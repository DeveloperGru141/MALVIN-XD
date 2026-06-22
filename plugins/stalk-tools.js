const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

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

        // Validate WhatsApp channel URL format
        if (!q.includes('whatsapp.com/channel/')) {
            return await reply('❌ Please provide a valid WhatsApp channel URL containing "whatsapp.com/channel/"');
        }

        await reply('🔄 Fetching channel information...');

        const url = encodeURIComponent(q);
        const nexoracleKey = process.env.NEXORACLE_API_KEY || 'e276311658d835109c';
        const { data } = await axios.get(`https://api.nexoracle.com/stalking/whatsapp-channel?apikey=${nexoracleKey}&url=${url}`, {
            timeout: 15000
        });
        
        if (!data.result || data.status !== 200) {
            return await reply('❌ Invalid channel URL or channel not found. Please check the URL and try again.');
        }

        const { title, followers, description, image, link, newsletterJid } = data.result;
        
        // Download channel image
        const imageRes = await axios.get(image, { 
            responseType: 'arraybuffer',
            timeout: 10000 
        });

        const caption = `📢 *WhatsApp Channel Information*\n\n` +
                       `🔖 *Title:* ${title}\n` +
                       `👥 *Followers:* ${followers}\n` +
                       `📄 *Description:* ${description || 'No description available'}\n` +
                       `🆔 *Channel ID:* ${newsletterJid || 'N/A'}\n\n` +
                       `🔗 *Link:* ${link}\n\n` +
                       `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                       `> © Powered by Ademola King`;

        await ademola.sendMessage(from, {
            image: Buffer.from(imageRes.data),
            caption: caption,
            mentions: [sender]
        }, { 
            quoted: fakevCard 
        });

    } catch (error) {
        console.error('WhatsApp Channel Stalk error:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. The channel information service is taking too long to respond.');
        } else if (error.response?.status === 404) {
            await reply('❌ Channel not found. Please check the URL and ensure the channel exists.');
        } else if (error.response?.status === 429) {
            await reply('❌ Rate limit exceeded. Please wait a few minutes before checking another channel.');
        } else if (error.message?.includes('Invalid URL')) {
            await reply('❌ Invalid WhatsApp channel URL format. Please provide a valid channel URL.');
        } else {
            await reply('❌ Failed to fetch channel information. The channel may be private or the service is unavailable.');
        }
    }
});

// ==================== TIKTOK STALK ====================
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

        const apiUrl = `https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status) {
            return await reply('❌ TikTok user not found. Please check the username and try again.');
        }

        const user = data.data.user;
        const stats = data.data.stats;

        const profileInfo = `📱 *TikTok Profile*\n\n` +
                          `👤 *Username:* @${user.uniqueId}\n` +
                          `📛 *Nickname:* ${user.nickname}\n` +
                          `✅ *Verified:* ${user.verified ? "Yes ✅" : "No ❌"}\n` +
                          `📍 *Region:* ${user.region}\n` +
                          `📝 *Bio:* ${user.signature || "No bio available"}\n` +
                          `🔗 *Bio Link:* ${user.bioLink?.link || "No link available"}\n\n` +
                          `📊 *Statistics:*\n` +
                          `👥 *Followers:* ${stats.followerCount.toLocaleString()}\n` +
                          `👤 *Following:* ${stats.followingCount.toLocaleString()}\n` +
                          `❤️ *Likes:* ${stats.heartCount.toLocaleString()}\n` +
                          `🎥 *Videos:* ${stats.videoCount.toLocaleString()}\n\n` +
                          `📅 *Account Created:* ${new Date(user.createTime * 1000).toLocaleDateString()}\n` +
                          `🔒 *Private Account:* ${user.privateAccount ? "Yes 🔒" : "No 🌍"}\n\n` +
                          `🔗 *Profile URL:* https://www.tiktok.com/@${user.uniqueId}\n\n` +
                          `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                          `> © Powered by Ademola King`;

        await ademola.sendMessage(from, {
            image: { url: user.avatarLarger },
            caption: profileInfo,
            mentions: [sender]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('TikTok Stalk error:', error);
        
        if (error.response?.status === 404) {
            await reply('❌ TikTok user not found. Please check the username.');
        } else if (error.code === 'ENOTFOUND') {
            await reply('❌ Network error. Please check your internet connection.');
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
                       `> © Powered by Ademola King`;

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

        const response = await axios.get(`https://api.siputzx.my.id/api/stalk/youtube?username=${encodeURIComponent(q)}`);
        const { status, data } = response.data;

        if (!status || !data) {
            return await reply('❌ YouTube channel not found. Please check the username.');
        }

        const {
            channel: {
                username: ytUsername,
                subscriberCount,
                videoCount,
                avatarUrl,
                channelUrl,
                description,
            },
            latest_videos,
        } = data;

        // Format the YouTube channel information
        const ytMessage = `📺 *YouTube Channel*\n\n` +
                         `👤 *Channel:* ${ytUsername}\n` +
                         `👥 *Subscribers:* ${subscriberCount}\n` +
                         `🎥 *Total Videos:* ${videoCount}\n` +
                         `📝 *Description:* ${description || "N/A"}\n` +
                         `🔗 *Channel URL:* ${channelUrl}\n\n` +
                         `🎬 *Latest Videos:*\n` +
                         latest_videos.slice(0, 3).map((video, index) => 
                             `${index + 1}. *${video.title}*\n   ▶️ *Views:* ${video.viewCount}\n   ⏱️ *Duration:* ${video.duration}\n   📅 *Published:* ${video.publishedTime}`
                         ).join('\n\n') + `\n\n👤 *Requested by:* @${sender.split('@')[0]}\n` +
                         `> © Powered by Ademola King`;

        await ademola.sendMessage(from, {
            image: { url: avatarUrl },
            caption: ytMessage,
            mentions: [sender]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('YouTube Stalk error:', error);
        
        if (error.response?.status === 404) {
            await reply('❌ YouTube channel not found. Please check the username.');
        } else if (error.code === 'ENOTFOUND') {
            await reply('❌ Network error. Please check your internet connection.');
        } else {
            await reply('❌ Failed to fetch YouTube channel information. Please try again later.');
        }
    }
});

