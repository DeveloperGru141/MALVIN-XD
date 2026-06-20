const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "staff",
    alias: ["admins", "adminlist"],
    desc: "Show group admins list",
    category: "group",
    react: "👑",
    use: ".staff",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        // Get group metadata
        const groupMetadata = await ademola.groupMetadata(from);
        
        // Get group profile picture
        let pp;
        try {
            pp = await ademola.profilePictureUrl(from, 'image');
        } catch {
            pp = 'https://i.ibb.co/VWt5CXzX/malvin-xd.jpg';
        }

        // Get admins from participants
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        
        if (groupAdmins.length === 0) {
            return await reply('👑 No admins found in this group!');
        }

        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n▢ ');
        
        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || from.split('-')[0] + '@s.whatsapp.net';

        // Create staff text
        const staffText = `
≡ *GROUP ADMINS* _${groupMetadata.subject}_

┌─⊷ *ADMINS*
▢ ${listAdmin}
└───────────

👑 *Total Admins:* ${groupAdmins.length}
📊 *Group Members:* ${participants.length}
`.trim();

        // Send the message with image and mentions
        await ademola.sendMessage(from, {
            image: { url: pp },
            caption: staffText,
            mentions: [...groupAdmins.map(v => v.id), owner]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in staff command:', error);
        await reply('❌ Failed to get admin list!');
    }
});