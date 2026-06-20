//---------------------------------------------
//           ADEMOLA-XD VIDEO DOWNLOADER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');
const yts = require('yt-search');

// Izumi API configuration
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

// Fast loading animation for video download
async function sendVideoLoading(ademola, from, action = "Processing") {
    const frames = ['🎬', '📥', '⚡', '🔄', '✨'];
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
    }, 600); // Fast animation ⚡
    
    return {
        stop: () => clearInterval(animationInterval),
        message: loadingMsg
    };
}

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

async function getIzumiVideoByUrl(youtubeUrl) {
    const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=720`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('Izumi video API returned no download');
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.mp4) {
        return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error('Okatsu ytmp4 returned no mp4');
}

async function getDavidCyrilVideoByUrl(youtubeUrl) {
    const apiUrl = `https://apis.davidcyriltech.my.id/youtube?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.downloadUrl) {
        return { download: res.data.downloadUrl, title: res.data.title };
    }
    throw new Error('David Cyril API returned no download');
}

// Main video command
ademola({
    pattern: "video",
    alias: ["ytvideo", "vid", "ytmp4"],
    desc: "Download YouTube videos in HD quality",
    category: "download",
    react: "🎬",
    use: ".video <query/url>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`🎬 *VIDEO DOWNLOADER*\n\n❌ Please provide a YouTube URL or search query.\n\n*Usage:*\n• .video https://youtu.be/ABC123\n• .video funny cat videos\n• .video music tutorial\n\n💡 *Tip:* You can search by keywords or paste YouTube URL`);
        }

        // Send initial reaction
        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        let videoUrl, videoInfo;
        const isYtUrl = q.match(/(youtube\.com|youtu\.be)/i);

        // Start search/process animation
        const searchAnimation = await sendVideoLoading(
            ademola, 
            from, 
            isYtUrl ? "Processing YouTube URL..." : "Searching for videos..."
        );

        if (isYtUrl) {
            // Handle YouTube URL
            const videoId = q.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
            if (!videoId) {
                searchAnimation.stop();
                return await reply('❌ *Invalid YouTube URL!*\n\nPlease provide a valid YouTube URL.\n*Example:* https://youtu.be/ABC123');
            }
            
            videoUrl = `https://youtu.be/${videoId}`;
            try {
                videoInfo = await yts({ videoId });
                if (!videoInfo) throw new Error('Could not fetch video info');
            } catch (e) {
                console.error('YT-Search error:', e);
                searchAnimation.stop();
                return await reply('❌ *Failed to get video information!*\n\nPlease check the URL and try again.');
            }
        } else {
            // Handle search query
            try {
                const searchResults = await yts(q);
                if (!searchResults?.videos?.length) {
                    searchAnimation.stop();
                    return await reply(`❌ *No videos found for:* "${q}"\n\nTry different keywords or check spelling.`);
                }

                // Filter results (exclude live streams and very long videos)
                const validVideos = searchResults.videos.filter(v => 
                    !v.live && v.seconds < 3600 && v.views > 1000
                );

                if (!validVideos.length) {
                    searchAnimation.stop();
                    return await reply(`❌ *No suitable videos found!*\n\nTry a different search term.`);
                }

                videoInfo = validVideos[0];
                videoUrl = videoInfo.url;

                console.log('Selected video:', {
                    title: videoInfo.title,
                    duration: videoInfo.timestamp,
                    views: videoInfo.views.toLocaleString(),
                    url: videoInfo.url
                });
            } catch (searchError) {
                console.error('Search error:', searchError);
                searchAnimation.stop();
                return await reply('❌ *Search failed!*\n\nPlease try again later or use a YouTube URL.');
            }
        }

        // Stop search animation
        searchAnimation.stop();

        // Show video info
        const videoInfoMsg = `
╭───═══━ • ━═══───╮
   🎬 *VIDEO FOUND*
╰───═══━ • ━═══───╯

╭──「 📋 𝙑𝙄𝘿𝙀𝙊 𝙄𝙉𝙁𝙊 」──➣
│ ▸ 📀 *ᴛɪᴛʟᴇ:* ${videoInfo?.title || 'Unknown'}
│ ▸ ⏱️ *ᴅᴜʀᴀᴛɪᴏɴ:* ${videoInfo?.timestamp || 'Unknown'}
│ ▸ 👁️ *ᴠɪᴇᴡs:* ${videoInfo?.views?.toLocaleString() || 'Unknown'}
│ ▸ 👤 *ᴄʜᴀɴɴᴇʟ:* ${videoInfo?.author?.name || 'Unknown'}
│ ▸ 📅 *ᴀɢᴏ:* ${videoInfo?.ago || 'Unknown'}
╰─────

_⏳ *Downloading video...*_
        `.trim();

        // Send video info with thumbnail
        await ademola.sendMessage(from, {
            image: { url: videoInfo?.thumbnail || 'https://files.catbox.moe/ceeo6k.jpg' },
            caption: videoInfoMsg,
            ...channelInfo
        }, { quoted: fakevCard });

        // Start download animation
        const downloadAnimation = await sendVideoLoading(ademola, from, "Downloading video...");

        // Try multiple download APIs
        let videoData = null;
        const apis = [
            { name: "Izumi", func: getIzumiVideoByUrl },
            { name: "Okatsu", func: getOkatsuVideoByUrl },
            { name: "David Cyril", func: getDavidCyrilVideoByUrl }
        ];

        for (const api of apis) {
            try {
                console.log(`Trying ${api.name} API...`);
                videoData = await api.func(videoUrl);
                console.log(`✅ Success with ${api.name} API`);
                break;
            } catch (apiError) {
                console.log(`❌ ${api.name} API failed:`, apiError.message);
                continue;
            }
        }

        if (!videoData) {
            downloadAnimation.stop();
            return await reply('❌ *All download services are busy!*\n\nPlease try again in a few minutes.');
        }

        // Stop download animation
        downloadAnimation.stop();

        // Send video with success caption
        const successCaption = `
✅ *Download Complete!*

🎬 *Title:* ${videoData.title || videoInfo?.title}
📁 *Format:* MP4 (HD)
🚀 *Ready to watch!*

> ✨ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ
        `.trim();

        await ademola.sendMessage(from, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${(videoData.title || videoInfo?.title || 'video').replace(/[<>:"\/\\|?*]+/g, '_').slice(0, 60)}.mp4`,
            caption: successCaption,
            ...channelInfo
        }, { quoted: fakevCard });

        // Success reaction
        await ademola.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('❌ Video download error:', error);
        await reply(`❌ *Download failed!*\n\nError: ${error.message || 'Network error'}\n\nPlease try again with a different video.`);
    }
});

// Video help command
ademola({
    pattern: "videohelp",
    alias: ["vidhelp", "ythelp"],
    desc: "Show video download help",
    category: "download",
    react: "📖",
    use: ".videohelp",
    filename: __filename
}, async (ademola, mek, m, { from, reply }) => {
    const helpText = `
╭───═══━ • ━═══───╮
   🎬 *VIDEO DOWNLOADER*
╰───═══━ • ━═══───╯

*Commands:*
• .video <url> - Download from YouTube URL
• .video <query> - Search and download video

*Examples:*
• .video https://youtu.be/ABC123
• .video funny cat compilation
• .video music tutorial 2024

*Features:*
✅ HD Quality (720p)
✅ Fast download
✅ Multiple API fallbacks
✅ Video info display

*Limitations:*
⏱️ Max 1 hour videos
🚫 No live streams
📱 Mobile optimized

> 🚀 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ
    `.trim();

    await reply(helpText);
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------