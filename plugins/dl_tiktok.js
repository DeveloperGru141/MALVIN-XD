const axios = require("axios");
const { ademola, fakevCard } = require("../ademola");
const { channelInfo } = require('../lib/messageConfig');

ademola({
  pattern: "tiktok",
  alias: ["tt", "tiktokdl"],
  react: '📥',
  desc: "Download TikTok video",
  category: "download",
  use: ".tiktok <url>",
  filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
  const tiktokUrl = q;

  if (!tiktokUrl || !tiktokUrl.includes("tiktok.com")) {
    return await reply(`🎬 *TikTok Downloader*\n\n❌ Please provide a valid TikTok URL.\n\n*Example:*\n.tiktok https://vm.tiktok.com/ABC123/`);
  }

  try {
    // Send initial processing message
    const processingMsg = await reply("⏳ Processing your TikTok link...");

    let data;
    
    // Try multiple APIs
    const apis = [
      // API 1
      `https://api.nexoracle.com/downloader/tiktok-nowm?apikey=free_key@maher_apis&url=${encodeURIComponent(tiktokUrl)}`,
      // API 2
      `https://api.tikwm.com/?url=${encodeURIComponent(tiktokUrl)}&hd=1`,
      // API 3 - Alternative
      `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`,
      // API 4 - Another alternative
      `https://api.tiktokdownload.me/?url=${encodeURIComponent(tiktokUrl)}`
    ];

    for (let apiUrl of apis) {
      try {
        console.log(`Trying API: ${apiUrl}`);
        const res = await axios.get(apiUrl, { timeout: 15000 });
        
        if (res.data) {
          // Parse response based on API structure
          if (res.data.status === 200 && res.data.result) {
            data = res.data.result;
            break;
          } else if (res.data.data) {
            const r = res.data.data;
            data = {
              title: r.title || "No Title",
              author: {
                username: r.author?.unique_id || r.author?.id || "unknown",
                nickname: r.author?.nickname || "Unknown User"
              },
              metrics: {
                digg_count: r.digg_count || 0,
                comment_count: r.comment_count || 0,
                share_count: r.share_count || 0,
                download_count: r.download_count || 0
              },
              url: r.play || r.hdplay || r.wmplay || r.music,
              thumbnail: r.cover || r.thumbnail
            };
            break;
          } else if (res.data.video_url) {
            // Alternative API structure
            data = {
              title: res.data.title || "No Title",
              author: {
                username: res.data.author_username || "unknown",
                nickname: res.data.author_nickname || "Unknown User"
              },
              metrics: {
                digg_count: res.data.likes || 0,
                comment_count: res.data.comments || 0,
                share_count: res.data.shares || 0,
                download_count: res.data.downloads || 0
              },
              url: res.data.video_url,
              thumbnail: res.data.thumbnail
            };
            break;
          }
        }
      } catch (apiError) {
        console.log(`API failed: ${apiUrl} - ${apiError.message}`);
        continue;
      }
    }

    if (!data || !data.url) {
      return await reply("❌ *Failed to fetch TikTok data from all APIs!*\n\nPlease try a different TikTok URL or try again later.");
    }

    const { title, author, url, metrics, thumbnail } = data;

    // Create caption
    const caption = `
╭───═══━ • ━═══───╮
   🎬 *TIKTOK DOWNLOADER*  
╰───═══━ • ━═══───╯

╭──「 📋 𝙑𝙄𝘿𝙀𝙊 𝙄𝙉𝙁𝙊 」──➣
│ ▸ 🎵 *Title:* ${title || 'No Title'}
│ ▸ 👤 *Author:* ${author.nickname} (@${author.username})
│ ▸ ❤️ *Likes:* ${metrics.digg_count?.toLocaleString() || 0}
│ ▸ 💬 *Comments:* ${metrics.comment_count?.toLocaleString() || 0}
│ ▸ 🔁 *Shares:* ${metrics.share_count?.toLocaleString() || 0}
│ ▸ 📥 *Downloads:* ${metrics.download_count?.toLocaleString() || 0}
╰─────

> 🚀 Powered by Ademola Tech
    `.trim();

    // Send video info
    if (thumbnail) {
      await ademola.sendMessage(from, {
        image: { url: thumbnail },
        caption: caption,
        ...channelInfo
      }, { quoted: fakevCard });
    } else {
      await ademola.sendMessage(from, {
        text: caption,
        ...channelInfo
      }, { quoted: fakevCard });
    }

    // Download and send video
    await reply("📥 Downloading video...");

    try {
      const videoResponse = await axios.get(url, { 
        responseType: 'arraybuffer', 
        timeout: 45000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',
          'Range': 'bytes=0-'
        }
      });
      
      if (!videoResponse.data || videoResponse.data.length === 0) {
        throw new Error('Empty video response');
      }

      const videoBuffer = Buffer.from(videoResponse.data, 'binary');
      const fileSize = (videoBuffer.length / 1024 / 1024).toFixed(2);

      // Check file size (WhatsApp limit is ~16MB)
      if (parseFloat(fileSize) > 15) {
        return await reply(`❌ *Video too large!*\n\nFile size: ${fileSize}MB\nWhatsApp limit: 16MB\n\nTry a shorter video.`);
      }

      // Send video
      await ademola.sendMessage(from, {
        video: videoBuffer,
        caption: `✅ *Download Complete!*\n\n🎬 *Video by:* @${author.username}\n💾 *Size:* ${fileSize}MB\n\n📥 Enjoy your video!`,
        ...channelInfo
      }, { quoted: fakevCard });

    } catch (downloadError) {
      console.error("Video download error:", downloadError);
      
      // If download fails, send the direct URL
      await reply(`❌ *Couldn't download video directly, but here's the link:*\n\n${url}\n\nYou can download it manually.`);
    }

  } catch (err) {
    console.error("❌ TikTok download error:", err);
    await reply("❌ *Failed to process TikTok URL!*\n\nPlease check:\n• URL is valid\n• Video is public\n• Try again later");
  }
});