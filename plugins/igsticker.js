//---------------------------------------------
//           ADEMOLA-XD INSTAGRAM STICKER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

// Store processed message IDs
const processedMessages = new Set();

// Ultra-fast loading animation (400ms)
async function sendStickerLoading(ademola, from, action = "Processing") {
    const frames = ['📸', '🔄', '⚡', '✨'];
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

// Simple sticker conversion
async function convertToSticker(buffer, isVideo = false) {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const tempInput = path.join(tmpDir, `sticker_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`);
    const tempOutput = path.join(tmpDir, `sticker_out_${Date.now()}.webp`);

    fs.writeFileSync(tempInput, buffer);

    // Simple FFmpeg command for sticker conversion
    let ffmpegCommand;
    if (isVideo) {
        ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=10" -c:v libwebp -loop 0 -pix_fmt yuva420p -quality 40 "${tempOutput}"`;
    } else {
        ffmpegCommand = `ffmpeg -y -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -pix_fmt yuva420p -quality 80 "${tempOutput}"`;
    }

    await new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });

    const webpBuffer = fs.readFileSync(tempOutput);

    // Add EXIF data for WhatsApp stickers
    const img = new webp.Image();
    await img.load(webpBuffer);

    const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': 'Ademola XD',
        'emojis': ['📸']
    };
    
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;

    const finalBuffer = await img.save(null);

    // Cleanup temp files
    try { fs.unlinkSync(tempInput); } catch {}
    try { fs.unlinkSync(tempOutput); } catch {}

    return finalBuffer;
}

// Download buffer from URL
async function fetchBuffer(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        return Buffer.from(response.data);
    } catch (error) {
        throw new Error(`Download failed: ${error.message}`);
    }
}

// Main Instagram sticker command
ademola({
    pattern: "igs",
    alias: ["igsticker", "instasticker"],
    desc: "Convert Instagram media to stickers",
    category: "sticker",
    react: "📸",
    use: ".igs <url>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        // Check if message already processed
        if (processedMessages.has(mek.key.id)) return;
        processedMessages.add(mek.key.id);
        setTimeout(() => processedMessages.delete(mek.key.id), 5 * 60 * 1000);

        if (!q) {
            return await reply(`📸 *INSTAGRAM STICKER*\n\n❌ Please provide an Instagram URL.\n\n*Usage:*\n.igs https://instagram.com/p/...\n.igs https://instagram.com/reel/...\n\n💡 *Tip:* Works with posts, reels, and stories!`);
        }

        // Validate Instagram URL
        if (!q.match(/instagram\.com|instagr\.am/i)) {
            return await reply(`❌ *Invalid Instagram URL!*\n\nPlease provide a valid Instagram link.\n\n*Examples:*\n• https://instagram.com/p/ABC123/\n• https://instagram.com/reel/XYZ789/`);
        }

        // Send initial reaction
        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Start ultra-fast loading
        const loadingAnimation = await sendStickerLoading(ademola, from, "Fetching Instagram media");

        const nexoracleKey = process.env.NEXORACLE_API_KEY;
        if (!nexoracleKey) return await reply('❌ NEXORACLE_API_KEY not configured in .env');
        const igRes = await axios.get(`https://api.nexoracle.com/downloader/ig?apikey=${nexoracleKey}&url=${encodeURIComponent(q)}`, { timeout: 20000 });
        const downloadData = igRes.data;

        let mediaItems = [];
        if (downloadData?.status === 200 && downloadData?.result?.data) {
            mediaItems = downloadData.result.data;
        } else if (downloadData?.data?.length) {
            mediaItems = downloadData.data;
        } else {
            loadingAnimation.stop();
            return await reply(`❌ *No media found!*\n\nPossible reasons:\n• Post is private\n• Link is invalid\n• Account is private\n\nPlease check the URL and try again.`);
        }

        mediaItems = mediaItems.filter(item => (item?.url || item?.download_url || item));
        
        if (!mediaItems.length) {
            loadingAnimation.stop();
            return await reply(`❌ *No valid media found!*\n\nThe scraper couldn't extract any media from this post.`);
        }

        loadingAnimation.stop();

        // Show processing info
        const processInfo = `
╭───═══━ • ━═══───╮
   📸 *STICKER CREATOR*
╰───═══━ • ━═══───╯

✅ *Found ${mediaItems.length} media item(s)*
⚡ *Converting to stickers...*

> ✨ Powered by Ademola Tech
        `.trim();

        await ademola.sendMessage(from, {
            text: processInfo,
            ...channelInfo
        }, { quoted: fakevCard });

        let successCount = 0;
        const maxItems = Math.min(mediaItems.length, 5); // Limit to 5 stickers

        // Process each media item
        for (let i = 0; i < maxItems; i++) {
            try {
                const media = mediaItems[i];
                const isVideo = media.type === 'video' || /\.(mp4|mov|avi)$/i.test(media.url);

                // Download media
                const mediaBuffer = await fetchBuffer(media.url);
                
                // Convert to sticker
                const stickerBuffer = await convertToSticker(mediaBuffer, isVideo);

                // Send sticker
                await ademola.sendMessage(from, {
                    sticker: stickerBuffer
                }, { quoted: fakevCard });

                successCount++;

                // Small delay between stickers
                if (i < maxItems - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (itemError) {
                console.error(`Sticker ${i + 1} failed:`, itemError);
                // Continue with next item
            }
        }

        // Send completion summary
        if (successCount > 0) {
            const summary = `
✅ *Sticker Creation Complete!*

📊 *Results:*
• ✅ Success: ${successCount}
• 📦 Total: ${maxItems}

🎉 *Enjoy your stickers!*
            `.trim();

            await ademola.sendMessage(from, {
                text: summary,
                ...channelInfo
            }, { quoted: fakevCard });

            // Success reaction
            await ademola.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            await reply(`❌ *All sticker conversions failed!*\n\nPlease try again with a different Instagram URL.`);
        }

    } catch (error) {
        console.error('❌ Instagram sticker error:', error);
        await reply(`❌ *Sticker creation failed!*\n\nError: ${error.message}\n\nPlease try again with a different Instagram URL.`);
    }
});

// Instagram sticker help
ademola({
    pattern: "igshelp",
    alias: ["igstickerhelp"],
    desc: "Show Instagram sticker help",
    category: "sticker",
    react: "📖",
    use: ".igshelp",
    filename: __filename
}, async (ademola, mek, m, { from, reply }) => {
    const helpText = `
╭───═══━ • ━═══───╮
   📸 *INSTAGRAM STICKER*
╰───═══━ • ━═══───╯

*Commands:*
• .igs <url> - Convert Instagram media to stickers

*Supported Content:*
✅ Posts (images/videos)
✅ Reels (videos) 
✅ Stories (24h content)
✅ Carousels (multiple media)

*Features:*
⚡ Fast conversion
🎯 Auto-detect media type
📦 Multiple stickers from carousels
✨ WhatsApp compatible

*Usage Examples:*
• .igs https://instagram.com/p/ABC123/
• .igs https://instagram.com/reel/XYZ789/

> 🚀 Powered by Ademola Tech
    `.trim();

    await reply(helpText);
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------