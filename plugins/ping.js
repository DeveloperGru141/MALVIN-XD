const { ademola, fakevCard } = require("../ademola");
const os = require('os');
const settings = require('../settings');
const { channelInfo } = require('../lib/messageConfig'); 

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

ademola({
    pattern: "ping",
    alias: ["speed", "status"],
    desc: "Check bot response speed and status",
    category: "general",
    react: "🚀",
    use: ".ping",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    try {
        const start = Date.now();
        await ademola.sendMessage(from, { text: 'Pong!' }, { quoted: mek });
        const end = Date.now();
        const ping = Math.round((end - start) / 2);

        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);

        // Get system info
        const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
        const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024));
        const usedMem = totalMem - freeMem;

        const botInfo = `
╭──❍ ${settings.botName} ❍─
┊ 🚀 ᴘɪɴɢ     : ${ping} ms
┊ ⏱  ᴜᴘᴛɪᴍᴇ   : ${uptimeFormatted}
┊ 🔖 ᴠᴇʀsɪᴏɴ   : ${settings.version}
┊ 💾 ᴍᴇᴍᴏʀʏ   : ${usedMem}GB / ${totalMem}GB
┊ 📦 ᴄᴍᴅs : ${require('../ademola').commands.length}
╰━━━━━━━━━━━━━━
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ 🪀
`.trim();

        await ademola.sendMessage(from, { 
            text: botInfo,
            ...channelInfo
        }, { 
            quoted: fakevCard 
        });

    } catch (error) {
        console.error('Error in ping command:', error);
        console.error('Full error:', error.stack);
        await reply("❌ Failed to get bot status.");
    }
});