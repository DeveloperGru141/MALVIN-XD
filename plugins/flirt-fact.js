const { ademola, fakevCard } = require("../ademola");
const fetch = require('node-fetch');
const axios = require('axios');

// ========== FLIRT COMMAND ==========
ademola({
    pattern: "flirt",
    alias: ["pickup", "romance"],
    desc: "Get random flirty pickup lines",
    category: "fun",
    react: "😘",
    use: ".flirt",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/flirt?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const flirtMessage = json.result;

        await reply(flirtMessage);
        
    } catch (error) {
        console.error('Error in flirt command:', error);
        await reply('❌ Failed to get flirt message. Please try again later!');
    }
});

// ========== FACT COMMAND ==========
ademola({
    pattern: "fact",
    alias: ["randomfact", "didyouknow"],
    desc: "Get random interesting facts",
    category: "fun",
    react: "📚",
    use: ".fact",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data.text;
        await reply(`📚 *Random Fact:*\n\n${fact}`);
        
    } catch (error) {
        console.error('Error in fact command:', error);
        await reply('❌ Sorry, I could not fetch a fact right now.');
    }
});