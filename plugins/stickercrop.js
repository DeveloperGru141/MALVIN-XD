const { ademola, fakevCard } = require("../ademola");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const webp = require('node-webpmux');
const crypto = require('crypto');

ademola({
    pattern: "crop",
    alias: ["stickercrop", "cropsticker"],
    desc: "Crop media to square sticker",
    category: "media",
    react: "✂️",
    use: ".crop (reply to image/video/sticker)",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        let targetMessage = mek;

        // If the message is a reply, use the quoted message
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedInfo = mek.message.extendedTextMessage.contextInfo;
            targetMessage = {
                key: {
                    remoteJid: from,
                    id: quotedInfo.stanzaId,
                    participant: quotedInfo.participant
                },
                message: quotedInfo.quotedMessage
            };
        }

        const mediaMessage = targetMessage.message?.imageMessage || targetMessage.message?.videoMessage || targetMessage.message?.documentMessage || targetMessage.message?.stickerMessage;

        if (!mediaMessage) {
            return await reply('Please reply to an image/video/sticker with .crop, or send an image/video/sticker with .crop as the caption.');
        }

        const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, { 
            logger: undefined, 
            reuploadRequest: ademola.updateMediaMessage 
        });

        if (!mediaBuffer) {
            return await reply('Failed to download media. Please try again.');
        }

        // Create temp directory
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Generate temp file paths
        const tempInput = path.join(tmpDir, `temp_${Date.now()}`);
        const tempOutput = path.join(tmpDir, `crop_${Date.now()}.webp`);

        // Write media to temp file
        fs.writeFileSync(tempInput, mediaBuffer);

        // Check if media is animated
        const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                          mediaMessage.mimetype?.includes('video') || 
                          mediaMessage.seconds > 0;

        // Get file size for compression level
        const fileSizeKB = mediaBuffer.length / 1024;
        const isLargeFile = fileSizeKB > 5000;

        // Convert to WebP with crop to square
        let ffmpegCommand;
        
        if (isAnimated) {
            if (isLargeFile) {
                ffmpegCommand = `ffmpeg -i "${tempInput}" -t 2 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=8" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput}"`;
            } else {
                ffmpegCommand = `ffmpeg -i "${tempInput}" -t 3 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=12" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 50 -compression_level 6 -b:v 150k -max_muxing_queue_size 1024 "${tempOutput}"`;
            }
        } else {
            ffmpegCommand = `ffmpeg -i "${tempInput}" -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,format=rgba" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;
        }

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('FFmpeg error:', error);
                    console.error('FFmpeg stderr:', stderr);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        // Check if output file exists
        if (!fs.existsSync(tempOutput)) {
            throw new Error('FFmpeg failed to create output file');
        }

        const outputStats = fs.statSync(tempOutput);
        if (outputStats.size === 0) {
            throw new Error('FFmpeg created empty output file');
        }

        // Read the WebP file
        let webpBuffer = fs.readFileSync(tempOutput);
        
        // Check final file size
        const finalSizeKB = webpBuffer.length / 1024;
        console.log(`Final sticker size: ${Math.round(finalSizeKB)} KB`);
        
        if (finalSizeKB > 1000) {
            console.log(`⚠️ Warning: Sticker size (${Math.round(finalSizeKB)} KB) exceeds recommended limit`);
        }

        // Add metadata using webpmux
        const img = new webp.Image();
        await img.load(webpBuffer);

        // Create metadata
        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': settings.packname || 'Ademola XD',
            'emojis': ['✂️']
        };

        // Create exif buffer
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        // Set the exif data
        img.exif = exif;

        // Get the final buffer with metadata
        const finalBuffer = await img.save(null);

        // Send the sticker
        await ademola.sendMessage(from, { 
            sticker: finalBuffer
        }, {
            quoted: fakevCard
        });

        // Cleanup temp files
        try {
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }

    } catch (error) {
        console.error('Error in crop command:', error);
        await reply('❌ Failed to crop sticker! Try with a different image or video.');
    }
});

// Helper function for buffer conversion
async function stickercropFromBuffer(inputBuffer, isAnimated) {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const tempInput = path.join(tmpDir, `cropbuf_${Date.now()}`);
    const tempOutput = path.join(tmpDir, `cropbuf_out_${Date.now()}.webp`);

    fs.writeFileSync(tempInput, inputBuffer);

    const fileSizeKB = inputBuffer.length / 1024;
    const isLargeFile = fileSizeKB > 5000;

    let ffmpegCommand;
    if (isAnimated) {
        if (isLargeFile) {
            ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 2 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=8" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput}"`;
        } else {
            ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 3 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=12" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 50 -compression_level 6 -b:v 150k -max_muxing_queue_size 1024 "${tempOutput}"`;
        }
    } else {
        ffmpegCommand = `ffmpeg -y -i "${tempInput}" -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,format=rgba" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;
    }

    await new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error) => {
            if (error) return reject(error);
            resolve();
        });
    });

    const webpBuffer = fs.readFileSync(tempOutput);

    const img = new webp.Image();
    await img.load(webpBuffer);
    const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': settings.packname || 'Ademola XD',
        'emojis': ['✂️']
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;
    const finalBuffer = await img.save(null);

    try {
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);
    } catch {}

    return finalBuffer;
}

module.exports.stickercropFromBuffer = stickercropFromBuffer;