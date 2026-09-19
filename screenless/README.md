# ScreenLess

A mobile app that reduces a young child's screen dependency by making off-screen
activity the more attractive option. A parent sets up a profile, the child gets an
animated cartoon buddy, and the buddy hands out real-world missions built from that
child's own interests. The parent confirms each one, the buddy grows, and new
content unlocks. The reward for leaving the screen is delivered through the screen.

The buddy has never been outside, so the child is the one who goes and looks. They
photograph what they find, classify it themselves by answering questions about what
is actually in front of them, and keep it in a collection alongside one tree they
watch for a year.

Built for TEKNOFEST 2026, Prevention Technologies.

- **Audience:** children aged 3 to 11, in three groups (3-5, 6-8, 9-11), and the parent who sets it up
- **Languages:** Turkish, English, Azerbaijani, including the AI replies
- **Data:** everything stays on the device. The one exception is the friends board, and
  only for a child whose parent chose a username
- **Recognition:** on device only, and never load bearing. The child always decides

---

## Running it

```bash
cd screenless
npm install
npx expo start
```

Scan the QR code with **Expo Go** on Android or iOS. Press `w` for a browser preview.

To work on the friends board, run its server locally and point the app at it:

```bash
npm run board:dev        # http://localhost:8787, with three seeded children
```

```
EXPO_PUBLIC_LEADERBOARD_URL=http://localhost:8787   # 10.0.2.2:8787 from the Android emulator
```

AI access has two modes, and only two. Copy `.env.example` to `.env`:

```
EXPO_PUBLIC_GEMINI_DEV_KEY=      # local development only, ignored in release builds
EXPO_PUBLIC_GEMINI_PROXY_URL=    # the only route a published build will use
```

> `EXPO_PUBLIC_*` values are compiled into the JS bundle as string literals, so a key
> put there is a published key. `src/ai/config.ts` refuses the dev key outside
> `__DEV__`, and the production profile in `eas.json` forces it empty at build time,
> so neither the code nor the config alone can leak it. For a release, deploy one
> of the two interchangeable proxies — `server/firebase` (a Firebase Function) or
> `server/gemini-proxy` (a Cloudflare Worker) — and point
> `EXPO_PUBLIC_GEMINI_PROXY_URL` at it. Both keep the key in server side secret
> storage, validate the request shape and pin the child safety thresholds where a
> caller cannot relax them. Verify with `npm run preflight`, which scans the real
> exported bundle for key shaped strings.

---

## How it works

**Missions come from a curated library first.** `src/data/tasks.ts` holds 56 missions
across twelve interests and three age bands, each written in all three languages.
`src/engine/task-engine.ts` scores them against the child's interests, avoids recent
repeats, balances categories, and penalises anything the child has skipped. It is
rule based on purpose: a parent can read the library and know exactly what their child
may be asked to do.

**The camera builds missions out of the real room.** `src/app/scan.tsx` reads three
frames through ML Kit's on device labeller, matches them against the twenty objects in
`src/data/room-objects.ts`, and `src/engine/room-engine.ts` fills one of the templates
in `src/data/room-missions.ts` with what it actually found. Frames are downscaled,
read and deleted; only the object names survive. Photo proof (`src/app/proof.tsx`)
works the same way, and what it recognises is a hint for the parent rather than a
verdict.

**Movement is measured, not claimed.** `src/lib/motion.ts` counts jumps, shakes and
spins off the accelerometer and gyroscope with hysteresis and a refractory gap, so a
child who taps "I did it" without moving does not get credit for it.

**Gemini adds three things on top.** The buddy chat, a "surprise me" mission generator,
and a parent coach. Every generated mission is validated for length, minutes and
safety before it is shown; anything malformed falls back to the library, so the child
always gets a real mission.

### The explorer's collection

Twelve things a child can find outside: a tree, a leaf, a flower, a minibeast, a bird,
an animal, a stone, a cloud, water, a feather, a seed, a mushroom. The camera only
decides which of those twelve cards to open, which is the one question the built in
labeller answers reliably, and it is allowed to shrug: when it is unsure the child
picks from the grid and nothing is lost.

