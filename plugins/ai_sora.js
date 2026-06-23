//---------------------------------------------
//           ADEMOLA-XD AI VIDEO GENERATOR
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');

ademola({
    pattern: "sora",
    alias: ["soraai", "txt2video", "genvideo"],
    desc: "Generate AI videos using Pollinations AI",
    category: "ai",
    react: "🎬",
    use: ".sora <prompt>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const prompt = q;

        if (!prompt) {
            return await reply(`🎬 *AI VIDEO GENERATOR*\n\nUsage: .sora <prompt>\nExample: .sora cat dancing on a beach`);
        }

        await reply(`⚡ Generating video from prompt...`);

        const videoUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=720&height=720&nologo=true`;

        await ademola.sendMessage(from, {
            image: { url: videoUrl },
            caption: `🎬 *AI Generated*\n\n📝 *Prompt:* ${prompt}\n\n_Note: AI video generation is limited. Using image generation as fallback._`
        }, { quoted: fakevCard });

        await reply(`✅ Generated successfully!`);

    } catch (error) {
        console.error('❌ Sora error:', error);
        await reply('❌ Failed to generate. Try again.');
    }
});
