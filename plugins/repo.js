const { ademola, fakevCard } = require("../ademola");
const { loadSettings } = require('../lib/settingsManager');
const moment = require('moment-timezone');

ademola({
    pattern: "info",
    alias: ["stats", "about", "botinfo"],
    desc: "Show bot information and statistics",
    category: "general", 
    react: "🤖",
    filename: __filename
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const currentSettings = loadSettings();
        const botName = currentSettings.botName || 'ᴀᴅᴇᴍᴏʟᴀ xᴅ';
        const txt = `
╭═✦〔 🥇 *${botName}* 〕✦═
│ 🤖 *Name* : ${botName}
│ 📦 *Version* : ${currentSettings.version || '2.1.1'}
│ 👑 *Owner* : ${currentSettings.botOwner || 'Ademola'}
│ 🔧 *Mode* : ${currentSettings.commandMode || 'public'}
│ 📝 *Description* : ${currentSettings.description || ''}
│ 
╰═
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ
`;

        const imageUrl = currentSettings.imageUrl;
        if (imageUrl) {
            await ademola.sendMessage(
                from,
                {
                    image: { url: imageUrl },
                    caption: txt,
                },
                { quoted: fakevCard }
            );
        } else {
            await ademola.sendMessage(
                from,
                {
                    text: txt,
                },
                { quoted: fakevCard }
            );
        }
    } catch (error) {
        console.error('Error in info command:', error);
        await reply('❌ Error fetching bot info.');
    }
});
