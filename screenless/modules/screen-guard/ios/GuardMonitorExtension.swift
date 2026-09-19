import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings
import UserNotifications

/**
 The DeviceActivityMonitor extension.

 This file is NOT part of the app target. `plugins/withScreenGuard.js` copies
 it into a separate extension target at prebuild, because Apple requires the
 threshold callbacks to run in their own process — that is what lets the limit
 hold while ScreenLess itself is closed or has been killed.

 It is deliberately the dumbest thing in the feature. It knows two events, it
 writes a flag, and it puts the shield up. Every decision about what a limit
 means was made on the JavaScript side and baked into the thresholds before
 monitoring started, which is the only way to keep the rules testable given
 that nothing in this process can be unit tested at all.

 Memory here is tight and the process is short lived. No networking, no
 logging, no work beyond setting a value and applying a store.
 */
class GuardMonitorExtension: DeviceActivityMonitor {

  private static let appGroup = "group.com.eminbakhishli.screenless.guard"
  private static let stateKey = "guard.state"
  private static let selectionKey = "guard.selection"
  private static let nudgeKey = "guard.nudges"

  private var shared: UserDefaults? { UserDefaults(suiteName: Self.appGroup) }
  private let store = ManagedSettingsStore(named: .init("screenless.guard"))

  override func eventDidReachThreshold(
    _ event: DeviceActivityEvent.Name,
    activity: DeviceActivityName
  ) {
    super.eventDidReachThreshold(event, activity: activity)

    var state = shared?.dictionary(forKey: Self.stateKey) ?? [:]

    // A day that has rolled over since the plan was written starts clean.
    let today = Self.today()
    if state["day"] as? String != today {
      state = ["armed": state["armed"] as? Bool ?? false, "day": today, "nudgesSent": 0]
    }

    // A parent lifted the block by hand. Nothing shields until tomorrow.
    if state["lifted"] as? Bool == true {
      shared?.set(state, forKey: Self.stateKey)
      return
    }

    let tier = state["tier"] as? String ?? "off"

    // An interval reminder. Nothing is shielded and no state is kept beyond
    // the count: these are the taps on the shoulder that happen long before
    // the limit, and they are the only part of this feature a child
    // experiences on an ordinary day.
    if event.rawValue.hasPrefix("screenless.nudge.") {
      let index = Int(event.rawValue.dropFirst("screenless.nudge.".count)) ?? 0
      postNudge(at: index)
      state["nudgesSent"] = max(state["nudgesSent"] as? Int ?? 0, index + 1)
      shared?.set(state, forKey: Self.stateKey)
      return
    }

    if event.rawValue.hasSuffix("warning") {
      state["warningFired"] = true
      // The warning never shields, at any tier. It exists so the app can send
      // a nudge the next time it runs, and so the child sees it coming.
    } else if event.rawValue.hasSuffix("limit") {
      state["limitFired"] = true
      if tier == "interrupt" || tier == "block" {
        applyShield()
      }
    }

    shared?.set(state, forKey: Self.stateKey)
  }

  /// Start of the monitored day: clear yesterday's flags and drop the shield.
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    let armed = shared?.dictionary(forKey: Self.stateKey)?["armed"] as? Bool ?? false
    let tier = shared?.dictionary(forKey: Self.stateKey)?["tier"] as? String ?? "off"
    shared?.set(["armed": armed, "tier": tier, "day": Self.today()], forKey: Self.stateKey)
    clearShield()
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    clearShield()
  }

  /**
   Posts one pre-written reminder.

   The sentences were rendered by the app, in the child's language and for
   their age band, and left in the App Group. This process does not compose
   copy, does not know what a suggestion is and does no work beyond reading two
   strings out of an array: the memory budget for a monitor extension is tiny
   and the process is killed the moment it returns.
   */
  private func postNudge(at index: Int) {
    guard
      let rows = shared?.array(forKey: Self.nudgeKey) as? [[String]],
      index >= 0,
      index < rows.count,
      rows[index].count >= 2
    else { return }

    let content = UNMutableNotificationContent()
    content.title = rows[index][0]
    content.body = rows[index][1]
    // Silent. The point is to be noticed when the child next looks up, not to
    // interrupt them mid-sentence.
    content.sound = nil

    let request = UNNotificationRequest(
      identifier: "screenless.nudge.\(index)",
      content: content,
      trigger: nil
    )
    UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
  }

  private func applyShield() {
    guard
      let data = shared?.data(forKey: Self.selectionKey),
      let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    else { return }

    store.shield.applications = selection.applicationTokens.isEmpty
      ? nil
      : selection.applicationTokens
    store.shield.applicationCategories = selection.categoryTokens.isEmpty
      ? nil
      : .specific(selection.categoryTokens)
    store.shield.webDomains = selection.webDomainTokens.isEmpty
      ? nil
      : selection.webDomainTokens
  }

  private func clearShield() {
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
  }

  private static func today() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.locale = Locale(identifier: "en_US_POSIX")
    return formatter.string(from: Date())
  }
}
