//---------------------------------------------
//           ADEMOLA-XD SORA AI VIDEO
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');

ademola({
    pattern: "sora",
    alias: ["soraai", "txt2video"],
    desc: "Generate AI videos using Sora",
    category: "ai",
    react: "🎬",
    use: ".sora <prompt>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const prompt = q;

        if (!prompt) {
            return await reply(`🎬 *SORA AI VIDEO*\n\nUsage: .sora <prompt>\nExample: .sora cat dancing`);
        }

        await reply(`⚡ Generating video...`);

        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl, { timeout: 60000 });

        const videoUrl = data?.videoUrl || data?.result;

        if (!videoUrl) {
            return await reply('❌ No video generated. Try different prompt.');
        }

        await ademola.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `🎬 ${prompt}`
        }, { quoted: fakevCard });

        await reply(`✅ Video generated!`);

    } catch (error) {
        await reply('❌ Failed to generate video. Try again.');
    }
});