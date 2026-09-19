# ScreenLess

Three pieces that ship together.

```
childrenapp/
  screenless/   the child's app      Expo SDK 54, ages 3-14, TR/EN/AZ
  parent/       the parent's app     Expo SDK 54, the dashboard and the limits
  server/       the hub              Node, no dependencies, one SQLite file
```

They are separate apps rather than one app with a parent mode, for a practical
reason rather than an architectural one: they live on different phones. A
parent setting a limit is not standing next to the child's device.

## Getting all three up

```bash
cd server    && npm run seed && npm start   # hub on :8099, six weeks of demo data
cd parent    && npm install && npm run web  # :8082, sign in as demo@screenless.app
cd screenless && npm run web                # :8081
```

The demo account is `demo@screenless.app` / `screenless-demo-2026`.

Each app has its own README with the detail. `.claude/launch.json` has entries
for all three.

## How they fit together

```
child's phone                      hub                        parent's phone
──────────────                     ───                        ──────────────
measures screen time    ──push──▶  keeps a row per day  ──▶    charts, trends
posts the reminders                                            best and worst days
                        ◀──pull──  the limits a parent  ◀──    budget, reminders,
                                   set                         quiet hours
```

The child's phone pairs once with a six character code that the parent app
generates. The code originates with the account it will join, which is what
stops someone holding a child's phone attaching it to their own account.

## What crosses the wire

Counts. Minutes of screen time, missions finished, stars, steps, mission
categories, reminders shown and how many led to a mission being started.

Not: the child's name, mission titles, the private notes the 10-14 tier writes,
photographs, chat messages, the collection, or anything a child typed or drew.
There is no field on the server to receive any of it, and
`screenless/scripts/test-sync.ts` posts a note, a photo path, a nickname and a
pair of coordinates and then asserts that none of it was stored.

The name a parent sees is the one they typed into the parent app. The child's
device has never sent one.

## Checks

```bash
cd screenless && npm run typecheck && npm run test:all   # ten suites
cd parent     && npm run typecheck && npm run test:format
cd server     && npm test                                # 43 tests, no network
```

## Deploying the hub

```bash
cd server && bash deploy/push.sh root@<server-ip>
```

Runs the tests, copies the folder, installs Node 22 if the box needs it, and
starts a hardened systemd unit behind nginx. Then get a domain onto the box and
run certbot before it carries anything real: the reports are only numbers, but
the bearer tokens are not.
