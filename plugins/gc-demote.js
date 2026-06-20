const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "demote",
    alias: ["remadmin", "removeadmin"],
    desc: "Demote user from admin role",
    category: "group", 
    react: "⬇️",
    use: ".demote @user or reply to user's message",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('This command can only be used in groups!');
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can use the demote command.');
        }

        let userToDemote = [];
        
        // SIMPLE FIX: Check for participant in contextInfo
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [mek.message.extendedTextMessage.contextInfo.participant];
            console.log('✅ Found user to demote:', userToDemote);
        }
        // Check for mentioned users
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToDemote = mek.message.extendedTextMessage.contextInfo.mentionedJid.filter(jid => !jid.includes('status@broadcast'));
            console.log('✅ Found mentioned users:', userToDemote);
        }
        
        if (userToDemote.length === 0) {
            return await reply('❌ Error: Please mention the user or reply to their message to demote!');
        }

        // Try to demote with the detected user
        await ademola.groupParticipantsUpdate(from, userToDemote, "demote");
        
        const usernames = userToDemote.map(jid => `@${jid.split('@')[0]}`);
        const demotionMessage = `*『 GROUP DEMOTION 』*\n\n👤 *Demoted User:*\n• ${usernames[0]}\n\n👑 *Demoted By:* @${sender.split('@')[0]}\n\n📅 *Date:* ${new Date().toLocaleString()}`;
        
        await ademola.sendMessage(from, { 
            text: demotionMessage,
            mentions: [...userToDemote, sender]
        }, {
            quoted: fakevCard
        });
        
    } catch (error) {
        console.error('Error in demote command:', error);
        await reply('❌ Failed to demote user. Make sure the user exists in the group and is an admin.');
    }
});