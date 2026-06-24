const fs = require('fs');
const path = require('path');
const cache = require('./cache');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');
const REACTION_CACHE_TTL = 15000;

function loadAutoReactionState() {
  return cache.wrap('autoReaction', () => {
    try {
      if (fs.existsSync(USER_GROUP_DATA)) {
        const data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
        return data.autoReaction || false;
      }
    } catch (error) {
      console.error('Error loading auto-reaction state:', error);
    }
    return false;
  }, REACTION_CACHE_TTL);
}

let isAutoReactionEnabled = loadAutoReactionState();

async function addCommandReaction(sock, message) {
  try {
    if (!isAutoReactionEnabled || !message?.key?.id) return;
    await sock.sendMessage(message.key.remoteJid, {
      react: { text: '⏳', key: message.key }
    });
  } catch (error) {
    console.error('Error adding command reaction:', error);
  }
}

function refreshAutoReactionState() {
  cache.del('autoReaction');
  isAutoReactionEnabled = loadAutoReactionState();
}

module.exports = { addCommandReaction, refreshAutoReactionState };
