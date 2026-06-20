const { ademola, fakevCard } = require("../ademola");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const axios = require('axios');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Utility functions
function getRandomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
}

function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Download media function using Baileys
async function downloadMedia(mediaNode, mediaType) {
    const stream = await downloadContentFromMessage(mediaNode, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

// Cover image handling
const COVER_URL = 'https://i.ibb.co/VWt5CXzX/malvin-xd.jpg';
let coverImagePath = null;

async function ensureCoverImage() {
    if (!coverImagePath) {
        coverImagePath = path.join(os.tmpdir(), `cover_${getRandomString()}.jpg`);
        try {
            const response = await axios.get(COVER_URL, { responseType: 'arraybuffer' });
            await fs.promises.writeFile(coverImagePath, response.data);
        } catch (e) {
            console.error('Failed to download cover image:', e);
            throw new Error('Could not download cover image');
        }
    }
    return coverImagePath;
}

// ==================== TO VOICE NOTE ====================
ademola({
    pattern: "tovn",
    alias: ["tovoice", "toptt"],
    desc: "Convert video or audio to voice note",
    category: "media",
    react: "🎤",
    use: ".tovn (reply to video/audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quotedMsg || mek.message;

        if (!target) {
            return await reply('🎤 *Convert to Voice Note*\n\nPlease reply to a video or audio message to convert it to voice note.');
        }

        let mediaNode = null;
        let mediaType = null;
        
        if (target.videoMessage) {
            mediaNode = target.videoMessage;
            mediaType = "video";
        } else if (target.audioMessage) {
            mediaNode = target.audioMessage;
            mediaType = "audio";
        } else {
            return await reply('❌ Please reply to a video or audio message.');
        }

        await reply('🔄 Converting to voice note...');

        // Download media using Baileys function
        const buffer = await downloadMedia(mediaNode, mediaType);

        // Convert to voice note
        const inputPath = path.join(os.tmpdir(), `tovn_input_${getRandomString()}`);
        const outputPath = path.join(os.tmpdir(), `tovn_output_${getRandomString()}.ogg`);

        fs.writeFileSync(inputPath, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .on("error", reject)
                .on("end", resolve)
                .addOutputOptions([
                    "-c:a", "libopus",
                    "-b:a", "128k",
                    "-vn",
                    "-f", "ogg"
                ])
                .toFormat("ogg")
                .save(outputPath);
        });

        const voiceBuffer = fs.readFileSync(outputPath);
        
        // Cleanup
        try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        } catch {}

        await ademola.sendMessage(from, {
            audio: voiceBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            caption: `🎤 *Voice Note Created*\n\n📁 *Original:* ${mediaType.toUpperCase()}\n💾 *Size:* ${formatBytes(buffer.length)}\n👤 *By:* @${sender.split('@')[0]}\n> © Powered by Ademola King`,
            mentions: [sender]
        }, { quoted: fakevCard });

    } catch (error) {
        console.error('ToVN error:', error);
        await reply('❌ Failed to convert to voice note. Please try with a different file.');
    }
});

// ==================== TO AUDIO ====================
ademola({
    pattern: "toaudio",
    alias: ["toaudiofile"],
    desc: "Convert video or voice to audio file",
    category: "media",
    react: "🎵",
    use: ".toaudio (reply to video/voice)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quotedMsg || mek.message;

        if (!target) {
            return await reply('🎵 *Convert to Audio*\n\nPlease reply to a video or voice message to convert it to audio file.');
        }

        let mediaNode = null;
        let mediaType = null;
        
        if (target.videoMessage) {
            mediaNode = target.videoMessage;
            mediaType = "video";
        } else if (target.audioMessage) {
            mediaNode = target.audioMessage;
            mediaType = "audio";
        } else {
            return await reply('❌ Please reply to a video or audio message.');
        }

        await reply('🔄 Converting to audio...');

        // Download media using Baileys function
        const buffer = await downloadMedia(mediaNode, mediaType);

        // Convert to audio
        const inputPath = path.join(os.tmpdir(), `toaudio_input_${getRandomString()}`);
        const outputPath = path.join(os.tmpdir(), `toaudio_output_${getRandomString()}.mp3`);

        fs.writeFileSync(inputPath, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .on("error", reject)
                .on("end", resolve)
                .addOutputOptions([
                    "-c:a", "libmp3lame",
                    "-b:a", "192k",
                    "-vn",
                    "-f", "mp3"
                ])
                .toFormat("mp3")
                .save(outputPath);
        });

        const audioBuffer = fs.readFileSync(outputPath);
        
        // Cleanup
        try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        } catch {}

        await ademola.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            caption: `🎵 *Audio File Created*\n\n📁 *Original:* ${mediaType.toUpperCase()}\n💾 *Size:* ${formatBytes(buffer.length)}\n👤 *By:* @${sender.split('@')[0]}\n> © Powered by Ademola King`,
            mentions: [sender]
        }, { quoted: fakevCard });

    } catch (error) {
        console.error('ToAudio error:', error);
        await reply('❌ Failed to convert to audio. Please try with a different file.');
    }
});

