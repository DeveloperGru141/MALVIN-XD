const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
const settings = require('../settings');

ademola({
    pattern: "gif",
    alias: ["giphy", "searchgif"],
    desc: "Search and send GIFs",
    category: "media",
    react: "🎬",
    use: ".gif <search term>",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!text) {
            return await reply('🎬 Please provide a search term for the GIF!\n\nExample: .gif hello');
        }

        // Use Giphy API key from settings or fallback
        const apiKey = settings.giphyApiKey || 'GIPHY_API_KEY'; // Replace with actual API key

        const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
            params: {
                api_key: apiKey,
                q: text,
                limit: 5, // Get 5 results to ensure we find a good one
                rating: 'g', // Family-friendly
                lang: 'en'
            }
        });

        if (!response.data.data || response.data.data.length === 0) {
            return await reply(`❌ No GIFs found for "${text}"\n\nTry a different search term!`);
        }

        // Get a random GIF from the results
        const randomIndex = Math.floor(Math.random() * response.data.data.length);
        const gifData = response.data.data[randomIndex];
        const gifUrl = gifData?.images?.original?.url || 
                      gifData?.images?.downsized_medium?.url;

        if (gifUrl) {
            await ademola.sendMessage(from, { 
                video: { url: gifUrl }, 
                caption: `🎬 *GIF for:* ${text}`,
                gifPlayback: true
            }, {
                quoted: fakevCard
            });
        } else {
            await reply('❌ Failed to load GIF. Please try again!');
        }
        
    } catch (error) {
        console.error('Error in gif command:', error);
        
        if (error.response?.status === 403) {
            await reply('❌ GIF API limit reached or invalid API key. Please try again later.');
        } else if (error.response?.status === 404) {
            await reply(`❌ No GIFs found for "${text}"\n\nTry a different search term!`);
        } else {
            await reply('❌ Failed to fetch GIF. Please try again later.');
        }
    }
});