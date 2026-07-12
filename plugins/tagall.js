const { ademola, fakevCard } = require("../ademola");
const settings = require('../settings');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');  // Import your existing isAdmin function

ademola({
    pattern: "tagall",
    alias: ["tagall", "everyone2"],
    desc: "Tag all group members with optional custom message",
    category: "group",
    react: "📢",
    use: ".tagall [custom message]",
    filename: __filename,
}, async (ademola, mek, m, { from, sender, isGroup, reply, text }) => {
    try {
        // Check if it's a group
        if (!isGroup) {
            return await reply("❌ This command can only be used in groups!");
        }

        // Check admin status using your existing function
        const adminStatus = await isAdmin(ademola, from, sender);
        
        if (!adminStatus.isSenderAdmin) {
            return await reply("🔒 Only admins can use the .tagall command.");
        }

        if (!adminStatus.isBotAdmin) {
            return await reply("🤖 I need to be an admin to use this command.");
        }

        // Get group metadata
        const groupMetadata = await ademola.groupMetadata(from);
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            return await reply("❌ No participants found in the group.");
        }

        // Use custom message or default
        const customMessage = text ? text : 'Hello Everyone! 👋';
        const taggerName = mek.pushName || `@${sender.split('@')[0]}`;

        // Create message
        let message = `📢 *${customMessage}*\n\n`;
        
        // Add members (limit to avoid message too long error)
        const maxMembersToShow = 50; // WhatsApp has message length limits
        const membersToShow = participants.slice(0, maxMembersToShow);
        
        membersToShow.forEach((participant) => {
            const number = participant.id.split('@')[0];
            message += `👤 @${number}\n`;
        });

        // Add footer info
        message += `\n🏷️ Tagged by: ${taggerName}`;
        message += `\n📊 Total members: ${participants.length}`;
        
        if (participants.length > maxMembersToShow) {
            message += `\n📋 Showing: ${maxMembersToShow}/${participants.length} members`;
        }

        // Send message with mentions
        await ademola.sendMessage(from, {
            text: message,
            mentions: participants.map(p => p.id).concat([sender])
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in tagall command:', error);
        await reply("❌ Failed to tag all members. Make sure I'm admin and try again.");
    }
});