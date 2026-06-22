//---------------------------------------------
//           ADEMOLA-XD INSTAGRAM DOWNLOADER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Ultra-fast loading animation (400ms)
async function sendIgLoading(ademola, from, action = "Processing") {
    const frames = ['📷', '⬇️', '⚡', '✨'];
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
    }, 600); // ⚡ ULTRA FAST
    
    return {
        stop: () => clearInterval(animationInterval),
        message: loadingMsg
    };
}

// Function to extract unique media URLs
function extractUniqueMedia(mediaData) {
    const uniqueMedia = [];
    const seenUrls = new Set();
    
    for (const media of mediaData) {
        if (!media.url) continue;
        
        if (!seenUrls.has(media.url)) {
            seenUrls.add(media.url);
            uniqueMedia.push(media);
        }
    }
    
    return uniqueMedia;
}

// Main Instagram command
ademola({
    pattern: "instagram",
    alias: ["ig", "igdl", "insta"],
    desc: "Download Instagram posts, reels, and stories",
    category: "download",
    react: "📷",
    use: ".instagram <url>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        // Check if message has already been processed
        if (processedMessages.has(mek.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(mek.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(mek.key.id);
        }, 5 * 60 * 1000);

        if (!q) {
            return await reply(`📷 *INSTAGRAM DOWNLOADER*\n\n❌ Please provide an Instagram URL.\n\n*Usage:*\n.instagram https://instagram.com/p/...\n.ig https://instagram.com/reel/...\n\n*Supported Content:*\n• Posts\n• Reels\n• Stories\n• IGTV\n• Carousels`);
        }

        // Check for various Instagram URL formats
        const instagramPatterns = [
            /https?:\/\/(?:www\.)?instagram\.com\//,
            /https?:\/\/(?:www\.)?instagr\.am\//,
            /https?:\/\/(?:www\.)?instagram\.com\/p\//,
            /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
            /https?:\/\/(?:www\.)?instagram\.com\/tv\//,
            /https?:\/\/(?:www\.)?instagram\.com\/stories\//
        ];

        const isValidUrl = instagramPatterns.some(pattern => pattern.test(q));
        
        if (!isValidUrl) {
            return await reply(`❌ *Invalid Instagram URL!*\n\nPlease provide a valid Instagram link.\n\n*Examples:*\n• https://instagram.com/p/ABC123/\n• https://instagram.com/reel/XYZ789/\n• https://instagram.com/stories/user/123/`);
        }

        // Send initial reaction
        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Start ultra-fast loading animation
        const loadingAnimation = await sendIgLoading(ademola, from, "Fetching Instagram data");

        const nexoracleKey = process.env.NEXORACLE_API_KEY || 'e276311658d835109c';
        const igRes = await axios.get(`https://api.nexoracle.com/downloader/ig?apikey=${nexoracleKey}&url=${encodeURIComponent(q)}`, { timeout: 20000 });
        const downloadData = igRes.data;

        let mediaItems = [];
        if (downloadData?.status === 200 && downloadData?.result?.data) {
            mediaItems = downloadData.result.data;
        } else if (downloadData?.data?.length) {
            mediaItems = downloadData.data;
        } else if (downloadData?.result?.length) {
            mediaItems = downloadData.result;
        } else {
            loadingAnimation.stop();
            return await reply(`❌ *No media found!*\n\nPossible reasons:\n• Post is private\n• Link is invalid\n• Account is private\n• Post was deleted\n\nPlease check the URL and try again.`);
        }

        const uniqueMedia = extractUniqueMedia(mediaItems.map(m => typeof m === 'string' ? { url: m } : m));
        const mediaToDownload = uniqueMedia.slice(0, 10);

        if (mediaToDownload.length === 0) {
            loadingAnimation.stop();
            return await reply(`❌ *No valid media found!*\n\nThe service couldn't extract any media from this post.`);
        }

        loadingAnimation.stop();

        // Show media info
        const mediaInfo = `
╭───═══━ • ━═══───╮
   📷 *INSTAGRAM MEDIA*
╰───═══━ • ━═══───╯

✅ *Found ${mediaToDownload.length} media item(s)*
📦 *Processing downloads...*

> ⚡ Powered by Ademola Tech
        `.trim();

        await ademola.sendMessage(from, {
            text: mediaInfo,
            ...channelInfo
        }, { quoted: fakevCard });

        let successCount = 0;
        let failCount = 0;

        // Download all media
        for (let i = 0; i < mediaToDownload.length; i++) {
            try {
                const media = mediaToDownload[i];
                const mediaUrl = media.url;

                // Check if URL ends with common video extensions
                const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                              media.type === 'video' || 
                              q.includes('/reel/') || 
                              q.includes('/tv/');

                const caption = `📷 *Instagram Download* ${i + 1}/${mediaToDownload.length}\n\n> ✨ Powered by Ademola Tech`;

                if (isVideo) {
                    await ademola.sendMessage(from, {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4",
                        caption: caption,
                        ...channelInfo
                    }, { quoted: fakevCard });
                } else {
                    await ademola.sendMessage(from, {
                        image: { url: mediaUrl },
                        caption: caption,
                        ...channelInfo
                    }, { quoted: fakevCard });
                }
                
                successCount++;
                
                // Small delay between downloads to prevent rate limiting
                if (i < mediaToDownload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
                
            } catch (mediaError) {
                console.error(`Error downloading media ${i + 1}:`, mediaError);
                failCount++;
                // Continue with next media if one fails
            }
        }

        // Send completion summary
        if (successCount > 0) {
            const summary = `
✅ *Download Complete!*

📊 *Results:*
• ✅ Success: ${successCount}
• ❌ Failed: ${failCount}
• 📦 Total: ${mediaToDownload.length}

🎉 *Enjoy your media!*
            `.trim();

            await ademola.sendMessage(from, {
                text: summary,
                ...channelInfo
            }, { quoted: fakevCard });

            // Success reaction
            await ademola.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            await reply(`❌ *All downloads failed!*\n\nPlease try again with a different Instagram URL.`);
        }

    } catch (error) {
        console.error('❌ Instagram download error:', error);
        await reply(`❌ *Download failed!*\n\nError: ${error.message}\n\nPlease try again with a different Instagram URL.`);
    }
});

// Instagram help command
ademola({
    pattern: "ighelp",
    alias: ["instagramhelp"],
    desc: "Show Instagram download help",
    category: "download",
    react: "📖",
    use: ".ighelp",
    filename: __filename
}, async (ademola, mek, m, { from, reply }) => {
    const helpText = `
╭───═══━ • ━═══───╮
   📷 *INSTAGRAM DOWNLOADER*
╰───═══━ • ━═══───╯

*Commands:*
• .instagram <url> - Download Instagram media
• .ig <url> - Short command

*Supported Content:*
✅ Posts (single image/video)
✅ Reels (videos)
✅ Stories (24h content)
✅ IGTV (long videos)
✅ Carousels (multiple media)

*Usage Examples:*
• .instagram https://instagram.com/p/ABC123/
• .ig https://instagram.com/reel/XYZ789/
• .instagram https://instagram.com/stories/user/123/

*Limitations:*
🔒 Private accounts won't work
📱 Mobile links supported
🔄 Multiple media supported
⚡ Fast downloads

> 🚀 Powered by Ademola Tech
    `.trim();

    await reply(helpText);
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------