const { ademola, fakevCard } = require('../ademola');
const store = require('../lib/lightweight_store');

// Ademola XD Delete Command
ademola({
    pattern: "delete",
    alias: ["del", "remove", "purge"],
    desc: "Delete user's recent messages (Admin Only)",
    category: "moderation",
    react: "🗑️",
    use: ".delete [count] [mention user or reply to message]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner, isAdmin, isGroup }) => {
    try {
        // Only works in groups
        if (!isGroup) {
            return reply("❌ This command only works in groups!", { quoted: fakevCard });
        }

        const adminStatus = await isAdmin();
        
        // Check bot admin status
        if (!adminStatus.isBotAdmin) {
            return reply("❌ I need to be an admin to delete messages.", { quoted: fakevCard });
        }

        // Check sender admin status
        if (!adminStatus.isSenderAdmin && !isOwner) {
            return reply("❌ Only admins can use the delete command.", { quoted: fakevCard });
        }

        // Parse arguments
        const args = q ? q.trim().split(/\s+/) : [];
        let count = 1;
        let targetUser = null;

        // Parse count from arguments
        if (args.length > 0) {
            const maybeNum = parseInt(args[0], 10);
            if (!isNaN(maybeNum) && maybeNum > 0) {
                count = Math.min(maybeNum, 50); // Limit to 50 messages max
                args.shift(); // Remove count from args
            }
        }

        // Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetUser = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetUser = mek.message.extendedTextMessage.contextInfo.participant;
        }

        // If no target found in message context, check remaining args
        if (!targetUser && args.length > 0) {
            // Try to extract user from remaining arguments
            const possibleUser = args.find(arg => arg.includes('@'));
            if (possibleUser) {
                targetUser = possibleUser.includes('@s.whatsapp.net') ? possibleUser : possibleUser + '@s.whatsapp.net';
            }
        }

        if (!targetUser) {
            return reply(
                "🗑️ *DELETE MESSAGES*\n\n" +
                "Delete recent messages from a user.\n\n" +
                "*Usage:*\n" +
                "• .delete @user - Delete 1 message\n" +
                "• .delete 5 @user - Delete 5 messages\n" +
                "• Reply to message with .delete - Delete that message\n" +
                "• Reply with .delete 3 - Delete 3 messages from that user\n\n" +
                "*Note:* Max 50 messages at once",
                { quoted: fakevCard }
            );
        }

        // Prevent deleting bot's messages to avoid loops
        const botId = ademola.user.id.split(':')[0] + '@s.whatsapp.net';
        if (targetUser === botId) {
            return reply("❌ Cannot delete bot's messages.", { quoted: fakevCard });
        }

        // Get user name for display
        let userName;
        try {
            userName = await ademola.getName(targetUser);
        } catch {
            userName = targetUser.split('@')[0];
        }

        // Send loading message
        const loadingMsg = await reply(`🔍 *Searching for messages from ${userName}...*`, { quoted: fakevCard });

        // Gather messages from store
        const chatMessages = Array.isArray(store.messages[from]) ? store.messages[from] : [];
        const toDelete = [];
        const seenIds = new Set();

        // Check if this is a reply to specific message
        const ctxInfo = mek.message?.extendedTextMessage?.contextInfo || {};
        const repliedMsgId = ctxInfo.stanzaId;

        // If replying to a message, prioritize deleting that specific message
        if (repliedMsgId) {
            const repliedMessage = chatMessages.find(m => 
                m.key.id === repliedMsgId && 
                (m.key.participant || m.key.remoteJid) === targetUser
            );
            if (repliedMessage) {
                toDelete.push(repliedMessage);
                seenIds.add(repliedMessage.key.id);
            } else {
                // If not found in store, try to delete directly
                try {
                    await ademola.sendMessage(from, {
                        delete: {
                            remoteJid: from,
                            fromMe: false,
                            id: repliedMsgId,
                            participant: targetUser
                        }
                    });
                    count = Math.max(0, count - 1); // Count this as one deleted
                } catch (error) {
                    console.log('Failed to delete replied message directly');
                }
            }
        }

        // Find recent messages from target user (newest first)
        for (let i = chatMessages.length - 1; i >= 0 && toDelete.length < count; i--) {
            const message = chatMessages[i];
            const participant = message.key.participant || message.key.remoteJid;
            
            if (participant === targetUser && 
                !seenIds.has(message.key.id) && 
                !message.message?.protocolMessage) {
                toDelete.push(message);
                seenIds.add(message.key.id);
            }
        }

        if (toDelete.length === 0) {
            await ademola.sendMessage(from, {
                text: `❌ No recent messages found from ${userName}.`,
                edit: loadingMsg.key
            });
            return;
        }

        // Update loading message with progress
        await ademola.sendMessage(from, {
            text: `🗑️ *Deleting ${toDelete.length} message(s) from ${userName}...*`,
            edit: loadingMsg.key
        });

        // Delete messages sequentially with delay to avoid rate limiting
        let successCount = 0;
        let errorCount = 0;

        for (const message of toDelete) {
            try {
                const msgParticipant = message.key.participant || targetUser;
                await ademola.sendMessage(from, {
                    delete: {
                        remoteJid: from,
                        fromMe: false,
                        id: message.key.id,
                        participant: msgParticipant
                    }
                });
                successCount++;
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                errorCount++;
                console.error(`Failed to delete message ${message.key.id}:`, error.message);
            }
        }

        // Send completion message
        let resultText;
        if (successCount > 0 && errorCount === 0) {
            resultText = `✅ *DELETION COMPLETE*\n\n` +
                        `🗑️ Deleted ${successCount} message(s) from ${userName}\n` +
                        `👤 User: @${targetUser.split('@')[0]}\n` +
                        `💬 All messages removed successfully!`;
        } else if (successCount > 0) {
            resultText = `⚠️ *PARTIAL DELETION*\n\n` +
                        `🗑️ Deleted: ${successCount} message(s)\n` +
                        `❌ Failed: ${errorCount} message(s)\n` +
                        `👤 User: @${targetUser.split('@')[0]}\n` +
                        `Some messages couldn't be deleted.`;
        } else {
            resultText = `❌ *DELETION FAILED*\n\n` +
                        `Could not delete any messages from ${userName}.\n` +
                        `The messages may be too old or already deleted.`;
        }

        await ademola.sendMessage(from, {
            text: resultText,
            mentions: [targetUser],
            edit: loadingMsg.key
        });

        console.log(`🗑️ Deleted ${successCount} messages from ${targetUser} in ${from} by ${m.sender}`);

    } catch (error) {
        console.error('Delete command error:', error);
        
        try {
            await ademola.sendMessage(from, {
                text: "❌ *DELETION FAILED*\n\nAn error occurred while trying to delete messages.\nPlease try again later.",
                edit: loadingMsg?.key
            });
        } catch {
            await reply("❌ Failed to delete messages due to an error.", { quoted: fakevCard });
        }
    }
});

