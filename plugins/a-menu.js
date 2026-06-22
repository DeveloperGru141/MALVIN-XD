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

const numberedCategories = [
    { num: 1, name: 'AI & CHAT TOOLS', cats: ['AI'] },
    { num: 2, name: 'DOWNLOAD MANAGER', cats: ['DOWNLOAD', 'DOWNLOADER'] },
    { num: 3, name: 'FUN & GAMES', cats: ['FUN', 'GAME'] },
    { num: 4, name: 'GROUP MANAGEMENT', cats: ['GROUP'] },
    { num: 5, name: 'UTILITIES & TOOLS', cats: ['GENERAL', 'INFO', 'TOOLS', 'SEARCH', 'STALK', 'UTILITY', 'WHATSAPP', 'MAIN'] },
    { num: 6, name: 'MEDIA & STICKERS', cats: ['MEDIA', 'STICKER', 'MAKER', 'AUDIO'] },
    { num: 7, name: 'BOT SETTINGS', cats: ['SETTINGS', 'SECURITY', 'MODERATION'] },
    { num: 8, name: 'TEXT & EFFECTS', cats: ['TEXTMAKER'] },
    { num: 9, name: 'IMAGE & FILTERS', cats: ['IMAGE'] },
];

function buildCategoryMenu(prefix, cat) {
    const cmds = commands.filter(c =>
        cat.cats.includes((c.category || '').toUpperCase()) &&
        c.pattern && !c.dontAddCommandList && c.pattern !== '([1-9])'
    );
    let text = `╭─── 📁 ${cat.name} ───╮\n\n`;
    cmds.forEach(cmd => {
        const desc = cmd.desc ? ` — ${cmd.desc}` : '';
        text += `▸ ${prefix}${cmd.pattern}${desc}\n`;
    });
    text += `\n💡 Send "0" for main menu`;
    return text;
}

const activeListeners = new Map();

async function buildMainMenu() {
    const currentSettings = loadSettings();
    const totalCommands = commands.filter(cmd => cmd.category && cmd.pattern && !cmd.dontAdd).length;
    const timezone = currentSettings.timezone || settings.timezone || 'Africa/Harare';
    const t = moment().tz(timezone);
    const currentPrefix = getCurrentPrefix();
    const forks = await fetchGitHubForks();

    return `╭─ 🤖 ${toTinyCaps(currentSettings.botName || settings.botName || 'ademola-xd')} ─╮
│ 👤 Owner: ${toTinyCaps(currentSettings.botOwner || settings.botOwner || 'ademola')}
│ ⏰ ${t.format('HH:mm:ss')}  📅 ${t.format('DD/MM/YYYY')}
│ 🌍 Mode: ${toTinyCaps(currentSettings.commandMode || 'public')}
│ ✒️ Prefix: [ ${currentPrefix} ]  🧩 Commands: ${totalCommands}
│ 🚀 Version: ${currentSettings.version || 'latest'}
│ 👥 Forks: ${forks}
╰──────────────────╯

📁 CATEGORIES

${numberedCategories.map(c => `  ${c.num}  ${c.name}`).join('\n')}

💡 Send a number (1-9) to see commands with descriptions`;
}

ademola({
    pattern: "menu",
    alias: ["m", "allmenu", "help", "h"],
    desc: "Show all bot commands in organized categories",
    category: "general",
    react: "📚",
    use: ".menu",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, prefix, sender }) => {
    try {
        const mainMenu = await buildMainMenu();

        if (activeListeners.has(sender)) {
            const old = activeListeners.get(sender);
            ademola.ev.off('messages.upsert', old.listener);
            clearTimeout(old.timeout);
            activeListeners.delete(sender);
        }

        await reply(mainMenu);

        const timeout = setTimeout(async () => {
            if (activeListeners.has(sender)) {
                const info = activeListeners.get(sender);
                ademola.ev.off('messages.upsert', info.listener);
                activeListeners.delete(sender);
            }
        }, 300000);

        const messageListener = async (update) => {
            try {
                const info = update?.messages[0];
                if (!info?.message || info.key.remoteJid !== from) return;
                const text = info.message.conversation || info.message.extendedTextMessage?.text;
                if (!text || !/^[0-9]+$/.test(text.trim())) return;

                const input = text.trim();

                if (input === '0') {
                    await reply('🔄 Returning to main menu...');
                    setTimeout(async () => {
                        await reply(mainMenu);
                    }, 1000);
                    return;
                }

                const num = parseInt(input);
                const cat = numberedCategories.find(c => c.num === num);
                if (cat) {
                    await reply(buildCategoryMenu(currentPrefix, cat));
                    try {
                        if (info?.key?.id) {
                            await ademola.sendMessage(from, { react: { text: "✅", key: info.key } });
                        }
                    } catch {}
                    return;
                }

            } catch (e) {
                console.error('Menu reply error:', e);
            }
        };

        ademola.ev.on('messages.upsert', messageListener);
        activeListeners.set(sender, { listener: messageListener, timeout });

    } catch (error) {
        console.error('Menu error:', error);
        await reply('❌ Failed to load menu. Please try again.');
    }
});

module.exports = { buildMainMenu, buildCategoryMenu };
