/**
 * The database, on Firestore.
 *
 *   players/{playerId}      the child's username, buddy, numbers and friends
 *   usernames/{key}         one document per folded username, so two phones
 *                           cannot claim the same one at the same moment
 *   invites/{code}          invite code to player, so a code can be looked up
 *                           without scanning players
 *
 * Every operation that touches more than one document runs in a transaction.
 * Nothing in the app talks to Firestore directly: the security rules deny all
 * client access and only this code, through the Admin SDK, reads or writes.
 *
 * Must keep the same promises as `memory.js`. The test suite runs against both.
 */

function createFirestoreStore(db) {
  const players = db.collection('players');
  const usernames = db.collection('usernames');
  const invites = db.collection('invites');

  return {
    async createPlayer(player) {
      return db.runTransaction(async (tx) => {
        const [name, code] = await tx.getAll(usernames.doc(player.usernameKey), invites.doc(player.inviteCode));
        if (name.exists) return 'taken';
        if (code.exists) return 'codeClash';
        tx.create(players.doc(player.id), player);
        tx.create(usernames.doc(player.usernameKey), { playerId: player.id, createdAt: player.createdAt });
        tx.create(invites.doc(player.inviteCode), { playerId: player.id });
        return 'ok';
      });
    },

    async isUsernameTaken(key) {
      return (await usernames.doc(key).get()).exists;
    },

    async getPlayer(id) {
      const snap = await players.doc(id).get();
      return snap.exists ? snap.data() : null;
    },

    async getPlayers(ids) {
      if (ids.length === 0) return [];
      const snaps = await db.getAll(...ids.map((id) => players.doc(id)));
      return snaps.filter((snap) => snap.exists).map((snap) => snap.data());
    },

    async updatePlayer(id, change) {
      return db.runTransaction(async (tx) => {
        const ref = players.doc(id);
        const snap = await tx.get(ref);
        if (!snap.exists) return null;
        const current = snap.data();
        const patch = change(current);
        tx.update(ref, patch);
        return { ...current, ...patch };
      });
    },

    async renamePlayer(id, username, key) {
      return db.runTransaction(async (tx) => {
        const ref = players.doc(id);
        const [snap, name] = await tx.getAll(ref, usernames.doc(key));
        if (!snap.exists) return 'missing';
        if (name.exists && name.get('playerId') !== id) return 'taken';
        const player = snap.data();
        if (player.usernameKey !== key) {
          tx.delete(usernames.doc(player.usernameKey));
          tx.set(usernames.doc(key), { playerId: id, createdAt: Date.now() });
        }
        tx.update(ref, { username, usernameKey: key });
        return 'ok';
      });
    },

    async findInvite(code) {
      const snap = await invites.doc(code).get();
      return snap.exists ? snap.get('playerId') : null;
    },

    async setInviteCode(id, code) {
      return db.runTransaction(async (tx) => {
        const ref = players.doc(id);
        const [snap, existing] = await tx.getAll(ref, invites.doc(code));
        if (!snap.exists) return 'missing';
        if (existing.exists) return 'codeClash';
        tx.delete(invites.doc(snap.get('inviteCode')));
        tx.create(invites.doc(code), { playerId: id });
        tx.update(ref, { inviteCode: code });
        return 'ok';
      });
    },

    async befriend(aId, bId, max) {
      return db.runTransaction(async (tx) => {
        const [a, b] = await tx.getAll(players.doc(aId), players.doc(bId));
        if (!a.exists || !b.exists) return 'missing';
        const aFriends = a.get('friends') ?? [];
        const bFriends = b.get('friends') ?? [];
        if (aFriends.includes(bId)) return 'already';
        if (aFriends.length >= max || bFriends.length >= max) return 'full';
        tx.update(a.ref, { friends: [...aFriends, bId] });
        tx.update(b.ref, { friends: [...bFriends.filter((f) => f !== aId), aId] });
        return 'ok';
      });
    },

    async unfriend(aId, bId) {
      return db.runTransaction(async (tx) => {
        const [a, b] = await tx.getAll(players.doc(aId), players.doc(bId));
        if (!a.exists) return 'missing';
        tx.update(a.ref, { friends: (a.get('friends') ?? []).filter((f) => f !== bId) });
        if (b.exists) tx.update(b.ref, { friends: (b.get('friends') ?? []).filter((f) => f !== aId) });
        return 'ok';
      });
    },

    async deletePlayer(id) {
      return db.runTransaction(async (tx) => {
        const ref = players.doc(id);
        const snap = await tx.get(ref);
        if (!snap.exists) return 'missing';
        const player = snap.data();
        // Every read before the first write, as a transaction requires.
        const friends = player.friends.length
          ? await tx.getAll(...player.friends.map((friendId) => players.doc(friendId)))
          : [];
        for (const friend of friends) {
          if (!friend.exists) continue;
          tx.update(friend.ref, { friends: (friend.get('friends') ?? []).filter((f) => f !== id) });
        }
        tx.delete(usernames.doc(player.usernameKey));
        tx.delete(invites.doc(player.inviteCode));
        tx.delete(ref);
        return 'ok';
      });
    },

    async listInactive(before, limit) {
      const snap = await players.where('updatedAt', '<', before).limit(limit).select().get();
      return snap.docs.map((doc) => doc.id);
    },
  };
}

module.exports = { createFirestoreStore };
