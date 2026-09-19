package expo.modules.screenguard

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * The flattened instruction the watcher service runs on.
 *
 * Every rule in this feature lives in TypeScript, in `src/guard/budget.ts`,
 * where it can be unit tested. What gets pushed down here is not the policy
 * but its *result*: a limit in seconds, a window, and a tier. The service can
 * evaluate that without judgement, which matters because the service keeps
 * running after the JavaScript engine is gone — a phone that has been rebooted
 * or an app the system has killed still has to hold the limit it was given.
 *
 * Whenever anything changes on the JS side a fresh plan is pushed down. If
 * nothing is pushed, the last plan stands, which is the behaviour a parent
 * would expect: killing the app must not lift the limit.
 */
data class GuardPlan(
  val enabled: Boolean,
  /** off | notice | interrupt | block */
  val tier: String,
  /** Packages being watched. Empty means nothing is enforced. */
  val packages: List<String>,
  /** Seconds of use allowed today, already including any grace JS granted. */
  val limitSec: Long,
  /** Minutes from midnight, or -1 for no curfew. May wrap past midnight. */
  val curfewStartMin: Int,
  val curfewEndMin: Int,
  /** The day this plan was written for, so a stale plan is obvious. */
  val day: String,
  /** Copy for the shield, localised on the JS side. */
  val blockTitle: String,
  val blockBody: String,
  val graceLabel: String,
  /** Whether the shield may offer the child a way through. */
  val graceAvailable: Boolean,
  /**
   * Seconds of watched-app use between one reminder and the next. Zero is off.
   *
   * The reminders have to fire while the child is in another app, which means
   * the service has to post them: the JavaScript engine is not running. What
   * the service is given is a counter and a list of sentences, never a rule
   * about when a sentence applies.
   */
  val nudgeEverySec: Long,
  /**
   * The reminders, already written, in the order they will be needed.
   *
   * Entry `k` is the reminder for the `(k + 1)`th checkpoint. Rendering them
   * up front is what keeps every decision on the JavaScript side: which tier
   * of copy an age band gets, which language, which suggestion comes next and
   * whether this particular checkpoint is close enough to the limit to be
   * written as a warning are all settled before the list is handed down. The
   * service does nothing but count and post.
   */
  val nudgeTitles: List<String>,
  val nudgeBodies: List<String>,
  val nudgeChannelName: String,
) {
  fun watches(pkg: String?): Boolean = pkg != null && packages.contains(pkg)

  /**
   * Whether a minute of the day sits inside the curfew.
   *
   * Mirrors `inCurfew` in `budget.ts`, including the window that wraps past
   * midnight — a bedtime curfew is 22:00 to 07:00 and the naive comparison is
   * wrong for exactly the nine hours that matter.
   */
  fun inCurfew(minuteOfDay: Int): Boolean {
    if (curfewStartMin < 0 || curfewEndMin < 0 || curfewStartMin == curfewEndMin) return false
    val now = ((minuteOfDay % 1440) + 1440) % 1440
    return if (curfewStartMin < curfewEndMin) {
      now >= curfewStartMin && now < curfewEndMin
    } else {
      now >= curfewStartMin || now < curfewEndMin
    }
  }

  fun toJson(): String = JSONObject().apply {
    put("enabled", enabled)
    put("tier", tier)
    put("packages", JSONArray(packages))
    put("limitSec", limitSec)
    put("curfewStartMin", curfewStartMin)
    put("curfewEndMin", curfewEndMin)
    put("day", day)
    put("blockTitle", blockTitle)
    put("blockBody", blockBody)
    put("graceLabel", graceLabel)
    put("graceAvailable", graceAvailable)
    put("nudgeEverySec", nudgeEverySec)
    put("nudgeTitles", JSONArray(nudgeTitles))
    put("nudgeBodies", JSONArray(nudgeBodies))
    put("nudgeChannelName", nudgeChannelName)
  }.toString()

  /** The reminder for checkpoint `index`, or null when the list runs out. */
  fun nudgeAt(index: Int): Pair<String, String>? {
    if (index < 0 || index >= nudgeTitles.size || index >= nudgeBodies.size) return null
    val title = nudgeTitles[index]
    val body = nudgeBodies[index]
    return if (title.isBlank()) null else Pair(title, body)
  }

  /** How many checkpoints the given number of seconds has gone past. */
  fun checkpointsReached(usedSec: Long): Int {
    if (nudgeEverySec <= 0L) return 0
    return (usedSec / nudgeEverySec).toInt()
  }

  companion object {
    private const val PREFS = "screen_guard_plan"
    private const val KEY = "plan"

    val OFF = GuardPlan(
      enabled = false,
      tier = "off",
      packages = emptyList(),
      limitSec = Long.MAX_VALUE,
      curfewStartMin = -1,
      curfewEndMin = -1,
      day = "",
      blockTitle = "",
      blockBody = "",
      graceLabel = "",
      graceAvailable = false,
      nudgeEverySec = 0L,
      nudgeTitles = emptyList(),
      nudgeBodies = emptyList(),
      nudgeChannelName = "Screen time",
    )

    private fun readStrings(array: JSONArray?): List<String> {
      if (array == null) return emptyList()
      val out = mutableListOf<String>()
      for (i in 0 until array.length()) out.add(array.optString(i, ""))
      return out
    }

    fun fromJson(raw: String?): GuardPlan {
      if (raw.isNullOrBlank()) return OFF
      return try {
        val o = JSONObject(raw)
        val packages = readStrings(o.optJSONArray("packages"))
        GuardPlan(
          enabled = o.optBoolean("enabled", false),
          tier = o.optString("tier", "off"),
          packages = packages,
          limitSec = o.optLong("limitSec", Long.MAX_VALUE),
          curfewStartMin = o.optInt("curfewStartMin", -1),
          curfewEndMin = o.optInt("curfewEndMin", -1),
          day = o.optString("day", ""),
          blockTitle = o.optString("blockTitle", ""),
          blockBody = o.optString("blockBody", ""),
          graceLabel = o.optString("graceLabel", ""),
          graceAvailable = o.optBoolean("graceAvailable", false),
          nudgeEverySec = o.optLong("nudgeEverySec", 0L),
          nudgeTitles = readStrings(o.optJSONArray("nudgeTitles")),
          nudgeBodies = readStrings(o.optJSONArray("nudgeBodies")),
          nudgeChannelName = o.optString("nudgeChannelName", "Screen time"),
        )
      } catch (error: Throwable) {
        OFF
      }
    }

    /**
     * Kept in plain preferences rather than in memory so the service can be
     * restarted by the system, or started at boot, and still know the limit.
     */
    fun load(context: Context): GuardPlan =
      fromJson(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null))

    fun save(context: Context, plan: GuardPlan) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(KEY, plan.toJson())
        .apply()
    }
  }
}
