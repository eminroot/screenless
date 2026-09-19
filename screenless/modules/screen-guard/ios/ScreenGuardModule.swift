import ExpoModulesCore
import SwiftUI

#if canImport(FamilyControls)
import FamilyControls
import ManagedSettings
import DeviceActivity
#endif

/**
 The iOS half of Screen Guard.

 Built on Apple's Screen Time API, which is the only supported way to do this
 on iOS and is a very different shape from the Android side. Three differences
 drive the whole design:

 1. **You never learn which apps were chosen.** `FamilyActivityPicker` hands
    back opaque tokens. The app cannot read them, cannot map them to bundle
    ids, and cannot tell whether Instagram is among them. Every piece of copy
    in this feature therefore says "the apps your parent picked" rather than
    naming one, and that is a privacy guarantee Apple enforces rather than a
    limitation we chose to live with.

 2. **You cannot read usage numbers into the app.** There is no API that
    returns minutes. `DeviceActivityReport` renders a view inside an extension
    that the host app cannot inspect. What you *can* do is register thresholds
    and be told when one is crossed, which is exactly enough for the escalation
    ladder — so this module registers a warning event and a limit event, and
    the monitor extension writes a flag into a shared App Group when either
    fires. The app reads flags, never figures.

 3. **The shield is the system's, not ours.** `ManagedSettingsStore.shield`
    applies it; iOS draws it. A custom look needs a second extension
    (`ShieldConfiguration`), which is optional and not required for the feature
    to work.

 The entitlement `com.apple.developer.family-controls` is requested from Apple
 per-team and is not granted automatically. Without it every call here fails
 gracefully and `getCapability` reports the feature as unavailable, which is
 what the JavaScript side renders as "not set up on this device".
 */
public class ScreenGuardModule: Module {

  /// Shared with the monitor extension. Must match the App Group added by
  /// `plugins/withScreenGuard.js`.
  private static let appGroup = "group.com.eminbakhishli.screenless.guard"
  private static let selectionKey = "guard.selection"
  private static let stateKey = "guard.state"

  private static let activityName = DeviceActivityName("screenless.daily")
  private static let warningEvent = DeviceActivityEvent.Name("screenless.warning")
  private static let limitEvent = DeviceActivityEvent.Name("screenless.limit")

  /// Where the pre-written reminders live, for the monitor extension to read.
  private static let nudgeKey = "guard.nudges"

  /**
   How many interval reminders are registered.

   Apple does not publish a hard ceiling on events per activity, but each one
   is a real scheduling entry and a day that needs more than twelve reminders
   has bigger problems than a notification can solve. Twelve at half-hourly
   spacing covers six hours of watched-app use, which no plan this app offers
   will reach.
   */
  private static let maxNudges = 12

  private var shared: UserDefaults? {
    UserDefaults(suiteName: Self.appGroup)
  }

  public func definition() -> ModuleDefinition {
    Name("ScreenGuard")

    Function("getCapability") { () -> [String: Any] in
      #if canImport(FamilyControls)
      if #available(iOS 16.0, *) {
        let status = AuthorizationCenter.shared.authorizationStatus
        let approved = status == .approved
        let hasSelection = self.loadSelection() != nil
        var missing: [String] = []
        if !approved { missing.append("familyControls") }
        if approved && !hasSelection { missing.append("appSelection") }

        return [
          "available": true,
          // iOS never hands usage figures to the app. The UI reads this and
          // shows thresholds rather than minutes.
          "canReadUsage": false,
          "canEnforce": approved && hasSelection,
          "missing": missing,
        ]
      }
      #endif
      return [
        "available": false,
        "canReadUsage": false,
        "canEnforce": false,
        "missing": ["familyControls"],
      ]
    }