**The child is the classifier.** Each kind carries two or three questions in
`src/data/finds.ts` that can only be answered by looking at the real thing. Count the
legs. Feel the bark. Hold the leaf up to the sun. Their answers pick the sub kind on
the card, so a child who has sorted a pointy leaf from a round one has done real
taxonomy without needing either name.

**Looking harder is the only currency.** Every kind has three facts, gated on how many
questions the child answered, and the collection remembers which ones they already
know. The first leaf gets the tiny kitchen. The second gets the pipes. That is what
makes going back out worth it.

**One tree, all year.** `src/app/tree.tsx` is the headline. The child picks one tree
near home, names it, and goes back every couple of weeks to photograph it from the
same spot and measure the trunk in arm spans. No recognition is involved at any point,
because it is the same tree and the child is the one who walks there. What comes out
after twelve months is a strip of photographs across four seasons that could not have
been hurried, faked or bought.

**Bring me two.** `src/app/compare.tsx` asks which of two things is bigger, darker and
pointier. Telling two things apart is far easier than naming either, and two
differences out of three means the child has found two different kinds.

**Finds earn no stars.** Stars only ever come from a mission a parent confirmed.
Photographing forty leaves must not be able to buy an ice cream, so the reward for a
find is the card, the photograph on it and the fact behind it.

**The parent confirms completion.** No sensors, no automatic detection. The child taps
"I did it", the mission goes to pending, and a four digit parent code unlocks the
approve step. Confirmed missions award stars, extend the streak, level the buddy up
and unlock accessories the buddy then wears.

**Real rewards close the loop off the screen.** In the parent area a parent writes down
what they have promised and the star total that earns it: an ice cream at 100, the toy
at 150. The child sees the nearest goal on the Today screen and the full list on the
journey map. When the number is reached the app says so to both of them and stops. It
buys nothing, orders nothing and asks for no payment method; handing the reward over
and ticking it off are both the parent's move. `src/engine/rewards.ts` holds the rules,
and a promise is a note on the device like everything else.

### The friends board

During setup, straight after the child's name and age, the parent answers one question:
can this child have a username? Nothing is preselected.

**No** means no. The score stays on the phone and the app never contacts the board
server, not even to check a name. That is enforced in one place, `src/online/network.ts`,
a gate in front of `fetch` that stays shut unless a username exists or a parent is
choosing one right now. `npm run test:social` replaces `fetch` and calls every board
function with the gate shut to prove no request leaves.

**Yes** opens a username picker. Format is checked while the parent types, availability
is checked against the server after a short pause, and the username is claimed when the
parent continues. From then on:

- `src/online/ScoreSync.tsx` sends stars, missions, streak and this week's stars and
  steps, at most every 30 seconds and only when something changed. Never the name, the
  age or the interests.
- Friends are added only with a six character invite code, and only behind the parent
  code. There is no search. A child can show their own code; they cannot let anyone in.
- The board (`src/app/board.tsx`) ranks the child and their friends by stars this week
  or all time. The child's own row uses the numbers on the phone, so a mission confirmed
  a second ago already counts.
- The parent area has everything else: rename, a new code, remove a friend, and remove
  the username, which deletes it from the server. Deleting everything does the same
  first.

The server is `server/firebase/leaderboard`, a Firebase Function in front of its own
Firestore database. It clamps every number a phone sends, so a patched app gains 25
stars an hour at most, and deletes usernames nobody has used for a year. Its README has
the data model, the rules and the deploy steps.

A family that set up the app before the board existed is treated as having said no. The
parent can turn it on from the parent area.

### Safety around the child's chat

Layered, and independent of Gemini's own filters:

1. **Before sending** (`src/ai/safety.ts`) the message is checked for phone numbers,
   emails, links, and words that signal a child in real distress. Those never reach the
   API. Distress gets a kind reply pointing at a trusted grown up.
