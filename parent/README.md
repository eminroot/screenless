# ScreenLess Parent

The second app. A parent signs in here, adds their children, sets the daily
limit, and reads back what the children's phones reported.

Separate from ScreenLess itself rather than a screen inside it, for one
practical reason: they live on different phones. The child's app runs on the
child's phone and the parent is not standing next to it.

```
childrenapp/
  screenless/   the child's app
  parent/       this
  server/       the hub both of them talk to
```

## Running it

```bash
npm install
npm run web        # http://localhost:8082
npm run android
npm run typecheck
npm run test:format
```

It needs the hub. From `../server`:

```bash
npm run seed       # six weeks of history for demo@screenless.app
npm start          # http://localhost:8099
```

Then sign in as `demo@screenless.app` / `screenless-demo-2026` and every chart
has something in it.

`EXPO_PUBLIC_HUB_URL` in `.env` says where the hub is. Release builds must use
https; the client refuses plain http outside development, for the same reason
the child app does.

## How a phone gets linked

1. A parent adds a child here and gets a six character code.
2. On the child's phone: ScreenLess, parent area, **Parent dashboard**, type
   the code.
3. The code is single use and expires in half an hour.

The direction is deliberate. The code originates with the account it will join,
so holding a child's phone is not enough to attach it to your own account.

## What it can see

Minutes of screen time, missions finished, stars, steps, and how many reminders
were shown. That is the whole list.

Names, photos, messages, drawings and anything a child writes never leave their
phone. The server has no field to receive them, and a test in
`screenless/scripts/test-sync.ts` posts a note, a photo path, a nickname and a
pair of coordinates and then asserts that none of it reached the database.

The name on a card here is the one the **parent** typed into this app. The
child's device has never sent one.

## The rule the charts obey

**A day the phone did not report is not a zero.** It is drawn as a faint tick
on the baseline, visibly different from a bar of no height, and every average
says how many days it is over.

This is the whole credibility of the app. A parent whose child's phone was off
for three days must not see three excellent days, and a dashboard that draws
absence as success cannot be trusted about anything else.

Two consequences worth knowing:

- Averages are over reporting days, not over the calendar.
- Trends compare per-day rates, never totals. A family's second month has more
  reporting days than their first, and comparing sums would say "missions up
  280%" when the child did exactly the same amount each day.

## What the parent can and cannot set

| | from here | on the child's phone |
|---|---|---|
| daily budget | yes | shown |
| what happens at the limit | yes | shown |
| reminder interval | yes | shown |
| quiet hours | yes | shown |
| **which apps are watched** | no | yes |

The watched list is Android package names that only exist on that device, and a
grown up picked them there from the apps actually installed. This app has no way
to show that list and no business guessing at it.

Turning the limit on here means "the parent wants this". Whether it can happen
depends on two Android special-access permissions that only a human standing at
the child's phone can grant.

## Layout

```
src/app/                 the screens. expo-router, file is the route
  index.tsx              sign in and register, one screen for both
  children.tsx           the list, one request per visit
  add.tsx                add a child, then the pairing code
  child/[id]/index.tsx   the dashboard
  child/[id]/limits.tsx  the daily limit
  settings.tsx           account, language, and the two ways out
src/api/                 client.ts and the shapes the hub returns
src/components/ui.tsx    eleven parts, one file
src/components/charts.tsx  hand-drawn svg. No charting library
src/lib/format.ts        every number the screen shows. Pure, and tested
src/i18n/                en, tr, az, checked against the English tree
src/theme/tokens.ts      the look, and why it is nothing like the child app
scripts/make-assets.py   draws the icons
```

## The look

Deliberately not the child app. ScreenLess is thick borders, hard shadows,
saturated colour and a mascot the height of the screen, because it is for a
five year old. This is warm paper, hairline rules, one accent used sparingly
and figures set large, because it is read standing up in a kitchen by the
person paying the phone bill.

The icon is four falling bars rather than a mascot, so a parent reaching for
the dashboard in a hurry never opens the child's app by mistake.

Colour means something here and is never decoration: coral is "look here",
green is "this moved the right way", amber is "it did not". `lowerIsBetter` on
a stat tile is why screen time falling is green and active minutes falling is
not.
