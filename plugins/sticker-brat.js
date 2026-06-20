const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

ademola({
    pattern: "bratvid",
    alias: ["bratvideo", "brattext"],
    desc: "Create Brat style video text sticker",
    category: "media",
    react: "🚀",
    use: ".bratvid <text>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`🚀 *Brat Style Video Text*\n\nUsage: .bratvid <your text>\nExample: .bratvid Hello World`);
        }

        if (q.length > 250) {
            return await reply('❌ Character limit exceeded! Maximum 250 characters allowed.');
        }

        // Send processing reaction
        await ademola.sendMessage(from, { react: { text: '🚀', key: mek.key } });

        const words = q.split(" ");
        const tempDir = path.join(process.cwd(), 'cache');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const framePaths = [];
        
        // Generate frames for each word
        for (let i = 0; i < words.length; i++) {
            const currentText = words.slice(0, i + 1).join(" ");
            const res = await axios.get(
                `https://aqul-brat.hf.space/?text=${encodeURIComponent(currentText)}`, {
                    responseType: "arraybuffer"
                }
            ).catch((e) => e.response);

            if (!res || !res.data) {
                throw new Error('Failed to generate frame');
            }

            const framePath = path.join(tempDir, `frame${i}.mp4`);
            fs.writeFileSync(framePath, res.data);
            framePaths.push(framePath);
        }

        // Create file list for ffmpeg
        const fileListPath = path.join(tempDir, "filelist.txt");
        let fileListContent = "";

        for (let i = 0; i < framePaths.length; i++) {
            fileListContent += `file '${framePaths[i]}'\n`;
            fileListContent += `duration 0.5\n`;
        }

        fileListContent += `file '${framePaths[framePaths.length - 1]}'\n`;
        fileListContent += `duration 1.5\n`;

        fs.writeFileSync(fileListPath, fileListContent);
        const outputVideoPath = path.join(tempDir, "output.mp4");

        // Combine frames into video
        execSync(
            `ffmpeg -y -f concat -safe 0 -i "${fileListPath}" -vf "fps=30" -c:v libx264 -preset superfast -pix_fmt yuv420p "${outputVideoPath}"`
        );

        // Convert to webp sticker
        const outputStickerPath = path.join(tempDir, "output.webp");
        execSync(
            `ffmpeg -i "${outputVideoPath}" -vf "scale=512:512:flags=lanczos,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -loop 0 -preset picture -an -vsync 0 -r 15 "${outputStickerPath}"`
        );

        // Send as sticker
        const stickerBuffer = fs.readFileSync(outputStickerPath);
        await ademola.sendMessage(from, {
            sticker: stickerBuffer,
            caption: `🚀 *Brat Style Text*\n\n📝 *Text:* ${q}\n👤 *By:* @${sender.split('@')[0]}`,
            mentions: [sender]
        }, { 
            quoted: fakevCard 
        });

        // Cleanup temporary files
        framePaths.forEach((frame) => {
            if (fs.existsSync(frame)) fs.unlinkSync(frame);
        });
        if (fs.existsSync(fileListPath)) fs.unlinkSync(fileListPath);
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
        if (fs.existsSync(outputStickerPath)) fs.unlinkSync(outputStickerPath);
        
    } catch (error) {
        console.error('Bratvid Error:', error);
        
        if (error.message?.includes('ffmpeg')) {
            await reply('❌ FFmpeg not found! Please install ffmpeg on your system.');
        } else if (error.message?.includes('Character limit')) {
            await reply('❌ Text too long! Maximum 250 characters allowed.');
        } else {
            await reply('❌ Failed to create Brat style video. Please try again with shorter text.');
        }
    }
});