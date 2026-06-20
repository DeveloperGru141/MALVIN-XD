const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');

const warningsFilePath = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsFilePath)) {
        fs.writeFileSync(warningsFilePath, JSON.stringify({}), 'utf8');
    }
    const data = fs.readFileSync(warningsFilePath, 'utf8');
    return JSON.parse(data);
}

ademola({
    pattern: "warnings",
    alias: ["checkwarn", "warncount"],
    desc: "Check user's warning count",
    category: "group",
    react: "📊",
    use: ".warnings @user",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        let userToCheck;
        
        // Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToCheck = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            console.log('✅ Checking warnings for:', userToCheck);
        }
        
        if (!userToCheck) {
            return await reply('❌ Please mention a user to check warnings!\n\nUsage: .warnings @user');
        }

        const warnings = loadWarnings();
        
        // Get warnings for this specific group and user
        const groupWarnings = warnings[from] || {};
        const warningCount = groupWarnings[userToCheck] || 0;

        const warningMessage = `*『 WARNING STATUS 』*\n\n` +
            `👤 *User:* @${userToCheck.split('@')[0]}\n` +
            `⚠️ *Warnings:* ${warningCount}/3\n` +
            `📊 *Status:* ${warningCount === 0 ? 'No warnings' : warningCount === 3 ? 'MAX - Will be kicked on next warn' : `${3 - warningCount} warnings until kick`}\n\n` +
            `ℹ️ *Note:* Users are automatically kicked after 3 warnings.`;

        await ademola.sendMessage(from, { 
            text: warningMessage,
            mentions: [userToCheck]
        }, {
            quoted: fakevCard
        });
        
    } catch (error) {
        console.error('Error in warnings command:', error);
        await reply('❌ Failed to check warnings.');
    }
});