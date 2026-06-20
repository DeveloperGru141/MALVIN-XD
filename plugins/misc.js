const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(ademola, mek) {
    // 1) Quoted image (highest priority)
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 2) Image in the current message
    if (mek.message?.imageMessage) {
        const stream = await downloadContentFromMessage(mek.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 3) Mentioned or replied participant avatar
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

// Simple avatar-only effects
const simpleEffects = [
    { pattern: "heart", alias: ["love"], desc: "Heart effect on profile picture", react: "❤️" },
    { pattern: "horny", alias: [], desc: "Horny license card", react: "😈" },
    { pattern: "circle", alias: [], desc: "Circular profile picture", react: "⭕" },
    { pattern: "lgbt", alias: ["pride"], desc: "LGBT rainbow effect", react: "🌈" },
    { pattern: "lied", alias: [], desc: "You lied effect", react: "🤥" },
    { pattern: "lolice", alias: [], desc: "Lolice card", react: "👮" },
    { pattern: "simpcard", alias: [], desc: "Simp card", react: "😍" },
    { pattern: "tonikawa", alias: [], desc: "Tonikawa effect", react: "🌙" },
    { pattern: "comrade", alias: [], desc: "Comrade filter", react: "☭" },
    { pattern: "gay", alias: [], desc: "Gay rainbow filter", react: "🏳️‍🌈" },
    { pattern: "glass", alias: [], desc: "Glass effect", react: "🔍" },
    { pattern: "jail", alias: [], desc: "Jail bars effect", react: "🚔" },
    { pattern: "passed", alias: [], desc: "Passed away effect", react: "💀" },
    { pattern: "triggered", alias: [], desc: "Triggered effect", react: "🔫" }
];

// Create simple effect commands
simpleEffects.forEach(effect => {
    ademola({
        pattern: effect.pattern,
        alias: effect.alias,
        desc: effect.desc,
        category: "media",
        react: effect.react,
        use: `.${effect.pattern}`,
        filename: __filename,
    }, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
        try {
            const avatarUrl = await getQuotedOrOwnImageUrl(ademola, mek);
            const url = `https://api.some-random-api.com/canvas/${effect.pattern === 'comrade' || effect.pattern === 'gay' || effect.pattern === 'glass' || effect.pattern === 'jail' || effect.pattern === 'passed' || effect.pattern === 'triggered' ? 'overlay' : 'misc'}/${effect.pattern}?avatar=${encodeURIComponent(avatarUrl)}`;
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            await ademola.sendMessage(from, { image: Buffer.from(response.data) }, {
                quoted: fakevCard
            });
        } catch (error) {
            console.error(`Error in ${effect.pattern} command:`, error);
            await reply('❌ Failed to generate image. Please try again.');
        }
    });
});

// Its-so-stupid command
ademola({
    pattern: "its-so-stupid",
    alias: ["stupid", "dog"],
    desc: "Its so stupid meme with text",
    category: "media",
    react: "🐶",
    use: ".its-so-stupid <text>",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!text) {
            return await reply('Usage: .its-so-stupid <text>');
        }
        const avatarUrl = await getQuotedOrOwnImageUrl(ademola, mek);
        const url = `https://api.some-random-api.com/canvas/misc/its-so-stupid?dog=${encodeURIComponent(text)}&avatar=${encodeURIComponent(avatarUrl)}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await ademola.sendMessage(from, { image: Buffer.from(response.data) }, {
            quoted: fakevCard
        });
    } catch (error) {
        console.error('Error in its-so-stupid command:', error);
        await reply('❌ Failed to generate image. Please try again.');
    }
});

// Namecard command
ademola({
    pattern: "namecard",
    alias: ["profilecard"],
    desc: "Create a namecard with user info",
    category: "media",
    react: "🪪",
    use: ".namecard username|birthday|description",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const [username, birthday, description] = text.split('|').map(s => (s || '').trim());
        if (!username || !birthday) {
            return await reply('Usage: .namecard username|birthday|description(optional)\nExample: .namecard Ademola|2000|Developer');
        }
        const avatarUrl = await getQuotedOrOwnImageUrl(ademola, mek);
        const params = new URLSearchParams({ username, birthday, avatar: avatarUrl });
        if (description) params.append('description', description);
        const url = `https://api.some-random-api.com/canvas/misc/namecard?${params.toString()}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await ademola.sendMessage(from, { image: Buffer.from(response.data) }, {
            quoted: fakevCard
        });
    } catch (error) {
        console.error('Error in namecard command:', error);
        await reply('❌ Failed to generate namecard. Please try again.');
    }
});

