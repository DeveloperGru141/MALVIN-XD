const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

// Load default settings from your settings.js
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
            imageUrl: mainSettings.imageUrl || "https://i.ibb.co/VWt5CXzX/malvin-xd.jpg",
            MENU_AUDIO_URL: mainSettings.MENU_AUDIO_URL || "https://files.catbox.moe/dy9z54.mp3",
            ALIVE_AUDIO_URL: mainSettings.ALIVE_AUDIO_URL || "https://files.catbox.moe/dy9z54.mp3",
            packname: mainSettings.packname || "ademola XD",
            author: mainSettings.author || "ademola King",
            description: mainSettings.description || "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ xᴅ"
        };
    } catch (error) {
        console.error('Error loading default settings:', error);
        return {
            botName: "🤖 ademola XD 🔥",
            botOwner: "ademola King",
            ownerNumber: "263776388689",
            commandMode: "public",
            prefix: ".",
            timezone: "Africa/Harare",
            version: "2.1.1",
            imageUrl: "https://i.ibb.co/VWt5CXzX/malvin-xd.jpg",
            MENU_AUDIO_URL: "https://files.catbox.moe/dy9z54.mp3",
            ALIVE_AUDIO_URL: "https://files.catbox.moe/dy9z54.mp3",
            packname: "ademola XD",
            author: "ademola King",
            description: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ xᴅ"
        };
    }
}

// Load settings from file
function loadSettings() {
    try {
        const defaultSettings = getDefaultSettings();
        
        if (fs.existsSync(SETTINGS_FILE)) {
            const fileData = fs.readFileSync(SETTINGS_FILE, 'utf8');
            const savedSettings = JSON.parse(fileData);
            // Merge: saved settings persist, but live env values always win for critical fields
            return { ...savedSettings, ...defaultSettings };
        } else {
            // Create settings file with defaults
            saveSettings(defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        return getDefaultSettings();
    }
}

// Only these keys can be user-persisted (everything else comes from .env)
const PERSISTABLE_KEYS = ['commandMode', 'prefix', 'timezone'];

// Save settings to file (only persistable keys)
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
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

// Update specific setting
function updateSetting(key, value) {
    const settings = loadSettings();
    settings[key] = value;
    return saveSettings(settings);
}

// Get specific setting
function getSetting(key) {
    const settings = loadSettings();
    return settings[key];
}

module.exports = {
    loadSettings,
    saveSettings,
    updateSetting,
    getSetting,
    getDefaultSettings
};