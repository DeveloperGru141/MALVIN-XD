const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
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
                       `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

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

        const apiUrl = `https://api.nexoracle.com/stalking/tiktok?apikey=${process.env.NEXORACLE_API_KEY || ''}&username=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.result) {
            return await reply('❌ TikTok user not found. Please check the username and try again.');
        }

        const user = data.result;

        const profileInfo = `📱 *TikTok Profile*\n\n` +
                          `👤 *Username:* @${user.username || user.uniqueId}\n` +
                          `📛 *Nickname:* ${user.nickname || user.nick}\n` +
                          `✅ *Verified:* ${user.verified ? "Yes ✅" : "No ❌"}\n` +
                          `📍 *Region:* ${user.region || 'N/A'}\n` +
                          `📝 *Bio:* ${user.bio || user.description || 'No bio available'}\n\n` +
                          `📊 *Statistics:*\n` +
                          `👥 *Followers:* ${(user.followers || user.followerCount || 0).toLocaleString()}\n` +
                          `👤 *Following:* ${(user.following || user.followingCount || 0).toLocaleString()}\n` +
                          `❤️ *Likes:* ${(user.likes || user.heartCount || 0).toLocaleString()}\n` +
                          `🎥 *Videos:* ${(user.videoCount || user.videos || 0).toLocaleString()}\n\n` +
                          `🔗 *Profile URL:* https://www.tiktok.com/@${user.username || user.uniqueId}\n\n` +
                       `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                       `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

        await ademola.sendMessage(from, {
            image: { url: user.avatar || user.avatarLarger },
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

