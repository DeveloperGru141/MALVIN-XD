const { ademola, fakevCard } = require("../ademola");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

ademola({
    pattern: "viewonce",
    alias: ["vo", "reveal", "vv"],
    desc: "Reveal view-once media",
    category: "media",
    react: "👁️",
    use: ".viewonce (reply to view-once media)",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        // Extract quoted imageMessage or videoMessage
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedImage = quoted?.imageMessage;
        const quotedVideo = quoted?.videoMessage;

        if (quotedImage && quotedImage.viewOnce) {
            // Download and send the image
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            await ademola.sendMessage(from, { 
                image: buffer, 
                fileName: 'revealed-image.jpg', 
                caption: quotedImage.caption || '📸 Revealed view-once image'
            }, {
                quoted: fakevCard
            });
            
        } else if (quotedVideo && quotedVideo.viewOnce) {
            // Download and send the video
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            await ademola.sendMessage(from, { 
                video: buffer, 
                fileName: 'revealed-video.mp4', 
                caption: quotedVideo.caption || '🎥 Revealed view-once video'
            }, {
                quoted: fakevCard
            });
            
        } else {
            await reply('❌ Please reply to a view-once image or video.');
        }
        
    } catch (error) {
        console.error('Error in viewonce command:', error);
        await reply('❌ Failed to reveal view-once media. Make sure you replied to a view-once image or video.');
    }
});


ademola({
    pattern: "vv2",
    alias: ["retrieve2", "viewonce2", "reveal2"],
    desc: "Retrieve view once messages (Owner Only)",
    category: "owner",
    react: "🐳",
    use: ".vv2 (reply to view once message)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const isOwner = await require('../lib/isOwnerOrSudo')(sender);
        if (!isOwner) {
            return await reply('❌ This is an owner-only command.');
        }

        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg) {
            return await reply('🍁 Please reply to a view once message!');
        }

        // Check if it's a view once message
        const isViewOnce = quotedMsg.viewOnceMessageV2 || quotedMsg.viewOnceMessageV2Extension;
        if (!isViewOnce) {
            return await reply('❌ This is not a view once message. Please reply to a view once image/video.');
        }

        // Extract the actual message from view once wrapper
        const actualMessage = quotedMsg.viewOnceMessageV2?.message || 
                             quotedMsg.viewOnceMessageV2Extension?.message;

        if (!actualMessage) {
            return await reply('❌ Could not extract view once message content.');
        }

        // Download the media
        let buffer;
        let mimeType;
        let messageType;

        if (actualMessage.imageMessage) {
            buffer = await ademola.downloadMediaMessage(
                { message: { imageMessage: actualMessage.imageMessage } },
                'buffer',
                {},
                {}
            );
            mimeType = actualMessage.imageMessage.mimetype || "image/jpeg";
            messageType = "image";
        } 
        else if (actualMessage.videoMessage) {
            buffer = await ademola.downloadMediaMessage(
                { message: { videoMessage: actualMessage.videoMessage } },
                'buffer',
                {},
                {}
            );
            mimeType = actualMessage.videoMessage.mimetype || "video/mp4";
            messageType = "video";
        }
        else if (actualMessage.audioMessage) {
            buffer = await ademola.downloadMediaMessage(
                { message: { audioMessage: actualMessage.audioMessage } },
                'buffer',
                {},
                {}
            );
            mimeType = actualMessage.audioMessage.mimetype || "audio/mp4";
            messageType = "audio";
        }
        else {
            return await reply('❌ Only image, video, and audio view once messages are supported.');
        }

        // Send the retrieved media
        let messageContent = {};
        
        switch (messageType) {
            case "image":
                messageContent = {
                    image: buffer,
                    mimetype: mimeType,
                    caption: '🐳 *View Once Message Retrieved*\n\n> © Powered by Ademola King'
                };
                break;
            case "video":
                messageContent = {
                    video: buffer,
                    mimetype: mimeType,
                    caption: '🐳 *View Once Video Retrieved*\n\n> © Powered by Ademola King'
                };
                break;
            case "audio":
                messageContent = {
                    audio: buffer,
                    mimetype: mimeType,
                    ptt: actualMessage.audioMessage?.ptt || false
                };
                break;
        }

        await ademola.sendMessage(from, messageContent, { 
            quoted: fakevCard 
        });

        console.log(`✅ View once message retrieved by owner: ${sender}`);

    } catch (error) {
        console.error('vv2 Error:', error);
        
        if (error.message?.includes('download')) {
            await reply('❌ Failed to download the view once media. The message may have expired.');
        } else if (error.message?.includes('not found')) {
            await reply('❌ View once message not found or already viewed.');
        } else {
            await reply(`❌ Error retrieving view once message: ${error.message}`);
        }
    }
});