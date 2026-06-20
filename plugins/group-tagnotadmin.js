const { ademola, fakevCard } = require("../ademola");
const isAdmin = require('../lib/isAdmin');

ademola({
    pattern: "tagnotadmin",
    alias: ["tagmembers", "tagusers", "tagnonadmin"],
    desc: "Tag all non-admin members in the group",
    category: "group",
    react: "🔊",
    use: ".tagnotadmin",
    filename: __filename,
}, async (ademola, mek, m, { from, sender, isGroup, reply }) => {
    try {
        // Check if it's a group
        if (!isGroup) {
            return await reply("❌ This command can only be used in groups!");
        }

        // Check admin status using your existing function
        const adminStatus = await isAdmin(ademola, from, sender);

        // Check if bot is admin first
        if (!adminStatus.isBotAdmin) {
            return await reply("🤖 Please make me an admin first to use this command.");
        }

        // Check if sender is admin
        if (!adminStatus.isSenderAdmin) {
            return await reply("🔒 Only admins can use the .tagnotadmin command.");
        }

        // Get group metadata
        const groupMetadata = await ademola.groupMetadata(from);
        const participants = groupMetadata.participants || [];

        // Filter non-admin members (those without admin role)
        const nonAdmins = participants.filter(p => !p.admin || p.admin === null);

        if (nonAdmins.length === 0) {
            return await reply("👑 All members in this group are admins!");
        }

        // Create message
        let message = '🔊 *Hello Non-Admin Members!* 👋\n\n';
        
        // Add non-admin members
        nonAdmins.forEach((participant) => {
            const number = participant.id.split('@')[0];
            message += `👤 @${number}\n`;
        });

        // Add footer info
        message += `\n📊 Non-admin members: ${nonAdmins.length}`;
        message += `\n👑 Admin members: ${participants.length - nonAdmins.length}`;
        message += `\n🔢 Total members: ${participants.length}`;

        // Send message with mentions
        await ademola.sendMessage(from, {
            text: message,
            mentions: nonAdmins.map(p => p.id)
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in tagnotadmin command:', error);
        await reply("❌ Failed to tag non-admin members. Please try again.");
    }
});