    /// Shows Apple's Screen Time permission prompt. On a child account this
    /// asks for the parent's Apple ID password.
    AsyncFunction("requestAuthorization") { (promise: Promise) in
      #if canImport(FamilyControls)
      if #available(iOS 16.0, *) {
        Task {
          do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .child)
            promise.resolve(true)
          } catch {
            // Denied, cancelled, or the entitlement is missing.
            promise.resolve(false)
          }
        }
        return
      }
      #endif
      promise.resolve(false)
    }

    /// Presents Apple's own app picker. The result is opaque; we store the
    /// encoded selection and hand it straight back to the system later.
    AsyncFunction("presentPicker") { (promise: Promise) in
      #if canImport(FamilyControls)
      if #available(iOS 16.0, *) {
        DispatchQueue.main.async {
          guard let root = self.appContext?.utilities?.currentViewController() else {
            promise.resolve(false)
            return
          }
          let host = UIHostingController(
            rootView: PickerScreen(
              initial: self.loadSelection() ?? FamilyActivitySelection(),
              onDone: { selection in
                self.saveSelection(selection)
                root.dismiss(animated: true) { promise.resolve(true) }
              },
              onCancel: {
                root.dismiss(animated: true) { promise.resolve(false) }
              }
            )
          )
          root.present(host, animated: true)
        }
        return
      }
      #endif
      promise.resolve(false)
    }

    /// How many apps the parent picked. The only thing we are allowed to know.
    Function("selectionCount") { () -> Int in
      #if canImport(FamilyControls)
      if #available(iOS 16.0, *) {
        guard let selection = self.loadSelection() else { return 0 }
        return selection.applicationTokens.count
          + selection.categoryTokens.count
          + selection.webDomainTokens.count
      }
      #endif
      return 0
    }

    /**
     Starts or stops monitoring.

     Two events are registered against the same daily schedule: one at three
     quarters of the budget and one at the budget. The monitor extension
     receives both and is what actually applies the shield, because it keeps
     running when this app does not.
     */
    Function("apply") { (plan: [String: Any]) -> Bool in
      #if canImport(FamilyControls)
      if #available(iOS 16.0, *) {
        let center = DeviceActivityCenter()
        center.stopMonitoring([Self.activityName])

        let enabled = plan["enabled"] as? Bool ?? false
        let tier = plan["tier"] as? String ?? "off"
        let limitSec = plan["limitSec"] as? Double ?? 0

        guard enabled, tier != "off", let selection = self.loadSelection() else {
          self.clearShield()
          self.writeState(["armed": false])
          return false
        }

        // The plan the extension reads when a threshold fires.
        self.writeState([
          "armed": true,
          "tier": tier,
          "day": plan["day"] as? String ?? "",
          "curfewStartMin": plan["curfewStartMin"] as? Int ?? -1,
          "curfewEndMin": plan["curfewEndMin"] as? Int ?? -1,
        ])

        let schedule = DeviceActivitySchedule(
          intervalStart: DateComponents(hour: 0, minute: 0),
          intervalEnd: DateComponents(hour: 23, minute: 59),
          repeats: true
        )

        let warningAt = max(60, Int(limitSec * 0.75))
        let limitAt = max(120, Int(limitSec))

        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [
          Self.warningEvent: DeviceActivityEvent(
            applications: selection.applicationTokens,
            categories: selection.categoryTokens,
            webDomains: selection.webDomainTokens,
            threshold: DateComponents(second: warningAt)
          ),
          Self.limitEvent: DeviceActivityEvent(
            applications: selection.applicationTokens,
            categories: selection.categoryTokens,
            webDomains: selection.webDomainTokens,
            threshold: DateComponents(second: limitAt)
          ),
        ]

        // The interval reminders.
        //
        // One event per checkpoint, because a threshold event fires once and
        // Apple offers nothing that repeats. The copy for each was written on
        // the JavaScript side and is stashed in the App Group here, so the
        // extension can post the right sentence without knowing anything
        // about age bands, languages or what to suggest next.
        let nudgeEverySec = plan["nudgeEverySec"] as? Int ?? 0
        let titles = plan["nudgeTitles"] as? [String] ?? []
        let bodies = plan["nudgeBodies"] as? [String] ?? []

        if nudgeEverySec >= 300 && !titles.isEmpty {
          let count = min(Self.maxNudges, min(titles.count, bodies.count))
          var written: [[String]] = []
          for index in 0..<count {
            let at = nudgeEverySec * (index + 1)
            // A reminder scheduled past the limit would fire after the shield
            // is already up, which is one interruption too many.
            if limitAt > 0 && at > limitAt { break }
            events[DeviceActivityEvent.Name("screenless.nudge.\(index)")] = DeviceActivityEvent(
              applications: selection.applicationTokens,
              categories: selection.categoryTokens,
              webDomains: selection.webDomainTokens,
              threshold: DateComponents(second: at)
            )
            written.append([titles[index], bodies[index]])
          }
          self.shared?.set(written, forKey: Self.nudgeKey)
        } else {
          self.shared?.removeObject(forKey: Self.nudgeKey)
        }

        do {
          try center.startMonitoring(Self.activityName, during: schedule, events: events)
          return true
        } catch {
          return false
        }
      }
      #endif
      return false
    }

    Function("stop") { () -> Bool in
      #if canImport(FamilyControls)
      if #available(iOS 16.0, *) {
        DeviceActivityCenter().stopMonitoring([Self.activityName])
        self.clearShield()
        self.writeState(["armed": false])
        return true
      }
      #endif
      return false
    }

    /**
     What the extension recorded while the app was closed.

     No minutes — iOS does not provide them. What comes back is which
     thresholds have fired today, which is what the escalation ladder needs.
     */
    Function("drainState") { () -> [String: Any] in
      let state = self.shared?.dictionary(forKey: Self.stateKey) ?? [:]
      return [
        "day": state["day"] as? String ?? "",
        "usedSec": NSNull(),
        // Apple reports no figures at all, so there is nothing to put here.
        // The app falls back to its own foreground time, which is the only
        // screen time number that exists on this platform.
        "deviceSec": 0,
        // Reminders the monitor extension posted while the app was closed.
        "nudgesSent": state["nudgesSent"] as? Int ?? 0,
        "warningFired": state["warningFired"] as? Bool ?? false,
        "limitFired": state["limitFired"] as? Bool ?? false,
        "graceRequestedFor": state["graceRequestedFor"] as? String ?? NSNull(),
      ]
    }

    /// A parent lifting the block by hand for the rest of the day.
    Function("lift") { () -> Bool in
      #if canImport(FamilyControls)
      if #available(iOS 16.0, *) {
        self.clearShield()
        var state = self.shared?.dictionary(forKey: Self.stateKey) ?? [:]
        state["lifted"] = true
        self.shared?.set(state, forKey: Self.stateKey)
        return true
      }
      #endif
      return false
    }

    Function("clear") { () -> Bool in
      self.shared?.removeObject(forKey: Self.stateKey)
      self.shared?.removeObject(forKey: Self.selectionKey)
      #if canImport(FamilyControls)
      if #available(iOS 16.0, *) {
        DeviceActivityCenter().stopMonitoring([Self.activityName])
        self.clearShield()
      }
      #endif
      return true
    }
  }

  /* ------------------------------------------------------------- internals */

  private func writeState(_ patch: [String: Any]) {
    var state = shared?.dictionary(forKey: Self.stateKey) ?? [:]
    for (key, value) in patch { state[key] = value }
    shared?.set(state, forKey: Self.stateKey)
  }

  #if canImport(FamilyControls)
  @available(iOS 16.0, *)
  private func loadSelection() -> FamilyActivitySelection? {
    guard let data = shared?.data(forKey: Self.selectionKey) else { return nil }
    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  @available(iOS 16.0, *)
  private func saveSelection(_ selection: FamilyActivitySelection) {
    guard let data = try? JSONEncoder().encode(selection) else { return }
    shared?.set(data, forKey: Self.selectionKey)
  }

  @available(iOS 16.0, *)
  private func clearShield() {
    let store = ManagedSettingsStore(named: .init("screenless.guard"))
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
  }
  #else
  private func loadSelection() -> Any? { nil }
  private func clearShield() {}
  #endif
}

#if canImport(FamilyControls)
/// Apple's picker has to be presented from SwiftUI, so this is the smallest
/// possible wrapper around it.
@available(iOS 16.0, *)
private struct PickerScreen: View {
  @State var selection: FamilyActivitySelection
  let onDone: (FamilyActivitySelection) -> Void
  let onCancel: () -> Void

  init(
    initial: FamilyActivitySelection,
    onDone: @escaping (FamilyActivitySelection) -> Void,
    onCancel: @escaping () -> Void
  ) {
    _selection = State(initialValue: initial)
    self.onDone = onDone
    self.onCancel = onCancel
  }

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Choose apps")
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel", action: onCancel)
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") { onDone(selection) }
          }
        }
    }
  }
}
#endif
