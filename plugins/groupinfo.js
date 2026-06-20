const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "groupinfo",
    alias: ["ginfo", "groupdesc"],
    desc: "Get detailed group information",
    category: "group",
    react: "ℹ️",
    use: ".groupinfo",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        // Get group metadata
        const groupMetadata = await ademola.groupMetadata(from);
        
        // Get group profile picture with better error handling
        let pp;
        try {
            pp = await ademola.profilePictureUrl(from, 'image');
        } catch {
            // Use a reliable default image
            pp = 'https://i.ibb.co/VWt5CXzX/malvin-xd.jpg';
        }

        // Get admins from participants
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        
        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || from.split('-')[0] + '@s.whatsapp.net';

        // Create info text
        const infoText = `
┌──「 *GROUP INFORMATION* 」
│
▢ *🆔 ID:* ${groupMetadata.id}
│
▢ *🔖 Name:* ${groupMetadata.subject}
│
▢ *👥 Members:* ${participants.length}
│
▢ *🤿 Owner:* @${owner.split('@')[0]}
│
▢ *🕵️ Admins (${groupAdmins.length}):*
${listAdmin || '   • No admins found'}
│
▢ *📝 Description:*
${groupMetadata.desc?.toString() || '   • No description'}
│
└──「 🔖ᴍᴀʟᴠɪɴ xᴅ 」 
`.trim();

        // Send the message with image and mentions
        await ademola.sendMessage(from, {
            image: { url: pp },
            caption: infoText,
            mentions: [...groupAdmins.map(v => v.id), owner]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in groupinfo command:', error);
        await reply('❌ Failed to get group information!');
    }
});