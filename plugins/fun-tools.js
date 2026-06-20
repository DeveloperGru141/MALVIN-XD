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

// ========== SHAYARI COMMAND ==========
ademola({
    pattern: "shayari",
    alias: ["poem", "shayri"],
    desc: "Get random shayari",
    category: "fun",
    react: "🪄",
    use: ".shayari",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const response = await fetch('https://shizoapi.onrender.com/api/texts/shayari?apikey=shizo');
        const data = await response.json();
        
        if (!data?.result) throw new Error('Invalid API response');

        const buttons = [
            { buttonId: '.shayari', buttonText: { displayText: 'Shayari 🪄' }, type: 1 },
            { buttonId: '.roseday', buttonText: { displayText: '🌹 RoseDay' }, type: 1 }
        ];

        await ademola.sendMessage(from, { 
            text: data.result,
            buttons: buttons,
            headerType: 1
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in shayari command:', error);
        await reply('❌ Failed to fetch shayari. Please try again later.');
    }
});

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
        const res = await fetch(`https://api.princetechn.com/api/fun/roseday?apikey=prince`);
        if (!res.ok) throw new Error('API error');
        
        const json = await res.json();
        await reply(json.result || '🌹 Happy Rose Day!');

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
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/quotes?apikey=shizo`);
        if (!res.ok) throw new Error('API error');
        
        const json = await res.json();
        await reply(json.result || '💫 Stay inspired!');

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
        const response = await fetch('https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo');
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('image')) {
            const imageBuffer = await response.buffer();
            
            const buttons = [
                { buttonId: '.meme', buttonText: { displayText: '🎭 Another Meme' }, type: 1 },
                { buttonId: '.joke', buttonText: { displayText: '😄 Joke' }, type: 1 }
            ];

            await ademola.sendMessage(from, { 
                image: imageBuffer,
                caption: "> Here's your cheems meme! 🐕",
                buttons: buttons,
                headerType: 1
            }, {
                quoted: fakevCard
            });
        } else {
            throw new Error('Invalid response type');
        }

    } catch (error) {
        console.error('Error in meme command:', error);
        await reply('❌ Failed to fetch meme. Please try again later.');
    }
});