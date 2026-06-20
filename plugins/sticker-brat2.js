const { ademola, fakevCard } = require("../ademola");
const fetch = require('node-fetch');
const { sticker5 } = require('../lib/sticker');
const axios = require('axios');

ademola({
    pattern: "brat",
    alias: ["banime", "bratanime"],
    desc: "Create Brat Anime style text stickers",
    category: "sticker",
    react: "🎨",
    use: ".brat <your text>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`🎨 *Brat Anime Sticker*\n\nUsage: .brat <your text>\n\nExample: .brat aku ganteng`);
        }

        // Send processing message
        await reply("🔄 Creating Brat Anime sticker...");

        const apiUrl = `https://www.veloria.my.id/imagecreator/bratanime?text=${encodeURIComponent(q)}`;

        // Download the image
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        if (!response.data) {
            throw new Error('No image received from API');
        }

        const buffer = Buffer.from(response.data);

        // Send as sticker
        await ademola.sendMessage(from, {
            sticker: buffer,
            caption: `🎨 *Brat Anime Sticker*\n\n📝 *Text:* ${q}\n👤 *By:* @${sender.split('@')[0]}`,
            mentions: [sender]
        }, { 
            quoted: fakevCard 
        });

        console.log(`✅ Brat Anime sticker created: "${q}" by ${sender}`);

    } catch (error) {
        console.error('Brat Anime Error:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. The API is taking too long to respond. Please try again.');
        } else if (error.message?.includes('No image')) {
            await reply('❌ API service is currently unavailable. Please try again later.');
        } else if (error.response?.status === 404) {
            await reply('❌ Brat Anime service not found. The API endpoint may have changed.');
        } else {
            await reply('❌ Failed to create Brat Anime sticker. Please try again with different text.');
        }
    }
});

ademola({
    pattern: "brat2",
    alias: ['bratsticker2', 'brattext2', 'brat2'],
    desc: "Create Brat style text sticker",
    category: "maker",
    react: "😈",
    use: ".brat <text>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`😈 *Brat Style Sticker*\n\nUsage: .brat <your text>\nExample: .brat Hello World`);
        }

        // Send processing message
        await reply('😈 Creating your Brat sticker...');

        const url = `https://api.privatezia.biz.id/api/generator/brat?text=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error(`API error! status: ${res.status}`);
        const buffer = await res.buffer();

        const stiker = await sticker5(buffer, null, 'ademola xd', 'ademola');

        if (stiker) {
            await ademola.sendMessage(from, {
                sticker: stiker,
                caption: `😈 *Brat Style Sticker*\n\n📝 *Text:* ${q}\n👤 *By:* @${sender.split('@')[0]}`,
                mentions: [sender]
            }, { 
                quoted: fakevCard 
            });
        } else {
            throw new Error('Failed to create sticker');
        }

    } catch (error) {
        console.error('Brat sticker error:', error);
        
        if (error.message?.includes('API error')) {
            await reply('❌ API service is currently unavailable. Please try again later.');
        } else if (error.message?.includes('Failed to create sticker')) {
            await reply('❌ Failed to process sticker. The text might be too long.');
        } else {
            await reply('❌ Failed to create Brat sticker. Please try again.');
        }
    }
});