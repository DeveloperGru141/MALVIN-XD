const { ademola, commands, fakevCard } = require("../ademola");
const os = require('os');
const settings = require('../settings');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');
const moment = require('moment-timezone');
const { getPrefix } = require('../lib/prefix');
const { loadSettings } = require('../lib/settingsManager');

const toTinyCaps = (text) => {
    const tinyCapsMap = {
        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
        j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
        s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => tinyCapsMap[c] || c).join('');
};

const fetchGitHubForks = async () => {
    try {
        const repo = 'XdKing2/MALVIN-XD';
        const response = await axios.get(`https://api.github.com/repos/${repo}`);
        return response.data.forks_count || 'ɴ/ᴀ';
    } catch (e) {
        console.error('ᴇʀʀᴏʀ ғᴇᴛᴄʜɪɴɢ ɢɪᴛʜᴜʙ ғᴏʀᴋs:', e);
        return 'ɴ/ᴀ';
    }
};

function getCurrentPrefix() {
    try {
        const prefix = getPrefix();
        return prefix || '.';
    } catch (error) {
        return '.';
    }
}

const categoryMap = {
    '1': { name: 'AI & CHAT TOOLS', cats: ['AI'] },
    '2': { name: 'DOWNLOAD MANAGER', cats: ['DOWNLOAD', 'DOWNLOADER'] },
    '3': { name: 'FUN & GAMES', cats: ['FUN', 'GAME'] },
    '4': { name: 'GROUP MANAGEMENT', cats: ['GROUP'] },
    '5': { name: 'UTILITIES & TOOLS', cats: ['GENERAL', 'INFO', 'TOOLS', 'SEARCH', 'STALK', 'UTILITY', 'WHATSAPP', 'MAIN'] },
    '6': { name: 'MEDIA & STICKERS', cats: ['MEDIA', 'STICKER', 'MAKER', 'AUDIO'] },
    '7': { name: 'BOT SETTINGS', cats: ['SETTINGS', 'SECURITY', 'MODERATION'] },
    '8': { name: 'TEXT & EFFECTS', cats: ['TEXTMAKER'] },
    '9': { name: 'IMAGE & FILTERS', cats: ['IMAGE'] },
};

function getCategoryMenus(prefix) {
    const menus = {};
    for (const [key, { name, cats }] of Object.entries(categoryMap)) {
        const cmds = commands.filter(c =>
            cats.includes((c.category || '').toUpperCase()) &&
            c.pattern &&
            !c.dontAddCommandList &&
            c.pattern !== '([1-9])'
        );
        let text = `╭─── \`📁 ${name}\` ───╮\n\n`;
        cmds.forEach(cmd => {
            const desc = cmd.desc ? ` — ${cmd.desc}` : '';
            text += `▸ *${prefix}${cmd.pattern}*${desc}\n`;
        });
        text += `\n╰─ 💡 Send "0" for main menu ─╯`;
        menus[key] = text;
    }
    return menus;
}

const activeListeners = new Map();

