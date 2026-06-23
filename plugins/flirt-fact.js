const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

const flirts = [
    "Are you a magician? Because whenever I look at you, everyone else disappears ✨",
    "Do you have a map? I keep getting lost in your eyes 🗺️",
    "Is your name Wi-Fi? Because I'm feeling a connection 📶",
    "Are you a time traveler? Because I see you in my future ⏰",
    "Do you have a Band-Aid? Because I just scraped my knee falling for you 🩹",
    "Is your dad a baker? Because you're a cutie pie 🥧",
    "Are you made of copper and tellurium? Because you're Cu-Te 💕",
    "Do you believe in love at first sight, or should I walk by again? 👀",
    "Are you a parking ticket? Because you've got FINE written all over you 🎫",
    "Is your name Google? Because you have everything I'm searching for 🔍",
    "Are you a camera? Every time I look at you, I smile 📸",
    "Do you like Star Wars? Because Yoda one for me! 🌟",
    "Are you a cat? Because I'm feline a connection 🐱",
    "Is your name Ariel? Because we were mermaid for each other 🧜‍♀️",
    "Are you made of sugar? Because you're so sweet 🍬",
    "Do you have a sunburn? Because you're hot! ☀️",
    "Are you a beaver? Because daaaaam! 🦫",
    "Is your name Chapstick? Because you're da balm 💄",
    "Are you a loan? Because you have my interest 💰",
    "Do you like raisins? How about a date? 🍇",
];

const factsEndpoint = 'https://uselessfacts.jsph.pl/random.json?language=en';

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
        const flirt = flirts[Math.floor(Math.random() * flirts.length)];
        await reply(`😘 *Flirt:*\n\n${flirt}`);
    } catch (error) {
        console.error('Error in flirt command:', error);
        await reply('❌ Failed to get flirt message. Please try again later!');
    }
});

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
        const response = await axios.get(factsEndpoint);
        const fact = response.data.text;
        await reply(`📚 *Random Fact:*\n\n${fact}`);
    } catch (error) {
        console.error('Error in fact command:', error);
        await reply('❌ Sorry, I could not fetch a fact right now.');
    }
});
