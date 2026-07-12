const { ademola } = require("../ademola");
const config = require('../config');

const WARN_LIMIT = config.WARN_COUNT || 3;

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
        
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToCheck = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        
        if (!userToCheck) {
            return await reply('❌ Please mention a user to check warnings!\n\nUsage: .warnings @user');
        }

        const { loadUserGroupData } = require('../lib/index');
        const data = loadUserGroupData();
        const warningCount = data.warnings?.[from]?.[userToCheck] || 0;

        const statusText = warningCount === 0 ? '✅ No warnings' :
            warningCount >= WARN_LIMIT ? '⚠️ MAX - Will be kicked on next warn' :
            `⚠️ ${WARN_LIMIT - warningCount} warnings until kick`;

        const warningMessage = `*『 WARNING STATUS 』*\n\n` +
            `👤 *User:* @${userToCheck.split('@')[0]}\n` +
            `⚠️ *Warnings:* ${warningCount}/${WARN_LIMIT}\n` +
            `📊 *Status:* ${statusText}\n\n` +
            `ℹ️ *Note:* Users are automatically kicked after ${WARN_LIMIT} warnings.`;

        await ademola.sendMessage(from, { 
            text: warningMessage,
            mentions: [userToCheck]
        });
        
    } catch (error) {
        console.error('Error in warnings command:', error);
        await reply('❌ Failed to check warnings.');
    }
});