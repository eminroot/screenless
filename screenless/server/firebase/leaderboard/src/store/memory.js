/**
 * The database, in memory.
 *
 * Used by the test suite and by `dev-server.js`. It keeps exactly the promises
 * the Firestore store keeps, operation by operation, so the tests prove the API
 * and not a friendlier stand in. JavaScript runs one of these at a time, which
 * gives the same all or nothing behaviour a Firestore transaction does.
 *
 * Records are copied in and out so a caller can never change stored state by
 * holding on to an object, which Firestore would not allow either.
 */

const copy = (value) => (value == null ? value : structuredClone(value));

function createMemoryStore() {
  const players = new Map();
  const usernames = new Map();
  const invites = new Map();

  return {
    async createPlayer(player) {
      if (usernames.has(player.usernameKey)) return 'taken';
      if (invites.has(player.inviteCode)) return 'codeClash';
      players.set(player.id, copy(player));
      usernames.set(player.usernameKey, player.id);
      invites.set(player.inviteCode, player.id);
      return 'ok';
    },

    async isUsernameTaken(key) {
      return usernames.has(key);
    },

    async getPlayer(id) {
      return copy(players.get(id) ?? null);
    },

    async getPlayers(ids) {
      return ids.map((id) => players.get(id)).filter(Boolean).map(copy);
    },

    async updatePlayer(id, change) {
      const current = players.get(id);
      if (!current) return null;
      const next = { ...current, ...change(copy(current)) };
      players.set(id, copy(next));
      return copy(next);
    },

    async renamePlayer(id, username, key) {
      const player = players.get(id);
      if (!player) return 'missing';
      const owner = usernames.get(key);
      if (owner && owner !== id) return 'taken';
      usernames.delete(player.usernameKey);
      usernames.set(key, id);
      players.set(id, { ...player, username, usernameKey: key });
      return 'ok';
    },

    async findInvite(code) {
      return invites.get(code) ?? null;
    },

    async setInviteCode(id, code) {
      const player = players.get(id);
      if (!player) return 'missing';
      if (invites.has(code)) return 'codeClash';
      invites.delete(player.inviteCode);
      invites.set(code, id);
      players.set(id, { ...player, inviteCode: code });
      return 'ok';
    },

    async befriend(aId, bId, max) {
      const a = players.get(aId);
      const b = players.get(bId);
      if (!a || !b) return 'missing';
      if (a.friends.includes(bId)) return 'already';
      if (a.friends.length >= max || b.friends.length >= max) return 'full';
      players.set(aId, { ...a, friends: [...a.friends, bId] });
      players.set(bId, { ...b, friends: [...b.friends.filter((f) => f !== aId), aId] });
      return 'ok';
    },

    async unfriend(aId, bId) {
      const a = players.get(aId);
      if (!a) return 'missing';
      players.set(aId, { ...a, friends: a.friends.filter((f) => f !== bId) });
      const b = players.get(bId);
      if (b) players.set(bId, { ...b, friends: b.friends.filter((f) => f !== aId) });
      return 'ok';
    },

    async deletePlayer(id) {
      const player = players.get(id);
      if (!player) return 'missing';
      for (const friendId of player.friends) {
        const friend = players.get(friendId);
        if (friend) players.set(friendId, { ...friend, friends: friend.friends.filter((f) => f !== id) });
      }
      usernames.delete(player.usernameKey);
      invites.delete(player.inviteCode);
      players.delete(id);
      return 'ok';
    },

    async listInactive(before, limit) {
      return [...players.values()]
        .filter((player) => player.updatedAt < before)
        .slice(0, limit)
        .map((player) => player.id);
    },
  };
}

module.exports = { createMemoryStore };
