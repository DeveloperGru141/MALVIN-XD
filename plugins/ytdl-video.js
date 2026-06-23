//---------------------------------------------
//           ADEMOLA-XD VIDEO DOWNLOADER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

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

async function getYtdlVideoByUrl(youtubeUrl) {
    const info = await ytdl.getInfo(youtubeUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
    if (!format?.url) throw new Error('No video format found');
    return { download: format.url, title: info.videoDetails.title };
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

        let videoData = null;

        try {
            console.log('Fetching video via ytdl-core...');
            videoData = await getYtdlVideoByUrl(videoUrl);
            console.log('✅ Success with ytdl-core');
        } catch (ytdlError) {
            console.log('❌ ytdl-core failed:', ytdlError.message);
        }

        if (!videoData) {
            downloadAnimation.stop();
            return await reply('❌ *Could not fetch video!*\n\nPlease try again in a few minutes.');
        }

        // Stop download animation
        downloadAnimation.stop();

        // Send video with success caption
        const successCaption = `
✅ *Download Complete!*

🎬 *Title:* ${videoData.title || videoInfo?.title}
📁 *Format:* MP4 (HD)
🚀 *Ready to watch!*

> ✨ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ
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

> 🚀 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ
    `.trim();

    await reply(helpText);
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------