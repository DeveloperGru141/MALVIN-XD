const settings = require('../settings');
const moment = require('moment-timezone');
const { ademola, commands } = require('../ademola');
const os = require('os');
const { getPrefix } = require('../lib/prefix');
const { fakevCard } = require('../lib/fakevCard');

ademola({
    pattern: 'help',
    alias: ['commands'],
    desc: 'Show all bot commands with categories',
    category: 'general',
    react: '📚',
    filename: __filename
}, async (ademola, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const timezone = settings.TIMEZONE || 'Africa/Harare';
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('DD/MM/YYYY');

        // Count total commands (excluding hidden ones)
        const totalCommands = commands.filter(cmd => 
            cmd.category && cmd.pattern && !cmd.dontAdd
        ).length;

        // Group commands by category
        const categories = {};
        
        for (const cmd of commands) {
            if (cmd.category && cmd.pattern && !cmd.dontAdd) {
                const category = cmd.category.toLowerCase();
                if (!categories[category]) {
                    categories[category] = [];
                }
                
                const commandName = Array.isArray(cmd.pattern) ? cmd.pattern[0] : cmd.pattern;
                const description = cmd.desc || 'No description';
                const aliases = cmd.alias ? ` (${cmd.alias.join(', ')})` : '';
                
                categories[category].push({
                    name: commandName,
                    desc: description,
                    aliases: aliases
                });
            }
        }

        // Build menu
        let menu = `
╭─✦「 🤖 ${settings.BOT_NAME || 'ᴍᴀʟᴠɪɴ xᴅ'} 」✦─╮
│ 👤 ᴜsᴇʀ: @${sender.split('@')[0]}
│ ⏰ ᴛɪᴍᴇ: ${time}
│ 📅 ᴅᴀᴛᴇ: ${date} 
│ 🔧 ᴘʀᴇғɪx: ${prefix}
│ 🧩 ᴄᴍᴅs: ${totalCommands}
│ 👑 ᴏᴡɴᴇʀ: ${settings.OWNER_NAME || 'Ademola King'}
╰─✦──✦

`;

        // Add categories sorted alphabetically
        const sortedCategories = Object.keys(categories).sort();
        
        for (const category of sortedCategories) {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            const categoryCount = categories[category].length;
            
            menu += `\n📂 *${categoryName} Commands* (${categoryCount})\n`;
            
            // Sort commands alphabetically
            const sortedCommands = categories[category].sort((a, b) => a.name.localeCompare(b.name));
            
            for (const cmd of sortedCommands) {
                menu += `┝ 🔹 ${prefix}${cmd.name}${cmd.aliases}\n`;
                menu += `└ 📝 ${cmd.desc}\n\n`;
            }
        }

        menu += `\n💡 *Usage*: ${prefix}command\n`;
        menu += `🔍 *Total Commands*: ${totalCommands}\n\n`;
        menu += `> ${settings.DESCRIPTION || 'Powered by Ademola Tech'}`;

        const menuImageUrl = settings.MENU_IMAGE_URL;
        if (menuImageUrl) {
            await ademola.sendMessage(from, {
                image: { url: menuImageUrl },
                caption: menu,
                contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true }
            }, { quoted: fakevCard });
        } else {
            await ademola.sendMessage(from, {
                text: menu,
                contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true }
            }, { quoted: fakevCard });
        }

    } catch (error) {
        console.error('Menu Error:', error);
        await reply(`❌ Error loading menu: ${error.message}`);
    }
});