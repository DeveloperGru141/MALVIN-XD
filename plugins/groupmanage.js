const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Set Group Description
ademola({
    pattern: "setgdesc",
    alias: ["setgroupdesc", "setdescription"],
    desc: "Set group description",
    category: "group",
    react: "📝",
    use: ".setgdesc <description>",
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
            return await reply('❌ Error: Only group admins can use this command.');
        }

        const desc = text.trim();
        if (!desc) {
            return await reply('📝 Usage: .setgdesc <description>');
        }

        await ademola.groupUpdateDescription(from, desc);
        await reply('✅ Group description updated successfully!');
        
    } catch (error) {
        console.error('Error in setgdesc command:', error);
        await reply('❌ Failed to update group description.');
    }
});

// Set Group Name
ademola({
    pattern: "setgname",
    alias: ["setgroupname", "setname"],
    desc: "Set group name",
    category: "group",
    react: "🏷️",
    use: ".setgname <new name>",
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
            return await reply('❌ Error: Only group admins can use this command.');
        }

        const name = text.trim();
        if (!name) {
            return await reply('🏷️ Usage: .setgname <new name>');
        }

        await ademola.groupUpdateSubject(from, name);
        await reply('✅ Group name updated successfully!');
        
    } catch (error) {
        console.error('Error in setgname command:', error);
        await reply('❌ Failed to update group name.');
    }
});

// Set Group Profile Picture
ademola({
    pattern: "setgpp",
    alias: ["setgrouppp", "setgrouppic"],
    desc: "Set group profile picture",
    category: "group",
    react: "🖼️",
    use: ".setgpp (reply to image/sticker)",
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
            return await reply('❌ Error: Only group admins can use this command.');
        }

        // Check for quoted image/sticker
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quoted?.imageMessage || quoted?.stickerMessage;
        
        if (!imageMessage) {
            return await reply('🖼️ Please reply to an image or sticker with .setgpp');
        }

        // Download and set group profile picture
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, buffer);

        await ademola.updateProfilePicture(from, { url: imgPath });
        
        // Clean up temporary file
        try { 
            fs.unlinkSync(imgPath); 
        } catch (_) {}

        await reply('✅ Group profile picture updated successfully!');
        
    } catch (error) {
        console.error('Error in setgpp command:', error);
        await reply('❌ Failed to update group profile picture.');
    }
});