/**
 * Captures the screenshots the README uses, from the real apps.
 *
 * Drives headless Chrome over the DevTools Protocol with nothing installed:
 * Node has had a WebSocket client built in since 22, and Chrome is already on
 * any machine that can build this. A screenshot library would be a hundred
 * megabytes of Chromium to do what a hundred lines does.
 *
 * Real screens, not mockups. A mockup drifts from the product the week after
 * it is drawn, and a README that shows something the app does not do is worse
 * than a README with no pictures.
 *
 *   node tools/shots.mjs            both apps
 *   node tools/shots.mjs parent     just one
 *
 * Needs the three dev servers up, on the ports below by default:
 *
 *   cd server     && npm start                       hub       8099
 *   cd screenless && npm run web                     child     8081
 *   cd parent     && npm run web                     parent    8082
 *
 * Override with CHILD_URL / PARENT_URL / HUB_URL when they are somewhere else,
 * which they will be if the parent app is running its native bundler instead.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHILD = process.env.CHILD_URL ?? 'http://localhost:8081';
const PARENT = process.env.PARENT_URL ?? 'http://localhost:8082';
const HUB = process.env.HUB_URL ?? 'http://localhost:8099';
const OUT = join(process.cwd(), 'docs', 'shots');

const CHROME =
  process.env.CHROME ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

/** A phone, at two times density so the strips stay sharp when scaled down. */
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const PORT = 9315;

/* ------------------------------------------------------------- the driver */

/**
 * The smallest CDP client that does the job.
 *
 * One socket to the browser, `Target.attachToTarget` with `flatten` so every
 * command can carry a `sessionId`, and a map of pending ids. No reconnection,
 * no retries: this runs on a laptop with the servers already up, and a failure
 * here should stop and say so rather than paper over a blank page.
 */
async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const listeners = [];

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    for (const listener of listeners) listener(message);
  });

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });

  return { send, on: (fn) => listeners.push(fn), close: () => socket.close() };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------- what to take */

/**
 * `seed` runs before the first navigation and writes whatever the app needs to
 * skip its own front door: a signed-in session for the parent app, a finished
 * profile for the child app. Driving onboarding with synthetic clicks was the
 * first attempt and it broke every time a label moved.
 */
async function shots(app) {
  if (app === 'parent') {
    const token = await signIn();
    const child = await firstChild(token);
    return {
      base: PARENT,
      seed: `localStorage.setItem('screenless.parent.session.v1', ${JSON.stringify(
        JSON.stringify({ token: token.token, parent: token.parent, language: 'tr' }),
      )})`,
      pages: [
        { name: 'parent-children', path: '/children', settle: 2600 },
        { name: 'parent-dashboard', path: `/child/${child}`, settle: 3000 },
        { name: 'parent-dashboard-lower', path: `/child/${child}`, settle: 3000, scroll: 760 },
        { name: 'parent-limits', path: `/child/${child}/limits`, settle: 2400 },
        { name: 'parent-send', path: `/child/${child}/send`, settle: 2400 },
      ],
    };
  }

  return {
    base: CHILD,
    seed: `localStorage.setItem('screenless.data.v1', ${JSON.stringify(
      JSON.stringify(childState()),
    )})`,
    pages: [
      { name: 'child-home', path: '/(tabs)', settle: 3600 },
      { name: 'child-parent', path: '/parent/send', settle: 2600 },
      { name: 'child-wardrobe', path: '/wardrobe', settle: 2600 },
      { name: 'child-screen-time', path: '/parent/screen-time', settle: 2400 },
    ],
  };
}