ademola({
    pattern: "menu",
    alias: ["m", "allmenu"],
    desc: "Show all bot commands in organized categories",
    category: "general",
    react: "📚",
    use: ".menu",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, prefix, sender }) => {
    try {
        const currentSettings = loadSettings();

        const totalCommands = commands.filter(cmd =>
            cmd.category && cmd.pattern && !cmd.dontAdd
        ).length;

        const timezone = currentSettings.timezone || settings.timezone || 'Africa/Harare';
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('DD/MM/YYYY');
        const forks = await fetchGitHubForks();
        const currentPrefix = getCurrentPrefix();

        const mainMenu = `
╭─ \`🤖 ${toTinyCaps(currentSettings.botName || settings.botName || 'ademola-xd')}\` ─╮
│ 👤 ᴏᴡɴᴇʀ : ${toTinyCaps(currentSettings.botOwner || settings.botOwner || 'ᴀᴅᴇᴍᴏʟᴀ')}
│ ⏰ ᴛɪᴍᴇ: ${time}  📅 ${date}
│ 🌍 ᴍᴏᴅᴇ: ${toTinyCaps(currentSettings.commandMode || settings.commandMode || 'ᴘᴜʙʟɪᴄ')}
│ ✒️ ᴘʀᴇғɪx: [ ${currentPrefix} ]  🧩 ᴄᴍᴅs: ${totalCommands}
│ 🚀 ᴠᴇʀsɪᴏɴ: ${currentSettings.version || settings.version || 'ʟᴀᴛᴇsᴛ'}
│ 👥 ғᴏʀᴋs: ${forks}
╰──────────────────╯

╭─ \`📁 ᴄᴀᴛᴇɢᴏʀɪᴇs\` ─╮
│ ➊  🤖 AI & Chat
│ ➋  📥 Download Manager
│ ➌  🎮 Fun & Games
│ ➍  💬 Group Management
│ ➎  🛠️ Utilities & Tools
│ ➏  🎨 Media & Stickers
│ ➐  ⚙️ Bot Settings
│ ➑  📝 Text & Effects
│ ➒  🖼️ Image & Filters
╰──────────────╯

💡 Send a number (1-9) to see commands with descriptions
`;

        if (activeListeners.has(sender)) {
            const oldListener = activeListeners.get(sender);
            ademola.ev.off('messages.upsert', oldListener.listener);
            clearTimeout(oldListener.timeout);
            activeListeners.delete(sender);
        }

        const imageUrl = currentSettings.imageUrl || currentSettings.MENU_IMAGE_URL || settings.imageUrl || settings.MENU_IMAGE_URL;
        let sentMsg;

        if (imageUrl) {
            try {
                sentMsg = await ademola.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: mainMenu
                }, { quoted: fakevCard });
            } catch (imageError) {
                console.error('ᴇʀʀᴏʀ ʟᴏᴀᴅɪɴɢ ɪᴍᴀɢᴇ:', imageError);
                sentMsg = await ademola.sendMessage(from, {
                    text: mainMenu
                }, { quoted: fakevCard });
            }
        } else {
            sentMsg = await ademola.sendMessage(from, {
                text: mainMenu
            }, { quoted: fakevCard });
        }

        const timeout = setTimeout(async () => {
            if (activeListeners.has(sender)) {
                const listenerInfo = activeListeners.get(sender);
                ademola.ev.off('messages.upsert', listenerInfo.listener);
                activeListeners.delete(sender);
                await reply("⏰ *Menu session expired!*\n\nUse .menu again to restart.");
            }
        }, 300000);

        const messageListener = async (messageUpdate) => {
            try {
                const mekInfo = messageUpdate?.messages[0];
                if (!mekInfo?.message || mekInfo.key.remoteJid !== from) return;

                const message = mekInfo.message;
                const messageType = message.conversation || message.extendedTextMessage?.text;

                if (messageType && /^[0-9]+$/.test(messageType.trim())) {
                    const userInput = messageType.trim();
                    const categoryMenus = getCategoryMenus(currentPrefix);

                    if (/^[1-9]$/.test(userInput)) {
                        if (categoryMenus[userInput]) {
                            await ademola.sendMessage(from, {
                                text: categoryMenus[userInput]
                            }, { quoted: fakevCard });

                            try {
                                if (mekInfo?.key?.id) {
                                    await ademola.sendMessage(from, { react: { text: "✅", key: mekInfo.key } });
                                }
                            } catch (reactError) {
                                console.error('Success reaction failed:', reactError);
                            }
                            return;
                        }
                    }

                    if (userInput === '0') {
                        await ademola.sendMessage(from, {
                            text: "🔄 Returning to main menu..."
                        }, { quoted: fakevCard });

                        setTimeout(async () => {
                            if (imageUrl) {
                                try {
                                    await ademola.sendMessage(from, {
                                        image: { url: imageUrl },
                                        caption: mainMenu
                                    }, { quoted: fakevCard });
                                } catch (imageError) {
                                    await ademola.sendMessage(from, {
                                        text: mainMenu
                                    }, { quoted: fakevCard });
                                }
                            } else {
                                await ademola.sendMessage(from, {
                                    text: mainMenu
                                }, { quoted: fakevCard });
                            }
                        }, 1000);
                        return;
                    }
                }

            } catch (error) {
                console.error('Menu reply error:', error);
            }
        };

        ademola.ev.on('messages.upsert', messageListener);

        activeListeners.set(sender, {
            listener: messageListener,
            timeout: timeout,
            startTime: Date.now()
        });

    } catch (error) {
        console.error('ᴇʀʀᴏʀ ɪɴ ᴍᴇɴᴜ ᴄᴏᴍᴍᴀɴᴅ:', error);
        await reply("❌ Failed to load menu. Please try again.");
    }
});
