const { ademola } = require("../ademola");
const axios = require('axios');

ademola({
    pattern: "newsletter",
    alias: ["cjid", "id", "channelinfo", "chaninfo"],
    desc: "Get WhatsApp Channel info from link",
    category: "whatsapp",
    react: "📡",
    use: ".newsletter <channel-link>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📡 *WhatsApp Channel Info*\n\nUsage: .newsletter <channel-link>\nExample: .newsletter https://whatsapp.com/channel/0029Vb5yGMgBKfi6JAAYiZ1U`);
        }

        const match = q.match(/whatsapp\.com\/channel\/([\w-]+)/);
        if (!match) return await reply('❌ Invalid WhatsApp channel link!');

        const inviteId = match[1];

        let metadata = null;
        let channelId = null;
        let externalInfo = null;

        // METHOD 1: Get Channel info using direct Baileys API
        try {
            metadata = await ademola.newsletterMetadata("invite", inviteId);
            if (metadata?.id) {
                channelId = metadata.id;
            }
        } catch (error) {
            console.log('❌ Direct API failed for ID');
        }

        // METHOD 2: Get detailed info from external API (fallback for richer data)
        const nexoracleKey = process.env.NEXORACLE_API_KEY;
        if (nexoracleKey) {
            try {
                const { data } = await axios.get(`https://api.nexoracle.com/stalking/whatsapp-channel?apikey=${nexoracleKey}&url=${encodeURIComponent(q)}`, {
                    timeout: 15000
                });
                if (data?.result) {
                    externalInfo = data.result;
                }
            } catch (error) {
                console.log('❌ External API failed for details');
            }
        }

        // Try metadata first (more reliable), fall back to external
        if (metadata?.id) {
            let creationDate = "Unknown";
            if (metadata.creation_time) {
                creationDate = new Date(metadata.creation_time * 1000).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            }

            const name = metadata.name || externalInfo?.title || 'No name';
            const subscribers = metadata.subscribers?.toLocaleString() || externalInfo?.followers || 'Not available';
            const description = metadata.description || externalInfo?.description || '';

            const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                `🔖 *Channel ID:* ${metadata.id}\n` +
                `📛 *Name:* ${name}\n` +
                `👥 *Subscribers:* ${subscribers}\n` +
                `${description ? `📝 *Description:* ${description}\n` : ''}` +
                `📅 *Created:* ${creationDate}\n` +
                `🔗 *Invite ID:* ${inviteId}\n\n` +
                `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                `> © Powered by Ademola King`;

            if (metadata.preview) {
                await ademola.sendMessage(from, {
                    image: { url: `https://pps.whatsapp.net${metadata.preview}` },
                    caption: infoText,
                    mentions: [sender]
                });
            } else if (externalInfo?.image) {
                await ademola.sendMessage(from, {
                    image: { url: externalInfo.image },
                    caption: infoText,
                    mentions: [sender]
                });
            } else {
                await reply(infoText);
            }
        } else if (externalInfo) {
            const { title, followers, description, image, newsletterJid } = externalInfo;

            const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                `🔖 *Channel ID:* ${newsletterJid || 'Not available'}\n` +
                `📛 *Name:* ${title || 'No name'}\n` +
                `👥 *Followers:* ${followers || 'Not available'}\n` +
                `${description ? `📝 *Description:* ${description}\n` : ''}` +
                `🔗 *Invite ID:* ${inviteId}\n\n` +
                `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                `> © Powered by Ademola King`;

            if (image) {
                await ademola.sendMessage(from, {
                    image: { url: image },
                    caption: infoText,
                    mentions: [sender]
                });
            } else {
                await reply(infoText);
            }
        } else {
            await reply('❌ Failed to fetch channel information. The channel may be private, deleted, or the link is invalid.');
        }

    } catch (error) {
        console.error('Newsletter command error:', error);
        if (error.message?.includes('newsletterMetadata')) {
            await reply('❌ This bot version does not support newsletter features. Please update your Baileys version.');
        } else {
            await reply('❌ An unexpected error occurred while fetching channel information.');
        }
    }
});