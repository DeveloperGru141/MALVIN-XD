const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const TMP_DIR = path.join(__dirname, '../tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ==================== WEATHER ====================

ademola({
    pattern: "weather",
    alias: ["wthr", "forecast"],
    desc: "Check weather for a city",
    category: "utility",
    react: "🌤️",
    use: ".weather <city name>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('❌ Usage: `.weather <city>`\nExample: .weather London');

        const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(q)}?format=%C+%t+%h+%w+%p`, {
            timeout: 10000
        });

        const parts = data.trim().split(' ');
        const condition = parts.slice(0, -4).join(' ') || 'N/A';
        const temp = parts[parts.length - 4] || 'N/A';
        const humidity = parts[parts.length - 3] || 'N/A';
        const wind = parts[parts.length - 2] || 'N/A';
        const precipitation = parts[parts.length - 1] || 'N/A';

        reply(`╭─── 🌤️ WEATHER ───╮\n\n📍 *${q}*\n🌡️ ${temp}\n☁️ ${condition}\n💧 Humidity: ${humidity}\n🌬️ Wind: ${wind}\n🌧️ Precip: ${precipitation}\n╰────────────────╯`);
    } catch (error) {
        console.error('Weather error:', error.message);
        reply('❌ Could not fetch weather. Check the city name or try again.');
    }
});

// ==================== DICTIONARY ====================

ademola({
    pattern: "define",
    alias: ["dictionary", "dict", "meaning"],
    desc: "Get word definition",
    category: "utility",
    react: "📖",
    use: ".define <word>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('❌ Usage: `.define <word>`\nExample: .define serendipity');

        const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`, {
            timeout: 10000
        });

        if (!data?.[0]) return reply(`❌ No definition found for "${q}".`);

        const entry = data[0];
        const word = entry.word;
        const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || '';
        let text = `╭─── 📖 ${word.toUpperCase()} ───╮\n`;
        if (phonetic) text += `\n🔊 ${phonetic}\n`;

        entry.meanings?.slice(0, 3).forEach(meaning => {
            text += `\n*${meaning.partOfSpeech}*`;
            meaning.definitions?.slice(0, 2).forEach((def, i) => {
                text += `\n${i + 1}. ${def.definition}`;
                if (def.example) text += `\n   └ "${def.example}"`;
            });
        });

        text += `\n╰────────────────────╯`;
        reply(text);
    } catch (error) {
        if (error.response?.status === 404) return reply(`❌ No definition found for "${q}".`);
        console.error('Define error:', error.message);
        reply('❌ Error fetching definition.');
    }
});

// ==================== WIKIPEDIA ====================

ademola({
    pattern: "wiki",
    alias: ["wikipedia", "encyclopedia"],
    desc: "Search Wikipedia",
    category: "utility",
    react: "🌐",
    use: ".wiki <query>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('❌ Usage: `.wiki <query>`\nExample: .wiki JavaScript');

        const { data } = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q), {
            timeout: 10000
        });

        if (data.type === 'disambiguation') {
            let text = `*${q}* may refer to:\n`;
            data.pages?.slice(0, 10).forEach(p => { text += `\n• ${p.title}`; });
            return reply(text);
        }

        if (!data.extract) return reply(`❌ No results for "${q}".`);

        const text = `*${data.title}*\n\n${data.extract.slice(0, 1500)}${data.extract.length > 1500 ? '...' : ''}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`;
        reply(text);
    } catch (error) {
        if (error.response?.status === 404) return reply(`❌ No Wikipedia page found for "${q}".`);
        console.error('Wiki error:', error.message);
        reply('❌ Error searching Wikipedia.');
    }
});

// ==================== CRYPTO ====================

ademola({
    pattern: "crypto",
    alias: ["cryptoprice", "coin", "cointicker"],
    desc: "Check cryptocurrency price",
    category: "utility",
    react: "💰",
    use: ".crypto <coin> (e.g. .crypto bitcoin, .crypto eth)",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('❌ Usage: `.crypto <coin>`\nExamples: .crypto bitcoin, .crypto eth, .crypto solana');

        const coin = q.trim().toLowerCase();
        const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true`, {
            timeout: 10000
        });

        if (!data[coin]) {
            const { data: search } = await axios.get(`https://api.coingecko.com/api/v3/search?query=${coin}`, { timeout: 5000 });
            const coins = search.coins?.slice(0, 5);
            if (!coins?.length) return reply(`❌ No crypto found for "${q}". Try a different name.`);
            let text = `*Did you mean?*\n`;
            coins.forEach(c => { text += `\n• ${c.name} (${c.symbol})`; });
            return reply(text);
        }

        const price = data[coin].usd?.toLocaleString() || 'N/A';
        const change = data[coin].usd_24h_change;
        const changeStr = change ? `${change >= 0 ? '📈' : '📉'} ${change.toFixed(2)}%` : '';

        reply(`╭─── 💰 ${coin.toUpperCase()} ───╮\n\n💵 $${price}\n${changeStr ? `📊 24h: ${changeStr}` : ''}\n╰────────────────────╯`);
    } catch (error) {
        console.error('Crypto error:', error.message);
        reply('❌ Error fetching crypto price.');
    }
});

