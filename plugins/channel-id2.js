const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "newsletter2",
    alias: ["cjid2", "id2"],
    desc: "Get WhatsApp Channel info from link",
    category: "whatsapp",
    react: "📡",
    use: ".newsletter <channel-link>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📡 *WhatsApp Channel Info*\n\nUsage: .newsletter <channel-link>\nExample: .newsletter https://whatsapp.com/channel/xxxxxxxxxx`);
        }

        // Extract channel ID from URL
        const match = q.match(/whatsapp\.com\/channel\/([\w-]+)/);
        if (!match) {
            return await reply(`❌ Invalid WhatsApp channel link!\n\nPlease provide a valid link like:\nhttps://whatsapp.com/channel/xxxxxxxxxx`);
        }

        const inviteId = match[1];
        let metadata;

        try {
            metadata = await ademola.newsletterMetadata("invite", inviteId);
        } catch (error) {
            console.error('Newsletter metadata error:', error);
            return await reply('❌ Failed to fetch channel info. The channel may be private, deleted, or the link is invalid.');
        }

        if (!metadata?.id) {
            return await reply('❌ Channel not found or inaccessible. Please check the link and try again.');
        }

        // Format creation date
        let creationDate = "Unknown";
        if (metadata.creation_time) {
            creationDate = new Date(metadata.creation_time * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                        `🔖 *Channel ID:* ${metadata.id}\n` +
                        `📛 *Name:* ${metadata.name || 'No name'}\n` +
                        `👥 *Subscribers:* ${metadata.subscribers?.toLocaleString() || 'Not available'}\n` +
                        `📅 *Created:* ${creationDate}\n` +
                        `🔗 *Invite ID:* ${inviteId}\n\n` +
                        `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                        `> © Powered by Ademola King`;

        // Send with image if available
        if (metadata.preview) {
            await ademola.sendMessage(from, {
                image: { url: `https://pps.whatsapp.net${metadata.preview}` },
                caption: infoText,
                mentions: [sender]
            }, { 
                quoted: fakevCard 
            });
        } else {
            await reply(infoText);
        }

        console.log(`✅ Channel info fetched: ${metadata.id} by ${sender}`);

    } catch (error) {
        console.error('Newsletter command error:', error);
        
        if (error.message?.includes('newsletterMetadata')) {
            await reply('❌ This bot version does not support newsletter features. Please update your Baileys version.');
        } else if (error.message?.includes('not found')) {
            await reply('❌ Channel not found. The link may be expired or the channel was deleted.');
        } else {
            await reply('❌ An unexpected error occurred while fetching channel information.');
        }
    }
});