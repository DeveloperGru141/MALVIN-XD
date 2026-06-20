const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "resetlink",
    alias: ["newlink", "revoke", "resetinvite"],
    desc: "Reset group invite link",
    category: "group",
    react: "🔗",
    use: ".resetlink",
    filename: __filename,
}, async (ademola, mek, m, { from, isGroup, sender, reply, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can reset the group link.');
        }

        // Reset the group link
        const newCode = await ademola.groupRevokeInvite(from);
        
        // Send the new link
        await reply(`✅ *Group link has been successfully reset!*\n\n📌 *New invite link:*\nhttps://chat.whatsapp.com/${newCode}\n\n👑 *Reset by:* @${sender.split('@')[0]}`);

    } catch (error) {
        console.error('Error in resetlink command:', error);
        
        if (error.message?.includes('not authorized')) {
            await reply('❌ Bot does not have permission to reset group link. Make sure bot is an admin.');
        } else if (error.message?.includes('rate limit')) {
            await reply('❌ Rate limit exceeded. Please wait a while before resetting the link again.');
        } else {
            await reply('❌ Failed to reset group link. Please try again later.');
        }
    }
});

// Command to list all pending group join requests & etc
ademola({
    pattern: "requestlist",
    alias: ["joinrequests", "pendingrequests"],
    desc: "Shows pending group join requests",
    category: "group",
    react: "📋",
    use: ".requestlist",
    filename: __filename,
}, async (ademola, mek, m, { from, isGroup, sender, reply, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can view join requests.');
        }

        const requests = await ademola.groupRequestParticipantsList(from);
        
        if (requests.length === 0) {
            return await reply('ℹ️ No pending join requests.');
        }

        let text = `📋 *Pending Join Requests (${requests.length})*\n\n`;
        requests.forEach((user, i) => {
            text += `${i+1}. @${user.jid.split('@')[0]}\n`;
        });

        text += `\n👑 *Requested by:* @${sender.split('@')[0]}`;

        await reply(text, { mentions: [...requests.map(u => u.jid), sender] });

    } catch (error) {
        console.error("Request list error:", error);
        await reply('❌ Failed to fetch join requests.');
    }
});

// Command to accept all pending join requests
ademola({
    pattern: "acceptall",
    alias: ["approveall", "acceptrequests"],
    desc: "Accepts all pending group join requests",
    category: "group",
    react: "✅",
    use: ".acceptall",
    filename: __filename,
}, async (ademola, mek, m, { from, isGroup, sender, reply, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can accept join requests.');
        }

        const requests = await ademola.groupRequestParticipantsList(from);
        
        if (requests.length === 0) {
            return await reply('ℹ️ No pending join requests to accept.');
        }

        const jids = requests.map(u => u.jid);
        await ademola.groupRequestParticipantsUpdate(from, jids, "approve");
        
        await reply(`✅ Successfully accepted ${requests.length} join request${requests.length > 1 ? 's' : ''}!\n\n👑 *Approved by:* @${sender.split('@')[0]}`, { 
            mentions: [sender] 
        });

    } catch (error) {
        console.error("Accept all error:", error);
        await reply('❌ Failed to accept join requests.');
    }
});

// Command to reject all pending join requests
ademola({
    pattern: "rejectall",
    alias: ["denyall", "rejectrequests"],
    desc: "Rejects all pending group join requests",
    category: "group",
    react: "❌",
    use: ".rejectall",
    filename: __filename,
}, async (ademola, mek, m, { from, isGroup, sender, reply, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can reject join requests.');
        }

        const requests = await ademola.groupRequestParticipantsList(from);
        
        if (requests.length === 0) {
            return await reply('ℹ️ No pending join requests to reject.');
        }

        const jids = requests.map(u => u.jid);
        await ademola.groupRequestParticipantsUpdate(from, jids, "reject");
        
        await reply(`✅ Successfully rejected ${requests.length} join request${requests.length > 1 ? 's' : ''}!\n\n👑 *Rejected by:* @${sender.split('@')[0]}`, { 
            mentions: [sender] 
        });

    } catch (error) {
        console.error("Reject all error:", error);
        await reply('❌ Failed to reject join requests.');
    }
});