const { ademola, fakevCard } = require("../ademola");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');

ademola({
    pattern: "sticker",
    alias: ["s", "stickerize"],
    desc: "Convert media to sticker (simple version)",
    category: "media",
    react: "🤖",
    use: ".sticker (reply to image/video)",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return await reply('Please reply to an image or video!');
        }

        const type = Object.keys(quoted)[0];
        if (!['imageMessage', 'videoMessage'].includes(type)) {
            return await reply('Please reply to an image or video!');
        }

        const stream = await downloadContentFromMessage(quoted[type], type.split('Message')[0]);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const tempInput = `./temp/temp_${Date.now()}.${type === 'imageMessage' ? 'jpg' : 'mp4'}`;
        const tempOutput = `./temp/sticker_${Date.now()}.webp`;

        // Create temp directory if it doesn't exist
        if (!fs.existsSync('./temp')) {
            fs.mkdirSync('./temp', { recursive: true });
        }

        fs.writeFileSync(tempInput, buffer);

        // Convert to WebP using ffmpeg
        await new Promise((resolve, reject) => {
            const cmd = type === 'imageMessage' 
                ? `ffmpeg -i "${tempInput}" -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease" "${tempOutput}"`
                : `ffmpeg -i "${tempInput}" -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease" -c:v libwebp -preset default -loop 0 -vsync 0 -t 6 "${tempOutput}"`;
            
            exec(cmd, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        await ademola.sendMessage(from, { 
            sticker: fs.readFileSync(tempOutput) 
        }, {
            quoted: fakevCard
        });

        // Cleanup
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);

    } catch (error) {
        console.error('Error in sticker command:', error);
        await reply('❌ Failed to create sticker!');
    }
});