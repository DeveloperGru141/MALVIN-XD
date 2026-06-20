const { ademola, fakevCard } = require("../ademola");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const STORE_DIR = path.join(__dirname, '../data/viewonce');
const INDEX_PATH = path.join(STORE_DIR, 'index.json');

if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
if (!fs.existsSync(INDEX_PATH)) fs.writeFileSync(INDEX_PATH, JSON.stringify([], null, 2));

function loadIndex() {
    try { return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')); }
    catch { return []; }
}

function saveIndex(idx) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
}

function addEntry(entry) {
    const idx = loadIndex();
    idx.unshift(entry);
    if (idx.length > 20) {
        const removed = idx.pop();
        const oldPath = path.join(STORE_DIR, removed.file);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    saveIndex(idx);
}

function getEntry(id) {
    const idx = loadIndex();
    return idx.find(e => e.id === id);
}

ademola({
    pattern: "viewonce",
    alias: ["vo", "reveal", "vv"],
    desc: "Reveal view-once media and save to gallery",
    category: "media",
    react: "👁️",
    use: ".viewonce (reply to view-once media)",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedImage = quoted?.imageMessage;
        const quotedVideo = quoted?.videoMessage;

        if (quotedImage && quotedImage.viewOnce) {
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            const filename = `${id}.jpg`;
            const filepath = path.join(STORE_DIR, filename);
            fs.writeFileSync(filepath, buffer);

            addEntry({
                id,
                type: 'image',
                file: filename,
                caption: quotedImage.caption || '',
                sender: sender,
                time: new Date().toISOString(),
                from: from
            });

            await ademola.sendMessage(from, {
                image: buffer,
                caption: `📸 *View-Once Revealed & Saved*\n\nID: \`${id}\`\nUse \`.viewlist\` to browse gallery`
            }, { quoted: fakevCard });

        } else if (quotedVideo && quotedVideo.viewOnce) {
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            const filename = `${id}.mp4`;
            const filepath = path.join(STORE_DIR, filename);
            fs.writeFileSync(filepath, buffer);

            addEntry({
                id,
                type: 'video',
                file: filename,
                caption: quotedVideo.caption || '',
                sender: sender,
                time: new Date().toISOString(),
                from: from
            });

            await ademola.sendMessage(from, {
                video: buffer,
                caption: `🎥 *View-Once Revealed & Saved*\n\nID: \`${id}\`\nUse \`.viewlist\` to browse gallery`
            }, { quoted: fakevCard });

        } else {
            await reply('❌ Please reply to a view-once image or video.');
        }

    } catch (error) {
        console.error('Error in viewonce command:', error);
        await reply('❌ Failed to reveal view-once media. Make sure you replied to a view-once image or video.');
    }
});

ademola({
    pattern: "viewlist",
    alias: ["vl", "vgallery", "viewgallery"],
    desc: "Browse saved view-once media gallery",
    category: "media",
    react: "🖼️",
    use: ".viewlist",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const idx = loadIndex();
        if (idx.length === 0) {
            return reply('📭 *No saved view-once media.*\n\nReply to a view-once message with `.vv` to save it here.');
        }

        let text = '╭─── \`📁 VIEW-ONCE GALLERY\` ───╮\n\n';
        idx.forEach((entry, i) => {
            const icon = entry.type === 'image' ? '📸' : '🎥';
            const date = new Date(entry.time).toLocaleString();
            const senderShort = entry.sender.split('@')[0] || entry.sender;
            text += `${i + 1}. ${icon} *[${entry.type}]*\n   └ From: ${senderShort} — ${date}\n`;
            if (entry.caption) text += `   └ Caption: ${entry.caption.slice(0, 40)}\n`;
        });
        text += `\n💡 Reply with *${getPrefix()}getview <number>* to retrieve\n╰────────────────────╯`;

        await reply(text);

    } catch (error) {
        console.error('Error in viewlist:', error);
        await reply('❌ Error loading gallery.');
    }
});

