const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

const ANIMU_BASE = 'https://api.some-random-api.com/animu';

function normalizeType(input) {
    const lower = (input || '').toLowerCase();
    if (lower === 'facepalm' || lower === 'face_palm') return 'face-palm';
    if (lower === 'quote' || lower === 'animu-quote' || lower === 'animuquote') return 'quote';
    return lower;
}

async function convertMediaToSticker(mediaBuffer, isAnimated) {
    // ... (keep your existing conversion code)
}

async function sendAnimu(ademola, from, type) {
    try {
        const endpoint = `${ANIMU_BASE}/${type}`;
        const res = await axios.get(endpoint);
        const data = res.data || {};

        if (data.link) {
            const link = data.link;
            const lower = link.toLowerCase();
            const isGifLink = lower.endsWith('.gif');
            const isImageLink = lower.match(/\.(jpg|jpeg|png|webp)$/);

            // Convert to stickers
            if (isGifLink || isImageLink) {
                try {
                    const resp = await axios.get(link, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const mediaBuf = Buffer.from(resp.data);
                    const stickerBuf = await convertMediaToSticker(mediaBuf, isGifLink);
                    await ademola.sendMessage(from, { sticker: stickerBuf }, { quoted: fakevCard });
                    return;
                } catch (error) {
                    console.error('Error converting media to sticker:', error);
                }
            }

            // Fallback to image
            try {
                await ademola.sendMessage(from, { image: { url: link }, caption: `🎌 Anime: ${type}` }, { quoted: fakevCard });
                return;
            } catch {}
        }
        
        if (data.quote) {
            await ademola.sendMessage(from, { text: `💫 *Anime Quote:*\n\n"${data.quote}"` }, { quoted: fakevCard });
            return;
        }

        await ademola.sendMessage(from, { text: '❌ Failed to fetch animu content.' }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error in sendAnimu:', error);
        await ademola.sendMessage(from, { text: '❌ Error fetching anime content.' }, { quoted: fakevCard });
    }
}

// Main anime command
ademola({
    pattern: "animu",
    alias: ["anime"],
    desc: "Get anime GIFs, images, and quotes",
    category: "fun",
    react: "🎌",
    use: ".animu [type]",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, text }) => {
    try {
        const subArg = text ? text.trim().toLowerCase() : '';
        const sub = normalizeType(subArg);

        const supported = ['nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote'];

        if (!sub) {
            return await reply(`🎌 *Anime Command*\nUsage: .animu <type>\nTypes: ${supported.join(', ')}`);
        }

        if (!supported.includes(sub)) {
            return await reply(`❌ Unsupported type. Available: ${supported.join(', ')}`);
        }

        await sendAnimu(ademola, from, sub);

    } catch (error) {
        console.error('Error in animu command:', error);
        await reply('❌ Error fetching anime content.');
    }
});

// Individual commands
const animeTypes = ['hug', 'kiss', 'pat', 'poke', 'cry', 'wink', 'nom', 'facepalm'];
animeTypes.forEach(type => {
    ademola({
        pattern: type,
        desc: `Get anime ${type} content`,
        category: "fun",
        react: "🎌",
        filename: __filename,
    }, async (ademola, mek, m, { from, reply }) => {
        await sendAnimu(ademola, from, normalizeType(type));
    });
});

ademola({
    pattern: "animequote",
    alias: ["animuquote"],
    desc: "Get anime quote content",
    category: "fun",
    react: "🎌",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await sendAnimu(ademola, from, 'quote');
});