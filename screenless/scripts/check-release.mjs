#!/usr/bin/env node
/**
 * Release preflight.
 *
 * Run before every production build. It answers one question: could this build
 * ship a secret, or ship pointing at nothing? Exits non zero if so.
 *
 *   node scripts/check-release.mjs
 *
 * If `dist/` exists (from `npx expo export`) the exported bundle is scanned too,
 * which is the only check that looks at what actually ships rather than at what
 * the config says will ship.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const problems = [];
const warnings = [];
const passed = [];

function fail(message) {
  problems.push(message);
}
function warn(message) {
  warnings.push(message);
}
function ok(message) {
  passed.push(message);
}

/* ------------------------------------------------------------------ secrets */

// Google AI Studio issues both shapes. Long base64ish runs after the prefix.
const KEY_PATTERNS = [
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{30,}/ },
  { name: 'Google AI Studio key', re: /\bAQ\.[0-9A-Za-z_-]{30,}/ },
  { name: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'Firebase service account', re: /"type"\s*:\s*"service_account"/ },
];

function scan(dir, label, skip = new Set()) {
  let hits = 0;
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      if (skip.has(entry)) continue;
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      let text;
      try {
        text = readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      for (const { name, re } of KEY_PATTERNS) {
        if (re.test(text)) {
          fail(`${label}: ${name} found in ${full.slice(root.length + 1)}`);
          hits += 1;
        }
      }
    }
  };
  walk(dir);
  if (hits === 0) ok(`${label}: no key shaped strings`);
}

scan(join(root, 'src'), 'source');

if (existsSync(join(root, 'dist'))) {
  scan(join(root, 'dist'), 'exported bundle');
} else {
  warn('dist/ not found, so the shipping bundle was not scanned. Run `npx expo export` first for the strongest check.');
}

/* ------------------------------------------------------------------- .env */

try {
  execSync('git ls-files --error-unmatch .env', { cwd: root, stdio: 'pipe' });
  fail('.env is tracked by git. Remove it from the index and rotate every key in it.');
} catch {
  ok('.env is not tracked by git');
}

if (existsSync(join(root, '.env'))) {
  const env = readFileSync(join(root, '.env'), 'utf8');
  if (/^\s*EXPO_PUBLIC_GEMINI_API_KEY\s*=\s*\S/m.test(env)) {
    fail('.env still sets EXPO_PUBLIC_GEMINI_API_KEY. That name is no longer read; move the value to EXPO_PUBLIC_GEMINI_DEV_KEY or delete it.');
  } else {
    ok('.env uses no retired key names');
  }
}

/* ----------------------------------------------------------------- eas.json */

const eas = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8'));
const production = eas.build?.production ?? {};
const prodEnv = production.env ?? {};

if (prodEnv.EXPO_PUBLIC_GEMINI_DEV_KEY !== '') {
  fail('eas.json production profile must set EXPO_PUBLIC_GEMINI_DEV_KEY to "" so a local .env cannot leak into a release build.');
} else {
  ok('production build forces the dev key empty');
}

const proxy = prodEnv.EXPO_PUBLIC_GEMINI_PROXY_URL ?? '';
if (!proxy) {
  warn('No EXPO_PUBLIC_GEMINI_PROXY_URL in the production profile. The build is safe, but the buddy chat, the parent coach and surprise missions will be switched off in it.');
} else if (proxy.includes('example')) {
  fail(`EXPO_PUBLIC_GEMINI_PROXY_URL is still the placeholder (${proxy}). Deploy server/gemini-proxy and paste the real url.`);
} else if (!proxy.startsWith('https://')) {
  fail(`EXPO_PUBLIC_GEMINI_PROXY_URL must be https, got ${proxy}`);
} else {
  ok(`production points at ${proxy}`);
}

/**
 * The friends board. Without a url the build is fine, but parents can only
 * answer "keep it on this phone", which contradicts the store listing.
 */
const board = prodEnv.EXPO_PUBLIC_LEADERBOARD_URL ?? '';
if (!board) {
  warn('No EXPO_PUBLIC_LEADERBOARD_URL in the production profile. Usernames and the friends board will be unavailable in the build.');
} else if (!board.startsWith('https://')) {
  fail(`EXPO_PUBLIC_LEADERBOARD_URL must be https, got ${board}. Release builds refuse anything else.`);
} else if (/localhost|10\.0\.2\.2|127\.0\.0\.1/.test(board)) {
  fail(`EXPO_PUBLIC_LEADERBOARD_URL points at a development server (${board}).`);
} else {
  ok(`friends board at ${board}. Deploy server/firebase/leaderboard before shipping a build that uses it`);
}

if (production.android?.buildType !== 'app-bundle') {
  fail('Google Play takes an .aab. Set build.production.android.buildType to "app-bundle".');
} else {
  ok('production builds an app bundle');
}

/* ----------------------------------------------------------------- app.json */

const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;

if (!app.android?.package || app.android.package.startsWith('com.example')) {
  fail('android.package is missing or still an example. It can never be changed after the first upload.');
} else {
  ok(`package id ${app.android.package}`);
}

if (!app.version) fail('app.json has no version');
else ok(`version ${app.version}`);

/* ------------------------------------------------------------ permissions */

