const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "promote",
    alias: ["makeadmin", "addadmin"],
    desc: "Promote user to admin role",
    category: "group", 
    react: "⬆️",
    use: ".promote @user or reply to user's message",
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
            return await reply('❌ Error: Only group admins can use the promote command.');
        }

        let userToPromote = [];
        
        // SIMPLE FIX: Check for participant in contextInfo
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToPromote = [mek.message.extendedTextMessage.contextInfo.participant];
            console.log('✅ Found user to promote:', userToPromote);
        }
        // Check for mentioned users
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToPromote = mek.message.extendedTextMessage.contextInfo.mentionedJid.filter(jid => !jid.includes('status@broadcast'));
            console.log('✅ Found mentioned users:', userToPromote);
        }
        
        if (userToPromote.length === 0) {
            return await reply('❌ Error: Please mention the user or reply to their message to promote!');
        }

        // Try to promote with the detected user
        await ademola.groupParticipantsUpdate(from, userToPromote, "promote");
        
        const usernames = userToPromote.map(jid => `@${jid.split('@')[0]}`);
        const promotionMessage = `*『 GROUP PROMOTION 』*\n\n👥 *Promoted User:*\n• ${usernames[0]}\n\n👑 *Promoted By:* @${sender.split('@')[0]}\n\n📅 *Date:* ${new Date().toLocaleString()}`;
        
        await ademola.sendMessage(from, { 
            text: promotionMessage,
            mentions: [...userToPromote, sender]
        }, {
            quoted: fakevCard
        });
        
    } catch (error) {
        console.error('Error in promote command:', error);
        await reply('❌ Failed to promote user. Make sure the user exists in the group.');
    }
});