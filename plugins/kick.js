const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "kick",
    alias: ["remove", "ban"],
    desc: "Remove user from group",
    category: "group",
    react: "🚪",
    use: ".kick @user or reply to user's message",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        let usersToKick = [];
        
        // SIMPLE METHOD: Same as promote/demote - check participant in contextInfo
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            usersToKick = [mek.message.extendedTextMessage.contextInfo.participant];
            console.log('✅ Found user to kick:', usersToKick);
        }
        // Check for mentioned users
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            usersToKick = mek.message.extendedTextMessage.contextInfo.mentionedJid.filter(jid => !jid.includes('status@broadcast'));
            console.log('✅ Found mentioned users:', usersToKick);
        }
        
        if (usersToKick.length === 0) {
            return await reply('❌ Please mention the user or reply to their message to kick!');
        }

        // Check permissions (owner can always kick, admins need admin status)
        const isOwner = mek.key.fromMe || (await require('../lib/isOwnerOrSudo')(sender));
        
        if (!isOwner) {
            const adminStatus = await isAdmin();
            
            if (!adminStatus.isBotAdmin) {
                return await reply('❌ Error: Please make the bot an admin first to use this command.');
            }

            if (!adminStatus.isSenderAdmin) {
                return await reply('❌ Error: Only group admins can use the kick command.');
            }
        }

        // Get bot's ID
        const botId = ademola.user.id.split(':')[0] + '@s.whatsapp.net';

        // Check if any of the users to kick is the bot itself
        if (usersToKick.some(jid => jid === botId || jid.replace('@lid', '@s.whatsapp.net') === botId)) {
            return await reply("🤖 I can't kick myself!");
        }

        // Check if trying to kick other admins (non-owners)
        if (!isOwner) {
            const groupMetadata = await ademola.groupMetadata(from);
            const participants = groupMetadata.participants || [];
            
            const adminUsers = usersToKick.filter(userJid => {
                const participant = participants.find(p => p.id === userJid || p.id === userJid.replace('@lid', '@s.whatsapp.net'));
                return participant && participant.admin;
            });
            
            if (adminUsers.length > 0) {
                return await reply('❌ You cannot kick other admins! Only the owner can kick admins.');
            }
        }

        await ademola.groupParticipantsUpdate(from, usersToKick, "remove");
        
        const usernames = usersToKick.map(jid => `@${jid.split('@')[0]}`);
        const kickMessage = `🚪 *User${usersToKick.length > 1 ? 's' : ''} Kicked:*\n${usernames.map(name => `• ${name}`).join('\n')}\n\n👑 *By:* @${sender.split('@')[0]}`;
        
        await ademola.sendMessage(from, { 
            text: kickMessage,
            mentions: [...usersToKick, sender]
        }, {
            quoted: fakevCard
        });
        
    } catch (error) {
        console.error('Error in kick command:', error);
        await reply('❌ Failed to kick user(s). Make sure the bot is admin and has sufficient permissions.');
    }
});