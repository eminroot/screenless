'use strict';

const http = require('node:http');
const path = require('node:path');

const { createApp } = require('./src/app');
const { createStore } = require('./src/store/sqlite');

/**
 * The listener.
 *
 * Everything interesting is in `src/app.js`; this file only turns sockets into
 * plain objects and back. It is the one place that knows about ports, headers,
 * bodies and proxies, which is what keeps the API itself testable without any
 * of them.
 *
 * Run it behind nginx with TLS. `TRUST_PROXY=1` then makes the rate limiter
 * read `X-Forwarded-For` instead of seeing every request arrive from 127.0.0.1
 * and throttling the whole world as one caller.
 *
 *   PORT=8080 DB_FILE=/var/lib/screenless/hub.db TRUST_PROXY=1 node server.js
 */

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'hub.db');
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const MAX_BODY = 512 * 1024;

const store = createStore({ file: DB_FILE });
const app = createApp({ store });

// Sessions nobody has used in six months are of no use to anyone. Swept once,
// on boot, rather than on a timer: the service restarts on every deploy.
store.pruneSessions(180 * 86_400_000);

function clientIp(req) {
  if (TRUST_PROXY) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
  }
  return req.socket.remoteAddress || 'unknown';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('too large'), { code: 'TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * Wide open, and it costs nothing.
 *
 * Every route either needs a bearer token or is a sign-in that a browser could
 * have posted to anyway. There are no cookies and no ambient authority, so a
 * page on another origin gains nothing by being allowed to call this: it still
 * has to have been given a token. Being permissive here is what lets the
 * parent app run as a web build during development.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Max-Age': '86400',
};

const server = http.createServer(async (req, res) => {
  const send = (status, body) => {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...CORS,
    });
    res.end(payload);
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', 'http://localhost');
  const query = Object.fromEntries(url.searchParams.entries());

  let body = null;
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    try {
      const raw = await readBody(req);
      if (raw.length > 0) body = JSON.parse(raw);
    } catch (error) {
      if (error && error.code === 'TOO_LARGE') {
        send(413, { error: 'invalid', reason: 'tooLarge' });
        return;
      }
      send(400, { error: 'invalid', reason: 'json' });
      return;
    }
  } else if (req.method === 'DELETE') {
    // Account deletion re-asks for the password, so DELETE carries a body.
    try {
      const raw = await readBody(req);
      if (raw.length > 0) body = JSON.parse(raw);
    } catch {
      body = null;
    }
  }

  const response = await app.handle({
    method: req.method,
    path: url.pathname,
    query,
    headers: req.headers,
    body,
    ip: clientIp(req),
  });

  send(response.status, response.body);
});

server.headersTimeout = 20_000;
server.requestTimeout = 30_000;

server.listen(PORT, HOST, () => {
  const counts = store.stats();
  console.log(
    `[hub] listening on ${HOST}:${PORT}  db=${DB_FILE}  ` +
      `parents=${counts.parents} children=${counts.children} days=${counts.days}`,
  );
});

function shutdown(signal) {
  console.log(`[hub] ${signal}, closing`);
  server.close(() => {
    store.close();
    process.exit(0);
  });
  // A stuck keep-alive socket must not hold a deploy open for ever.
  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
