//---------------------------------------------
//           ADEMOLA-XD STICKER TAKE
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');
const crypto = require('crypto');

ademola({
    pattern: "take",
    alias: ["claim", "steal"],
    desc: "Take sticker and add to your pack",
    category: "sticker",
    react: "🎯",
    use: ".take <packname> (reply to sticker)",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        // Check if message is a reply to a sticker
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage?.stickerMessage) {
            return await reply(`🎯 *STICKER TAKE*\n\n❌ Please reply to a sticker.\n\n*Usage:*\n.take My Pack Name\n\n*Example:*\nReply to a sticker with: .take My Cool Pack`);
        }

        // Get the packname from args or use default
        const packname = q || 'Ademola XD';

        // Download the sticker
        const stickerBuffer = await downloadMediaMessage(
            {
                key: mek.message.extendedTextMessage.contextInfo.stanzaId,
                message: quotedMessage,
                messageType: 'stickerMessage'
            },
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: ademola.updateMediaMessage
            }
        );

        if (!stickerBuffer) {
            return await reply('❌ Failed to download sticker. Please try again.');
        }

        // Add metadata using webpmux
        const img = new webp.Image();
        await img.load(stickerBuffer);

        // Create metadata
        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': packname,
            'emojis': ['🎯']
        };

        // Create exif buffer
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        // Set the exif data
        img.exif = exif;

        // Get the final buffer with metadata
        const finalBuffer = await img.save(null);

        // Send success message
        await reply(`✅ *Sticker Taken!*\n\n📦 Pack: ${packname}\n🎯 Added to your sticker collection`);

        // Send the sticker
        await ademola.sendMessage(from, {
            sticker: finalBuffer
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('❌ Take command error:', error);
        await reply('❌ Failed to take sticker. Please try again with a different sticker.');
    }
});

// Take help command
ademola({
    pattern: "takehelp",
    alias: ["claimhelp"],
    desc: "Show sticker take help",
    category: "sticker",
    react: "📖",
    use: ".takehelp",
    filename: __filename
}, async (ademola, mek, m, { from, reply }) => {
    const helpText = `
🎯 *STICKER TAKE COMMAND*

*Usage:*
• Reply to any sticker with:
  .take <packname>

*Examples:*
.take My Funny Pack
.take Cute Animals
.take Memes Collection

*Features:*
✅ Add any sticker to your pack
✅ Custom pack names
✅ Keep original quality
✅ Works with animated stickers

*Note:*
This adds the sticker to your personal collection with your chosen pack name.
    `.trim();

    await reply(helpText);
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------