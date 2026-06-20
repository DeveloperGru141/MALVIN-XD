//---------------------------------------------
//           ADEMOLA-XD PROFILE PICTURE
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

ademola({
    pattern: "setpp",
    alias: ["setprofile", "setpic"],
    desc: "Set bot profile picture (Owner only)",
    category: "owner",
    react: "🖼️",
    use: ".setpp (reply to image)",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        // Check if user is owner
        if (!isOwner) {
            return await reply('❌ This command is only available for the owner!');
        }

        // Check if message is a reply to an image
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage) {
            return await reply('❌ Please reply to an image with .setpp');
        }

        const imageMessage = quotedMessage.imageMessage || quotedMessage.stickerMessage;
        if (!imageMessage) {
            return await reply('❌ The replied message must contain an image!');
        }

        await reply('🖼️ Setting profile picture...');

        // Download the image
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Create tmp directory
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const imagePath = path.join(tmpDir, `profile_${Date.now()}.jpg`);
        
        // Save the image
        fs.writeFileSync(imagePath, buffer);

        // Set the profile picture
        await ademola.updateProfilePicture(ademola.user.id, { url: imagePath });

        // Clean up
        fs.unlinkSync(imagePath);

        await reply('✅ Bot profile picture updated successfully!');

    } catch (error) {
        await reply('❌ Failed to update profile picture!');
    }
});