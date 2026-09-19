package expo.modules.screenguard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/**
 * The watcher.
 *
 * A foreground service that looks once a second at which app is on screen,
 * adds up the time spent in the watched ones, and puts the shield over them
 * once the plan says the day is spent.
 *
 * Why a foreground service and not something quieter: Android has not allowed
 * open ended background work since Oreo, and anything else the system kills
 * within minutes. The permanent notification is the price, and it is arguably
 * a feature — a limit that runs invisibly on a child's phone is a limit nobody
 * consented to. The notification says what it is and stays there.
 *
 * What this service deliberately does NOT do:
 * - It never uses an AccessibilityService. That is the usual shortcut for
 *   knowing what is on screen and it is the one API Google genuinely restricts
 *   to assistive use. Usage access does the same job inside policy.
 * - It never reads the content of any app, only which one is in front.
 * - It never sends anything anywhere. There is no network code in this file.
 */
class GuardService : Service() {

  private val handler = Handler(Looper.getMainLooper())
  private lateinit var shield: ShieldView
  private var plan: GuardPlan = GuardPlan.OFF
  private var lastDay: String = today()

  private val tick = object : Runnable {
    override fun run() {
      try {
        evaluate()
      } catch (error: Throwable) {
        // A watcher that crashes is a limit that silently stops. Swallow and
        // keep ticking; the JS side sees the usage stop moving and can tell
        // the parent something is wrong.
      }
      handler.postDelayed(this, TICK_MS)
    }
  }

  override fun onCreate() {
    super.onCreate()
    shield = ShieldView(this)
    plan = GuardPlan.load(this)
    startForeground(NOTIFICATION_ID, buildNotification())
    handler.post(tick)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // Re-read on every start: the module pushes a new plan by restarting us.
    plan = GuardPlan.load(this)
    if (!plan.enabled || plan.packages.isEmpty()) {
      shield.hide()
      stopSelf()
      return START_NOT_STICKY
    }
    // STICKY so the system brings the watcher back after it reclaims memory.
    // A limit that quietly dies when the phone is busy is worse than no limit,
    // because a parent believes it is running.
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    shield.hide()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  /* --------------------------------------------------------------- the tick */

  private fun evaluate() {
    if (!plan.enabled || plan.packages.isEmpty()) {
      shield.hide()
      return
    }

    val now = today()
    if (now != lastDay) {
      lastDay = now
      shield.hide()
    }

    // Measured on every tick, not only while a watched app is in front.
    //
    // The reminders are counted against the whole day's use, and a child who
    // has just switched to the home screen has still used those minutes. Only
    // the shield cares what is on screen right now.
    val usedMs = UsageReader.foregroundMillisToday(this, plan.packages.toSet()).values.sum()
    val usedSec = usedMs / 1000L
    GuardStore.recordUsage(this, now, usedSec)

    // Counting and reminding come before every gate below, because neither of
    // them takes anything away. A stale plan or a revoked overlay permission
    // must not silently stop the measuring: the numbers are what the parent
    // sees, and a chart that quietly flatlines is worse than one that shows
    // the truth.
    deliverNudges(now, usedSec)

    // A plan written yesterday must not enforce today's limit with yesterday's
    // spend. Until JS pushes a fresh one the watcher stands down rather than
    // guessing, because guessing here means blocking a child at breakfast.
    if (plan.day.isNotEmpty() && plan.day != now) {
      shield.hide()
      return
    }

    if (!Settings.canDrawOverlays(this)) {
      // The permission was taken away while we were running.
      shield.hide()
      return
    }

    val foreground = UsageReader.foregroundPackage(this)
    if (!plan.watches(foreground)) {
      shield.hide()
      return
    }

    val curfew = plan.inCurfew(minuteOfDay())
    val spent = usedSec >= plan.limitSec

    if (!curfew && !spent) {
      shield.hide()
      return
    }

    when (plan.tier) {
      // Counting and warning only. The nudges themselves are scheduled by the
      // JS side through expo-notifications; nothing covers the screen here.
      "notice", "off" -> shield.hide()

      "interrupt" -> shield.show(
        plan.blockTitle,
        plan.blockBody,
        if (plan.graceAvailable && !curfew) plan.graceLabel else null,
      ) { GuardStore.requestGrace(this, now) }

      else -> shield.show(plan.blockTitle, plan.blockBody, null, null)
    }
  }

  /* ---------------------------------------------------------------- nudges */

  /**
   * Posts the screen time reminders the child has earned.
   *
   * This is the only reason the reminders work at all. The child is in another
   * app when they matter, so the JavaScript engine is not running and nothing
   * in `guard/nudge.ts` can execute. What that module did instead was write
   * every sentence in advance and hand the list down, so all that happens here
   * is counting.
   *
   * At most one per tick, however many checkpoints were crossed. A phone that
   * comes back from a long doze having passed three of them owes the child one
   * notification, not three, and the counter still moves past all of them so
   * the skipped ones never arrive later.
   */
  private fun deliverNudges(day: String, usedSec: Long) {
    if (plan.nudgeEverySec <= 0L) return

    val reached = plan.checkpointsReached(usedSec)
    val sent = GuardStore.nudgesSent(this, day)
    if (reached <= sent) return

    // The most recent one is the one that is true right now.
    val index = reached - 1
    val text = plan.nudgeAt(index)
    // The list runs out at the end of a very long day. Counting past it keeps
    // the tick cheap and means nothing stale is delivered hours later.
    GuardStore.recordNudge(this, day, reached)
    if (text == null) return

    postNudge(text.first, text.second, index)
  }

  private fun postNudge(title: String, body: String, index: Int) {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        NUDGE_CHANNEL_ID,
        plan.nudgeChannelName.ifBlank { "Screen time" },
        // DEFAULT rather than HIGH. This arrives several times a day, and a
        // heads-up banner each time is what gets the whole channel switched
        // off in the first week.
        NotificationManager.IMPORTANCE_DEFAULT,
      )
      channel.setShowBadge(false)
      manager.createNotificationChannel(channel)
    }

