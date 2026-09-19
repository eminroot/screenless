'use strict';

const crypto = require('node:crypto');

/**
 * Identity for the hub: who a parent is, and which device belongs to a child.
 *
 * Two kinds of credential, deliberately shaped so they can never be confused
 * for one another:
 *
 *   par_<id>.<secret>   a parent, signed in from the parent app
 *   dev_<id>.<secret>   one child's phone, paired once and then silent
 *
 * The prefix is part of the id rather than a separate field because every
 * lookup starts by deciding which table to read. A device token that somehow
 * reached a parent route would miss on `parents` and be rejected before it
 * touched a row, instead of being resolved against the wrong table.
 *
 * Nothing here is reversible. Passwords go through scrypt, tokens are stored
 * as SHA-256 digests, and both are compared in constant time. A dump of the
 * database gives an attacker a list of email addresses and some daily minute
 * counts, which is the worst case this design accepts.
 */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };

/** URL-safe random, no padding. 24 bytes is 192 bits, plenty for a bearer token. */
function randomKey(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function newParentId() {
  return `par_${randomKey(9)}`;
}

function newChildId() {
  return `chd_${randomKey(9)}`;
}

function newDeviceId() {
  return `dev_${randomKey(9)}`;
}

function newToken() {
  return randomKey(32);
}

/* --------------------------------------------------------------- passwords */

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, salt, key] = parts;
  let expected;
  try {
    expected = Buffer.from(key, 'base64');
    const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ tokens */

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('base64');
}

function tokenMatches(token, hash) {
  if (typeof hash !== 'string' || hash.length === 0) return false;
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ----------------------------------------------------------- pairing codes */

/**
 * The code a parent reads out to a child's phone.
 *
 * No vowels, no 0/O/1/I/L: the code is going to be typed by a nine year old
 * from a screen held by someone else, and every pair of characters that look
 * alike in a condensed font is a support ticket. Six characters from this
 * alphabet is about 31 bits, which is far too weak to leave lying around, so
 * codes expire and are single use.
 */
const CODE_ALPHABET = '23456789BCDFGHJKMNPQRSTVWXYZ';

function newPairCode() {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i += 1) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

/** Codes are shown as `ABC-123`; accept any spacing or case on the way back in. */
function normaliseCode(input) {
  const cleaned = String(input ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return cleaned.length === 6 && [...cleaned].every((ch) => CODE_ALPHABET.includes(ch))
    ? cleaned
    : null;
}

const PAIR_CODE_TTL_MS = 30 * 60_000;

module.exports = {
  CODE_ALPHABET,
  PAIR_CODE_TTL_MS,
  hashPassword,
  hashToken,
  newChildId,
  newDeviceId,
  newPairCode,
  newParentId,
  newToken,
  normaliseCode,
  randomKey,
  tokenMatches,
  verifyPassword,
};