async function signIn() {
  const response = await fetch(`${HUB}/v1/parents/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@screenless.app', password: 'screenless-demo-2026' }),
  });
  if (!response.ok) throw new Error(`hub sign-in failed: ${response.status}. Is it seeded?`);
  return response.json();
}

async function firstChild(session) {
  const response = await fetch(`${HUB}/v1/children`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const { children } = await response.json();
  // The one with something to show today, so the charts are not all gaps.
  const best = children.find((c) => c.today?.reported) ?? children[0];
  if (!best) throw new Error('no children on the demo account; run server/scripts/seed.js');
  return best.id;
}

/**
 * A finished child profile, mid-journey, with something from a grown up
 * waiting.
 *
 * Written out rather than clicked through because the front door is eight
 * screens long and every one of them is a label that can move. `reconcile()`
 * in `state/storage.ts` fills in every field left out here, so this only has
 * to carry the handful that make the screens worth photographing.
 */
function childState() {
  const now = new Date();
  const iso = now.toISOString();
  const day = (offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return {
    schema: 10,
    // All four of these are what `isOnboarded` checks. Miss one and the app
    // sends you back to the front door, which is what happened the first time.
    settings: {
      language: 'tr',
      parentPin: '2468',
      consentAt: iso,
      voiceEnabled: true,
      duoEnabled: true,
    },
    social: { mode: 'offline', account: null, lastSent: null, lastSentAt: null, lostUsername: null },
    profile: {
      nickname: 'Ayla',
      ageBand: '6-9',
      interests: ['animals', 'drawing', 'nature'],
      buddyId: 'fox',
      buddyName: 'Pamuk',
      createdAt: iso,
    },
    progress: {
      stars: 148,
      level: 6,
      totalMissions: 41,
      totalMinutes: 620,
      streak: 5,
      bestStreak: 11,
      lastDoneDate: day(0),
      unlocked: ['hat', 'scarf', 'cape'],
    },
    walk: {
      coins: 7400,
      lifetimeSteps: 96_000,
      days: [0, 1, 2, 3, 4, 5, 6].map((i) => ({ date: day(i), steps: 5200 - i * 300 })),
      bestDay: 9400,
      goalStreak: 3,
    },
    wardrobe: { owned: ['hat', 'scarf', 'cape', 'shades', 'backpack'], worn: ['scarf'] },
    // The feature this whole round of work was about, sitting on the home
    // screen where a child would find it.
    inbox: {
      assignment: null,
      note: {
        id: 'note_demo',
        text: 'Saat altıda evde ol, sonra parka gideriz',
        at: iso,
        source: 'local',
      },
      pendingReply: null,
      pendingTook: null,
    },
  };
}

/* ------------------------------------------------------------------- run it */

async function capture(app) {
  const plan = await shots(app);
  const profile = join(tmpdir(), `screenless-shots-${app}`);
  rmSync(profile, { recursive: true, force: true });

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  try {
    const version = await poll(`http://127.0.0.1:${PORT}/json/version`);
    const browser = await connect(version.webSocketDebuggerUrl);

    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', {
      targetId,
      flatten: true,
    });

    await browser.send('Page.enable', {}, sessionId);
    await browser.send('Runtime.enable', {}, sessionId);
    await browser.send('Emulation.setDeviceMetricsOverride', VIEWPORT, sessionId);

    // The seed has to be written against the app's own origin, so land there
    // first and only then put it in storage.
    await browser.send('Page.navigate', { url: plan.base }, sessionId);
    await wait(1500);
    await browser.send('Runtime.evaluate', { expression: plan.seed }, sessionId);

    mkdirSync(OUT, { recursive: true });

    for (const page of plan.pages) {
      await browser.send('Page.navigate', { url: plan.base + page.path }, sessionId);
      await wait(page.settle ?? 2500);
      if (page.scroll) {
        await browser.send(
          'Runtime.evaluate',
          { expression: `window.scrollTo(0, ${page.scroll})` },
          sessionId,
        );
        await wait(700);
      }
      const { data } = await browser.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      const file = join(OUT, `${page.name}.png`);
      writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`  ${page.name.padEnd(24)} ${file}`);
    }

    browser.close();
  } finally {
    chrome.kill();
  }
}

/** Chrome takes a moment to open its debugging port. */
async function poll(url, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Not up yet.
    }
    await wait(250);
  }
  throw new Error(`Chrome never answered on ${url}`);
}

const only = process.argv[2];
const apps = only ? [only] : ['child', 'parent'];
for (const app of apps) {
  console.log(`\n${app}`);
  await capture(app);
}
console.log('\ndone\n');
