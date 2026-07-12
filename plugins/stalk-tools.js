const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
const cheerio = require('cheerio');
const ytSearch = require('yt-search');

ademola({
    pattern: "wastalk",
    alias: ["chanstalk", "wstalk", "channelstalk"],
    desc: "Get WhatsApp channel information",
    category: "stalk",
    react: "📢",
    use: ".wastalk <channel-url>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📢 *WhatsApp Channel Stalk*\n\nUsage: .wastalk <channel-url>\nExample: .wastalk https://whatsapp.com/channel/...`);
        }

        const match = q.match(/whatsapp\.com\/channel\/([\w-]+)/);
        if (!match) {
            return await reply('❌ Please provide a valid WhatsApp channel URL containing "whatsapp.com/channel/"');
        }

        const inviteId = match[1];
        await reply('🔄 Fetching channel information...');

        const metadata = await ademola.newsletterMetadata("invite", inviteId);
        if (!metadata?.id) {
            return await reply('❌ Invalid channel URL or channel not found. Please check the URL and try again.');
        }

        const channelId = metadata.id;
        const name = metadata.name || metadata.title || 'Unnamed Channel';
        const description = metadata.description || metadata.subtitle || 'No description';
        const image = metadata.image || metadata.picture;

        const caption = `📢 *WhatsApp Channel Information*\n\n` +
                       `🔖 *Channel ID:* ${channelId}\n` +
                       `📛 *Name:* ${name}\n` +
                       `📝 *Description:* ${description}\n` +
                       `🔗 *Invite ID:* ${inviteId}\n\n` +
                       `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                       `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

        if (image) {
            await ademola.sendMessage(from, {
                image: { url: image },
                caption: caption,
                mentions: [sender]
            }, { quoted: fakevCard });
        } else {
            await ademola.sendMessage(from, {
                text: caption,
                mentions: [sender]
            }, { quoted: fakevCard });
        }

    } catch (error) {
        console.error('WhatsApp Channel Stalk error:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. The channel information service is taking too long to respond.');
        } else {
            await reply('❌ Failed to fetch channel information. The channel may be private or the service is unavailable.');
        }
    }
});

// ==================== TIKTOK STALK ====================
async function scrapeTikTokProfile(username) {
  const res = await axios.get(`https://www.tiktok.com/@${username}`, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  const $ = cheerio.load(res.data);

  const sigData = res.data.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (sigData) {
    try {
      const json = JSON.parse(sigData[1]);
      const user = json?.props?.pageProps?.userData?.user || json?.props?.pageProps?.user;
      if (user) return user;
    } catch (e) { console.log('TT JSON parse error:', e.message); }
  }

  const avatar = $('img[src*="tiktok.com/avatar"]').first().attr('src') ||
    $('img[src*="p16-sign"]').first().attr('src') || '';
  const nickname = $('h1[data-e2e="user-title"]').text().trim() ||
    $('h2[data-e2e="user-subtitle"]').text().trim() || username;
  const followers = $('strong[data-e2e="followers-count"]').text().trim() || 'N/A';
  const following = $('strong[data-e2e="following-count"]').text().trim() || 'N/A';
  const likes = $('strong[data-e2e="likes-count"]').text().trim() || 'N/A';
  const bio = $('h2[data-e2e="user-bio"]').text().trim() || 'No bio available';
  const verified = res.data.includes('verified') || res.data.includes('"verified":true') ? 'Yes ✅' : 'No ❌';
  const videoCount = $('strong[data-e2e="video-count"]').text().trim() || 'N/A';

  return { avatar, nickname, username, followers, following, likes, bio, verified, videoCount };
}

ademola({
    pattern: "tiktokstalk",
    alias: ["tstalk", "ttstalk"],
    desc: "Fetch TikTok user profile details",
    category: "stalk",
    react: "📱",
    use: ".tiktokstalk <username>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📱 *TikTok Stalk*\n\nUsage: .tiktokstalk <username>\nExample: .tiktokstalk mrbeast`);
        }

        await reply('🔄 Fetching TikTok profile...');

        let user;
        try {
          const tikwmRes = await axios.get(`https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(q)}`, { timeout: 10000 });
          if (tikwmRes.data?.data?.user) {
            const u = tikwmRes.data.data.user;
            user = {
              avatar: u.avatarLarger || u.avatarMedium || u.avatarThumb,
              nickname: u.nickname,
              username: u.uniqueId,
              followers: u.followerCount?.toLocaleString(),
              following: u.followingCount?.toLocaleString(),
              likes: u.heartCount?.toLocaleString(),
              bio: u.signature || 'No bio available',
              verified: u.verified ? 'Yes ✅' : 'No ❌',
              videoCount: u.videoCount?.toLocaleString()
            };
          }
        } catch (e) { console.log('TikWM API failed:', e.message); }

        if (!user) {
          const scraped = await scrapeTikTokProfile(q.replace(/^@/, ''));
          user = {
            avatar: scraped.avatar,
            nickname: scraped.nickname,
            username: scraped.username || q,
            followers: scraped.followers,
            following: scraped.following,
            likes: scraped.likes,
            bio: scraped.bio,
            verified: scraped.verified,
            videoCount: scraped.videoCount
          };
        }

        if (!user || (!user.nickname && !user.username)) {
            return await reply('❌ TikTok user not found. Please check the username and try again.');
        }

        const profileInfo = `📱 *TikTok Profile*\n\n` +
                          `👤 *Username:* @${user.username}\n` +
                          `📛 *Nickname:* ${user.nickname || 'N/A'}\n` +
                          `✅ *Verified:* ${user.verified || 'No ❌'}\n` +
                          `📝 *Bio:* ${user.bio || 'No bio available'}\n\n` +
                          `📊 *Statistics:*\n` +
                          `👥 *Followers:* ${user.followers || 'N/A'}\n` +
                          `👤 *Following:* ${user.following || 'N/A'}\n` +
                          `❤️ *Likes:* ${user.likes || 'N/A'}\n` +
                          `🎥 *Videos:* ${user.videoCount || 'N/A'}\n\n` +
                          `🔗 *Profile URL:* https://www.tiktok.com/@${user.username}\n\n` +
                       `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                       `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

        await ademola.sendMessage(from, {
            image: { url: user.avatar },
            caption: profileInfo,
            mentions: [sender]
        }, { quoted: fakevCard });

    } catch (error) {
        console.error('TikTok Stalk error:', error);

        if (error.response?.status === 404) {
            await reply('❌ TikTok user not found. Please check the username.');
        } else {
            await reply('❌ Failed to fetch TikTok profile. Please try again later.');
        }
    }
});

