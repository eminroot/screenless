# ScreenLess hub

The small service in the middle. A child's phone pushes numbers up; the parent
app pulls them back as charts.

No dependencies. Node's own `http` and `node:sqlite`, which means the whole
thing installs with a copy and a `systemctl restart` and never needs a package
registry, a compiler or a database daemon on the server.

```
childrenapp/
  screenless/   the child's app
  parent/       the parent's app
  server/       this
```

## Running it here

```bash
npm test          # 43 tests, no network, no files
npm run seed      # six weeks of plausible history for the demo account
npm start         # http://localhost:8080
```

`npm run seed` creates `demo@screenless.app` / `screenless-demo-2026` with three
children, six weeks of days, and a trend that goes the right way. Sign in to the
parent app with it and every chart has something in it.

## Putting it on the server

```bash
bash deploy/push.sh root@<server-ip>
```

That runs the tests, rsyncs the folder, and runs `deploy/install.sh` on the box,
which installs Node 22 if it is missing, makes a `screenless` system user, puts
the code in `/opt/screenless-hub`, the database in `/var/lib/screenless`, and
starts a hardened systemd unit behind nginx.

Then, once:

```bash
ufw allow 80,443/tcp                       # if the firewall is on
certbot --nginx -d hub.your-domain.tld     # once a domain points at the box
```

Logs: `journalctl -u screenless-hub -f`.

### Before it carries anything real

The service answers on plain http so the apps can be pointed at a bare IP while
they are being built. The reports are only numbers, but the bearer tokens are
not, and a token on plain http is a token anyone on the same wifi has. Get a
domain onto the box and run certbot before it leaves the workbench.

## What is stored

Per parent: an email address and a scrypt hash. Per child: the name the
**parent** typed, an age band, and a row of counters per day.

What a child's phone sends is fixed by `src/rules.js` and it is numbers only.
There is no field for a name, a mission, a note, a photo or a location, and
anything extra in the JSON is dropped rather than stored. One of the tests
posts a note, a photo path, a nickname and a pair of coordinates and then
asserts that none of it made it into the database.

## The API

Two kinds of caller, and they never overlap.

| | parent app | child's phone |
|---|---|---|
| gets in with | email and password | a six character pairing code, once |
| token | `par_xxx.secret` | `dev_xxx.secret` |
| can read | names, numbers, charts | its own limits |
| can write | limits | its own daily numbers |

A device token on a parent route is a 401, and the other way round. There is a
test for both directions.

```
GET    /v1/health

POST   /v1/parents                 { email, password, name? }
POST   /v1/parents/session         { email, password }        -> token
DELETE /v1/parents/session
GET    /v1/parents/me
DELETE /v1/parents/me              { password }

GET    /v1/children                every child, today, and a week of bars
POST   /v1/children                { name, ageBand }          -> child + pairing code
PATCH  /v1/children/:id            { name?, ageBand? }
DELETE /v1/children/:id
POST   /v1/children/:id/code       a fresh code
GET    /v1/children/:id/summary    ?range=week|month|quarter  or ?from=&to=
GET    /v1/children/:id/limits
PUT    /v1/children/:id/limits     the daily budget, the tier, the nudges

POST   /v1/devices                 { code, platform }         -> device token
GET    /v1/devices/me              the current plan, with a revision
POST   /v1/devices/me/reports      { days: [...], snapshot }
DELETE /v1/devices/me              unpair
```

### Three decisions worth knowing about

**Syncing is idempotent.** Every counter in `days` takes the larger of what is
stored and what arrived. The phone sends running totals for the day, so
"larger" is also "more recent", a retry after a dropped connection costs
nothing, and a stale report arriving late cannot walk a number backwards.

**Averages are over days that reported.** A phone that was off for a week
should not look like progress. `reportedDays` comes back alongside every
average so the app can say what the average is over.

**Trends compare rates, never totals.** A family's second month has more
reporting days than their first, so comparing sums says "missions up 280%" when
the child did exactly the same amount each day. Everything in `change` is per
reporting day.

### Pairing

A code is six characters from an alphabet with no vowels and no `0/O/1/I/L`,
because a nine year old is going to type it off a screen someone else is
holding. It is single use and it expires in half an hour. Wrong guesses are
rate limited per address; correct ones are not, so a family setting up three
phones on the same wifi never trips it.

## Layout

```
server.js              sockets in, JSON out. The only file that knows about ports
src/app.js             every route. handle(request) -> response, no framework
src/rules.js           what may be stored, and what is silently dropped
src/analytics.js       rollups. Pure, so the tests can drive it with hand-written rows
src/auth.js            scrypt, token hashing, pairing codes
src/rate-limit.js      token buckets
src/store/sqlite.js    the schema and every query
test/api.test.js       43 tests, through handle(), with a clock a test can move
deploy/                systemd unit, nginx site, install.sh, push.sh
```
