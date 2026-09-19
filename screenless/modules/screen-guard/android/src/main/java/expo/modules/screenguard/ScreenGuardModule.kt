package expo.modules.screenguard

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/**
 * The Android half of Screen Guard.
 *
 * Its job is small on purpose: report seconds, hand the parent to the two
 * Settings screens Android insists they visit in person, and run whatever plan
 * the JavaScript side pushes down. Every rule about what a limit means lives
 * in `src/guard/budget.ts`, which is the only part of this feature that can be
 * unit tested.
 *
 * The permissions this needs are both "special access" rather than runtime
 * permissions, which means no dialog: the user has to walk into Settings and
 * turn them on. There is no way around that and no way to do it quietly, which
 * is the correct design for a tool that watches app usage.
 */
class PlanRecord : Record {
  @Field var enabled: Boolean = false
  @Field var tier: String = "off"
  @Field var packages: List<String> = emptyList()
  @Field var limitSec: Double = Double.MAX_VALUE
  @Field var curfewStartMin: Int = -1
  @Field var curfewEndMin: Int = -1
  @Field var day: String = ""
  @Field var blockTitle: String = ""
  @Field var blockBody: String = ""
  @Field var graceLabel: String = ""
  @Field var graceAvailable: Boolean = false
  @Field var notificationTitle: String = ""
  @Field var notificationBody: String = ""
  @Field var nudgeEverySec: Double = 0.0
  @Field var nudgeTitles: List<String> = emptyList()
  @Field var nudgeBodies: List<String> = emptyList()
  @Field var nudgeChannelName: String = "Screen time"
}

class ScreenGuardModule : Module() {

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "No Android context" }

  override fun definition() = ModuleDefinition {
    Name("ScreenGuard")

    /** What this device and build can actually do. */
    Function("getCapability") {
      val usage = UsageReader.hasUsageAccess(context)
      val overlay = Settings.canDrawOverlays(context)
      val missing = mutableListOf<String>()
      if (!usage) missing.add("usageAccess")
      if (!overlay) missing.add("overlay")

      mapOf(
        "available" to true,
        "canReadUsage" to usage,
        "canEnforce" to (usage && overlay),
        "missing" to missing,
      )
    }

    /**
     * Opens Settings at the usage access list. Android gives no callback, so
     * the app re-checks `getCapability` when it comes back to the foreground.
     */
    Function("openUsageAccessSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }

    Function("openOverlaySettings") {
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${context.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }

    /**
     * Apps the parent can choose from: things with a launcher entry, minus
     * this app itself. Icons are left out deliberately — encoding a few
     * hundred bitmaps across the bridge to draw a picker is not worth it, and
     * the labels are what a parent actually reads.
     */
    Function("listApps") {
      val manager = context.packageManager
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val resolved = manager.queryIntentActivities(launcher, 0)

      resolved
        .mapNotNull { info ->
          val pkg = info.activityInfo?.packageName ?: return@mapNotNull null
          if (pkg == context.packageName) return@mapNotNull null
          mapOf(
            "id" to pkg,
            "label" to info.loadLabel(manager).toString(),
            "system" to isSystem(manager, pkg),
          )
        }
        .distinctBy { it["id"] }
        .sortedBy { (it["label"] as? String)?.lowercase(Locale.getDefault()) ?: "" }
    }

    /** Foreground seconds today, per package. */
    Function("getUsage") { packages: List<String> ->
      UsageReader.foregroundMillisToday(context, packages.toSet())
        .map { (pkg, ms) -> mapOf("id" to pkg, "seconds" to (ms / 1000.0)) }
    }

    /**
     * Foreground seconds today across the whole phone.
     *
     * Separate from `getUsage` because it answers the parent's question rather
     * than the limit's: nothing is enforced on this number, it is the one that
     * goes on the chart. Zero when usage access has not been granted, which
     * the app already knows from `getCapability`.
     */
    Function("getDeviceUsage") {
      UsageReader.deviceForegroundMillisToday(context) / 1000.0
    }

    /**
     * Pushes a plan down and starts, restarts or stops the watcher.
     *
     * Restarting rather than messaging the running service keeps the service
     * simple: it reads the plan on create and on every start command, so there
     * is exactly one path into it.
     */
    Function("apply") { plan: PlanRecord ->
      GuardStore.setNotificationText(context, plan.notificationTitle, plan.notificationBody)

      val saved = GuardPlan(
        enabled = plan.enabled,
        tier = plan.tier,
        packages = plan.packages,
        limitSec = plan.limitSec.toLong(),
        curfewStartMin = plan.curfewStartMin,
        curfewEndMin = plan.curfewEndMin,
        day = plan.day,
        blockTitle = plan.blockTitle,
        blockBody = plan.blockBody,
        graceLabel = plan.graceLabel,
        graceAvailable = plan.graceAvailable,
        nudgeEverySec = plan.nudgeEverySec.toLong(),
        nudgeTitles = plan.nudgeTitles,
        nudgeBodies = plan.nudgeBodies,
        nudgeChannelName = plan.nudgeChannelName,
      )
      GuardPlan.save(context, saved)

      // Reminders alone are enough to be worth running for.
      //
      // A family that wants the taps on the shoulder and no enforcement sets
      // the tier to "off" and an interval, and that is a setup worth
      // supporting: it is where most families should start. Requiring a tier
      // above "off" would silently give them nothing.
      val runnable = saved.enabled &&
        saved.packages.isNotEmpty() &&
        (saved.tier != "off" || saved.nudgeEverySec > 0L) &&
        UsageReader.hasUsageAccess(context)

      if (runnable) GuardService.start(context) else GuardService.stop(context)
      runnable
    }

    Function("stop") {
      GuardPlan.save(context, GuardPlan.OFF)
      GuardService.stop(context)
      true
    }

    /**
     * What the watcher measured while the app was closed, plus whether the
     * child pressed the extend button on the shield. The app folds both into
     * its own record on the next launch.
     */
    Function("drainState") {
      val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)
      mapOf(
        "day" to today,
        "usedSec" to GuardStore.usageFor(context, today).toDouble(),
        "deviceSec" to (UsageReader.deviceForegroundMillisToday(context) / 1000.0),
        // How many reminders the service posted while the app was closed. The
        // app folds this into the day it reports, so the parent's figure for
        // "reminders sent" counts the ones that actually reached the child
        // rather than the ones this process happened to be awake for.
        "nudgesSent" to GuardStore.nudgesSent(context, today),
        "graceRequestedFor" to GuardStore.takeGraceRequest(context),
      )
    }

    Function("clear") {
      GuardStore.clear(context)
      GuardPlan.save(context, GuardPlan.OFF)
      GuardService.stop(context)
      true
    }
  }

  private fun isSystem(manager: PackageManager, pkg: String): Boolean = try {
    val info = manager.getApplicationInfo(pkg, 0)
    (info.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
  } catch (error: Throwable) {
    false
  }
}
