const { ademola, fakevCard } = require("../ademola");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const STICKER_DIR = path.join(__dirname, '../data/stickers');
const INDEX_PATH = path.join(STICKER_DIR, 'index.json');

if (!fs.existsSync(STICKER_DIR)) fs.mkdirSync(STICKER_DIR, { recursive: true });
if (!fs.existsSync(INDEX_PATH)) fs.writeFileSync(INDEX_PATH, JSON.stringify([], null, 2));

function loadIndex() {
    try { return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')); }
    catch { return []; }
}

function saveIndex(idx) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
}

ademola({
    pattern: "savesticker",
    alias: ["addsticker", "stickeradd", "favsticker"],
    desc: "Save a sticker to your favorites storage",
    category: "sticker",
    react: "💾",
    use: ".savesticker <name> (reply to a sticker)",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage?.stickerMessage) {
            return reply('❌ Reply to a sticker with `.savesticker <name>` to save it.');
        }

        const name = q?.trim() || `sticker_${Date.now()}`;
        const idx = loadIndex();
        if (idx.find(e => e.name === name)) {
            return reply(`❌ A sticker named "${name}" already exists. Use a different name or delete it first.`);
        }

        const stickerBuffer = await downloadMediaMessage(
            {
                key: mek.message.extendedTextMessage.contextInfo.stanzaId,
                message: quotedMessage,
                messageType: 'stickerMessage'
            },
            'buffer',
            {},
            { logger: console, reuploadRequest: ademola.updateMediaMessage }
        );

        if (!stickerBuffer) return reply('❌ Failed to download sticker.');

        const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}.webp`;
        const filepath = path.join(STICKER_DIR, filename);
        fs.writeFileSync(filepath, stickerBuffer);

        idx.push({ name, file: filename, added: new Date().toISOString(), addedBy: sender });
        saveIndex(idx);

        await reply(`✅ Sticker "${name}" saved! (${idx.length} total)\nUse \`.stickerlist\` to see all.`);
    } catch (error) {
        console.error('Error saving sticker:', error);
        reply('❌ Failed to save sticker.');
    }
});

ademola({
    pattern: "delsticker",
    alias: ["removesticker", "deletesticker", "stickerremove"],
    desc: "Remove a saved sticker",
    category: "sticker",
    react: "🗑️",
    use: ".delsticker <name>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q?.trim()) return reply('❌ Usage: `.delsticker <name>`');

        const idx = loadIndex();
        const entry = idx.find(e => e.name === q.trim());
        if (!entry) return reply(`❌ No sticker found with name "${q.trim()}".`);

        const filepath = path.join(STICKER_DIR, entry.file);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

        const newIdx = idx.filter(e => e.name !== q.trim());
        saveIndex(newIdx);
        reply(`✅ Sticker "${q.trim()}" removed.`);
    } catch (error) {
        console.error('Error deleting sticker:', error);
        reply('❌ Failed to delete sticker.');
    }
});

ademola({
    pattern: "stickerlist",
    alias: ["liststickers", "stickers", "mystickers"],
    desc: "List all saved stickers",
    category: "sticker",
    react: "📋",
    use: ".stickerlist",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    const idx = loadIndex();
    if (idx.length === 0) return reply('📭 No saved stickers. Reply to a sticker with `.savesticker <name>` to add one.');

    let text = `╭─── 📋 STICKER STORAGE ───╮\n\n📦 *${idx.length} sticker(s) saved*\n\n`;
    idx.forEach((entry, i) => {
        text += `${i + 1}. *${entry.name}*\n`;
    });
    text += `\n💡 Send \`.sticker <name>\` to retrieve a sticker`;
    text += `\n╰────────────────────────╯`;

    reply(text);
});

ademola({
    pattern: "getsticker",
    alias: ["sendsticker", "stickerget"],
    desc: "Send a saved sticker by name",
    category: "sticker",
    react: "🎯",
    use: ".getsticker <name>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q?.trim()) {
            const idx = loadIndex();
            if (idx.length === 0) return reply('📭 No saved stickers.');
            let text = '*🎯 SAVED STICKERS*\n\n';
            idx.forEach((e, i) => { text += `${i + 1}. ${e.name}\n`; });
            text += '\nUse `.sticker <name>` to send one.';
            return reply(text);
        }

        const idx = loadIndex();
        const entry = idx.find(e => e.name === q.trim());
        if (!entry) return reply(`❌ No sticker found with name "${q.trim()}". Use \`.stickerlist\` to see all.`);

        const filepath = path.join(STICKER_DIR, entry.file);
        if (!fs.existsSync(filepath)) {
            const newIdx = idx.filter(e => e.name !== q.trim());
            saveIndex(newIdx);
            return reply('❌ Sticker file missing. Removed from index.');
        }

        await ademola.sendMessage(from, { sticker: fs.readFileSync(filepath) }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error sending sticker:', error);
        reply('❌ Failed to send sticker.');
    }
});

async function handleStickerReply(ademola, mek, from, senderId) {
    try {
        if (!mek.message?.stickerMessage) return;

        const isGroup = from.endsWith('@g.us');
        if (isGroup) {
            const botJid = ademola.user.id.split(':')[0] + '@s.whatsapp.net';
            const mentioned = mek.message.stickerMessage.contextInfo?.mentionedJid || [];
            if (!mentioned.includes(botJid)) return;
        }

        const idx = loadIndex();
        if (idx.length === 0) return;

        const randomSticker = idx[Math.floor(Math.random() * idx.length)];
        const filepath = path.join(STICKER_DIR, randomSticker.file);
        if (!fs.existsSync(filepath)) return;

        await ademola.sendMessage(from, { sticker: fs.readFileSync(filepath) }, { quoted: fakevCard });
        console.log(`🎯 Auto sticker reply to ${senderId}: "${randomSticker.name}"`);
    } catch (error) {
        console.error('Error in sticker reply:', error.message);
    }
}

module.exports = { handleStickerReply };
