# Screen Guard — store compliance

Everything a submission needs when `extra.screenGuard` is `true` in `app.json`.
With the flag off, none of this applies: no extra permissions ship, no
entitlement is requested, and `scripts/check-release.mjs` still fails the build
if any of these permissions appear by another route.

**Read this before flipping the flag.** Turning Screen Guard on changes what
kind of app this is in both stores.

---

## The headline decision

ScreenLess is a Designed-for-Families app for ages 3–9 plus a 10–14 band. Screen
Guard needs permissions that a Families-programme app is not expected to carry.
There are three ways to ship it and only the first two are defensible:

1. **Separate companion app** *(recommended)* — a second, general-audience
   (13+) app that does the enforcement, paired to the ScreenLess install. The
   family-facing app stays clean and keeps its Families designation.
2. **Mixed-audience declaration on ScreenLess** — change the Play target
   audience to "children and older users", add a neutral age screen, and carry
   the permission declarations here. Bigger paperwork; affects all three tiers.
   Increasingly reasonable now that the top band includes 13- and 14-year-olds,
   who are outside COPPA.
3. ~~Ship it quietly inside the Families build~~ — not an option. The
   permissions are visible in the manifest and the review will find them.

Nothing below assumes which route you take, but route 1 makes almost all of it
easier.

---

## Google Play

### Permissions declared, and why

| Permission | Type | Why |
|---|---|---|
| `PACKAGE_USAGE_STATS` | Special access | Read how long each chosen app has been in the foreground. Granted by the user in Settings; there is no dialog and no way to request it silently. |
| `SYSTEM_ALERT_WINDOW` | Special access | Draw the cover over a chosen app once the limit is spent. Granted in Settings. |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_SPECIAL_USE` | Normal | The limit has to hold while ScreenLess is closed. Android has not allowed open-ended background work since Oreo. |
| `QUERY_ALL_PACKAGES` | **Restricted — needs a declaration** | The parent picks from the apps actually installed. A time limit a parent can only apply to a list we guessed in advance is not a time limit. |

### Deliberately NOT used

**`BIND_ACCESSIBILITY_SERVICE`.** It is the usual shortcut for knowing what is
on screen, and it is the one API Google genuinely restricts to assistive use.
Usage access does the same job inside policy. If a reviewer asks how the app
detects the foreground app, the answer is `UsageStatsManager.queryEvents`, and
there is no accessibility service in the manifest to contradict it.

### `QUERY_ALL_PACKAGES` declaration text

> ScreenLess is a parental screen-time tool. A parent sets a daily time limit
> and chooses which apps it applies to. To present that choice we must list the
> apps installed on the device; there is no narrower alternative, because the
> apps a family wants to limit are not known in advance and differ per family.
> The list is shown only inside the parent area, which is behind a parent code.
> Package names are stored on the device only and are never transmitted.

### `FOREGROUND_SERVICE_SPECIAL_USE` justification

> Enforces a daily app time limit configured by a parent, by observing which
> app is in the foreground. A foreground service is required because the limit
> must continue to hold while our app is closed. The service performs no
> networking. The persistent notification is intentional disclosure that the
> limit is running.

### Data safety form

Screen Guard **adds no new data collection**. Update the existing answers with:

- **Data collected:** none, for this feature.
- **Data shared:** none.
- **App activity → App interactions:** *Not collected.* Usage figures are read
  from the OS, kept on the device, and never transmitted. There is no analytics
  or crash-reporting SDK in this app that could pick them up.
- Confirm "Data is encrypted in transit" remains answered for the features that
  do transmit (the Gemini proxy and the friends board), neither of which touch
  guard data.

### Families policy note

If you take route 2 (mixed audience), be ready for the review to ask why a
child-directed app needs overlay and usage access. The answer is that the
feature is parent-configured, parent-gated, and only reachable behind the
parent code — and that the child-facing side of it is purely informational.

---

## Apple App Store

### Entitlement

`com.apple.developer.family-controls` is **not** granted automatically. Request
it per team:

https://developer.apple.com/contact/request/family-controls-distribution

Turnaround is typically a couple of weeks. Until it is approved, everything
still builds and runs — `getCapability()` reports the feature as unavailable
and the app falls back to the notice-only tier, which needs no entitlement.

### What Apple's API does and does not allow

Three limits that shape the feature and should be stated plainly in review notes:

1. **We are never told which apps were chosen.** `FamilyActivityPicker` returns
   opaque tokens. The app cannot map them to bundle identifiers and cannot tell
   whether any particular app is among them. Every string in the UI therefore
   says "the apps your parent picked" rather than naming one.
2. **We cannot read usage figures.** There is no API that returns minutes to
   the host app. We register thresholds and are told when one is crossed. The
   child-facing screen says so rather than showing a zero.
3. **The shield is the system's.** `ManagedSettingsStore` applies it; iOS draws
   it. We do not and cannot overlay another app.

### Review notes to include

> ScreenLess is a parental screen-time tool. Screen Time (FamilyControls,
> ManagedSettings, DeviceActivity) is used exactly as documented: a parent
> authorises via `AuthorizationCenter`, chooses apps via `FamilyActivityPicker`,
> and we register daily thresholds. Enforcement is Apple's own shield. The app
> never receives app identities or usage figures. To test, sign in with a child
> account under Family Sharing, open Parent area → Daily app limit, grant the
> Screen Time prompt, pick any app, and set the limit to 1 minute.

### Guideline 5.1.1 / privacy

- `NSFamilyControlsUsageDescription` is set by the config plugin.
- Nothing about usage leaves the device, so no new privacy-nutrition entries.
- The extension performs no networking; state passes through an App Group.

---

## Build checklist

1. Set `extra.screenGuard: true` in `app.json`.
2. `npx expo prebuild --clean`.
3. **iOS only, once per clone:** add the `GuardMonitor` extension target in
   Xcode. `ios/GuardMonitor/README.md` is written by the plugin and has the
   six steps.
4. `npm run test:guard` — the escalation rules.
5. `node scripts/check-release.mjs` — it will now warn that this is not a
   Families build, which is expected and correct.
6. Submit with the declarations above.

---

## Where the rules live

Every decision about what a limit *means* is in `src/guard/budget.ts`, which is
pure and covered by `scripts/test-guard.ts` (60 checks). The native watchers on
both platforms receive a flattened plan — a limit in seconds, a window, a tier —
and evaluate it without judgement.

This split is deliberate and worth defending in any review conversation: the
parts that are impossible to test (a foreground service, an iOS extension) are
also the parts that make no decisions.

## Known gaps

- The iOS extension target is added by hand. A config plugin cannot create an
  app extension target reliably across SDK versions, and generating a broken
  project would be worse than a documented manual step.
- Neither native half has been run on a device from this workstation. The Swift
  and Kotlin have not been compiled. Treat the first device build as the real
  test.
- A determined teenager can revoke usage access in Android Settings. The app
  notices on its next foreground and reports the limit as not enforceable; it
  cannot prevent it. No consumer app can, short of device-owner provisioning.