    val open = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    val pending = if (open == null) {
      null
    } else {
      android.app.PendingIntent.getActivity(
        this,
        0,
        open,
        android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
      )
    }

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, NUDGE_CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }

    builder
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(Notification.BigTextStyle().bigText(body))
      .setSmallIcon(applicationInfo.icon)
      .setAutoCancel(true)
      // Silent. The point is to be noticed when the child next looks, not to
      // interrupt them mid-sentence.
      .setOnlyAlertOnce(true)
    if (pending != null) builder.setContentIntent(pending)

    // A distinct id per checkpoint, so a reminder still on screen is replaced
    // rather than stacking into a pile the child scrolls past.
    manager.notify(NUDGE_NOTIFICATION_ID + (index % 8), builder.build())
  }

  /* ------------------------------------------------------------ notification */

  private fun buildNotification(): Notification {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Screen limit",
        // Low, not default: this notification is a disclosure, not an alert,
        // and it must never make a sound.
        NotificationManager.IMPORTANCE_LOW,
      ).apply {
        description = "Shows while the daily limit set by a parent is being kept."
        setShowBadge(false)
      }
      manager.createNotificationChannel(channel)
    }

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }

    return builder
      .setContentTitle(GuardStore.notificationTitle(this))
      .setContentText(GuardStore.notificationBody(this))
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .build()
  }

  companion object {
    private const val TICK_MS = 1_000L
    private const val CHANNEL_ID = "screen-guard"
    private const val NOTIFICATION_ID = 8801

    /**
     * The reminders sit on their own channel, away from the permanent "the
     * limit is on" notice. A family has to be able to silence one without
     * losing the other: they are different promises.
     *
     * The id matches the channel `lib/screen-nudge.ts` creates, so a reminder
     * posted by the service and one posted by the app land in the same place
     * in Android's settings rather than appearing as two unrelated switches.
     */
    private const val NUDGE_CHANNEL_ID = "screen-time"
    private const val NUDGE_NOTIFICATION_ID = 8810

    fun start(context: Context) {
      val intent = Intent(context, GuardService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, GuardService::class.java))
    }

    /** Android 14 wants the type named at `startForeground` as well. */
    fun foregroundType(): Int =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
      } else {
        0
      }

    private fun today(): String =
      SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)

    private fun minuteOfDay(): Int {
      val calendar = Calendar.getInstance()
      return calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
    }
  }
}
