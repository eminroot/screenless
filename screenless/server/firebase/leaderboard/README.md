# ScreenLess friends board

The server behind usernames and the friends board. A Firebase Function in front of
its own Firestore database, deployed from the same Firebase project as the Gemini
proxy but as a separate codebase, so the two deploy, scale and fail on their own.

Only children whose parent chose a username ever reach it. A child whose parent
said no never contacts it, not even to check a username: the app refuses every
request below one gate in `src/online/network.ts`, and `npm run test:social` in the
app proves it by replacing `fetch` and calling every endpoint with the gate shut.

## What it stores

One document per child, keyed by a random id:

| Field | What it is |
| --- | --- |
| `username`, `usernameKey` | as typed, and folded for uniqueness (`Çağla` = `cagla` = `CAGLA`) |
| `tokenHash` | SHA-256 of the token the phone holds. The token itself is never stored |
| `inviteCode` | six characters, no I, L, O, 0 or 1 |
| `buddyId` | which cartoon to draw next to the name |
| `stars`, `missions`, `streak` | totals from the phone, clamped |
| `weekKey`, `weekStars`, `weekSteps`, `weekBase` | the current ISO week's numbers |
| `friends` | ids of up to 50 other children |
| `createdAt`, `updatedAt`, `scoredAt` | milliseconds |

Plus `usernames/{key}` and `invites/{code}`, which exist so a claim and a code
lookup are single atomic reads. Nothing else is accepted: no name, no age, no
interests, no photos, no chat. Friends see a field by field copy of the public
parts (`publicView` in `src/app.js`), never the stored record.

## API

| Method | Path | Body | Auth |
| --- | --- | --- | --- |
| GET | `/usernames/:name` | | |
| POST | `/players` | `{ username, buddyId }` | |
| PATCH | `/me` | `{ username }` | token |
| PUT | `/me/score` | `{ stars, missions, streak, weekKey, weekStars, weekSteps, buddyId }` | token |
| POST | `/me/invite` | | token |
| DELETE | `/me` | | token |
| GET | `/board?week=2026-W38` | | token |
| POST | `/friends` | `{ code }` | token |
| DELETE | `/friends/:id` | | token |

Auth is `Authorization: Bearer <playerId>.<token>`. The token is handed out once, by
`POST /players`, and lives on the phone. Errors come back as `{ "error": "taken" }`
with a matching status, and the app maps each one to a sentence a parent can act on.

## Rules it holds the line on

All in `src/rules.js`.

- **Usernames.** 3 to 16 characters, Latin plus the Turkish and Azerbaijani letters,
  digits and `_`, starting with a letter, at most 4 digits so a phone number cannot
  be a username. Rude roots in all three languages and names that could pass for
  the app are refused. The format part is mirrored in `src/online/username.ts` in
  the app, and the app's test checks the two agree case by case.
- **Stars.** Never go down. Arrive at up to 150 at once plus 25 an hour since the
  last accepted score, so an honest child who was offline for a week catches up in
  one sync and a patched app gains 25 an hour at most. A first score may bring up to
  3000, for a child who played for months before getting a username. The level is
  worked out here from the stars, never taken from the phone.
- **Weekly numbers.** Week stars are capped by the stars that actually arrived since
  the week began, so an old total cannot buy the weekly board. A week key more than a
  week from the server's own is ignored.
- **Friends.** Mutual, added only by invite code, 50 at most. Wrong codes cost a token
  from an 8 token bucket per player that refills one a minute; real codes cost
  nothing, so a teacher adding a whole class is never throttled.
- **Rate limits.** Per instance, in memory (`src/rate-limit.js`). With
  `maxInstances: 10` that bounds both abuse and the bill.
- **Retention.** `leaderboardSweep` runs daily and deletes every child nobody has
  opened the app for in a year, with their username, code and friend links.

## Deploy

Needs the Blaze plan, which this project already has for the Gemini proxy.

```bash
cd server/firebase
npm --prefix leaderboard install

# Once: a database of its own, in the same region as the functions.
npx firebase firestore:databases:create screenless --location=europe-west1 --delete-protection=ENABLED

# The security rules deny all client access, then the two functions.
npx firebase deploy --only firestore,functions:screenless-social
```

Deploy prints the url. Put it in `eas.json` under
`build.production.env.EXPO_PUBLIC_LEADERBOARD_URL` (already filled with the url this
project will get) and in `.env` for a local build against the real server:

```
EXPO_PUBLIC_LEADERBOARD_URL=https://europe-west1-cyberxbank-7dc0b.cloudfunctions.net/leaderboard
```

Check it:

```bash
curl -s https://europe-west1-cyberxbank-7dc0b.cloudfunctions.net/leaderboard/usernames/Arif
# {"available":true}
```

The first deploy of the sweep asks to enable Cloud Scheduler. Say yes.

## Local development

```bash
npm run dev          # http://localhost:8787, three seeded children with invite codes
```

Same API code with an in-memory store, so everything is gone when it stops. Point the
app at it with `EXPO_PUBLIC_LEADERBOARD_URL=http://localhost:8787`, or
`http://10.0.2.2:8787` from the Android emulator. Plain http is only accepted by
development builds of the app.

## Tests

```bash
npm test               # 22 cases against the in-memory store
npm run test:emulator  # the same 22 against the Firestore emulator (needs Java)
```

Running one suite against both stores is what keeps them honest, including the two
races that matter: two phones claiming the same username at the same moment, and two
children adding each other at the same moment.

## Things to know

- **The data is in a named database, `screenless`,** not in `(default)`. Nothing else
  in the project can read it by accident, and it can be exported or deleted as a unit.
  If ScreenLess ever moves to a Firebase project of its own, move the database with
  it; `index.js` only needs the project to change.
- **Losing a phone loses the username.** There is no account to sign back in to, by
  design. The parent picks a new username; the old one is swept after a year.
- **App Check is not wired up.** The url is public and the rate limits are the
  defence. Adding Firebase App Check with Play Integrity would prove requests come
  from the genuine app, and needs the Firebase client SDK in the app first.
