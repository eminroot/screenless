# Shipping ScreenLess to Google Play

Everything below was checked against Play policy as it stands on **29 July 2026**.
Two things on this page are hard blockers with a clock attached. Read those first.

---

## The two things that decide your launch date

### 1. Closed testing: 12 testers, 14 unbroken days

A **personal** developer account created after 13 November 2023 cannot publish to
production until it has run a closed test with **at least 12 testers opted in for
14 continuous days**. The count is checked at the moment you apply for production
access, and the 14 days run from when the twelfth tester joins, not from when you
upload.

So the earliest possible production date is **today + 14 days**, and only if you
get all 12 people opted in today. Testers must actually accept the opt-in link on
the Google account they use on their phone. If one drops out and the count falls
below 12, the clock restarts.

This does not apply to an **organisation** account. If you have a company and can
wait for the verification paperwork, that route skips the 14 days entirely.

> Start this today, before any of the polish. Everything else on this page can be
> done while the 14 days run.

### 2. Target API level 36, from 31 August 2026

From that date new apps must target Android 16 (API 36). Expo SDK 54 with React
Native 0.81 already compiles to `targetSdkVersion 36`, so **you are fine, with no
change needed** — but a submission that slips past 31 August on an older Expo
version would be rejected. Do not downgrade Expo.

The related 16 KB page size requirement (in force since 1 November 2025) is also
satisfied by SDK 54.

---

## Technical status

| Requirement | Status |
| --- | --- |
| Target API 36 (Android 16) | ✅ Expo SDK 54 default |
| 16 KB native page alignment | ✅ Expo SDK 54 / RN 0.81 |
| Android App Bundle, not APK | ✅ `production` profile builds `app-bundle` |
| Play App Signing | ✅ EAS generates and uploads the key on first build |
| Package name locked forever | ✅ `com.eminbakhishli.screenless` |
| `versionCode` auto increment | ✅ `autoIncrement` + `appVersionSource: remote` |
| No location / mic / contacts permission | ✅ blocked in `app.json` |
| No dangerous permission merged in by a library | ✅ `ACTIVITY_RECOGNITION` (expo-sensors) and `SYSTEM_ALERT_WINDOW` (React Native debug manifest) both stripped |
| No advertising ID | ✅ no ads SDK, permission never declared |
| Edge to edge (Android 15+) | ✅ enabled |
| Account deletion policy | ✅ the optional username is deleted in app (Username and friends → Remove the username, and Delete everything) and on request through the privacy policy's `#delete` section |
| No key in the shipped bundle | ✅ verified against the exported Hermes bundle |

Verify any time with:

```bash
npm run preflight
```

That typechecks, exports the real Android bundle and scans it for key shaped
strings, then checks the build config. It exits non-zero if anything would ship a
secret or point at a placeholder.

Its permission check reads the **merged** release manifest when one exists, not
`app.json`. That distinction matters: `app.json` lists what the app asks for,
while libraries merge in their own, and two dangerous ones arrived that way. If
you have not built yet it says so rather than passing on incomplete information.

---

## Before you build

### Deploy the AI proxy, or turn the AI off

The Gemini key can no longer ride along in the bundle. Two honest options:

**a. Deploy the proxy.** Two interchangeable implementations, pick one:

*Firebase Function* — `server/firebase`, needs the Blaze plan:

```bash
cd server/firebase && npm --prefix functions install && npx firebase login && npx firebase use YOUR_PROJECT_ID && npx firebase functions:secrets:set GEMINI_API_KEY && npx firebase deploy --only functions
```

*Cloudflare Worker* — `server/gemini-proxy`, no billing account needed:

```bash
cd server/gemini-proxy && npm install && npx wrangler login && npx wrangler secret put GEMINI_API_KEY && npx wrangler deploy
```

Either way, put the printed url into `.env` for a local build, and into `eas.json`
→ `build.production.env.EXPO_PUBLIC_GEMINI_PROXY_URL` for an EAS build, replacing
the `example` placeholder.

The key you feed either one is a **Gemini** key from Google AI Studio, not your
Firebase web API key. Keeping them separate is what lets you rotate the Gemini key
without touching your other apps.

**b. Ship without AI.** Clear `EXPO_PUBLIC_GEMINI_PROXY_URL` in `eas.json`. The
buddy chat, the parent coach and surprise missions switch themselves off; the
mission library, room scan, rewards and the whole progress loop are rule based and
unaffected. `isGeminiConfigured` already hides those entry points.

