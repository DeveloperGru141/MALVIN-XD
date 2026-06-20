const { ademola, fakevCard } = require("../ademola");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

ademola({
    pattern: "save",
    alias: ["savestatus", "statusave", "downloadstatus"],
    desc: "Save status media (images/videos)",
    category: "utility",
    react: "💾",
    use: ".save (reply to status)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg) {
            return await reply('💾 *Save Status*\n\nPlease reply to a WhatsApp status to save it.');
        }

        // Check if it's from status broadcast
        const isStatus = mek.message?.extendedTextMessage?.contextInfo?.remoteJid === 'status@broadcast';
        
        if (!isStatus) {
            return await reply('❌ Please reply to a WhatsApp status (image/video) from status broadcast.');
        }

        // Determine media type from quoted message
        let mediaNode = null;
        let mediaType = null;
        
        if (quotedMsg.imageMessage) {
            mediaNode = quotedMsg.imageMessage;
            mediaType = "image";
        } else if (quotedMsg.videoMessage) {
            mediaNode = quotedMsg.videoMessage;
            mediaType = "video";
        } else {
            return await reply('❌ Only image and video statuses are supported.');
        }

        // Send processing message
        await reply('🔄 Saving status...');

        // Download media buffer
        let buffer;
        try {
            const stream = await downloadContentFromMessage(mediaNode, mediaType);
            let _buf = Buffer.from([]);
            for await (const chunk of stream) {
                _buf = Buffer.concat([_buf, chunk]);
            }
            buffer = _buf;
        } catch (error) {
            console.error("Download error:", error);
            return await reply('❌ Failed to download status media. The status may have expired.');
        }

        if (!buffer || buffer.length === 0) {
            return await reply('❌ Downloaded media is empty or corrupted.');
        }

        // Send the saved status media
        if (mediaType === "image") {
            await ademola.sendMessage(from, {
                image: buffer,
                caption: `💾 *Status Saved*\n\n🖼️ Image saved from status\n👤 *Saved by:* @${sender.split('@')[0]}\n> © Powered by Ademola King`,
                mentions: [sender]
            }, { quoted: fakevCard });
        } else if (mediaType === "video") {
            await ademola.sendMessage(from, {
                video: buffer,
                caption: `💾 *Status Saved*\n\n🎥 Video saved from status\n👤 *Saved by:* @${sender.split('@')[0]}\n> © Powered by Ademola King`,
                mentions: [sender]
            }, { quoted: fakevCard });
        }

        await reply(`✅ *Status ${mediaType.toUpperCase()} Saved*\n\n👤 *Saved by:* @${sender.split('@')[0]}\n> © Powered by Ademola King`);

        console.log(`✅ Status ${mediaType} saved by ${sender}`);

    } catch (error) {
        console.error("Save Error:", error);
        
        if (error.message?.includes('download')) {
            await reply('❌ Failed to download status. The status may have expired or been deleted.');
        } else if (error.message?.includes('not found')) {
            await reply('❌ Status not found. It may have expired.');
        } else {
            await reply(`❌ Error saving status: ${error.message}`);
        }
    }
});