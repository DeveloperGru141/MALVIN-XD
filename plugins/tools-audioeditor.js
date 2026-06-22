const { ademola, fakevCard } = require("../ademola");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const audioEditor = require('../lib/audioeditor');

async function processAudioEffect(ademola, mek, from, effectName, effectFunction, reply) {
    try {
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg || !['audioMessage', 'videoMessage'].includes(quotedMsg.audioMessage ? 'audioMessage' : 'videoMessage')) {
            return await reply(`🔊 *${effectName} Effect*\n\nPlease reply to an audio or video message to apply the effect.`);
        }

        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        const mediaType = quotedMsg.audioMessage ? 'audioMessage' : 'videoMessage';
        const stream = await downloadContentFromMessage(quotedMsg[mediaType], mediaType.split('Message')[0]);
        let mediaBuffer = Buffer.from([]);
        for await (const chunk of stream) {
            mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
        }

        const ext = mediaType === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await effectFunction(mediaBuffer, ext);

        await ademola.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg',
            caption: `🎵 *${effectName} Effect Applied*\n\n> © Powered by Ademola King`
        }, { 
            quoted: fakevCard 
        });

        await ademola.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error(`${effectName} effect error:`, error);
        await ademola.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ Failed to apply ${effectName} effect. Please try again with a different audio file.`);
    }
}

// ==================== DEEP EFFECT ====================
ademola({
    pattern: "deep",
    alias: ["deepvoice", "deeper"],
    desc: "Make audio sound deeper",
    category: "audio",
    react: "🗣️",
    use: ".deep (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Deep Voice", audioEditor.deep, reply);
});

// ==================== SMOOTH EFFECT ====================
ademola({
    pattern: "smooth",
    alias: ["smoothaudio"],
    desc: "Smooth out audio",
    category: "audio",
    react: "🌀",
    use: ".smooth (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Smooth", audioEditor.smooth, reply);
});

// ==================== FAT EFFECT ====================
ademola({
    pattern: "fat",
    alias: ["bassy"],
    desc: "Make audio sound fat/bassy",
    category: "audio",
    react: "🍔",
    use: ".fat (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Fat/Bassy", audioEditor.fat, reply);
});

// ==================== TUPAI EFFECT ====================
ademola({
    pattern: "tupai",
    alias: ["squirrel"],
    desc: "Special tupai effect",
    category: "audio",
    react: "🐿️",
    use: ".tupai (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Tupai", audioEditor.tupai, reply);
});

// ==================== BLOWN EFFECT ====================
ademola({
    pattern: "blown",
    alias: ["blownout", "distorted"],
    desc: "Make audio sound blown out",
    category: "audio",
    react: "💥",
    use: ".blown (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Blown Out", audioEditor.blown, reply);
});

// ==================== RADIO EFFECT ====================
ademola({
    pattern: "radio",
    alias: ["oldradio", "vintage"],
    desc: "Make audio sound like old radio",
    category: "audio",
    react: "📻",
    use: ".radio (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Old Radio", audioEditor.radio, reply);
});

// ==================== ROBOT EFFECT ====================
ademola({
    pattern: "robot",
    alias: ["robotic", "cyborg"],
    desc: "Make audio sound robotic",
    category: "audio",
    react: "🤖",
    use: ".robot (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Robotic", audioEditor.robot, reply);
});

// ==================== CHIPMUNK EFFECT ====================
ademola({
    pattern: "chipmunk",
    alias: ["highpitch", "squeaky"],
    desc: "Make audio sound high-pitched",
    category: "audio",
    react: "🐿️",
    use: ".chipmunk (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Chipmunk", audioEditor.chipmunk, reply);
});

// ==================== NIGHTCORE EFFECT ====================
ademola({
    pattern: "nightcore",
    alias: ["nightcorefx"],
    desc: "Apply nightcore effect",
    category: "audio",
    react: "🎶",
    use: ".nightcore (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Nightcore", audioEditor.nightcore, reply);
});

// ==================== EARRAPE EFFECT ====================
ademola({
    pattern: "earrape",
    alias: ["maxvolume", "loud"],
    desc: "Max volume (use with caution)",
    category: "audio",
    react: "📢",
    use: ".earrape (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Earrape", audioEditor.earrape, reply);
});

// ==================== BASS EFFECT ====================
ademola({
    pattern: "bass",
    alias: ["bassboost", "heavybass"],
    desc: "Add heavy bass boost to audio",
    category: "audio",
    react: "🔊",
    use: ".bass (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Bass Boost", audioEditor.bass, reply);
});

// ==================== REVERSE EFFECT ====================
ademola({
    pattern: "reverse",
    alias: ["reversed", "backwards"],
    desc: "Reverse audio",
    category: "audio",
    react: "⏪",
    use: ".reverse (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Reverse", audioEditor.reverse, reply);
});

// ==================== SLOW EFFECT ====================
ademola({
    pattern: "slow",
    alias: ["slowmo", "slowed"],
    desc: "Slow down audio",
    category: "audio",
    react: "🐌",
    use: ".slow (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Slow Motion", audioEditor.slow, reply);
});

// ==================== FAST EFFECT ====================
ademola({
    pattern: "fast",
    alias: ["speedup", "fastforward"],
    desc: "Speed up audio",
    category: "audio",
    react: "⚡",
    use: ".fast (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Fast", audioEditor.fast, reply);
});

// ==================== BABY EFFECT ====================
ademola({
    pattern: "baby",
    alias: ["babyvoice", "child"],
    desc: "Make audio sound like a baby",
    category: "audio",
    react: "👶",
    use: ".baby (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Baby Voice", audioEditor.baby, reply);
});

// ==================== DEMON EFFECT ====================
ademola({
    pattern: "demon",
    alias: ["demonic", "evil"],
    desc: "Make audio sound demonic",
    category: "audio",
    react: "👹",
    use: ".demon (reply to audio)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processAudioEffect(ademola, mek, from, "Demon", audioEditor.demon, reply);
});