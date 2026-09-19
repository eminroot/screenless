#!/usr/bin/env node
/**
 * The friends board on a laptop, for working on the app.
 *
 *   node dev-server.js            empty board on http://localhost:8787
 *   node dev-server.js --seed     plus three children with scores, whose
 *                                 invite codes are printed so you can add them
 *
 * Same API code as the deployed function, with the in-memory store instead of
 * Firestore, so everything is gone when it stops. Point the app at it with
 * `EXPO_PUBLIC_LEADERBOARD_URL=http://localhost:8787` (Android emulator:
 * `http://10.0.2.2:8787`). The app only accepts plain http in development.
 */

const http = require('node:http');

const { createApp } = require('./src/app');
const { isoWeekKey } = require('./src/rules');
const { createMemoryStore } = require('./src/store/memory');

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 4_000;

const app = createApp({ store: createMemoryStore() });

const server = http.createServer(async (req, res) => {
  // Lets the Expo web preview call it. The deployed function has no CORS at all.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  let raw = '';
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      res.writeHead(413, { 'content-type': 'application/json' }).end('{"error":"tooLarge"}');
      return;
    }
    raw += chunk;
  }

  let body = null;
  if (raw && String(req.headers['content-type'] ?? '').includes('application/json')) {
    try {
      body = JSON.parse(raw);
    } catch {
      res.writeHead(400, { 'content-type': 'application/json' }).end('{"error":"invalid"}');
      return;
    }
  }

  const url = new URL(req.url ?? '/', 'http://localhost');
  const started = Date.now();
  const result = await app.handle({
    method: req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers: req.headers,
    body,
    ip: req.socket.remoteAddress,
  });

  res.writeHead(result.status, { 'content-type': 'application/json' }).end(JSON.stringify(result.body));
  console.log(`${req.method} ${url.pathname} -> ${result.status} ${Date.now() - started}ms`);
});

server.listen(PORT, async () => {
  console.log(`Friends board dev server on http://localhost:${PORT}`);
  if (process.argv.includes('--seed')) await seed();
});

/** Three children to be friends with, so the board has something on it. */
async function seed() {
  const week = isoWeekKey(Date.now());
  const children = [
    { username: 'Arif', buddyId: 'tiger', stars: 186, missions: 17, streak: 4, weekStars: 58, weekSteps: 31200 },
    { username: 'Leyla', buddyId: 'bunny', stars: 242, missions: 22, streak: 6, weekStars: 41, weekSteps: 22800 },
    { username: 'Deniz', buddyId: 'owl', stars: 97, missions: 9, streak: 1, weekStars: 73, weekSteps: 40100 },
  ];

  console.log('\nSeeded children. Add them from the app with these codes:');
  for (const child of children) {
    const claimed = await app.handle({
      method: 'POST',
      path: '/players',
      body: { username: child.username, buddyId: child.buddyId },
      ip: 'seed',
    });
    const { playerId, token, inviteCode } = claimed.body;
    await app.handle({
      method: 'PUT',
      path: '/me/score',
      headers: { authorization: `Bearer ${playerId}.${token}` },
      body: { ...child, weekKey: week },
      ip: 'seed',
    });
    console.log(`  ${child.username.padEnd(8)} ${inviteCode.slice(0, 3)}-${inviteCode.slice(3)}`);
  }
  console.log('');
}