2. **The system prompt** (`src/ai/prompts.ts`) locks the reply language, caps the length
   for the age band, and forbids personal questions, links, brands, meeting offers,
   medical advice, and any attempt to rewrite the rules from inside a message.
3. **Gemini safety settings** are all set to `BLOCK_LOW_AND_ABOVE`.
4. **After the reply** it is re-scanned; anything containing a link, an address or a
   contact detail is dropped rather than shown.

### Privacy

The app asks for a first name, an age group and interest categories chosen from a
fixed list, held in device storage under one key. The name never leaves the phone:
Gemini never sees it and neither does the friends board. Without a username there is
no ScreenLess account and nothing on a ScreenLess server. With one, the server holds
the username, the buddy, the board numbers and the friend list, and nothing else.

Scan frames and proof photos are read and deleted. The pictures a child takes for
their collection and their tree are the only ones kept, because those pictures are the
feature: `src/vision/finder.ts` copies each one out of the camera cache, which the
system sweeps, into the app's own document folder, which it does not. They are never
written to the shared media store, so nothing shows up in the phone's gallery, and
they never leave the device. A child can delete any of them from their collection. The parent consents under KVKK law no. 6698 during
setup, can export everything as a file, and can delete everything from the parent area.


### Screen time and the parent dashboard

The screen limit has two halves, and the half that fires dozens of times a week is the
reminders rather than the blocking.

**Measuring.** On Android, `modules/screen-guard` reads `UsageStatsManager` for both the
watched apps (what the limit bites on) and the whole phone (what a parent means by
"screen time"). On iOS, Apple hands an app no figures at all, so the only number that
exists is this app's own foreground time, which `useGuard` counts everywhere including
the web build.

**Reminding.** `src/guard/nudge.ts` decides when to say something: every
`nudgeEveryMin` minutes of measured use, plus three quarters of the budget and the
budget itself. Past the limit the intervals stop, because repeating the point every
half hour is what teaches a child to swipe notifications away.

The copy is three genuinely different registers, not one sentence with the minutes
swapped in:

| | what it says |
|---|---|
| 3-5 | the buddy misses them. No numbers, no limit, no clock |
| 6-9 | minutes left, plus one concrete thing to go and do |
| 10-13 | the figure. No mascot, no exclamation mark |

The notification has to arrive while the child is in *another* app, when no JavaScript
is running. So `useGuard` renders every sentence for the rest of the day in advance and
hands the list down; the Android service and the iOS monitor extension count
checkpoints and post entry `k`. Every decision about language, age band and which
suggestion comes next stays in TypeScript, where `npm run test:nudge` renders 378 lines
across three languages and asserts none of them has an unfilled token.

**Reporting.** With a phone linked to a parent's account, `src/sync/` pushes a day of
counters to the hub and pulls the limits back. What goes is fixed by
`src/sync/report.ts` and it is numbers only: screen minutes, missions, stars, steps,
categories, reminders shown and how many led to a mission. No name, no mission text, no
note, no photo, no location, and `npm run test:sync` asserts each of those absences.

Linking is opt-in, behind the parent code, and unlinking takes nothing with it. See
`../server/README.md` and `../parent/README.md`.

`extra.screenGuard` in `app.json` is **on**, which ships usage access, an overlay and a
foreground service. That is not a Designed-for-Families release; `npm run check:release`
warns about it and `store/SCREEN-GUARD.md` has the paperwork.

---

## Project layout

```
src/
  app/                 expo-router routes
    onboarding/        language, KVKK consent, child, username, interests, buddy, code
    (tabs)/            today, finds, journey, buddy chat, parent
    parent/            coach, history, help, settings, profile, code, friends
    scan, proof, story, collect, find, tree, compare
    mission, confirm, celebrate, privacy, board
  components/
    buddy/             the animated 2D characters
    ui/                Screen, Sticker, Button, Chip, Field, SpeechBubble, ...
  ai/                  gemini client, prompts, safety guards
  online/              friends board: network gate, api, score sync, ranking
  guard/               the daily limit: budget rules, the reminders, the hook
  sync/                the parent dashboard: what is reported, and the limits coming back
  vision/              detector (rooms and proof), finder (outdoors and the album)
  lib/                 motion counting, the buddy's voice, reminders
  data/                missions, room objects and templates, finds, stories, zones
  engine/              mission selection, room missions, finds and the tree, learning
  i18n/                tr / en / az bundles, typed keys
  state/               domain types, storage, app store
  theme/               design tokens
```