// ==================== NEWS ====================

ademola({
    pattern: "news",
    alias: ["headlines", "topnews"],
    desc: "Get latest news headlines",
    category: "utility",
    react: "📰",
    use: ".news",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        const apiKey = process.env.NEWS_API_KEY;

        if (apiKey) {
            const { data } = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&pageSize=8`, {
                headers: { 'X-Api-Key': apiKey },
                timeout: 10000
            });

            if (data.articles?.length) {
                let text = `╭─── 📰 TOP NEWS ───╮\n\n`;
                data.articles.slice(0, 8).forEach((a, i) => {
                    text += `${i + 1}. *${a.title}*\n   └ ${a.source.name}${a.description ? '\n   └ ' + a.description.slice(0, 100) : ''}\n\n`;
                });
                text += `╰──────────────────╯`;
                return reply(text);
            }
        }

        const cheerio = require('cheerio');
        const { data: html } = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', {
            timeout: 10000
        });

        const $ = cheerio.load(html, { xmlMode: true });
        const items = [];
        $('item').each((i, el) => {
            if (i >= 8) return false;
            const title = $(el).find('title').text().trim();
            const source = $(el).find('source').text().trim() || 'News';
            if (title) items.push({ title, source });
        });

        if (!items.length) return reply('❌ Could not fetch news. Try again later.');

        let text = `╭─── 📰 TOP NEWS ───╮\n\n`;
        items.forEach((a, i) => {
            text += `${i + 1}. *${a.title}*\n   └ ${a.source}\n\n`;
        });
        text += `╰──────────────────╯`;
        reply(text);
    } catch (error) {
        console.error('News error:', error.message);
        reply('❌ Error fetching news.');
    }
});

// ==================== QR CODE ====================

ademola({
    pattern: "qr",
    alias: ["qrcode", "makeqr"],
    desc: "Generate a QR code from text",
    category: "utility",
    react: "📱",
    use: ".qr <text or URL>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('❌ Usage: `.qr <text or URL>`\nExample: .qr https://example.com');

        const filepath = path.join(TMP_DIR, `qr_${Date.now()}.png`);
        await QRCode.toFile(filepath, q, { width: 512, margin: 2 });

        await ademola.sendMessage(from, {
            image: fs.readFileSync(filepath),
            caption: `📱 *QR Code*\n\nContent: ${q.slice(0, 100)}`
        }, { quoted: fakevCard });

        fs.unlink(filepath, () => {});
    } catch (error) {
        console.error('QR error:', error.message);
        reply('❌ Failed to generate QR code.');
    }
});

ademola({
    pattern: "qrread",
    alias: ["readqr", "decodeqr"],
    desc: "Read/decode a QR code from an image",
    category: "utility",
    react: "🔍",
    use: ".qrread (reply to an image with QR code)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const img = quoted?.imageMessage;
        if (!img) return reply('❌ Reply to an image containing a QR code with `.qrread`.');

        const buffer = await require('@whiskeysockets/baileys').downloadMediaMessage(
            { key: { id: mek.message.extendedTextMessage.contextInfo.stanzaId }, message: quoted },
            'buffer',
            {},
            { logger: console }
        );

        if (!buffer) return reply('❌ Failed to download image.');

        const QrReader = require('qrcode-reader');
        const image = await Jimp.read(buffer);
        const reader = new QrReader();

        const result = await new Promise((resolve, reject) => {
            reader.callback = (err, val) => {
                if (err || !val) reject(new Error('No QR found'));
                else resolve(val);
            };
            reader.decode(image.bitmap);
        });

        if (!result?.result) return reply('❌ No QR code found in the image.');

        reply(`✅ *QR Code Content:*\n\n${result.result}`);
    } catch (error) {
        console.error('QR read error:', error.message);
        reply('❌ Failed to read QR code.');
    }
});