// ==================== TWITTER/X STALK ====================
ademola({
    pattern: "xstalk",
    alias: ["twitterstalk", "twtstalk"],
    desc: "Get details about a Twitter/X user",
    category: "stalk",
    react: "🔍",
    use: ".xstalk <username>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`🔍 *Twitter/X Stalk*\n\nUsage: .xstalk <username>\nExample: .xstalk elonmusk`);
        }

        // Send loading reaction
        await ademola.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://delirius-apiofc.vercel.app/tools/xstalk?username=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.data) {
            return await reply('❌ Twitter/X user not found. Please check the username.');
        }

        const user = data.data;
        const verifiedBadge = user.verified ? "✅" : "❌";

        const caption = `🔍 *Twitter/X Profile*\n\n` +
                       `👤 *Name:* ${user.name}\n` +
                       `🔹 *Username:* @${user.username}\n` +
                       `✔️ *Verified:* ${verifiedBadge}\n` +
                       `👥 *Followers:* ${user.followers_count}\n` +
                       `👤 *Following:* ${user.following_count}\n` +
                       `📝 *Tweets:* ${user.tweets_count}\n` +
                       `📅 *Joined:* ${user.created}\n` +
                       `🔗 *Profile:* ${user.url}\n\n` +
                       `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                       `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

        await ademola.sendMessage(from, {
            image: { url: user.avatar },
            caption: caption,
            mentions: [sender]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Twitter/X Stalk error:', error);
        
        if (error.response?.status === 404) {
            await reply('❌ Twitter/X user not found. Please check the username.');
        } else if (error.code === 'ENOTFOUND') {
            await reply('❌ Network error. Please check your internet connection.');
        } else {
            await reply('❌ Failed to fetch Twitter/X profile. Please try again later.');
        }
    }
});

// ==================== YOUTUBE STALK ====================
ademola({
    pattern: "ytstalk",
    alias: ["youtubestalk", "ytsearch"],
    desc: "Get YouTube channel information and latest videos",
    category: "stalk",
    react: "📺",
    use: ".ytstalk <username>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📺 *YouTube Stalk*\n\nUsage: .ytstalk <username>\nExample: .ytstalk ademolatech2`);
        }

        const searchResults = await ytSearch(q);
        const channel = searchResults?.channels?.[0];

        if (!channel) {
            return await reply('❌ YouTube channel not found. Please check the name.');
        }

        const ytMessage = `📺 *YouTube Channel*\n\n` +
                         `👤 *Channel:* ${channel.name}\n` +
                         `👥 *Subscribers:* ${channel.subscribers || 0}\n` +
                         `🎥 *Total Videos:* ${channel.videoCount || 'N/A'}\n` +
                         `🔗 *Channel URL:* ${channel.url}\n\n` +
                         `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

        await ademola.sendMessage(from, {
            image: { url: channel.image },
            caption: ytMessage,
            mentions: [sender]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('YouTube Stalk error:', error);
        await reply('❌ Failed to fetch YouTube channel information. Please try again later.');
    }
});