ademola({
    pattern: "githubstalk",
    alias: ["gstalk", "gitstalk", "gits"],
    desc: "Fetch detailed GitHub user profile",
    category: "stalk",
    react: "🖥️",
    use: ".githubstalk <username>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`🖥️ *GitHub Stalk*\n\nUsage: .githubstalk <username>\nExample: .githubstalk XdKing2`);
        }

        const username = q.trim();
        const apiUrl = `https://api.github.com/users/${username}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        let userInfo = `🖥️ *GitHub Profile*\n\n` +
                      `👤 *Name:* ${data.name || data.login}\n` +
                      `🔗 *Profile:* ${data.html_url}\n` +
                      `📝 *Bio:* ${data.bio || 'Not available'}\n` +
                      `🏙️ *Location:* ${data.location || 'Unknown'}\n` +
                      `🏢 *Company:* ${data.company || 'Not specified'}\n` +
                      `📊 *Public Repos:* ${data.public_repos}\n` +
                      `👥 *Followers:* ${data.followers} | *Following:* ${data.following}\n` +
                      `📅 *Account Created:* ${new Date(data.created_at).toDateString()}\n` +
                      `✍️ *Public Gists:* ${data.public_gists}\n\n` +
                      `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                      `> © Powered by Ademola King`;

        await ademola.sendMessage(from, {
            image: { url: data.avatar_url },
            caption: userInfo,
            mentions: [sender]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('GitHub Stalk error:', error);
        
        if (error.response?.status === 404) {
            await reply(`❌ GitHub user "${q}" not found. Please check the username and try again.`);
        } else if (error.response?.status === 403) {
            await reply('❌ GitHub API rate limit exceeded. Please try again in a few minutes.');
        } else if (error.code === 'ENOTFOUND') {
            await reply('❌ Network error. Please check your internet connection.');
        } else {
            await reply(`❌ Failed to fetch GitHub profile: ${error.message}`);
        }
    }
});