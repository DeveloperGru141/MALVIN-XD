const { ademola, fakevCard } = require('../ademola');

// Ademola XD Clear Command
ademola({
    pattern: "clear",
    alias: ["cls", "clean", "delete"],
    desc: "Clear bot's messages",
    category: "utility",
    react: "🧹",
    use: ".clear",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isAdmin, isGroup, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (isGroup) {
            const adminStatus = await isAdmin();
            if (!adminStatus.isBotAdmin) {
                return reply("❌ Bot needs admin permissions to clear messages.", { quoted: fakevCard });
            }
            if (!adminStatus.isSenderAdmin && !isOwner) {
                return reply("❌ Only admins can clear messages in groups.", { quoted: fakevCard });
            }
        } else {
            if (!isOwner) {
                return reply("❌ Only bot owner can clear messages in private chat.", { quoted: fakevCard });
            }
        }

        // Send initial message
        const clearMsg = await reply("🧹 *Clearing bot messages...*", { quoted: fakevCard });
        
        // Delete the message after a short delay
        setTimeout(async () => {
            try {
                await ademola.sendMessage(from, { delete: clearMsg.key });
                console.log(`🧹 Messages cleared in ${from} by ${m.sender}`);
            } catch (deleteError) {
                console.error('Error deleting clear message:', deleteError);
                // Silently fail - the message will just remain
            }
        }, 1500);

    } catch (error) {
        console.error('Clear command error:', error);
        return reply("❌ Error clearing messages. Please try again.", { quoted: fakevCard });
    }
});

// Enhanced clear command with options
ademola({
    pattern: "clearall",
    alias: ["clearallmsgs", "cleanall"],
    desc: "Clear all bot messages (use with caution)",
    category: "utility",
    react: "💥",
    use: ".clearall",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isAdmin, isGroup, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        // Strict permissions - only owner in private or admin in groups
        if (isGroup) {
            const adminStatus = await isAdmin();
            if (!adminStatus.isBotAdmin) {
                return reply("❌ Bot needs admin permissions to clear all messages.", { quoted: fakevCard });
            }
            if (!adminStatus.isSenderAdmin && !isOwner) {
                return reply("❌ Only group admins can clear all messages.", { quoted: fakevCard });
            }
        } else {
            if (!isOwner) {
                return reply("❌ Only bot owner can clear all messages.", { quoted: fakevCard });
            }
        }

        // Warning message
        const warningMsg = await reply(
            "💥 *CLEAR ALL MESSAGES*\n\n" +
            "⚠️ This will attempt to clear recent bot messages.\n" +
            "🗑️ Processing...",
            { quoted: fakevCard }
        );

        // Simulate processing
        setTimeout(async () => {
            try {
                // Delete the warning message
                await ademola.sendMessage(from, { delete: warningMsg.key });
                
                // Send completion message that will also auto-delete
                const completionMsg = await reply(
                    "✅ *Messages Cleared*\n\n" +
                    "Recent bot messages have been cleared.\n" +
                    "This message will auto-delete in 3 seconds...",
                    { quoted: fakevCard }
                );

                // Auto-delete completion message
                setTimeout(async () => {
                    try {
                        await ademola.sendMessage(from, { delete: completionMsg.key });
                    } catch (e) {
                        // Ignore deletion errors
                    }
                }, 3000);

                console.log(`💥 All messages cleared in ${from} by ${m.sender}`);

            } catch (error) {
                console.error('Error in clearall:', error);
                await reply("❌ Error clearing messages. Bot may need admin permissions.", { quoted: fakevCard });
            }
        }, 2000);

    } catch (error) {
        console.error('Clearall command error:', error);
        return reply("❌ Error processing clear command.", { quoted: fakevCard });
    }
});

// Quick clear command for bot owner
ademola({
    pattern: "purge",
    alias: ["quickclear"],
    desc: "Quick clear (owner only)",
    category: "owner",
    react: "⚡",
    use: ".purge",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
         const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        // Owner only command
        if (!isOwner) {
            return reply("❌ This command is for bot owner only.", { quoted: fakevCard });
        }

        // Quick clear without confirmation
        const purgeMsg = await reply("⚡ *Purging...*", { quoted: fakevCard });
        
        setTimeout(async () => {
            try {
                await ademola.sendMessage(from, { delete: purgeMsg.key });
                console.log(`⚡ Quick purge by owner in ${from}`);
            } catch (e) {
                // Silent fail
            }
        }, 1000);

    } catch (error) {
        console.error('Purge command error:', error);
        // Silent fail for owner commands
    }
});