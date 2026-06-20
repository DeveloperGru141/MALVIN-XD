//---------------------------------------------
//           ADEMOLA-XD ANIME FIGURE
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Ultra-fast loading animation (400ms)
async function sendFigureLoading(ademola, from, action = "Processing") {
    const frames = ['🎨', '✨', '⚡', '🔄'];
    let loadingMsg = await ademola.sendMessage(from, { 
        text: `${frames[0]} ${action}`
    }, { quoted: fakevCard });
    
    let frameIndex = 0;
    const animationInterval = setInterval(async () => {
        frameIndex = (frameIndex + 1) % frames.length;
        try {
            await ademola.sendMessage(from, {
                text: `${frames[frameIndex]} ${action}`,
                edit: loadingMsg.key
            });
        } catch (e) {
            clearInterval(animationInterval);
        }
    }, 400); // ⚡ ULTRA FAST
    
    return {
        stop: () => clearInterval(animationInterval),
        message: loadingMsg
    };
}

// Main tofigure command
ademola({
    pattern: "tofigure",
    alias: ["animefigure", "figure"],
    desc: "Convert image to anime figure style",
    category: "ai",
    react: "🎨",
    use: ".tofigure (reply to image)",
    filename: __filename
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        // Check if message has image
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quotedMsg || mek.message;

        let mediaNode = null;
        let mediaType = null;

        if (target.imageMessage) {
            mediaNode = target.imageMessage;
            mediaType = "image";
        } else if (target.documentMessage && target.documentMessage.mimetype?.startsWith('image/')) {
            mediaNode = target.documentMessage;
            mediaType = "document";
        } else {
            return await reply(`🎨 *ANIME FIGURE CONVERTER*\n\n❌ Please reply to an image.\n\n*Usage:*\n1. Reply to an image with .tofigure\n2. Make sure image is clear and well-lit\n\n💡 *Tip:* Works best with portrait photos!`);
        }

        // Send initial reaction
        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Start ultra-fast loading animation
        const loadingAnimation = await sendFigureLoading(ademola, from, "Converting to anime figure");

        // Download image
        let buffer;
        try {
            const stream = await downloadContentFromMessage(mediaNode, mediaType);
            let _buf = Buffer.from([]);
            for await (const chunk of stream) {
                _buf = Buffer.concat([_buf, chunk]);
            }
            buffer = _buf;
        } catch (e) {
            loadingAnimation.stop();
            return await reply(`❌ *Failed to download image!*\n\nPlease make sure:\n• Image is not too large\n• Image is valid\n• Try with a different image`);
        }

        if (!buffer || buffer.length === 0) {
            loadingAnimation.stop();
            return await reply(`❌ *Image is empty!*\n\nPlease try with a different image.`);
        }

        // Upload image to temporary hosting
        let figureUrl;
        try {
            const form = new FormData();
            form.append('files[]', buffer, { filename: 'image.jpg' });
            
            const uploadRes = await axios.post('https://uguu.se/upload.php', form, { 
                headers: form.getHeaders(),
                timeout: 30000
            });
            
            const uploadedUrl = uploadRes.data.files[0].url;

            // Convert to anime figure
            const apiRes = await axios.get(`https://api.nekolabs.my.id/tools/convert/tofigure?imageUrl=${encodeURIComponent(uploadedUrl)}`, {
                timeout: 45000
            });
            
            figureUrl = apiRes.data.result;

        } catch (e) {
            loadingAnimation.stop();
            console.error('Conversion error:', e);
            return await reply(`❌ *Conversion failed!*\n\nPossible reasons:\n• API is busy\n• Image format not supported\n• Server timeout\n\nPlease try again in a moment.`);
        }

        loadingAnimation.stop();

        // Send the anime figure result
        const resultCaption = `
╭───═══━ • ━═══───╮
   🎨 *ANIME FIGURE*
╰───═══━ • ━═══───╯

✅ *Conversion Successful!*
✨ Your image has been transformed into anime style!

> 🚀 Powered by Ademola Tech
        `.trim();

        await ademola.sendMessage(from, {
            image: { url: figureUrl },
            caption: resultCaption,
            ...channelInfo
        }, { quoted: fakevCard });

        // Success reaction
        await ademola.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('❌ Anime figure error:', error);
        await reply(`❌ *Conversion failed!*\n\nError: ${error.message}\n\nPlease try again with a different image.`);
    }
});



//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------