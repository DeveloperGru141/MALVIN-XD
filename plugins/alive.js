const { ademola } = require('../ademola');
const moment = require('moment-timezone');
const os = require('os');
const { fakevCard } = require('../lib/fakevCard');
const { channelInfo } = require('../lib/messageConfig');
const { loadSettings } = require('../lib/settingsManager');
const { toTinyCaps } = require('../lib/tinyCaps');

const botStartTime = Date.now();

// Format status info with tiny caps
const formatStatusInfo = (pushname, harareTime, harareDate, runtimeHours, runtimeMinutes, runtimeSeconds, settings) => `
╭──〔 🎖 ${toTinyCaps(settings.botName)} 〕──
│
├─ 👋 ʜɪ, ${pushname} 🙃
│
├─ ⏰ ᴛɪᴍᴇ: ${harareTime}
├─ 📆 ᴅᴀᴛᴇ: ${harareDate}
├─ ⏳ ᴜᴘᴛɪᴍᴇ: ${runtimeHours} ʜʀs, ${runtimeMinutes} ᴍɪɴs, ${runtimeSeconds} sᴇᴄs
├─ 🧩 ʀᴀᴍ ᴜsᴀɢᴇ: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}ᴍʙ / ${Math.round(os.totalmem() / 1024 / 1024)}ᴍʙ
├─ 🔧 ᴍᴏᴅᴇ: ${toTinyCaps(settings.commandMode)}
├─ 👑 ᴏᴡɴᴇʀ: ${settings.botOwner}
│
├─ 📢 ɴᴏᴛɪᴄᴇ:
│   ɪ ᴀᴍ ɴᴏᴛ ʀᴇsᴘᴏɴsɪʙʟᴇ ғᴏʀ ᴀɴʏ
│   ᴡʜᴀᴛsᴀᴘᴘ ʙᴀɴs ᴛʜᴀᴛ ᴍᴀʏ ᴏᴄᴄᴜʀ
│   ᴅᴜᴇ ᴛᴏ ᴛʜᴇ ᴜsᴀɢᴇ ᴏғ ᴛʜɪs ʙᴏᴛ.
│   ᴜsᴇ ɪᴛ ᴡɪsᴇʟʏ ᴀɴᴅ ᴀᴛ ʏᴏᴜʀ ᴏᴡɴ ʀɪsᴋ ⚠️ 
│
╰───〔 🥰 〕───
> ${settings.description}
`.trim();

ademola({
  pattern: 'alive',
  alias: ['uptime', 'runtime', 'status'],
  desc: 'Check if the bot is active and view system status',
  category: 'info',
  react: '🚀',
  filename: __filename,
}, async (ademola, mek, m, { reply, from, sender, pushName }) => {
  try {
    // Load current settings
    const currentSettings = loadSettings();
    
    const pushname = pushName || m.pushName || 'User';
    const timezone = currentSettings.timezone || 'Africa/Harare';
    const harareTime = moment().tz(timezone).format('HH:mm:ss');
    const harareDate = moment().tz(timezone).format('dddd, MMMM Do YYYY');
    const runtimeMilliseconds = Date.now() - botStartTime;
    const runtimeSeconds = Math.floor((runtimeMilliseconds / 1000) % 60);
    const runtimeMinutes = Math.floor((runtimeMilliseconds / (1000 * 60)) % 60);
    const runtimeHours = Math.floor(runtimeMilliseconds / (1000 * 60 * 60));

    const statusInfo = formatStatusInfo(
      pushname,
      harareTime,
      harareDate,
      runtimeHours,
      runtimeMinutes,
      runtimeSeconds,
      currentSettings
    );

    const imageUrl = currentSettings.imageUrl;
    
    if (imageUrl) {
      await ademola.sendMessage(from, {
        image: { url: imageUrl },
        caption: statusInfo,
        mentions: [sender],
        ...channelInfo
      }, { quoted: fakevCard });
    } else {
      await ademola.sendMessage(from, {
        text: statusInfo,
        mentions: [sender],
        ...channelInfo
      }, { quoted: fakevCard });
    }

    // Send audio if available in settings
    const audioUrl = currentSettings.ALIVE_AUDIO_URL || currentSettings.MENU_AUDIO_URL;
    if (audioUrl && audioUrl.startsWith('http')) {
      await ademola.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: false,
       // ...channelInfo
      }, { quoted: fakevCard });
    }

  } catch (error) {
    console.error('❌ Error in alive command:', error);
    
    // Fallback text-only response if image fails
    const currentSettings = loadSettings();
    const pushname = m.pushName || 'User';
    const timezone = currentSettings.timezone || 'Africa/Harare';
    const harareTime = moment().tz(timezone).format('HH:mm:ss');
    const runtimeMilliseconds = Date.now() - botStartTime;
    const runtimeSeconds = Math.floor((runtimeMilliseconds / 1000) % 60);
    const runtimeMinutes = Math.floor((runtimeMilliseconds / (1000 * 60)) % 60);
    const runtimeHours = Math.floor(runtimeMilliseconds / (1000 * 60 * 60));

    const fallbackMessage = `
🤖 *${currentSettings.botName}* 🚀

👋 ʜᴇʏ ${pushname}
⏰ ᴛɪᴍᴇ: ${harareTime}
⏳ ᴜᴘᴛɪᴍᴇ: ${runtimeHours}ʜ ${runtimeMinutes}ᴍ ${runtimeSeconds}s
🧠 ʀᴀᴍ: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}ᴍʙ
🔧 ᴍᴏᴅᴇ: ${currentSettings.commandMode}
👑 ᴏᴡɴᴇʀ: ${currentSettings.botOwner}

> ${currentSettings.description}
    `.trim();

    await reply(fallbackMessage);
  }
});