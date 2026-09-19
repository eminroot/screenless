package expo.modules.screenguard

import android.content.Context

/**
 * The small amount of state the watcher and the JavaScript side share.
 *
 * Kept in plain preferences rather than passed over the bridge, because the
 * two halves are rarely alive at the same time: the service runs while the app
 * is closed, and the app reads the result when it opens. Preferences are the
 * only thing both can reach.
 *
 * Nothing in here is personal. It is a count of seconds, a date, and a flag.
 */
object GuardStore {
  private const val PREFS = "screen_guard_state"

  private const val KEY_DAY = "day"
  private const val KEY_USED = "usedSec"
  private const val KEY_GRACE_REQUEST = "graceRequestedAt"
  private const val KEY_NOTIF_TITLE = "notifTitle"
  private const val KEY_NOTIF_BODY = "notifBody"
  private const val KEY_NUDGES = "nudgesSent"

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  /**
   * The watcher writing down what it measured.
   *
   * Only ever moves forwards inside a day. The platform can report a smaller
   * figure after a reboot, and handing a child their afternoon back because
   * the phone restarted would be the first thing anyone learned to exploit.
   */
  fun recordUsage(context: Context, day: String, usedSec: Long) {
    val store = prefs(context)
    rollDay(context, day)
    val previous = store.getLong(KEY_USED, 0L)
    store.edit()
      .putString(KEY_DAY, day)
      .putLong(KEY_USED, maxOf(previous, usedSec))
      .apply()
  }

  /**
   * Wipes yesterday's counters the first time a new date is written.
   *
   * Every counter here is keyed off one shared date, so they have to be reset
   * together. Without this, whichever counter happened to be written first
   * after midnight would move the date forwards and leave the others looking
   * like today's — a child would wake up having already used three hours and
   * received four reminders.
   */
  private fun rollDay(context: Context, day: String) {
    val store = prefs(context)
    if (store.getString(KEY_DAY, null) == day) return
    store.edit()
      .putString(KEY_DAY, day)
      .putLong(KEY_USED, 0L)
      .putInt(KEY_NUDGES, 0)
      .apply()
  }

  fun usageFor(context: Context, day: String): Long {
    val store = prefs(context)
    return if (store.getString(KEY_DAY, null) == day) store.getLong(KEY_USED, 0L) else 0L
  }

  /**
   * How many screen time reminders have gone out today.
   *
   * Doubles as the index into the plan's list of pre-written reminders, so it
   * is the single thing keeping the service from repeating itself. It has to
   * live here rather than in the service's own memory: the system restarts the
   * service freely, and a counter that resets with the process would deliver
   * the first reminder again every time Android reclaimed some memory.
   *
   * Read by the app too, which folds it into the day it reports to the hub.
   */
  fun nudgesSent(context: Context, day: String): Int {
    val store = prefs(context)
    return if (store.getString(KEY_DAY, null) == day) store.getInt(KEY_NUDGES, 0) else 0
  }

  fun recordNudge(context: Context, day: String, sent: Int) {
    rollDay(context, day)
    val store = prefs(context)
    store.edit().putInt(KEY_NUDGES, maxOf(store.getInt(KEY_NUDGES, 0), sent)).apply()
  }

  /**
   * The child pressed the button on the shield.
   *
   * The service does not grant the extension itself — it only records that one
   * was asked for. Whether there is any left is a rule, and the rules live in
   * `budget.ts`; the app reads this flag next time it runs and decides.
   */
  fun requestGrace(context: Context, day: String) {
    prefs(context).edit().putString(KEY_GRACE_REQUEST, day).apply()
  }

  fun takeGraceRequest(context: Context): String? {
    val store = prefs(context)
    val day = store.getString(KEY_GRACE_REQUEST, null)
    if (day != null) store.edit().remove(KEY_GRACE_REQUEST).apply()
    return day
  }

  /** Copy for the ongoing notification, localised on the JS side. */
  fun setNotificationText(context: Context, title: String, body: String) {
    prefs(context).edit()
      .putString(KEY_NOTIF_TITLE, title)
      .putString(KEY_NOTIF_BODY, body)
      .apply()
  }

  fun notificationTitle(context: Context): String =
    prefs(context).getString(KEY_NOTIF_TITLE, null) ?: "Screen limit is on"

  fun notificationBody(context: Context): String =
    prefs(context).getString(KEY_NOTIF_BODY, null) ?: "Keeping the daily limit a parent set."

  fun clear(context: Context) {
    prefs(context).edit().clear().apply()
  }
}
