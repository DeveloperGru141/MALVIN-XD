const { ademola, fakevCard } = require("../ademola");
const { channelInfo } = require('../lib/messageConfig');
const { loadSettings, saveSettings, updateSetting } = require('../lib/settingsManager');
const { toTinyCaps } = require('../lib/myfunc');
const SETTINGS_IMG = "";

<<<<<<< HEAD
const { toTinyCaps } = require('../lib/tinyCaps');

=======
>>>>>>> 844315816c65935d2ef65ce1f8013ce525023bfd
// ==================== SHOW SETTINGS ====================
ademola({
    pattern: "settings",
    alias: ["seto", "config"],
    desc: "Show bot settings",
    category: "settings",
    react: "⚙️",
    use: ".settings",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) return await reply('❌ Only bot owner can view settings!');

        const currentSettings = loadSettings();

        // Helper functions
        const getStatus = (value) => value ? "✅ Set" : "❌ Not set";
        const getModeIcon = (mode) => mode === 'private' ? '🔒' : '🔓';
        const getModeText = (mode) => mode === 'private' ? 'PRIVATE' : 'PUBLIC';

        const settingsInfo = `

╭─✦「 ⚙️ʙᴏᴛ ᴄᴏɴғɪɢᴜʀᴀᴛɪᴏɴ 」✦─╮
│
├ 🤖 *Bot Identity*
│   ├ 📛 ɴᴀᴍᴇ: ${toTinyCaps(currentSettings.botName)}
│   ├ 🔧 ᴘʀᴇғɪx: ${currentSettings.prefix}
│   ├ 🤖 ᴍᴏᴅᴇ: ${getModeIcon(currentSettings.commandMode)} ${getModeText(currentSettings.commandMode)}
│   ├ 🏷️ ᴠᴇʀsɪᴏɴ: ${currentSettings.version}
│
├ 👑 *Ownership*
│   ├ 👤 ᴏᴡɴᴇʀ: ${toTinyCaps(currentSettings.botOwner)}
│   └ ✍️ ᴀᴜᴛʜᴏʀ: ${toTinyCaps(currentSettings.author)}
╰───◆

╭─✦「 🔄 *ʙᴏᴛ sᴇᴛᴛɪɴɢs* 」✦─╮
│ *Usage: toggle <feature>*
│
├ 📞 anticall: on /off
├ 🗑️ antidelete: on /off
├ 👁️ autoread: on /off
├ ⌨️ autotyping: on /off
├ 💬 mentionreply: on/ off
├ 🥳 autostatus: on /off
├ 🥳 autostatus react: on /off
├ 🙂‍↕️ autoreact: on /off
├ 😜 autoread: on /off
├ 🔗 antilink: on /off
├ 🏷️ antitag: on /off
├ 🤖 gcbot: on /off
├ 🎉 Welcome: on/off
├ 👋 Goodbye: on/off
│
├ 🔧 .setprefix <new>
├ 🔧 .resetprefix 
├ 🔄 .mode <private/public>
├ 📛 .setbotname <name>
├ 👑 .setownername <name>
├ 🖼️ .setbotimage <url>
├ 🎵 .setbotaudio menu/alive <url>
├ 🔧 .resetsettings 
├ 📊 .stats (bot statistics)
├ 🧹 .cleartmp (clean temp)
├ 💾 .backupsession (backup)
│
╰───◆
> *${currentSettings.description}* 
        `.trim();

        // Check if image URL is valid
        const isValidImage = SETTINGS_IMG && SETTINGS_IMG.startsWith("http");
        
        if (isValidImage) {
            // Send with image
            await ademola.sendMessage(from, {
                image: { url: SETTINGS_IMG },
                caption: settingsInfo,
                ...channelInfo
            }, { quoted: fakevCard });
        } else {
            // Send without image if URL is invalid
            await ademola.sendMessage(from, {
                text: settingsInfo,
                ...channelInfo
            }, { quoted: fakevCard });
        }

    } catch (error) {
        console.error('Settings error:', error);
        await reply('❌ Failed to retrieve settings');
    }
});