// Quick delete command for single message
ademola({
    pattern: "del",
    alias: ["rm", "remove"],
    desc: "Quick delete (reply to message)",
    category: "moderation",
    react: "🚮",
    use: ".del [reply to message]",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner, isAdmin, isGroup }) => {
    try {
        if (!isGroup) {
            return reply("❌ This command only works in groups!", { quoted: fakevCard });
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return reply("❌ I need to be an admin to delete messages.", { quoted: fakevCard });
        }

        if (!adminStatus.isSenderAdmin && !isOwner) {
            return reply("❌ Only admins can delete messages.", { quoted: fakevCard });
        }

        // Check if this is a reply
        const ctxInfo = mek.message?.extendedTextMessage?.contextInfo || {};
        const targetUser = ctxInfo.participant;
        const repliedMsgId = ctxInfo.stanzaId;

        if (!targetUser || !repliedMsgId) {
            return reply(
                "🚮 *QUICK DELETE*\n\n" +
                "Quickly delete a specific message.\n\n" +
                "*Usage:*\n" +
                "• Reply to any message with .del\n" +
                "• The replied message will be deleted\n\n" +
                "*Note:* Bot and user must be admins",
                { quoted: fakevCard }
            );
        }

        // Get user name
        let userName;
        try {
            userName = await ademola.getName(targetUser);
        } catch {
            userName = targetUser.split('@')[0];
        }

        // Try to delete the message
        try {
            await ademola.sendMessage(from, {
                delete: {
                    remoteJid: from,
                    fromMe: false,
                    id: repliedMsgId,
                    participant: targetUser
                }
            });

            await reply(
                `✅ *MESSAGE DELETED*\n\n` +
                `🗑️ Deleted 1 message from ${userName}\n` +
                `💬 Message removed successfully!`,
                { 
                    mentions: [targetUser],
                    quoted: fakevCard 
                }
            );

            console.log(`🚮 Quick deleted message from ${targetUser} in ${from} by ${m.sender}`);

        } catch (error) {
            console.error('Quick delete error:', error);
            await reply("❌ Failed to delete the message. It may be too old or already deleted.", { quoted: fakevCard });
        }

    } catch (error) {
        console.error('Del command error:', error);
        await reply("❌ Failed to delete message due to an error.", { quoted: fakevCard });
    }
});

module.exports = {};