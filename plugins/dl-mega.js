const { ademola, fakevCard } = require("../ademola");
const { File } = require("megajs");
const mime = require("mime-types");
const { bytesToSize } = require('../lib/myfunc');

// ==================== MEGA DOWNLOADER ====================
ademola({
    pattern: "mega",
    alias: ["megadl", "megadownload"],
    desc: "Download files from Mega.nz",
    category: "downloader",
    react: "📥",
    use: ".mega <mega-url>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📥 *Mega Downloader*\n\nUsage: .mega <mega-url>\nExample: .mega https://mega.nz/file/XXXX#KEY`);
        }

        if (!q.includes('mega.nz')) {
            return await reply('❌ Please provide a valid Mega.nz URL.');
        }

        await reply('🔄 Processing Mega.nz link...');

        const file = File.fromURL(q);
        await file.loadAttributes();

        // Check if it's a folder
        if (file.directory) {
            return await reply('❌ Folders are not supported. Please provide a direct file link.');
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const mimeType = mime.lookup(fileExtension) || 'application/octet-stream';
        const fileSize = bytesToSize(file.size);

        // Show file info
        const fileInfo = `📥 *File Information*\n\n` +
                        `📄 *Name:* ${file.name}\n` +
                        `💾 *Size:* ${fileSize}\n` +
                        `📁 *Type:* ${mimeType}\n\n` +
                        `🔄 Downloading...`;

        await reply(fileInfo);

        // Validate file size (1.8 GB limit)
        if (file.size >= 1800000000) {
            return await reply('❌ File is too large (max 1.8 GB). Please download manually from the Mega website.');
        }

        // Download file
        const buffer = await file.downloadBuffer();

        await ademola.sendMessage(from, {
            document: buffer,
            fileName: file.name,
            mimetype: mimeType,
            caption: `📥 *File Downloaded from Mega*\n\n` +
                    `📄 *Name:* ${file.name}\n` +
                    `💾 *Size:* ${fileSize}\n` +
                    `👤 *Downloaded by:* @${sender.split('@')[0]}\n` +
                    `> © Powered by Ademola King`,
            mentions: [sender]
        }, { 
            quoted: fakevCard 
        });

    } catch (error) {
        console.error('Mega download error:', error);
        
        if (error.message?.includes('invalid')) {
            await reply('❌ Invalid Mega.nz URL. Please check the link and try again.');
        } else if (error.message?.includes('not found')) {
            await reply('❌ File not found. The link may be expired or invalid.');
        } else if (error.message?.includes('decryption key')) {
            await reply('❌ Invalid decryption key. Please check the Mega URL.');
        } else {
            await reply('❌ Failed to download file. The link may be invalid or the file is no longer available.');
        }
    }
});