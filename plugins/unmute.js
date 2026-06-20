const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "unmute",
    alias: ["unmutechat", "enablechat"],
    desc: "Unmute group chat",
    category: "group",
    react: "🔊",
    use: ".unmute",
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
            return await reply('❌ Error: Only group admins can use the unmute command.');
        }

        await ademola.groupSettingUpdate(from, 'not_announcement'); // Unmute the group
        await reply('🔊 Group has been unmuted! Members can now send messages.');
        
    } catch (error) {
        console.error('Error in unmute command:', error);
        await reply('❌ Failed to unmute group. Make sure the bot is admin and has sufficient permissions.');
    }
});