### The characters

Twelve buddies (fox, robot, cat, dino, owl, star, bear, tiger, bunny, panda, turtle,
rocket) drawn as SVG in
`src/components/buddy/Buddy.tsx`. No image assets and no animation library files.
Whole-body motion (bob, squash, tilt, hop) runs on Reanimated; blinking, mouth shapes
and arm poses are frame-driven on timers, which gives the limited-animation feel of
hand-drawn cartoons and avoids animated SVG props. Moods are `idle`, `talking`,
`happy`, `cheer` and `sleepy`. Unlocked rewards are rendered onto the character.

### Adding a mission

Append to `library` in `src/data/tasks.ts`. Fill `title` and `body` in all three
languages, pick a `category`, the `ageBands` it suits, and set `stars` roughly equal to
`minutes`. It is picked up automatically.

### Adding a find

Append to `findKinds` in `src/data/finds.ts`. Give it an emoji, a colour, trilingual
name and reaction, the labeller keywords that mean it (`keywords` for the ones that
name it outright, `weak` for the vague ones that only count when nothing specific
matched), two or three questions with tap answers, three facts with rising `at` gates,
and the variants one question decides. Add the id to `FIND_KINDS` in
`src/state/types.ts` and it appears on the shelf. Anything a child should not touch
gets a `caution`, which is shown before the first question.

### Adding a language

Add the code to `src/i18n/types.ts`, copy `locales/en.ts` to the new file, translate it,
register it in `src/i18n/index.tsx`, and add the language name to
`languageInstructionName` so the AI replies in it. TypeScript will list every string
you have not translated yet.

---

## Releasing to Google Play

Read **[store/RELEASE.md](store/RELEASE.md)** first. It has the ordered checklist, the
technical status against current Play policy, and the two things with a clock on them:
the 12 tester / 14 day closed testing rule for personal developer accounts, and the
31 August 2026 target API 36 deadline.

**[store/PLAY-CONSOLE.md](store/PLAY-CONSOLE.md)** has the answer for every App content
form, the Data safety declarations, the IARC content rating answers and the store
listing copy in all three languages.

**[store/privacy-policy.html](store/privacy-policy.html)** is the hostable privacy
policy Play requires a public url for. Replace `CONTACT_EMAIL` before publishing it.

```bash
npm run preflight                                    # typecheck, export, scan for secrets
npx eas build --platform android --profile production
npx eas submit --platform android --profile production
```

`eas build --profile preview` produces an installable APK for testing on a real device
without going through the store.

Permissions actually declared: internet, vibrate, notifications and camera. Location,
microphone, contacts, media and exact alarms are explicitly blocked in `app.json`,
which is what the Families policy requires.

---

## Checks

```bash
npm run typecheck        # tsc --noEmit
npm run test:all         # every pure-logic suite, ten of them
npm run test:nudge       # the reminders, and the copy in all three languages
npm run test:sync        # what leaves the phone, and what a parent's limits do
npm run test:social      # no username means no requests; usernames match the server
npm run test:board-server  # the board server's API suite
npm run check:release    # config and secret scan, no build needed
npm run preflight        # the above plus a real bundle export and scan
npx expo-doctor
```

## Known limits

- Daily reminders use local notifications. Android in Expo Go cannot schedule them
  reliably, so the toggle degrades quietly there and works in a real build.
- A generated mission is stored with the same text in all three language slots, since
  it is written in whichever language was active at the time.
- The parent code cannot be recovered. Resetting the app from phone settings is the
  only way out, and it erases progress. This is deliberate.