/**
 * Checked against the *merged* manifest when there is one, because that is what
 * ships. `app.json` lists only what the app asks for; libraries merge in their
 * own, and `expo-sensors` and React Native both added permissions here that
 * nobody had declared.
 */
const ALWAYS_RISKY = [
  'ACCESS_FINE_LOCATION',
  'ACCESS_COARSE_LOCATION',
  'RECORD_AUDIO',
  'READ_CONTACTS',
  'ACTIVITY_RECOGNITION',
  'READ_EXTERNAL_STORAGE',
  'READ_MEDIA_IMAGES',
  'READ_MEDIA_VIDEO',
  'READ_PHONE_STATE',
  'BIND_ACCESSIBILITY_SERVICE',
];

/**
 * Permissions Screen Guard needs and nothing else in the app may have.
 *
 * They stay forbidden unless `extra.screenGuard` is true in app.json, which is
 * the switch that also turns on different store paperwork. The point of
 * keeping them listed rather than deleting the check is that a library merging
 * one of these in by accident still fails an ordinary build, which is exactly
 * how ACTIVITY_RECOGNITION and SYSTEM_ALERT_WINDOW got in here the first time.
 */
const GUARD_ONLY = [
  'SYSTEM_ALERT_WINDOW',
  'PACKAGE_USAGE_STATS',
  'QUERY_ALL_PACKAGES',
  'FOREGROUND_SERVICE_SPECIAL_USE',
];

// Deliberately not in the list above: RECEIVE_BOOT_COMPLETED. expo-notifications
// already merges it in so a scheduled reminder survives a restart, it is not a
// Families-policy problem, and listing it here failed an ordinary build for a
// permission that was already shipping for a good reason.

const guardBuild = app.extra?.screenGuard === true;
const RISKY = guardBuild ? ALWAYS_RISKY : [...ALWAYS_RISKY, ...GUARD_ONLY];

if (guardBuild) {
  warn(
    'Screen Guard is ON for this build. It ships usage access, an overlay and a foreground service, ' +
      'so this is NOT a Designed-for-Families release. Work through store/SCREEN-GUARD.md before submitting.',
  );
} else {
  ok('Screen Guard is off, so none of its permissions may appear');
}

const mergedManifest = join(
  root,
  'android/app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml',
);

if (existsSync(mergedManifest)) {
  const xml = readFileSync(mergedManifest, 'utf8');
  // A blocked permission still appears, carrying tools:node="remove". Only
  // count the ones that survive into the shipped manifest.
  const kept = [...xml.matchAll(/<uses-permission[^>]*android:name="android\.permission\.([A-Z_]+)"([^>]*)>/g)]
    .filter((m) => !m[2].includes('remove'))
    .map((m) => m[1]);
  const bad = RISKY.filter((r) => kept.includes(r));
  if (bad.length > 0) {
    fail(`Merged release manifest ships permissions this build should not: ${bad.join(', ')}. Add them to android.blockedPermissions in app.json and rebuild, or turn on extra.screenGuard if they belong to Screen Guard.`);
  } else {
    ok(`merged manifest is clean (${kept.length} permissions, none risky)`);
  }
} else {
  const declared = app.android?.permissions ?? [];
  const bad = RISKY.filter((r) => declared.some((p) => p.includes(r)));
  if (bad.length > 0) {
    fail(`Permissions Google Play's Families policy does not allow for a child directed app: ${bad.join(', ')}`);
  } else {
    warn('No merged manifest found, so only app.json was checked. Build once, then re-run to see what libraries actually merge in.');
  }
}

/* --------------------------------------------------------- bundle signature */

/**
 * Reads the certificate out of the built .aab.
 *
 * Expo generates a release build signed with the *debug* key, and a config
 * plugin rewriting that line is easy to get subtly wrong. A debug signed bundle
 * looks completely normal until Play rejects the upload, so the only check worth
 * having is one that reads the artifact itself.
 */
const aab = join(root, 'android/app/build/outputs/bundle/release/app-release.aab');

if (existsSync(aab)) {
  try {
    const cert = execSync(`keytool -printcert -jarfile "${aab}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const owner = (cert.match(/Owner:\s*(.+)/) ?? [, 'unknown'])[1].trim();
    if (/CN=Android Debug/i.test(owner) || /androiddebugkey/i.test(cert)) {
      fail(`The built .aab is signed with the DEBUG key (${owner}). Google Play will reject it. Check the release signingConfig in android/app/build.gradle.`);
    } else if (/^Owner:/m.test(cert)) {
      ok(`.aab signed by ${owner}`);
    }
  } catch {
    warn('Could not read the .aab certificate. Is keytool on PATH?');
  }
} else {
  warn('No .aab built yet, so its signature was not checked.');
}

/* ------------------------------------------------------------------ report */

const line = '─'.repeat(64);
console.log(line);
for (const message of passed) console.log(`  ok    ${message}`);
for (const message of warnings) console.log(`  warn  ${message}`);
for (const message of problems) console.log(`  FAIL  ${message}`);
console.log(line);

if (problems.length > 0) {
  console.log(`${problems.length} problem${problems.length === 1 ? '' : 's'} to fix before building.\n`);
  process.exit(1);
}
console.log(`Ready to build.${warnings.length ? ` ${warnings.length} warning to read first.` : ''}\n`);