ademola({
    pattern: "getview",
    alias: ["gv", "retrieveview"],
    desc: "Retrieve a saved view-once by number from gallery",
    category: "media",
    react: "📎",
    use: ".getview <number>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q || isNaN(q)) {
            return reply('❌ Usage: `.getview <number>`\nUse `.viewlist` to see available items.');
        }

        const idx = loadIndex();
        const num = parseInt(q);
        if (num < 1 || num > idx.length) {
            return reply(`❌ Invalid number. Use 1-${idx.length}. Run .viewlist to see the gallery.`);
        }

        const entry = idx[num - 1];
        const filepath = path.join(STORE_DIR, entry.file);

        if (!fs.existsSync(filepath)) {
            return reply('❌ File no longer exists on disk. It may have been removed.');
        }

        const buffer = fs.readFileSync(filepath);

        if (entry.type === 'image') {
            await ademola.sendMessage(from, {
                image: buffer,
                caption: `📸 *View-Once #${num}*\n${entry.caption ? '💬 ' + entry.caption : ''}`
            }, { quoted: fakevCard });
        } else if (entry.type === 'video') {
            await ademola.sendMessage(from, {
                video: buffer,
                caption: `🎥 *View-Once #${num}*\n${entry.caption ? '💬 ' + entry.caption : ''}`
            }, { quoted: fakevCard });
        }

    } catch (error) {
        console.error('Error in getview:', error);
        await reply('❌ Failed to retrieve view-once media.');
    }
});

ademola({
    pattern: "vv2",
    alias: ["retrieve2", "viewonce2", "reveal2"],
    desc: "Retrieve view once messages (Owner Only)",
    category: "owner",
    react: "🐳",
    use: ".vv2 (reply to view once message)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const isOwner = await require('../lib/isOwnerOrSudo')(sender);
        if (!isOwner) {
            return await reply('❌ This is an owner-only command.');
        }

        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg) {
            return await reply('🍁 Please reply to a view once message!');
        }

        const isViewOnce = quotedMsg.viewOnceMessageV2 || quotedMsg.viewOnceMessageV2Extension;
        if (!isViewOnce) {
            return await reply('❌ This is not a view once message. Please reply to a view once image/video.');
        }

        const actualMessage = quotedMsg.viewOnceMessageV2?.message ||
                             quotedMsg.viewOnceMessageV2Extension?.message;

        if (!actualMessage) {
            return await reply('❌ Could not extract view once message content.');
        }

        let buffer;
        let mimeType;
        let messageType;

        if (actualMessage.imageMessage) {
            buffer = await ademola.downloadMediaMessage(
                { message: { imageMessage: actualMessage.imageMessage } },
                'buffer',
                {},
                {}
            );
            mimeType = actualMessage.imageMessage.mimetype || "image/jpeg";
            messageType = "image";
        }
        else if (actualMessage.videoMessage) {
            buffer = await ademola.downloadMediaMessage(
                { message: { videoMessage: actualMessage.videoMessage } },
                'buffer',
                {},
                {}
            );
            mimeType = actualMessage.videoMessage.mimetype || "video/mp4";
            messageType = "video";
        }
        else if (actualMessage.audioMessage) {
            buffer = await ademola.downloadMediaMessage(
                { message: { audioMessage: actualMessage.audioMessage } },
                'buffer',
                {},
                {}
            );
            mimeType = actualMessage.audioMessage.mimetype || "audio/mp4";
            messageType = "audio";
        }
        else {
            return await reply('❌ Only image, video, and audio view once messages are supported.');
        }

        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const ext = messageType === 'image' ? '.jpg' : messageType === 'video' ? '.mp4' : '.mp3';
        const filename = `${id}${ext}`;
        const filepath = path.join(STORE_DIR, filename);
        fs.writeFileSync(filepath, buffer);

        addEntry({
            id,
            type: messageType,
            file: filename,
            caption: '',
            sender: sender,
            time: new Date().toISOString(),
            from: from
        });

        let messageContent = {};

        switch (messageType) {
            case "image":
                messageContent = {
                    image: buffer,
                    mimetype: mimeType,
                    caption: `🐳 *View Once Retrieved & Saved*\n\nID: \`${id}\`\nUse \`.viewlist\` to browse gallery`
                };
                break;
            case "video":
                messageContent = {
                    video: buffer,
                    mimetype: mimeType,
                    caption: `🐳 *View Once Retrieved & Saved*\n\nID: \`${id}\`\nUse \`.viewlist\` to browse gallery`
                };
                break;
            case "audio":
                messageContent = {
                    audio: buffer,
                    mimetype: mimeType,
                    ptt: actualMessage.audioMessage?.ptt || false
                };
                break;
        }

        await ademola.sendMessage(from, messageContent, { quoted: fakevCard });
        console.log(`✅ View once message retrieved and saved: ${id}`);

    } catch (error) {
        console.error('vv2 Error:', error);

        if (error.message?.includes('download')) {
            await reply('❌ Failed to download the view once media. The message may have expired.');
        } else if (error.message?.includes('not found')) {
            await reply('❌ View once message not found or already viewed.');
        } else {
            await reply(`❌ Error retrieving view once message: ${error.message}`);
        }
    }
});

function getPrefix() {
    try {
        const p = require('../lib/prefix');
        return p.getPrefix() || '.';
    } catch { return '.'; }
}
