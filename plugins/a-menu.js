const { ademola, commands, fakevCard } = require("../ademola");
const settings = require('../settings');
const axios = require('axios');
const moment = require('moment-timezone');
const { getPrefix } = require('../lib/prefix');
const { loadSettings } = require('../lib/settingsManager');

const toTinyCaps = (text) => {
    const m = { a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ' };
    return text.toLowerCase().split('').map(c => m[c] || c).join('');
};

const fetchGitHubForks = async () => {
    try {
        const res = await axios.get('https://api.github.com/repos/XdKing2/MALVIN-XD');
        return res.data.forks_count || 'N/A';
    } catch { return 'N/A'; }
};

function getCurrentPrefix() {
    try { return getPrefix() || '.'; }
    catch { return '.'; }
}

const categoryMap = {
    ai:       { name: 'AI & CHAT TOOLS', cats: ['AI'] },
    download: { name: 'DOWNLOAD MANAGER', cats: ['DOWNLOAD', 'DOWNLOADER'] },
    fun:      { name: 'FUN & GAMES', cats: ['FUN', 'GAME'] },
    group:    { name: 'GROUP MANAGEMENT', cats: ['GROUP'] },
    tools:    { name: 'UTILITIES & TOOLS', cats: ['GENERAL', 'INFO', 'TOOLS', 'SEARCH', 'STALK', 'UTILITY', 'WHATSAPP', 'MAIN'] },
    media:    { name: 'MEDIA & STICKERS', cats: ['MEDIA', 'STICKER', 'MAKER', 'AUDIO'] },
    settings: { name: 'BOT SETTINGS', cats: ['SETTINGS', 'SECURITY', 'MODERATION'] },
    text:     { name: 'TEXT & EFFECTS', cats: ['TEXTMAKER'] },
    image:    { name: 'IMAGE & FILTERS', cats: ['IMAGE'] },
};

const categoryAliases = {
    ai: 'ai', chat: 'ai',
    download: 'download', dl: 'download',
    fun: 'fun', game: 'fun', games: 'fun',
    group: 'group', grp: 'group', gc: 'group',
    tools: 'tools', utility: 'tools', util: 'tools', tool: 'tools', utilities: 'tools',
    media: 'media', sticker: 'media', stickers: 'media',
    settings: 'settings', setting: 'settings', config: 'settings', bot: 'settings',
    text: 'text', textmaker: 'text', effect: 'text', effects: 'text',
    image: 'image', img: 'image', filter: 'image', filters: 'image',
};

function buildCategoryMenu(prefix, key) {
    const { name, cats } = categoryMap[key];
    const cmds = commands.filter(c =>
        cats.includes((c.category || '').toUpperCase()) &&
        c.pattern && !c.dontAddCommandList && c.pattern !== '([1-9])'
    );
    let text = `╭─── 📁 ${name} ───╮\n\n`;
    cmds.forEach(cmd => {
        const desc = cmd.desc ? ` — ${cmd.desc}` : '';
        text += `▸ ${prefix}${cmd.pattern}${desc}\n`;
    });
    return text;
}

ademola({
    pattern: "menu",
    alias: ["m", "allmenu", "help", "h"],
    desc: "Show bot commands. Use .menu <category> for details.",
    category: "general",
    react: "📚",
    use: ".menu [ai|download|fun|group|tools|media|settings|text|image]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, prefix, sender }) => {
    try {
        const currentSettings = loadSettings();
        const totalCommands = commands.filter(cmd => cmd.category && cmd.pattern && !cmd.dontAdd).length;
        const timezone = currentSettings.timezone || settings.timezone || 'Africa/Harare';
        const t = moment().tz(timezone);
        const currentPrefix = getCurrentPrefix();

        if (q) {
            const input = q.trim().toLowerCase();
            const mapped = categoryAliases[input];
            if (mapped && categoryMap[mapped]) {
                return reply(buildCategoryMenu(currentPrefix, mapped));
            }
            const list = Object.keys(categoryMap).join(', ');
            return reply(`❌ Unknown category.\n\nAvailable: ${list}\n\nExample: ${currentPrefix}menu ai`);
        }

        const forks = await fetchGitHubForks();
        const timeStr = t.format('HH:mm:ss');
        const dateStr = t.format('DD/MM/YYYY');

        const main = `╭─ 🤖 ${toTinyCaps(currentSettings.botName || settings.botName || 'ademola-xd')} ─╮
│ 👤 Owner: ${toTinyCaps(currentSettings.botOwner || settings.botOwner || 'ademola')}
│ ⏰ ${timeStr}  📅 ${dateStr}
│ 🌍 Mode: ${toTinyCaps(currentSettings.commandMode || 'public')}
│ ✒️ Prefix: [ ${currentPrefix} ]  🧩 Commands: ${totalCommands}
│ 🚀 Version: ${currentSettings.version || 'latest'}
│ 👥 Forks: ${forks}
╰──────────────────╯

📁 CATEGORIES

${Object.entries(categoryMap).map(([k, v]) => `  ${currentPrefix}menu ${k} — ${v.name}`).join('\n')}

💡 Example: ${currentPrefix}menu ai`;

        await reply(main);

    } catch (error) {
        console.error('Menu error:', error);
        await reply('❌ Failed to load menu.');
    }
});
