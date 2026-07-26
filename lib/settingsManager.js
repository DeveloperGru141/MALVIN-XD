const fs = require('fs');
const path = require('path');
const cache = require('./cache');

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');
const SETTINGS_CACHE_TTL = 10000;

const PERSISTABLE_KEYS = [
  'commandMode',
  'prefix',
  'timezone',
  'botName',
  'botOwner',
  'imageUrl',
  'MENU_AUDIO_URL',
  'ALIVE_AUDIO_URL'
];

function getDefaultSettings() {
  try {
    const mainSettings = require('../settings');
    return {
      botName: mainSettings.botName || "🤖 ademola XD 🔥",
      botOwner: mainSettings.botOwner || "ademola King",
      ownerNumber: mainSettings.ownerNumber || "263776388689",
      commandMode: mainSettings.commandMode || "public",
      prefix: mainSettings.prefix || ".",
      timezone: mainSettings.timezone || "Africa/Harare",
      version: mainSettings.version || "2.1.1",
      imageUrl: mainSettings.imageUrl || "",
      MENU_AUDIO_URL: mainSettings.MENU_AUDIO_URL || "https://files.catbox.moe/dy9z54.mp3",
      ALIVE_AUDIO_URL: mainSettings.ALIVE_AUDIO_URL || "https://files.catbox.moe/dy9z54.mp3",
      packname: mainSettings.packname || "ademola XD",
      author: mainSettings.author || "ademola King",
      description: mainSettings.description || "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ xᴅ"
    };
  } catch {
    return {
      botName: "🤖 ademola XD 🔥",
      botOwner: "ademola King",
      ownerNumber: "263776388689",
      commandMode: "public",
      prefix: ".",
      timezone: "Africa/Harare",
      version: "2.1.1",
      imageUrl: "",
      MENU_AUDIO_URL: "https://files.catbox.moe/dy9z54.mp3",
      ALIVE_AUDIO_URL: "https://files.catbox.moe/dy9z54.mp3",
      packname: "ademola XD",
      author: "ademola King",
      description: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ xᴅ"
    };
  }
}

function loadSettings() {
  return cache.wrap('persistent-settings', () => {
    try {
      const defaultSettings = getDefaultSettings();
      if (fs.existsSync(SETTINGS_FILE)) {
        const fileData = fs.readFileSync(SETTINGS_FILE, 'utf8');
        const savedSettings = JSON.parse(fileData);
        return { ...defaultSettings, ...savedSettings };
      }
      saveSettings(defaultSettings);
      return defaultSettings;
    } catch {
      return getDefaultSettings();
    }
  }, SETTINGS_CACHE_TTL);
}

function saveSettings(settings) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const toSave = {};
    for (const key of PERSISTABLE_KEYS) {
      if (key in settings) toSave[key] = settings[key];
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(toSave, null, 2));
    cache.del('persistent-settings');
    return true;
  } catch {
    return false;
  }
}

function updateSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  return saveSettings(settings);
}

function getSetting(key) {
  return loadSettings()[key];
}

function clearSettingsCache() {
  cache.del('persistent-settings');
}

module.exports = {
  loadSettings,
  saveSettings,
  updateSetting,
  getSetting,
  getDefaultSettings,
  clearSettingsCache
};
