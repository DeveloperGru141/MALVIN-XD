const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

ademola({
    pattern: "creart",
    alias: ["createart", "art", "aiart"],
    desc: "Generate AI images using Creart AI",
    category: "ai",
    react: "🎨",
    use: ".creart <your prompt>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return reply('Please provide a prompt for image generation.\n\nExample: .creart a beautiful sunset over mountains');
        }

        await reply('_🎨 Generating your image with Creart AI... Please wait._');

        const response = await axios.get(`https://ademola-api.vercel.app/ai/creart/image?prompt=${encodeURIComponent(q)}`, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        const imageBuffer = Buffer.from(response.data);

        await ademola.sendMessage(from, {
            image: imageBuffer,
            caption: `🎨 *Creart AI Generated Image*\n\n📝 *Prompt:* ${q}\n👤 *Requested by:* @${sender.split('@')[0]}`,
            mentions: [sender]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in creart command:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. Image generation is taking too long. Please try again with a simpler prompt.');
        } else if (error.response?.status === 429) {
            await reply('❌ Rate limit exceeded. Please wait a few minutes before generating another image.');
        } else {
            await reply('❌ Failed to generate image. Please try again later.');
        }
    }
});