// ==================== TO VIDEO ====================
ademola({
    pattern: "tovideo",
    alias: ["audiovideo", "tovid"],
    desc: "Convert audio to video with cover image",
    category: "media",
    react: "🎬",
    use: ".tovideo (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg || !quotedMsg.audioMessage) {
            return await reply('🎬 *Audio to Video*\n\nPlease reply to an audio message to convert it to video with cover image.');
        }

        await reply('🔄 Downloading cover image and preparing video...');

        const imagePath = await ensureCoverImage();
        
        // Download audio using Baileys function
        const buffer = await downloadMedia(quotedMsg.audioMessage, "audio");

        const audioPath = path.join(os.tmpdir(), `audio_${getRandomString()}.mp3`);
        const outputPath = path.join(os.tmpdir(), `video_${getRandomString()}.mp4`);

        fs.writeFileSync(audioPath, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(imagePath)
                .input(audioPath)
                .outputOptions([
                    '-c:v', 'libx264',
                    '-preset', 'fast',
                    '-crf', '22',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    '-vf', 'scale=640:480:force_original_aspect_ratio=decrease'
                ])
                .output(outputPath)
                .on("error", reject)
                .on("end", resolve)
                .run();
        });

        const videoBuffer = fs.readFileSync(outputPath);
        
        // Cleanup
        try {
            fs.unlinkSync(audioPath);
            fs.unlinkSync(outputPath);
        } catch {}

        await ademola.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: `🎬 *Video Created from Audio*\n\n💾 *Size:* ${formatBytes(videoBuffer.length)}\n👤 *By:* @${sender.split('@')[0]}\n> © Powered by Ademola King`,
            mentions: [sender]
        }, { quoted: fakevCard });

    } catch (error) {
        console.error('ToVideo error:', error);
        await reply('❌ Failed to convert audio to video. Please try with a different audio file.');
    }
});

// ==================== TO MP3 ====================
ademola({
    pattern: "tomp3",
    alias: ["tomp3file", "convertmp3"],
    desc: "Convert media to MP3 audio",
    category: "media",
    react: "🎶",
    use: ".tomp3 (reply to video/audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quotedMsg || mek.message;

        if (!target) {
            return await reply('🎶 *Convert to MP3*\n\nPlease reply to a video or audio message to convert it to MP3.');
        }

        let mediaNode = null;
        let mediaType = null;
        
        if (target.videoMessage) {
            mediaNode = target.videoMessage;
            mediaType = "video";
        } else if (target.audioMessage) {
            mediaNode = target.audioMessage;
            mediaType = "audio";
        } else {
            return await reply('❌ Please reply to a video or audio message.');
        }

        await reply('🔄 Converting to MP3...');

        // Download media using Baileys function
        const buffer = await downloadMedia(mediaNode, mediaType);

        const inputPath = path.join(os.tmpdir(), `tomp3_input_${getRandomString()}`);
        const outputPath = path.join(os.tmpdir(), `tomp3_output_${getRandomString()}.mp3`);

        fs.writeFileSync(inputPath, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .on("error", reject)
                .on("end", resolve)
                .audioCodec('libmp3lame')
                .audioBitrate('192k')
                .toFormat('mp3')
                .save(outputPath);
        });

        const mp3Buffer = fs.readFileSync(outputPath);
        
        // Cleanup
        try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        } catch {}

        await ademola.sendMessage(from, {
            document: mp3Buffer,
            fileName: `converted_audio_${Date.now()}.mp3`,
            mimetype: 'audio/mpeg',
            caption: `🎶 *MP3 File Created*\n\n💾 *Size:* ${formatBytes(mp3Buffer.length)}\n👤 *By:* @${sender.split('@')[0]}\n> © Powered by Ademola King`,
            mentions: [sender]
        }, { quoted: fakevCard });

    } catch (error) {
        console.error('ToMP3 error:', error);
        await reply('❌ Failed to convert to MP3. Please try with a different file.');
    }
});