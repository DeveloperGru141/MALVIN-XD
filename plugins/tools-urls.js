const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

ademola({
    pattern: "abellashort",
    alias: ['shortabella', 'abellaurl', 'urlshort'],
    desc: "Shorten URLs using Abella shortener service",
    category: "tools",
    react: "🔗",
    use: ".abellashort <url>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return await reply(`🔗 *URL Shortener*\n\nUsage: .abellashort <url>\nExample: .abellashort https://google.com`);
        }

        // Validate URL format
        const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        if (!urlRegex.test(q)) {
            return await reply('❌ Please provide a valid URL starting with http:// or https://');
        }

        // Send processing message
        await reply('🔄 Processing your URL...');

        const { data } = await axios.post(
            'https://short.abella.icu/api/shorten',
            { url: q },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
                    'Referer': 'https://short.abella.icu/'
                },
                timeout: 10000
            }
        );

        if (!data.shortUrl) {
            return await reply('❌ Sorry, the URL shortener service returned an invalid response.');
        }

        await reply(`🔗 *URL Shortened Successfully*\n\n📎 *Original URL:*\n${q}\n\n🔗 *Shortened URL:*\n${data.shortUrl}\n\n_Shortened using Abella service_`);

    } catch (error) {
        console.error('Abella Short error:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. The URL shortener service is taking too long to respond.');
        } else if (error.response?.status === 400) {
            await reply('❌ Invalid URL provided. Please check the URL format and try again.');
        } else if (error.response?.status === 429) {
            await reply('❌ Rate limit exceeded. Please wait a few minutes before shortening another URL.');
        } else if (error.response?.status >= 500) {
            await reply('❌ URL shortener service is currently unavailable. Please try again later.');
        } else {
            await reply('❌ Failed to shorten URL. Please check the URL and try again.');
        }
    }
});