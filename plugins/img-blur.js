const { ademola, fakevCard } = require("../ademola");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const sharp = require('sharp');
const { channelInfo } = require('../lib/messageConfig');

ademola({
    pattern: "blur",
    alias: ["blurimage"],
    desc: "Blur an image",
    category: "media",
    react: "🖼️",
    use: ".blur (reply to an image or send with caption)",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        // Get the image to blur
        let imageBuffer;
        
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            // If replying to a message
            const quotedMessage = mek.message.extendedTextMessage.contextInfo.quotedMessage;
            
            if (!quotedMessage.imageMessage) {
                return reply('❌ Please reply to an image message');
            }
            
            const quoted = {
                message: {
                    imageMessage: quotedMessage.imageMessage
                }
            };
            
            imageBuffer = await downloadMediaMessage(
                quoted,
                'buffer',
                { },
                { }
            );
        } else if (mek.message?.imageMessage) {
            // If image is in current message
            imageBuffer = await downloadMediaMessage(
                mek,
                'buffer',
                { },
                { }
            );
        } else {
            return reply('❌ Please reply to an image or send an image with caption .blur');
        }

        // Resize and optimize image
        const resizedImage = await sharp(imageBuffer)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Apply blur effect
        const blurredImage = await sharp(resizedImage)
            .blur(10)
            .toBuffer();

        // Send the blurred image
        await ademola.sendMessage(from, {
            image: blurredImage,
            caption: '*[ ✔ ] Image Blurred Successfully*',
            ...channelInfo 
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in blur command:', error);
        await reply('❌ Failed to blur image. Please try again later.');
    }
});