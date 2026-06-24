//---------------------------------------------
//           ADEMOLA-XD FACEBOOK DOWNLOADER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Fast loading animation for Facebook download
async function sendFbLoading(ademola, from, action = "Processing") {
    const frames = ['📱', '📥', '⚡', '🔄', '✨'];
    let loadingMsg = await ademola.sendMessage(from, { 
        text: `${frames[0]} ${action}...`
    }, { quoted: fakevCard });
    
    let frameIndex = 0;
    const animationInterval = setInterval(async () => {
        frameIndex = (frameIndex + 1) % frames.length;
        try {
            await ademola.sendMessage(from, {
                text: `${frames[frameIndex]} ${action}...`,
                edit: loadingMsg.key
            });
        } catch (e) {
            clearInterval(animationInterval);
        }
    }, 400); // Fast animation ⚡
    
    return {
        stop: () => clearInterval(animationInterval),
        message: loadingMsg
    };
}

const fbApis = [
    {
        name: "Nexoracle",
        url: (url) => `https://api.nexoracle.com/downloader/facebook?apikey=${process.env.NEXORACLE_API_KEY}&url=${encodeURIComponent(url)}`,
        parse: (data) => data?.result?.hd || data?.result?.sd
    },
    {
        name: "Facebook Downloader",
        url: (url) => `https://fbdownloader.net/api/?url=${encodeURIComponent(url)}`,
        parse: (data) => data?.download_url
    }
];

async function resolveFacebookUrl(url) {
    try {
        const res = await axios.get(url, { 
            timeout: 15000, 
            maxRedirects: 10, 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            } 
        });
        return res?.request?.res?.responseUrl || url;
    } catch {
        return url;
    }
}

async function fetchFromFacebookApi(api, url) {
    try {
        const response = await axios.get(api.url(url), {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            },
            validateStatus: status => status >= 200 && status < 500
        });
        
        console.log(`✅ ${api.name} API response:`, response.status);
        return response.data;
    } catch (error) {
        console.log(`❌ ${api.name} API failed:`, error.message);
        throw error;
    }
}

async function downloadFacebookVideo(videoUrl) {
    // Create temp directory
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

    const videoResponse = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 45000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Range': 'bytes=0-',
            'Connection': 'keep-alive',
            'Referer': 'https://www.facebook.com/'
        }
    });

    const writer = fs.createWriteStream(tempFile);
    videoResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    // Verify download
    if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
        fs.unlinkSync(tempFile);
        throw new Error('Downloaded file is empty');
    }

    return tempFile;
}

