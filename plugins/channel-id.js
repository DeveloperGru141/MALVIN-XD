const { ademola, fakevCard } = require("../ademola");
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
        
        let channelId = null;
        let externalInfo = null;

        // METHOD 1: Get Channel ID using direct Baileys API (for the ID)
        try {
            const metadata = await ademola.newsletterMetadata("invite", inviteId);
            if (metadata?.id) {
                channelId = metadata.id;
                console.log('✅ Got Channel ID from direct API:', channelId);
            }
        } catch (error) {
            console.log('❌ Direct API failed for ID');
        }

        // METHOD 2: Get detailed info from external API (for name, followers, description)
        try {
            const { data } = await axios.get(`https://api.nexoracle.com/stalking/whatsapp-channel?apikey=e276311658d835109c&url=${encodeURIComponent(q)}`, {
                timeout: 15000
            });
            if (data?.result) {
                externalInfo = data.result;
                console.log('✅ Got details from external API');
            }
        } catch (error) {
            console.log('❌ External API failed for details');
        }

        // If we have both, combine them
        if (channelId && externalInfo) {
            const { title, followers, description, image } = externalInfo;
            
            const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                            `🔖 *Channel ID:* ${channelId}\n` +
                            `📛 *Name:* ${title || 'No name'}\n` +
                            `👥 *Followers:* ${followers || 'Not available'}\n` +
                            `📝 *Description:* ${description || 'No description'}\n` +
                            `🔗 *Invite ID:* ${inviteId}\n\n` +
                            `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                            `> © Powered by Ademola King`;

            if (image) {
                await ademola.sendMessage(from, {
                    image: { url: image },
                    caption: infoText,
                    mentions: [sender]
                }, { quoted: fakevCard });
            } else {
                await reply(infoText);
            }
        }
        // If only direct API worked (we have ID but no details)
        else if (channelId) {
            const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                            `🔖 *Channel ID:* ${channelId}\n` +
                            `📛 *Name:* No name\n` +
                            `👥 *Followers:* Not available\n` +
                            `📝 *Description:* No description\n` +
                            `🔗 *Invite ID:* ${inviteId}\n\n` +
                            `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                            `> © Powered by Ademola King`;
            
            await reply(infoText);
        }
        // If only external API worked (we have details but no ID)
        else if (externalInfo) {
            const { title, followers, description, image, newsletterJid } = externalInfo;
            
            const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                            `🔖 *Channel ID:* ${newsletterJid || 'Not available'}\n` +
                            `📛 *Name:* ${title || 'No name'}\n` +
                            `👥 *Followers:* ${followers || 'Not available'}\n` +
                            `📝 *Description:* ${description || 'No description'}\n` +
                            `🔗 *Invite ID:* ${inviteId}\n\n` +
                            `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                            `> © Powered by Ademola King`;

            if (image) {
                await ademola.sendMessage(from, {
                    image: { url: image },
                    caption: infoText,
                    mentions: [sender]
                }, { quoted: fakevCard });
            } else {
                await reply(infoText);
            }
        }
        // If both failed
        else {
            await reply('❌ Failed to fetch channel information from both sources. The channel may be private or the link is invalid.');
        }

    } catch (error) {
        console.error('Newsletter command error:', error);
        await reply('❌ An unexpected error occurred while fetching channel information.');
    }
});