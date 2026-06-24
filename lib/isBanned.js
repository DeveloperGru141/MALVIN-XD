const fs = require('fs');
const cache = require('./cache');
const BANNED_CACHE_TTL = 15000;

function loadBannedList() {
  return cache.wrap('banned-list', () => {
    try {
      return JSON.parse(fs.readFileSync('./data/banned.json', 'utf8'));
    } catch {
      return [];
    }
  }, BANNED_CACHE_TTL);
}

function isBanned(userId) {
  if (!userId) return false;
  try {
    const bannedUsers = loadBannedList();
    return bannedUsers.includes(userId);
  } catch {
    return false;
  }
}

function clearBannedCache() {
  cache.del('banned-list');
}

module.exports = { isBanned, clearBannedCache };