// Oogway commands
ademola({
    pattern: "oogway",
    alias: ["oogwayquote"],
    desc: "Master Oogway with your quote",
    category: "media",
    react: "🐢",
    use: ".oogway <quote>",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!text) {
            return await reply('Usage: .oogway <quote>\nExample: .oogway "Be happy"');
        }
        const avatarUrl = await getQuotedOrOwnImageUrl(ademola, mek);
        const url = `https://api.some-random-api.com/canvas/misc/oogway?quote=${encodeURIComponent(text)}&avatar=${encodeURIComponent(avatarUrl)}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await ademola.sendMessage(from, { image: Buffer.from(response.data) }, {
            quoted: fakevCard
        });
    } catch (error) {
        console.error('Error in oogway command:', error);
        await reply('❌ Failed to generate Oogway quote. Please try again.');
    }
});

ademola({
    pattern: "oogway2",
    alias: ["oogway2quote"],
    desc: "Master Oogway v2 with your quote",
    category: "media",
    react: "🐢",
    use: ".oogway2 <quote>",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!text) {
            return await reply('Usage: .oogway2 <quote>\nExample: .oogway2 "Be happy"');
        }
        const avatarUrl = await getQuotedOrOwnImageUrl(ademola, mek);
        const url = `https://api.some-random-api.com/canvas/misc/oogway2?quote=${encodeURIComponent(text)}&avatar=${encodeURIComponent(avatarUrl)}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await ademola.sendMessage(from, { image: Buffer.from(response.data) }, {
            quoted: fakevCard
        });
    } catch (error) {
        console.error('Error in oogway2 command:', error);
        await reply('❌ Failed to generate Oogway quote. Please try again.');
    }
});

// Tweet command
ademola({
    pattern: "tweet",
    alias: ["twitter"],
    desc: "Create fake Twitter tweet",
    category: "media",
    react: "🐦",
    use: ".tweet displayname|username|comment|theme",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const [displayname, username, comment, theme] = text.split('|').map(s => (s || '').trim());
        if (!displayname || !username || !comment) {
            return await reply('Usage: .tweet displayname|username|comment|theme(optional)\nExample: .tweet Ademola|ademolaXD|Hello world!|dark');
        }
        const avatarUrl = await getQuotedOrOwnImageUrl(ademola, mek);
        const params = new URLSearchParams({ displayname, username, comment, avatar: avatarUrl });
        if (theme) params.append('theme', theme);
        const url = `https://api.some-random-api.com/canvas/misc/tweet?${params.toString()}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await ademola.sendMessage(from, { image: Buffer.from(response.data) }, {
            quoted: fakevCard
        });
    } catch (error) {
        console.error('Error in tweet command:', error);
        await reply('❌ Failed to generate tweet. Please try again.');
    }
});

// YouTube comment command
ademola({
    pattern: "youtube-comment",
    alias: ["ytcomment", "youtube"],
    desc: "Create fake YouTube comment",
    category: "media",
    react: "📺",
    use: ".youtube-comment username|comment",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const [username, comment] = text.split('|').map(s => (s || '').trim());
        if (!username || !comment) {
            return await reply('Usage: .youtube-comment username|comment\nExample: .youtube-comment Ademola|Great video!');
        }
        const avatarUrl = await getQuotedOrOwnImageUrl(ademola, mek);
        const params = new URLSearchParams({ username, comment, avatar: avatarUrl });
        const url = `https://api.some-random-api.com/canvas/misc/youtube-comment?${params.toString()}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await ademola.sendMessage(from, { image: Buffer.from(response.data) }, {
            quoted: fakevCard
        });
    } catch (error) {
        console.error('Error in youtube-comment command:', error);
        await reply('❌ Failed to generate YouTube comment. Please try again.');
    }
});