// Main Facebook command
ademola({
    pattern: "facebook",
    alias: ["fb", "fbdl", "fbvideo"],
    desc: "Download Facebook videos",
    category: "download",
    react: "📱",
    use: ".facebook <url>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📱 *FACEBOOK DOWNLOADER*\n\n❌ Please provide a Facebook video URL.\n\n*Usage:*\n.facebook https://facebook.com/...\n.fb https://fb.watch/...\n\n*Supported URLs:*\n• Facebook posts\n• Facebook Watch\n• Facebook Reels\n• Facebook stories\n\n💡 *Tip:* Make sure the video is public!`);
        }

        // Validate Facebook URL
        if (!q.match(/facebook\.com|fb\.watch|fb\.com/i)) {
            return await reply(`❌ *Invalid Facebook URL!*\n\nPlease provide a valid Facebook video URL.\n\n*Examples:*\n• https://facebook.com/...\n• https://fb.watch/...\n• https://www.facebook.com/reel/...`);
        }

        // Send initial reaction
        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Start processing animation
        const processingAnimation = await sendFbLoading(ademola, from, "Processing Facebook URL...");

        // Resolve URL (handle short links)
        const resolvedUrl = await resolveFacebookUrl(q);
        console.log(`Resolved URL: ${resolvedUrl}`);

        processingAnimation.stop();

        // Start API fetching animation
        const apiAnimation = await sendFbLoading(ademola, from, "Fetching video data...");

        let videoData = null;
        let apiUsed = null;

        // Filter APIs that require configured keys
        const availableApis = fbApis.filter(api => {
            if (api.name === 'Nexoracle' && !process.env.NEXORACLE_API_KEY) return false;
            return true;
        });

        // Try multiple APIs
        for (const api of availableApis) {
            try {
                console.log(`Trying ${api.name} API...`);
                const data = await fetchFromFacebookApi(api, resolvedUrl);
                
                const parsedUrl = api.parse(data);
                if (parsedUrl) {
                    videoData = parsedUrl;
                    apiUsed = api.name;
                    break;
                }
            } catch (error) {
                console.log(`${api.name} failed:`, error.message);
                continue;
            }
        }

        if (!videoData) {
            apiAnimation.stop();
            return await reply(`❌ *Failed to fetch video!*\n\nPossible reasons:\n• Video is private/restricted\n• URL is invalid\n• All APIs are busy\n• Video is too long\n\nPlease try again with a different URL.`);
        }

        apiAnimation.stop();

        // Show video info
        const videoInfo = `
╭───═══━ • ━═══───╮
   📱 *FACEBOOK VIDEO*
╰───═══━ • ━═══───╯

✅ *Video data fetched successfully!*
🔧 *Service:* ${apiUsed}
🌐 *URL:* ${q.length > 30 ? q.substring(0, 30) + '...' : q}

⏳ *Downloading video...*
        `.trim();

        await ademola.sendMessage(from, {
            text: videoInfo,
            ...channelInfo
        }, { quoted: fakevCard });

        // Start download animation
        const downloadAnimation = await sendFbLoading(ademola, from, "Downloading video...");

        let tempFilePath;
        try {
            // Download the video
            tempFilePath = await downloadFacebookVideo(videoData);
            
            // Get file size
            const fileSize = (fs.statSync(tempFilePath).size / 1024 / 1024).toFixed(2);
            
            downloadAnimation.stop();

            // Send video with success caption
            const successCaption = `
✅ *Download Complete!*

📱 *Source:* Facebook
💾 *Size:* ${fileSize}MB
🎬 *Quality:* HD Available

> ✨ Powered by Ademola Tech
            `.trim();

            await ademola.sendMessage(from, {
                video: { url: tempFilePath },
                mimetype: "video/mp4",
                caption: successCaption,
                ...channelInfo
            }, { quoted: fakevCard });

            // Success reaction
            await ademola.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } catch (downloadError) {
            downloadAnimation.stop();
            throw new Error(`Video download failed: ${downloadError.message}`);
        } finally {
            // Clean up temp file
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (cleanupError) {
                    console.error('Error cleaning up temp file:', cleanupError);
                }
            }
        }

    } catch (error) {
        console.error('❌ Facebook download error:', error);
        await reply(`❌ *Download failed!*\n\nError: ${error.message}\n\nPlease try again with a different Facebook URL.`);
    }
});

// Facebook help command
ademola({
    pattern: "fbhelp",
    alias: ["facebookhelp"],
    desc: "Show Facebook download help",
    category: "download",
    react: "📖",
    use: ".fbhelp",
    filename: __filename
}, async (ademola, mek, m, { from, reply }) => {
    const helpText = `
╭───═══━ • ━═══───╮
   📱 *FACEBOOK DOWNLOADER*
╰───═══━ • ━═══───╯

*Commands:*
• .facebook <url> - Download Facebook video
• .fb <url> - Short command

*Supported Content:*
✅ Facebook posts
✅ Facebook Watch
✅ Facebook Reels  
✅ Facebook stories
✅ Public videos only

*Usage Examples:*
• .facebook https://facebook.com/.../videos/...
• .fb https://fb.watch/abc123/
• .facebook https://www.facebook.com/reel/...

*Important Notes:*
🔒 Only public videos work
⏱️ Videos under 10 minutes
📱 Mobile and desktop links
🔄 Multiple API fallbacks

> 🚀 Powered by Ademola Tech
    `.trim();

    await reply(helpText);
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------