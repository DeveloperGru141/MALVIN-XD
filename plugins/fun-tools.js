const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
const fetch = require('node-fetch');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Utility function for image effects
async function getQuotedOrOwnImageUrl(ademola, mek) {
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    if (mek.message?.imageMessage) {
        const stream = await downloadContentFromMessage(mek.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    let targetJid;
    const ctx = mek.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length > 0) {
        targetJid = ctx.mentionedJid[0];
    } else if (ctx?.participant) {
        targetJid = ctx.participant;
    } else {
        targetJid = mek.key.participant || mek.key.remoteJid;
    }

    try {
        const url = await ademola.profilePictureUrl(targetJid, 'image');
        return url;
    } catch {
        return 'https://i.imgur.com/2wzGhpF.png';
    }
}

// ========== SIMP CARD COMMAND ==========
ademola({
    pattern: "simp",
    alias: ["simpcard"],
    desc: "Generate simp card for user",
    category: "fun",
    react: "😍",
    use: ".simp [@user or reply]",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        let targetJid;
        const ctx = mek.message?.extendedTextMessage?.contextInfo;
        if (ctx?.mentionedJid?.length > 0) {
            targetJid = ctx.mentionedJid[0];
        } else if (ctx?.participant) {
            targetJid = ctx.participant;
        } else {
            targetJid = sender;
        }

        let avatarUrl;
        try {
            avatarUrl = await ademola.profilePictureUrl(targetJid, 'image');
        } catch {
            avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
        }

        const apiUrl = `https://some-random-api.com/canvas/misc/simpcard?avatar=${encodeURIComponent(avatarUrl)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const imageBuffer = await response.buffer();
        await ademola.sendMessage(from, {
            image: imageBuffer,
            caption: '*your religion is simping*'
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in simp command:', error);
        await reply('❌ Failed to generate simp card. Please try again.');
    }
});

// ========== STICKER TO IMAGE COMMAND ==========
ademola({
    pattern: "simage",
    alias: ["stickertoimage", "toimage"],
    desc: "Convert sticker to image",
    category: "media",
    react: "🖼️",
    use: ".simage (reply to sticker)",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) {
            return await reply('Please reply to a sticker!');
        }

        const tempDir = './temp';
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const stickerFilePath = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const outputImagePath = path.join(tempDir, `image_${Date.now()}.png`);

        const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await fs.promises.writeFile(stickerFilePath, buffer);
        await sharp(stickerFilePath).png().toFile(outputImagePath);

        const imageBuffer = await fs.promises.readFile(outputImagePath);
        await ademola.sendMessage(from, { 
            image: imageBuffer,
            caption: '✨ Here\'s your image!' 
        }, {
            quoted: fakevCard
        });

        // Cleanup
        setTimeout(() => {
            try {
                fs.unlinkSync(stickerFilePath);
                fs.unlinkSync(outputImagePath);
            } catch (_) {}
        }, 30000);

    } catch (error) {
        console.error('Error in simage command:', error);
        await reply('❌ Failed to convert sticker to image!');
    }
});

// ========== SHIP COMMAND ==========
ademola({
    pattern: "ship",
    alias: ["couple", "match"],
    desc: "Ship two random group members",
    category: "fun",
    react: "💖",
    use: ".ship",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command only works in groups!');
        }

        const groupMetadata = await ademola.groupMetadata(from);
        const participants = groupMetadata.participants.map(v => v.id);
        
        if (participants.length < 2) {
            return await reply('❌ Need at least 2 members to ship!');
        }

        let firstUser, secondUser;
        firstUser = participants[Math.floor(Math.random() * participants.length)];
        
        do {
            secondUser = participants[Math.floor(Math.random() * participants.length)];
        } while (secondUser === firstUser);

        await ademola.sendMessage(from, {
            text: `@${firstUser.split('@')[0]} ❤️ @${secondUser.split('@')[0]}\nCongratulations 💖🍻`,
            mentions: [firstUser, secondUser]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in ship command:', error);
        await reply('❌ Failed to ship members!');
    }
});

const shayaris = [
    "Tumhari ek muskaan ke liye hum kitna kuch kar guzarte hain,\nTumse door rehkar bhi hum tumse hi pyaar karte hain 🪄",
    "Mohabbat mein andha hona koi bura nahi,\nAndha to wo hai jo tumhe dekhkar bhi na pahchane 💕",
    "Dil ki baat labon tak aati nahi,\nMohabbat bhi humse kehti jaati nahi,\nTum itne kareeb ho ke,\nDoori ka ehsaas bhi aata nahi 💫",
    "Har ek cheez mein tera hi nasha hai,\nHar subah teri hi yaadon ka jamana hai,\nTere bina adhoori si hai ye zindagi,\nTu mil gaya to lagta hai har gham bhulana hai ✨",
    "Tumhari aankhon mein basa hai ek jahaan,\nTumhari baaton mein chhupa hai ek nishaan,\nTumse milke lagta hai jaise,\nMila ho mujhe koi khuda ka imtihaan 🌟",
    "Sheeshe ki tarah hai dil mera,\nTodne se pehle soch lena,\nEk baar tootne ke baad,\nJodne mein puri zindagi lag jaati hai 💔",
    "Chand ko dekha to tera chehra yaad aaya,\nPhool ko dekha to tera mehak yaad aayi,\nHar khubsurat cheez mein tu hai,\nPhir kyun teri yaadon ne raaton ko neend uda di 🌙",
    "Woh log mohabbat ko ibadat kehte hain,\nHum to bas teri hi baat karte hain,\nTujhe paa liya to duniya mil gayi,\nTujhe khone se darte hain 🥺",
    "Dard ko humne bhi mohabbat ka naam diya,\nTumne to bas ek baar dekha humein,\nHumne to har baar tumhe yaad kiya ❤️",
    "Zindagi me kuch log milte hain khaas,\nJaise tum mile ho mere paas,\nTumhari hasi ki kimat kya bataun,\nJaise mil gaya ho khazana mere haath ✨",
];

const quotes = [
    "The only way to do great work is to love what you do. — Steve Jobs 💫",
    "In the middle of difficulty lies opportunity. — Albert Einstein",
    "Be yourself; everyone else is already taken. — Oscar Wilde",
    "Two roads diverged in a wood, and I took the one less traveled by. — Robert Frost",
    "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
    "It does not matter how slowly you go as long as you do not stop. — Confucius",
    "Everything you've ever wanted is on the other side of fear. — George Addair",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. — Churchill",
    "Believe you can and you're halfway there. — Theodore Roosevelt",
    "The only impossible journey is the one you never begin. — Tony Robbins",
    "What lies behind us and what lies before us are tiny matters compared to what lies within us. — Emerson",
    "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
    "Your time is limited, don't waste it living someone else's life. — Steve Jobs",
    "The purpose of our lives is to be happy. — Dalai Lama",
    "Life is what happens when you're busy making other plans. — John Lennon",
    "Get busy living or get busy dying. — Stephen King",
    "You miss 100% of the shots you don't take. — Wayne Gretzky",
    "Whether you think you can or you think you can't, you're right. — Henry Ford",
    "The best revenge is massive success. — Frank Sinatra",
    "I have not failed. I've just found 10,000 ways that won't work. — Thomas Edison",
];

const rosedayQuotes = [
    "🌹 A rose for you, because you deserve all the beauty in this world.",
    "🌹 Like a rose, your beauty is timeless and your heart is full of grace.",
    "🌹 Every rose has its thorn, but you make even the thorns worth it.",
    "🌹 If I could give you one thing, it would be the ability to see yourself through my eyes.",
    "🌹 You're like a rose in a garden of dandelions — rare, unique, and absolutely stunning.",
    "🌹 A single rose can be my garden... a single person can be my world. You are that person.",
    "🌹 Roses are red, violets are blue, but nothing compares to the beauty of you.",
    "🌹 Like a rose blooming at dawn, your smile brightens up my world.",
    "🌹 Some people are like roses — they bring color and fragrance into your life. Thank you for being that rose.",
    "🌹 In a field of roses, you are the one I'd pick every single time.",
];

// ========== ROSEDAY COMMAND ==========
ademola({
    pattern: "roseday",
    alias: ["rose", "rosedayquote"],
    desc: "Get roseday quotes",
    category: "fun",
    react: "🌹",
    use: ".roseday",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const quote = rosedayQuotes[Math.floor(Math.random() * rosedayQuotes.length)];
        await reply(quote);
    } catch (error) {
        console.error('Error in roseday command:', error);
        await reply('❌ Failed to get roseday quote. Please try again later!');
    }
});

// ========== QUOTE COMMAND ==========
ademola({
    pattern: "quote",
    alias: ["quotes", "inspire"],
    desc: "Get inspirational quotes",
    category: "fun",
    react: "💫",
    use: ".quote",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        await reply(`💫 *Inspirational Quote*\n\n${q}`);
    } catch (error) {
        console.error('Error in quote command:', error);
        await reply('❌ Failed to get quote. Please try again later!');
    }
});

// ========== JOKE COMMAND ==========
ademola({
    pattern: "joke",
    alias: ["dadjoke", "funny"],
    desc: "Get random dad jokes",
    category: "fun",
    react: "😄",
    use: ".joke",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' }
        });
        await reply(response.data.joke);

    } catch (error) {
        console.error('Error in joke command:', error);
        await reply('❌ Sorry, I could not fetch a joke right now.');
    }
});

// ========== MEME COMMAND ==========
ademola({
    pattern: "meme",
    alias: ["memes", "cheems"],
    desc: "Get random memes",
    category: "fun",
    react: "🎭",
    use: ".meme",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const response = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });
        const data = response.data;

        if (!data?.url) throw new Error('Invalid API response');

        await ademola.sendMessage(from, { 
            image: { url: data.url },
            caption: `> ${data.title || 'Here\'s your meme!'} 🎭`
        }, {
            quoted: fakevCard
        });
    } catch (error) {
        console.error('Error in meme command:', error);
        await reply('❌ Failed to fetch meme. Please try again later.');
    }
});