### Deploy the friends board, or leave it out

Usernames and the friends board need `server/firebase/leaderboard` running. It sits in
the same Firebase project as the proxy, in a Firestore database of its own:

```bash
cd server/firebase && npm --prefix leaderboard install && npx firebase firestore:databases:create screenless --location=europe-west1 --delete-protection=ENABLED && npx firebase deploy --only firestore,functions:screenless-social
```

`eas.json` already points `EXPO_PUBLIC_LEADERBOARD_URL` at the url that deploy
produces. Check it answers before building:

```bash
curl -s https://europe-west1-cyberxbank-7dc0b.cloudfunctions.net/leaderboard/usernames/Arif
```

To ship without it, clear `EXPO_PUBLIC_LEADERBOARD_URL` in `eas.json`. Setup still
asks the question but only "keep it on this phone" works, so also take the friends
board out of the store listing and the Data safety form (`PLAY-CONSOLE.md`).

### Turn on billing for the Gemini key — this one matters

On the **unpaid** Gemini tier, Google's terms let it use submitted prompts and
responses to improve its products, **including human review**. Those prompts are
messages typed by children. For an app under the Families policy that is a bad
position to be in, and it is not something a privacy policy can wave away.

Link a billing account to the Cloud project behind the key. On the paid tier
prompts and responses are not used for product improvement and are covered by
Google's data processing terms. Cost at this app's volume is negligible: replies
are capped at 220 tokens with thinking disabled.

If you do not do this, say so plainly in the privacy policy and expect questions
during Families review.

### Rotate the old key

`AQ.Ab8RN6…GoljSbOdg` was inlined into every bundle built so far. Treat it as
public: delete it in Google AI Studio and issue a new one for the proxy.

### Host the privacy policy

`store/privacy-policy.html` is filled in and ready (contact address
`eminbaxishli514@gmail.com`). It just needs hosting. GitHub Pages is enough:

1. push the repo, Settings → Pages → deploy from branch
2. the policy lands at `https://<user>.github.io/<repo>/store/privacy-policy.html`
3. paste that url into Play Console → App content → Privacy policy

The url has to be public, load without a login and not be user editable. A Google
Doc with edit access does not qualify.

---

## Build and upload

### Locally, with the upload key in `credentials/`

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew bundleRelease
```

The bundle lands at `android/app/build/outputs/bundle/release/app-release.aab`.

Signing is wired by `plugins/withUploadSigning.js`, so it survives `prebuild`.
It reads `credentials/keystore.properties`; with that folder missing the build
falls back to debug signing, which Play rejects — deliberate, so an unsigned
bundle cannot reach the store by accident. **`credentials/` is gitignored. Back it
up somewhere you will still have in two years.** Losing the upload key is
recoverable through Play support, but only slowly.

Environment variables for a local build come from `.env`, **not** from `eas.json`.
To build with AI on, set `EXPO_PUBLIC_GEMINI_PROXY_URL` in `.env` first.

### Or through EAS

```bash
npm run preflight
npx eas build --platform android --profile production
npx eas submit --platform android --profile production
```

EAS manages its own keystore. If you have already uploaded a locally signed
bundle, give EAS the same one (`eas credentials`) or Play will reject the next
upload for a key mismatch.

`submit` puts the bundle on the **internal** track as a draft, which is the right
place to start. Promote it to closed testing for the 14 day run.

---

## Store assets to produce

| Asset | Spec | Notes |
| --- | --- | --- |
| App icon | 512 × 512 PNG, 32-bit | Export from `assets/images/icon.png` |
| Feature graphic | 1024 × 500 PNG or JPG | Required. No screenshot content, no small text |
| Phone screenshots | 2–8, min 320 px, 16:9 or 9:16 | Take 6: Today, a mission running, the room scan, the journey map, real rewards, the parent area |
| Tablet screenshots | optional | `supportsTablet` is on for iOS only; skip for Play |

Screenshots must be of the real app. Framed mockups with added marketing text are
allowed; fabricated screens are not.

---

## Order of work

1. **Today** — get 12 testers opted in to closed testing. The clock starts now.
2. Today — rotate the Gemini key, enable billing, deploy the proxy.
3. Today — host the privacy policy, fill in the contact address.
4. This week — screenshots, feature graphic, listing copy (`PLAY-CONSOLE.md`).
5. This week — fill every App content form (`PLAY-CONSOLE.md` has the answers).
6. Day 14 — apply for production access.
7. After approval — promote to production, staged rollout at 20%.
