require('dotenv').config();
const publicSettings = require('./setting');

const settings = {
  botName: publicSettings.BOT_NAME,
  botOwner: publicSettings.OWNER_NAME,
  ownerNumber: publicSettings.OWNER_NUMBER,
  SESSION_ID: publicSettings.SESSION_ID,
  timezone: publicSettings.TIMEZONE,
  commandMode: publicSettings.MODE,

  packname: 'sᴛᴀʀ xᴅ',
  author: 'ᴀᴅᴇᴍᴏʟᴀ ᴋɪɴɢ',
  version: '2.1.1',
  prefix: '.',
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ xᴅ",
  updateZipUrl: "https://github.com/XdKing2/MALVIN-XD/archive/refs/heads/main.zip",
  imageUrl: "https://i.ibb.co/zHhMyRT3/malvin-xd.jpg",
  MENU_AUDIO_URL: "https://files.catbox.moe/jrhodx.mp3",
  ALIVE_AUDIO_URL: "https://files.catbox.moe/dy9z54.mp3",
};

global.SESSION_ID = settings.SESSION_ID;
module.exports = settings;
