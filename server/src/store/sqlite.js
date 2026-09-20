'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const { CATEGORIES, defaultLimits } = require('../rules');

/**
 * Where the hub keeps everything, which is one file on the server.
 *
 * SQLite through Node's own `node:sqlite`, so the whole service installs with
 * a `git pull` and a `systemctl restart` and never needs a compiler, a package
 * registry or a database daemon on the box. For a few hundred families each
 * writing a handful of rows a day that is not a compromise, it is the right
 * size: the entire dataset for a year of one family is smaller than a photo.
 *
 * Everything is synchronous. `node:sqlite` has no async API and, at this write
 * volume, wrapping it in promises would buy nothing but the illusion of
 * concurrency. WAL is on so a read during a write does not block.
 *
 * The schema is created on open and migrated forwards by `user_version`. There
 * is no migration tool and there does not need to be one.
 */

const SCHEMA = 2;

function open(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 4000');
  migrate(db);
  return db;
}

function migrate(db) {
  const current = db.prepare('PRAGMA user_version').get().user_version;
  if (current >= SCHEMA) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS parents (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      pass_hash   TEXT NOT NULL,
      name        TEXT,
      created_at  INTEGER NOT NULL,
      last_seen   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash  TEXT PRIMARY KEY,
      parent_id   TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
      created_at  INTEGER NOT NULL,
      last_seen   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_parent ON sessions(parent_id);

    CREATE TABLE IF NOT EXISTS children (
      id          TEXT PRIMARY KEY,
      parent_id   TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      age_band    TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      pair_code   TEXT,
      pair_expires INTEGER,
      paired_at   INTEGER,
      buddy_id    TEXT,
      level       INTEGER NOT NULL DEFAULT 1,
      stars       INTEGER NOT NULL DEFAULT 0,
      coins       INTEGER NOT NULL DEFAULT 0,
      total_missions INTEGER NOT NULL DEFAULT 0,
      streak      INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      tz_offset_min INTEGER NOT NULL DEFAULT 0,
      app_version TEXT,
      last_report INTEGER
    );
    CREATE INDEX IF NOT EXISTS children_parent ON children(parent_id);
    CREATE UNIQUE INDEX IF NOT EXISTS children_code ON children(pair_code) WHERE pair_code IS NOT NULL;

    CREATE TABLE IF NOT EXISTS devices (
      id          TEXT PRIMARY KEY,
      child_id    TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      token_hash  TEXT NOT NULL,
      platform    TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      last_seen   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS devices_child ON devices(child_id);

    CREATE TABLE IF NOT EXISTS limits (
      child_id    TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
      revision    INTEGER NOT NULL DEFAULT 1,
      enabled     INTEGER NOT NULL DEFAULT 0,
      tier        TEXT NOT NULL DEFAULT 'notice',
      daily_budget_min INTEGER NOT NULL DEFAULT 120,
      nudge_every_min  INTEGER NOT NULL DEFAULT 30,
      grace_count INTEGER NOT NULL DEFAULT 2,
      grace_minutes INTEGER NOT NULL DEFAULT 5,
      curfew_start_min INTEGER NOT NULL DEFAULT -1,
      curfew_end_min   INTEGER NOT NULL DEFAULT -1,
      watched     TEXT NOT NULL DEFAULT '[]',
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS days (
      child_id    TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      date        TEXT NOT NULL,
      screen_sec  INTEGER NOT NULL DEFAULT 0,
      guarded_sec INTEGER NOT NULL DEFAULT 0,
      app_sec     INTEGER NOT NULL DEFAULT 0,
      missions_done INTEGER NOT NULL DEFAULT 0,
      missions_started INTEGER NOT NULL DEFAULT 0,
      stars       INTEGER NOT NULL DEFAULT 0,
      coins       INTEGER NOT NULL DEFAULT 0,
      steps       INTEGER NOT NULL DEFAULT 0,
      active_min  INTEGER NOT NULL DEFAULT 0,
      nudges      INTEGER NOT NULL DEFAULT 0,
      nudge_heeded INTEGER NOT NULL DEFAULT 0,
      over_limit  INTEGER NOT NULL DEFAULT 0,
      graces_used INTEGER NOT NULL DEFAULT 0,
      cat_move    INTEGER NOT NULL DEFAULT 0,
      cat_outdoor INTEGER NOT NULL DEFAULT 0,
      cat_create  INTEGER NOT NULL DEFAULT 0,
      cat_social  INTEGER NOT NULL DEFAULT 0,
      cat_calm    INTEGER NOT NULL DEFAULT 0,
      updated_at  INTEGER NOT NULL,
      PRIMARY KEY (child_id, date)
    );
    CREATE INDEX IF NOT EXISTS days_child_date ON days(child_id, date DESC);

    /*
     * The three tables below are the other direction.
     *
     * Everything above this line is what a child's phone measured and sent
     * up. Everything below it is what a parent wrote and is waiting to go
     * down: a mission they picked, a reward they promised, a line they typed.
     * The split matters, because the rule for the two halves is not the same.
     * A child's sentences never reach this file. A parent's do, for the same
     * reason the child's name already does — they typed it, into their own
     * account, about their own child.
     *
     * What comes back up from these is ids and enums: which mission was taken,
     * which note was answered and with which of four fixed replies. There is
     * no column here a phone can put free text into.
     */

    CREATE TABLE IF NOT EXISTS assignments (
      child_id    TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
      task_id     TEXT NOT NULL,
      assigned_at INTEGER NOT NULL,
      taken_at    INTEGER
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id          TEXT PRIMARY KEY,
      child_id    TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      stars       INTEGER NOT NULL,
      label       TEXT NOT NULL,
      emoji       TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      given_at    INTEGER
    );
    CREATE INDEX IF NOT EXISTS rewards_child ON rewards(child_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS notes (
      id          TEXT PRIMARY KEY,
      child_id    TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      text        TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      reply       TEXT,
      replied_at  INTEGER
    );
    CREATE INDEX IF NOT EXISTS notes_child ON notes(child_id, created_at DESC);
  `);

  db.exec(`PRAGMA user_version = ${SCHEMA}`);
}

/* ------------------------------------------------------------------ shapes */

function rowToChild(row) {
  if (!row) return null;
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    ageBand: row.age_band,
    createdAt: row.created_at,
    pairCode: row.pair_code || null,
    pairExpires: row.pair_expires || null,
    pairedAt: row.paired_at || null,
    buddyId: row.buddy_id || null,
    level: row.level,
    stars: row.stars,
    coins: row.coins,
    totalMissions: row.total_missions,
    streak: row.streak,
    bestStreak: row.best_streak,
    tzOffsetMin: row.tz_offset_min,
    appVersion: row.app_version || null,
    lastReport: row.last_report || null,
  };
}

function rowToAssignment(row) {
  if (!row) return null;
  return {
    taskId: row.task_id,
    assignedAt: row.assigned_at,
    takenAt: row.taken_at || null,
  };
}

function rowToReward(row) {
  return {
    id: row.id,
    stars: row.stars,
    label: row.label,
    emoji: row.emoji,
    createdAt: row.created_at,
    givenAt: row.given_at || null,
  };
}

function rowToNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
    reply: row.reply || null,
    repliedAt: row.replied_at || null,
  };
}

function rowToLimits(row) {
  if (!row) return { ...defaultLimits(), revision: 0, updatedAt: null };
  let watched = [];
  try {
    watched = JSON.parse(row.watched);
  } catch {
    watched = [];
  }
  return {
    revision: row.revision,
    enabled: row.enabled === 1,
    tier: row.tier,
    dailyBudgetMin: row.daily_budget_min,
    nudgeEveryMin: row.nudge_every_min,
    graceCount: row.grace_count,
    graceMinutes: row.grace_minutes,
    curfewStartMin: row.curfew_start_min,
    curfewEndMin: row.curfew_end_min,
    watched: Array.isArray(watched) ? watched : [],
    updatedAt: row.updated_at,
  };
}

function rowToDay(row) {
  return {
    date: row.date,
    screenSec: row.screen_sec,
    guardedSec: row.guarded_sec,
    appSec: row.app_sec,
    missionsDone: row.missions_done,
    missionsStarted: row.missions_started,
    stars: row.stars,
    coins: row.coins,
    steps: row.steps,
    activeMin: row.active_min,
    nudges: row.nudges,
    nudgeHeeded: row.nudge_heeded,
    overLimit: row.over_limit === 1,
    gracesUsed: row.graces_used,
    categories: {
      move: row.cat_move,
      outdoor: row.cat_outdoor,
      create: row.cat_create,
      social: row.cat_social,
      calm: row.cat_calm,
    },
  };
}

/* ------------------------------------------------------------------- store */

function createStore({ file = ':memory:', clock = () => Date.now() } = {}) {
  const db = open(file);

  const q = {
    parentByEmail: db.prepare('SELECT * FROM parents WHERE email = ?'),
    parentById: db.prepare('SELECT * FROM parents WHERE id = ?'),
    insertParent: db.prepare(
      'INSERT INTO parents (id, email, pass_hash, name, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
    ),
    touchParent: db.prepare('UPDATE parents SET last_seen = ? WHERE id = ?'),
    deleteParent: db.prepare('DELETE FROM parents WHERE id = ?'),

    insertSession: db.prepare(
      'INSERT INTO sessions (token_hash, parent_id, created_at, last_seen) VALUES (?, ?, ?, ?)',
    ),
    sessionByHash: db.prepare('SELECT * FROM sessions WHERE token_hash = ?'),
    touchSession: db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    deleteSessionsOlderThan: db.prepare('DELETE FROM sessions WHERE last_seen < ?'),

    insertChild: db.prepare(
      `INSERT INTO children (id, parent_id, name, age_band, created_at, pair_code, pair_expires)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ),
    childById: db.prepare('SELECT * FROM children WHERE id = ?'),
    childrenOf: db.prepare('SELECT * FROM children WHERE parent_id = ? ORDER BY created_at ASC'),
    childByCode: db.prepare('SELECT * FROM children WHERE pair_code = ?'),
    renameChild: db.prepare('UPDATE children SET name = ?, age_band = ? WHERE id = ?'),
    setCode: db.prepare('UPDATE children SET pair_code = ?, pair_expires = ? WHERE id = ?'),
    clearCode: db.prepare('UPDATE children SET pair_code = NULL, pair_expires = NULL, paired_at = ? WHERE id = ?'),
    deleteChild: db.prepare('DELETE FROM children WHERE id = ?'),
    applySnapshot: db.prepare(
      `UPDATE children SET buddy_id = COALESCE(?, buddy_id), level = ?, stars = ?, coins = ?,
         total_missions = ?, streak = ?, best_streak = ?, tz_offset_min = ?,
         app_version = COALESCE(?, app_version), last_report = ?, age_band = COALESCE(?, age_band)
       WHERE id = ?`,
    ),
    touchReport: db.prepare('UPDATE children SET last_report = ? WHERE id = ?'),

    insertDevice: db.prepare(
      'INSERT INTO devices (id, child_id, token_hash, platform, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
    ),
    deviceById: db.prepare('SELECT * FROM devices WHERE id = ?'),
    devicesOf: db.prepare('SELECT * FROM devices WHERE child_id = ? ORDER BY created_at ASC'),
    touchDevice: db.prepare('UPDATE devices SET last_seen = ? WHERE id = ?'),
    deleteDevice: db.prepare('DELETE FROM devices WHERE id = ?'),

    limitsOf: db.prepare('SELECT * FROM limits WHERE child_id = ?'),
    upsertLimits: db.prepare(
      `INSERT INTO limits (child_id, revision, enabled, tier, daily_budget_min, nudge_every_min,
         grace_count, grace_minutes, curfew_start_min, curfew_end_min, watched, updated_at)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(child_id) DO UPDATE SET
         revision = limits.revision + 1,
         enabled = excluded.enabled, tier = excluded.tier,
         daily_budget_min = excluded.daily_budget_min, nudge_every_min = excluded.nudge_every_min,
         grace_count = excluded.grace_count, grace_minutes = excluded.grace_minutes,
         curfew_start_min = excluded.curfew_start_min, curfew_end_min = excluded.curfew_end_min,
         watched = excluded.watched, updated_at = excluded.updated_at`,
    ),

    upsertDay: db.prepare(
      `INSERT INTO days (child_id, date, screen_sec, guarded_sec, app_sec, missions_done,
         missions_started, stars, coins, steps, active_min, nudges, nudge_heeded, over_limit,
         graces_used, cat_move, cat_outdoor, cat_create, cat_social, cat_calm, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(child_id, date) DO UPDATE SET
         screen_sec = MAX(days.screen_sec, excluded.screen_sec),
         guarded_sec = MAX(days.guarded_sec, excluded.guarded_sec),
         app_sec = MAX(days.app_sec, excluded.app_sec),
         missions_done = MAX(days.missions_done, excluded.missions_done),
         missions_started = MAX(days.missions_started, excluded.missions_started),
         stars = MAX(days.stars, excluded.stars),
         coins = MAX(days.coins, excluded.coins),
         steps = MAX(days.steps, excluded.steps),
         active_min = MAX(days.active_min, excluded.active_min),
         nudges = MAX(days.nudges, excluded.nudges),
         nudge_heeded = MAX(days.nudge_heeded, excluded.nudge_heeded),
         over_limit = MAX(days.over_limit, excluded.over_limit),
         graces_used = MAX(days.graces_used, excluded.graces_used),
         cat_move = MAX(days.cat_move, excluded.cat_move),
         cat_outdoor = MAX(days.cat_outdoor, excluded.cat_outdoor),
         cat_create = MAX(days.cat_create, excluded.cat_create),
         cat_social = MAX(days.cat_social, excluded.cat_social),
         cat_calm = MAX(days.cat_calm, excluded.cat_calm),
         updated_at = excluded.updated_at`,
    ),
    daysBetween: db.prepare(
      'SELECT * FROM days WHERE child_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
    ),
    dayOf: db.prepare('SELECT * FROM days WHERE child_id = ? AND date = ?'),
    getAssignment: db.prepare('SELECT * FROM assignments WHERE child_id = ?'),
    putAssignment: db.prepare(
      `INSERT INTO assignments (child_id, task_id, assigned_at, taken_at)
       VALUES (?, ?, ?, NULL)
       ON CONFLICT(child_id) DO UPDATE SET
         task_id = excluded.task_id,
         assigned_at = excluded.assigned_at,
         taken_at = NULL`,
    ),
    clearAssignment: db.prepare('DELETE FROM assignments WHERE child_id = ?'),
    takeAssignment: db.prepare(
      'UPDATE assignments SET taken_at = ? WHERE child_id = ? AND task_id = ? AND taken_at IS NULL',
    ),

    rewardsOf: db.prepare('SELECT * FROM rewards WHERE child_id = ? ORDER BY created_at ASC'),
    rewardById: db.prepare('SELECT * FROM rewards WHERE id = ? AND child_id = ?'),
    countRewards: db.prepare('SELECT COUNT(*) AS n FROM rewards WHERE child_id = ?'),
    insertReward: db.prepare(
      'INSERT INTO rewards (id, child_id, stars, label, emoji, created_at, given_at) VALUES (?, ?, ?, ?, ?, ?, NULL)',
    ),
    setRewardGiven: db.prepare('UPDATE rewards SET given_at = ? WHERE id = ? AND child_id = ?'),
    deleteReward: db.prepare('DELETE FROM rewards WHERE id = ? AND child_id = ?'),

    notesOf: db.prepare('SELECT * FROM notes WHERE child_id = ? ORDER BY created_at DESC LIMIT ?'),
    latestUnanswered: db.prepare(
      'SELECT * FROM notes WHERE child_id = ? AND reply IS NULL ORDER BY created_at DESC LIMIT 1',
    ),
    insertNote: db.prepare(
      'INSERT INTO notes (id, child_id, text, created_at, reply, replied_at) VALUES (?, ?, ?, ?, NULL, NULL)',
    ),
    answerNote: db.prepare(
      'UPDATE notes SET reply = ?, replied_at = ? WHERE id = ? AND child_id = ? AND reply IS NULL',
    ),
    trimNotes: db.prepare(
      `DELETE FROM notes WHERE child_id = ? AND id NOT IN (
         SELECT id FROM notes WHERE child_id = ? ORDER BY created_at DESC LIMIT ?
       )`,
    ),

    countParents: db.prepare('SELECT COUNT(*) AS n FROM parents'),
    countChildren: db.prepare('SELECT COUNT(*) AS n FROM children'),
    countDays: db.prepare('SELECT COUNT(*) AS n FROM days'),
  };

  return {
    db,
    close: () => db.close(),

    /* --------------------------------------------------------- parents */

    /* --------------------------- what a parent sent down to a child */

    getAssignment: (childId) => rowToAssignment(q.getAssignment.get(childId)),
    setAssignment(childId, taskId) {
      q.putAssignment.run(childId, taskId, clock());
      return rowToAssignment(q.getAssignment.get(childId));
    },
    clearAssignment: (childId) => {
      q.clearAssignment.run(childId);
    },
    /**
     * Marks the mission as landed. Keyed on the task id as well as the child,
     * so an acknowledgement for a mission the parent has already replaced
     * does not silently mark the new one as taken.
     */
    takeAssignment(childId, taskId) {
      const result = q.takeAssignment.run(clock(), childId, taskId);
      return result.changes > 0;
    },

    listRewards: (childId) => q.rewardsOf.all(childId).map(rowToReward),
    countRewards: (childId) => q.countRewards.get(childId).n,
    addReward(childId, reward) {
      q.insertReward.run(reward.id, childId, reward.stars, reward.label, reward.emoji, clock());
      return rowToReward(q.rewardById.get(reward.id, childId));
    },
    setRewardGiven(childId, rewardId, given) {
      const result = q.setRewardGiven.run(given ? clock() : null, rewardId, childId);
      if (result.changes === 0) return null;
      return rowToReward(q.rewardById.get(rewardId, childId));
    },
    deleteReward(childId, rewardId) {
      return q.deleteReward.run(rewardId, childId).changes > 0;
    },

    listNotes: (childId, limit = 20) => q.notesOf.all(childId, limit).map(rowToNote),
    /** The one the child's phone still owes an answer to, newest first. */
    openNote: (childId) => rowToNote(q.latestUnanswered.get(childId)),
    addNote(childId, note, keep = 50) {
      q.insertNote.run(note.id, childId, note.text, clock());
      q.trimNotes.run(childId, childId, keep);
      return rowToNote(q.notesOf.all(childId, 1)[0]);
    },
    /** Refuses a second answer to the same note, so a retry cannot overwrite. */
    answerNote(childId, noteId, reply) {
      return q.answerNote.run(reply, clock(), noteId, childId).changes > 0;
    },

    /* --------------------------------------------------------- parents */

    getParentByEmail: (email) => q.parentByEmail.get(email) || null,
    getParent: (id) => q.parentById.get(id) || null,
    createParent(parent) {
      q.insertParent.run(
        parent.id,
        parent.email,
        parent.passHash,
        parent.name || null,
        parent.createdAt,
        parent.createdAt,
      );
      return q.parentById.get(parent.id);
    },
    touchParent: (id) => q.touchParent.run(clock(), id),
    deleteParent: (id) => q.deleteParent.run(id),

    /* -------------------------------------------------------- sessions */

    createSession(tokenHash, parentId) {
      const now = clock();
      q.insertSession.run(tokenHash, parentId, now, now);
    },
    getSession: (tokenHash) => q.sessionByHash.get(tokenHash) || null,
    touchSession: (tokenHash) => q.touchSession.run(clock(), tokenHash),
    deleteSession: (tokenHash) => q.deleteSession.run(tokenHash),
    /** Sessions unused for `ms` are dropped. Called on boot, not per request. */
    pruneSessions: (ms) => q.deleteSessionsOlderThan.run(clock() - ms),

    /* -------------------------------------------------------- children */

    createChild(child) {
      q.insertChild.run(
        child.id,
        child.parentId,
        child.name,
        child.ageBand,
        child.createdAt,
        child.pairCode,
        child.pairExpires,
      );
      return rowToChild(q.childById.get(child.id));
    },
    getChild: (id) => rowToChild(q.childById.get(id)),
    listChildren: (parentId) => q.childrenOf.all(parentId).map(rowToChild),
    getChildByCode(code) {
      const row = q.childByCode.get(code);
      if (!row) return null;
      // An expired code is as good as no code. Checked on read rather than
      // swept on a timer so there is no background job to forget to run.
      if (row.pair_expires && row.pair_expires < clock()) return null;
      return rowToChild(row);
    },
    updateChild: (id, name, ageBand) => q.renameChild.run(name, ageBand, id),
    setPairCode: (id, code, expires) => q.setCode.run(code, expires, id),
    markPaired: (id) => q.clearCode.run(clock(), id),
    deleteChild: (id) => q.deleteChild.run(id),
    applySnapshot(childId, snapshot) {
      const now = clock();
      if (!snapshot) {
        q.touchReport.run(now, childId);
        return;
      }
      q.applySnapshot.run(
        snapshot.buddyId,
        snapshot.level,
        snapshot.stars,
        snapshot.coins,
        snapshot.totalMissions,
        snapshot.streak,
        snapshot.bestStreak,
        snapshot.tzOffsetMin,
        snapshot.appVersion,
        now,
        snapshot.ageBand,
        childId,
      );
    },

    /* --------------------------------------------------------- devices */

    createDevice(device) {
      const now = clock();
      q.insertDevice.run(device.id, device.childId, device.tokenHash, device.platform, now, now);
    },
    getDevice: (id) => q.deviceById.get(id) || null,
    listDevices: (childId) => q.devicesOf.all(childId),
    touchDevice: (id) => q.touchDevice.run(clock(), id),
    deleteDevice: (id) => q.deleteDevice.run(id),

    /* ---------------------------------------------------------- limits */

    getLimits: (childId) => rowToLimits(q.limitsOf.get(childId)),
    setLimits(childId, limits) {
      q.upsertLimits.run(
        childId,
        limits.enabled ? 1 : 0,
        limits.tier,
        limits.dailyBudgetMin,
        limits.nudgeEveryMin,
        limits.graceCount,
        limits.graceMinutes,
        limits.curfewStartMin,
        limits.curfewEndMin,
        JSON.stringify(limits.watched),
        clock(),
      );
      return rowToLimits(q.limitsOf.get(childId));
    },

    /* ------------------------------------------------------------ days */

    /**
     * Folds a report in.
     *
     * Every counter takes the larger of what is stored and what arrived, which
     * makes the whole sync idempotent: the phone can re-send a day as often as
     * it likes, a retry after a dropped connection costs nothing, and the only
     * way a number goes down is a parent deleting the child. The counters are
     * all running totals for the day on the phone's side, so "larger" is also
     * always "more recent".
     */
    putDay(childId, day) {
      q.upsertDay.run(
        childId,
        day.date,
        day.screenSec,
        day.guardedSec,
        day.appSec,
        day.missionsDone,
        day.missionsStarted,
        day.stars,
        day.coins,
        day.steps,
        day.activeMin,
        day.nudges,
        day.nudgeHeeded,
        day.overLimit ? 1 : 0,
        day.gracesUsed,
        day.categories.move,
        day.categories.outdoor,
        day.categories.create,
        day.categories.social,
        day.categories.calm,
        clock(),
      );
    },
    getDays: (childId, from, to) => q.daysBetween.all(childId, from, to).map(rowToDay),
    getDay(childId, date) {
      const row = q.dayOf.get(childId, date);
      return row ? rowToDay(row) : null;
    },

    stats: () => ({
      parents: q.countParents.get().n,
      children: q.countChildren.get().n,
      days: q.countDays.get().n,
    }),
  };
}

module.exports = { createStore, CATEGORIES, SCHEMA };
