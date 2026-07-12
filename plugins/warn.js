const { ademola } = require("../ademola");
const { incrementWarningCount, resetWarningCount } = require('../lib/index');
const config = require('../config');

const WARN_LIMIT = config.WARN_COUNT || 3;

ademola({
    pattern: "warn",
    alias: ["warning"],
    desc: "Warn user in group (auto-kick after 3 warnings)",
    category: "group",
    react: "⚠️",
    use: ".warn @user or reply to user's message",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can use the warn command.');
        }

        let userToWarn;
        
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = mek.message.extendedTextMessage.contextInfo.participant;
        } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToWarn = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        
        if (!userToWarn) {
            return await reply('❌ Error: Please mention the user or reply to their message to warn!');
        }

        try {
            const warningCount = await incrementWarningCount(from, userToWarn);

            const warningMessage = `*『 WARNING ALERT 』*\n\n` +
                `👤 *Warned User:* @${userToWarn.split('@')[0]}\n` +
                `⚠️ *Warning Count:* ${warningCount}/${WARN_LIMIT}\n` +
                `👑 *Warned By:* @${sender.split('@')[0]}\n\n` +
                `📅 *Date:* ${new Date().toLocaleString()}`;

            await ademola.sendMessage(from, { 
                text: warningMessage,
                mentions: [userToWarn, sender]
            });

            if (warningCount >= WARN_LIMIT) {
                await ademola.groupParticipantsUpdate(from, [userToWarn], "remove");
                await resetWarningCount(from, userToWarn);
                
                const kickMessage = `*『 AUTO-KICK 』*\n\n` +
                    `@${userToWarn.split('@')[0]} has been removed from the group after receiving ${WARN_LIMIT} warnings! ⚠️`;

                await ademola.sendMessage(from, { 
                    text: kickMessage,
                    mentions: [userToWarn]
                });
            }
        } catch (error) {
            console.error('Error in warn command:', error);
            await reply('❌ Failed to warn user!');
        }
        
    } catch (error) {
        console.error('Error in warn command:', error);
        await reply('❌ Failed to warn user. Make sure the bot is admin and has sufficient permissions.');
    }
});