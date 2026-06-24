const { ademola, fakevCard } = require("../ademola");
const fetch = require('node-fetch');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

ademola({
    pattern: "emojimix",
    alias: ["mixemoji", "emojicombine"],
    desc: "Mix two emojis together",
    category: "fun",
    react: "🎴",
    use: ".emojimix 😎+🥰",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!text) {
            return await reply('🎴 Example: .emojimix 😎+🥰');
        }

        if (!text.includes('+')) {
            return await reply('✳️ Separate the emojis with a *+* sign\n\n📌 Example: \n.emojimix 😎+🥰');
        }

        let [emoji1, emoji2] = text.split('+').map(e => e.trim());

        const tenorKey = process.env.TENOR_API_KEY;
        if (!tenorKey) return await reply('❌ TENOR_API_KEY not configured in .env');
        const url = `https://tenor.googleapis.com/v2/featured?key=${tenorKey}&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return await reply('❌ These emojis cannot be mixed! Try different ones.');
        }

        // Get the first result URL
        const imageUrl = data.results[0].url;

        // Create temp directory if it doesn't exist
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Generate random filenames with escaped paths
        const tempFile = path.join(tmpDir, `temp_${Date.now()}.png`).replace(/\\/g, '/');
        const outputFile = path.join(tmpDir, `sticker_${Date.now()}.webp`).replace(/\\/g, '/');

        // Download and save the image
        const imageResponse = await fetch(imageUrl);
        const buffer = await imageResponse.buffer();
        fs.writeFileSync(tempFile, buffer);

        // Convert to WebP using ffmpeg with proper path escaping
        const ffmpegCommand = `ffmpeg -i "${tempFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" "${outputFile}"`;
        
        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) {
                    console.error('FFmpeg error:', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        // Check if output file exists
        if (!fs.existsSync(outputFile)) {
            throw new Error('Failed to create sticker file');
        }

        // Read the WebP file
        const stickerBuffer = fs.readFileSync(outputFile);

        // Send the sticker
        await ademola.sendMessage(from, { 
            sticker: stickerBuffer 
        }, {
            quoted: fakevCard
        });

        // Cleanup temp files
        try {
            fs.unlinkSync(tempFile);
            fs.unlinkSync(outputFile);
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }

    } catch (error) {
        console.error('Error in emojimix command:', error);
        await reply('❌ Failed to mix emojis! Make sure you\'re using valid emojis.\n\nExample: .emojimix 😎+🥰');
    }
});