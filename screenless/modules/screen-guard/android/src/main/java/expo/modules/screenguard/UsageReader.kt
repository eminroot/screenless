package expo.modules.screenguard

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Process
import java.util.Calendar

/**
 * Reading how long an app has been on screen today.
 *
 * Built on `UsageStatsManager.queryEvents` rather than `queryUsageStats`,
 * because the aggregated buckets are rounded and lag by minutes — fine for a
 * weekly chart, useless for a limit that has to bite at the sixtieth minute.
 * Walking the raw resume and pause events gives a figure accurate to the
 * second and, more usefully, tells us which app is on screen right now.
 *
 * This needs `PACKAGE_USAGE_STATS`, which is not a runtime permission: the
 * user grants it by hand in Settings > Special app access > Usage access. That
 * is deliberate on Android's part and it is why the setup flow in this app
 * walks a parent to that screen rather than showing a dialog.
 *
 * Nothing read here leaves the phone. The numbers are folded into a local
 * count and the event stream is not stored.
 */
object UsageReader {

  /** Whether the user has granted usage access in Settings. */
  fun hasUsageAccess(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
    val mode = appOps.unsafeCheckOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      Process.myUid(),
      context.packageName,
    )
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun startOfToday(): Long {
    val calendar = Calendar.getInstance()
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    return calendar.timeInMillis
  }

  /**
   * Foreground milliseconds per package since midnight.
   *
   * An app that is still in the foreground when we look has no matching pause
   * event yet, so its open session is closed off at `now` — without that, the
   * app the child is using right this second counts as zero, which is exactly
   * the app the limit is about.
   */
  fun foregroundMillisToday(context: Context, packages: Set<String>): Map<String, Long> {
    val totals = mutableMapOf<String, Long>()
    if (packages.isEmpty() || !hasUsageAccess(context)) return totals

    val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return totals

    val start = startOfToday()
    val now = System.currentTimeMillis()
    val events = manager.queryEvents(start, now)
    val openedAt = mutableMapOf<String, Long>()
    val event = UsageEvents.Event()

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val pkg = event.packageName ?: continue
      if (!packages.contains(pkg)) continue

      when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> openedAt[pkg] = event.timeStamp
        UsageEvents.Event.ACTIVITY_PAUSED,
        UsageEvents.Event.ACTIVITY_STOPPED -> {
          val opened = openedAt.remove(pkg) ?: continue
          if (event.timeStamp > opened) {
            totals[pkg] = (totals[pkg] ?: 0L) + (event.timeStamp - opened)
          }
        }
      }
    }

    // Whatever is still open right now.
    for ((pkg, opened) in openedAt) {
      if (now > opened) totals[pkg] = (totals[pkg] ?: 0L) + (now - opened)
    }

    return totals
  }

  /**
   * Packages that should not count as a child using a phone.
   *
   * The launcher is on screen every time an app is closed, and the system UI
   * and the keyboard are "in the foreground" constantly without anybody having
   * chosen to be there. Counting them turns the figure from "how long was this
   * phone in use" into "how long was it awake", which is a different number
   * and a much larger one.
   *
   * Resolved by asking the package manager which app actually handles HOME on
   * this device, rather than matching a list of known launcher names: a child
   * with Nova or a vendor launcher would otherwise have every gap between apps
   * counted as screen time.
   */
  private fun ignoredPackages(context: Context): Set<String> {
    val ignored = mutableSetOf(context.packageName)

    val home = android.content.Intent(android.content.Intent.ACTION_MAIN)
      .addCategory(android.content.Intent.CATEGORY_HOME)
    context.packageManager
      .queryIntentActivities(home, android.content.pm.PackageManager.MATCH_DEFAULT_ONLY)
      .mapNotNullTo(ignored) { it.activityInfo?.packageName }

    ignored.add("com.android.systemui")
    return ignored
  }

  /**
   * Foreground milliseconds today across the whole phone.
   *
   * The figure a parent means by "screen time", as opposed to the watched-app
   * total the limit is enforced against. Nothing is enforced on this: it goes
   * on a chart so a family can see the size of the thing they are dealing
   * with, and so the watched-app number has something to be a fraction of.
   *
   * One app at a time. Overlapping sessions are not summed, because two apps
   * that were both technically resumed for the same ten minutes are still ten
   * minutes of a child's afternoon, and adding them would report twenty.
   */
  fun deviceForegroundMillisToday(context: Context): Long {
    if (!hasUsageAccess(context)) return 0L

    val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return 0L

    val ignored = ignoredPackages(context)
    val start = startOfToday()
    val now = System.currentTimeMillis()
    val events = manager.queryEvents(start, now)
    val event = UsageEvents.Event()

    // Walked as a single timeline rather than per package: `openedAt` is the
    // moment the screen last became "something a child chose", and it is
    // closed off as soon as the foreground moves to anything ignored.
    var openedAt = 0L
    var total = 0L

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val pkg = event.packageName ?: continue

      when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> {
          if (ignored.contains(pkg)) {
            if (openedAt > 0L && event.timeStamp > openedAt) total += event.timeStamp - openedAt
            openedAt = 0L
          } else if (openedAt == 0L) {
            openedAt = event.timeStamp
          }
        }
        // The screen going off ends the session whatever was on it.
        UsageEvents.Event.SCREEN_NON_INTERACTIVE -> {
          if (openedAt > 0L && event.timeStamp > openedAt) total += event.timeStamp - openedAt
          openedAt = 0L
        }
      }
    }

    if (openedAt > 0L && now > openedAt) total += now - openedAt
    return total
  }

  /**
   * The package on screen right now, or null.
   *
   * Looked for in a short window rather than since midnight: the watcher asks
   * this once a second and walking the whole day each time would be wasteful
   * on a device that has been awake since breakfast.
   */
  fun foregroundPackage(context: Context, windowMs: Long = 10_000L): String? {
    if (!hasUsageAccess(context)) return null
    val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return null

    val now = System.currentTimeMillis()
    val events = manager.queryEvents(now - windowMs, now)
    val event = UsageEvents.Event()
    var latest: String? = null
    var latestAt = 0L

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED && event.timeStamp >= latestAt) {
        latestAt = event.timeStamp
        latest = event.packageName
      }
    }
    return latest
  }
}
