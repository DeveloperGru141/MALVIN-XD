const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function loadState() {
	try {
		const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'mention.json'), 'utf8');
        const state = JSON.parse(raw);
        // If using the built-in default asset, treat it as no custom asset and default to text "Hi"
        if (state && typeof state.assetPath === 'string' && state.assetPath.endsWith('assets/mention_default.webp')) {
            return { enabled: !!state.enabled, assetPath: '', type: 'text' };
        }
        return state;
	} catch {
        // Default: disabled; when enabled without custom asset, reply as plain text
        return { enabled: false, assetPath: '', type: 'text' };
	}
}

function saveState(state) {
	fs.writeFileSync(path.join(__dirname, '..', 'data', 'mention.json'), JSON.stringify(state, null, 2));
}

async function ensureDefaultSticker(state) {
	try {
		const assetPath = path.join(__dirname, '..', state.assetPath);
		if (state.assetPath.endsWith('mention_default.webp') && !fs.existsSync(assetPath)) {
			// Create a simple default sticker instead of downloading from external URL
			const defaultStickerPath = path.join(__dirname, '..', 'assets', 'stickintro.webp');
			if (fs.existsSync(defaultStickerPath)) {
				// Copy existing sticker as default
				fs.copyFileSync(defaultStickerPath, assetPath);
			} else {
				// Create assets directory if it doesn't exist
				const assetsDir = path.dirname(assetPath);
				if (!fs.existsSync(assetsDir)) {
					fs.mkdirSync(assetsDir, { recursive: true });
				}
				// Create a simple text file as fallback
				fs.writeFileSync(assetPath.replace('.webp', '.txt'), 'Default mention sticker not available');
			}
		}
	} catch (e) {
		console.warn('ensureDefaultSticker failed:', e?.message || e);
	}
}

// Function to handle mention detection (for use in main bot file)
async function handleMentionDetection(sock, chatId, message) {
	try {
		if (message.key?.fromMe) return;

		const state = loadState();
		await ensureDefaultSticker(state);
		if (!state.enabled) return;

		// Normalize bot JID (handles formats like '12345:abcd@...')
		const rawId = sock.user?.id || sock.user?.jid || '';
		if (!rawId) return;
		const botNum = rawId.split('@')[0].split(':')[0];
		const botJids = [
			`${botNum}@s.whatsapp.net`,
			`${botNum}@whatsapp.net`,
			rawId
		];

		// Extract contextInfo from multiple message types
		const msg = message.message || {};
		const contexts = [
			msg.extendedTextMessage?.contextInfo,
			msg.imageMessage?.contextInfo,
			msg.videoMessage?.contextInfo,
			msg.documentMessage?.contextInfo,
			msg.stickerMessage?.contextInfo,
			msg.buttonsResponseMessage?.contextInfo,
			msg.listResponseMessage?.contextInfo
		].filter(Boolean);

		let mentioned = [];
		for (const c of contexts) {
			if (Array.isArray(c.mentionedJid)) {
				mentioned = mentioned.concat(c.mentionedJid);
			}
		}

		// Also capture direct mentionedJid arrays on messages (some clients/placeholders set it here)
		const directMentionLists = [
			msg.extendedTextMessage?.mentionedJid,
			msg.mentionedJid
		].filter(Array.isArray);
		for (const arr of directMentionLists) mentioned = mentioned.concat(arr);

		if (!mentioned.length) {
			// Heuristic fallback: detect if the text includes the bot's number as a mention-like token
			const rawText = (
				msg.conversation ||
				msg.extendedTextMessage?.text ||
				msg.imageMessage?.caption ||
				msg.videoMessage?.caption ||
				''
			).toString();
			if (rawText) {
				const safeBot = botNum.replace(/[-\s]/g, '');
				const re = new RegExp(`@?${safeBot}\b`);
				if (!re.test(rawText.replace(/\s+/g, ''))) return;
			} else {
				return;
			}
		}
		const isBotMentioned = mentioned.some(j => botJids.includes(j));
		if (!isBotMentioned) {
			// If no formal mention but heuristic matched, proceed silently
		}

		// Send custom asset or default fallback
		if (!state.assetPath) {
			await sock.sendMessage(chatId, { text: 'Hi' }, { quoted: message });
			return;
		}
		const assetPath = path.join(__dirname, '..', state.assetPath);
        // If configured asset does not exist, send plain text "Hi" as a safe default
        if (!fs.existsSync(assetPath)) {
            await sock.sendMessage(chatId, { text: 'Hi' }, { quoted: message });
            return;
        }
        try {
            if (state.type === 'sticker') {
                await sock.sendMessage(chatId, { sticker: fs.readFileSync(assetPath) }, { quoted: message });
                return;
            }
            const payload = {};
            if (state.type === 'image') payload.image = fs.readFileSync(assetPath);
            else if (state.type === 'video') {
                payload.video = fs.readFileSync(assetPath);
                if (state.gifPlayback) payload.gifPlayback = true;
            }
            else if (state.type === 'audio') {
                payload.audio = fs.readFileSync(assetPath);
                if (state.mimetype) payload.mimetype = state.mimetype; else payload.mimetype = 'audio/mpeg';
                if (typeof state.ptt === 'boolean') payload.ptt = state.ptt;
            }
            else if (state.type === 'text') payload.text = fs.readFileSync(assetPath, 'utf8');
            else payload.text = 'Hi';
            await sock.sendMessage(chatId, payload, { quoted: message });
        } catch (e) {
            await sock.sendMessage(chatId, { text: 'Hi' }, { quoted: message });
        }
	} catch (err) {
		console.error('handleMentionDetection error:', err);
	}
}

// Mention toggle command using Ademola XD framework
ademola({
    pattern: "mention",
    alias: ["mentionreply"],
    desc: "Enable/disable mention reply feature",
    category: "utility",
    react: "👋",
    use: ".mention [on/off]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply("Only Owner or Sudo can use this command.", { quoted: fakevCard });
        }

        const onoff = (q || '').trim().toLowerCase();
        if (!onoff || !['on','off'].includes(onoff)) {
            return reply("Usage: .mention on|off", { quoted: fakevCard });
        }

        const state = loadState();
        state.enabled = onoff === 'on';
        saveState(state);
        
        return reply(`Mention reply ${state.enabled ? 'enabled' : 'disabled'}.`, { quoted: fakevCard });
    } catch (error) {
        console.error('Mention toggle error:', error);
        await reply("❌ Error processing command!", { quoted: fakevCard });
    }
});

// Set mention media command using Ademola XD framework
ademola({
    pattern: "setmention",
    alias: ["setmentionreply"],
    desc: "Set custom media for mention replies",
    category: "utility", 
    react: "🖼️",
    use: "Reply to a message with .setmention",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply("Only Owner or Sudo can use this command.", { quoted: fakevCard });
        }

        const ctx = mek.message?.extendedTextMessage?.contextInfo;
        const qMsg = ctx?.quotedMessage;
        if (!qMsg) {
            return reply("Reply to a message or media (sticker/image/video/audio/document).", { quoted: fakevCard });
        }

        // Determine type and media key
        let type = 'sticker', buf, dataType;
        if (qMsg.stickerMessage) { dataType = 'stickerMessage'; type = 'sticker'; }
        else if (qMsg.imageMessage) { dataType = 'imageMessage'; type = 'image'; }
        else if (qMsg.videoMessage) { dataType = 'videoMessage'; type = 'video'; }
        else if (qMsg.audioMessage) { dataType = 'audioMessage'; type = 'audio'; }
        else if (qMsg.documentMessage) { dataType = 'documentMessage'; type = 'file'; }
        else if (qMsg.conversation || qMsg.extendedTextMessage?.text) { type = 'text'; }
        else {
            return reply("Unsupported. Reply to text/sticker/image/video/audio/document.", { quoted: fakevCard });
        }

        // Download or capture text
        if (type === 'text') {
            buf = Buffer.from(qMsg.conversation || qMsg.extendedTextMessage?.text || '', 'utf8');
            if (!buf.length) return reply("Empty text.", { quoted: fakevCard });
        } else {
            try {
                const media = qMsg[dataType];
                if (!media) throw new Error('No media');
                const kind = type === 'sticker' ? 'sticker' : type;
                const stream = await downloadContentFromMessage(media, kind);
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                buf = Buffer.concat(chunks);
            } catch (e) {
                console.error('download error', e);
                return reply("Failed to download media.", { quoted: fakevCard });
            }
        }

        // Size limit 1MB
        if (buf.length > 1024 * 1024) {
            return reply("File too large. Max 1 MB.", { quoted: fakevCard });
        }

        // Decide extension and flags by mimetype
        let mimetype = qMsg[dataType]?.mimetype || '';
        let ptt = !!qMsg.audioMessage?.ptt;
        let gifPlayback = !!qMsg.videoMessage?.gifPlayback;
        let ext = 'bin';
        if (type === 'sticker') ext = 'webp';
        else if (type === 'image') ext = mimetype.includes('png') ? 'png' : 'jpg';
        else if (type === 'video') ext = 'mp4';
        else if (type === 'audio') {
            if (mimetype.includes('ogg') || mimetype.includes('opus')) { ext = 'ogg'; mimetype = 'audio/ogg; codecs=opus'; }
            else if (mimetype.includes('mpeg') || mimetype.includes('mp3')) { ext = 'mp3'; mimetype = 'audio/mpeg'; }
            else if (mimetype.includes('aac')) { ext = 'aac'; mimetype = 'audio/aac'; }
            else if (mimetype.includes('wav')) { ext = 'wav'; mimetype = 'audio/wav'; }
            else if (mimetype.includes('m4a') || mimetype.includes('mp4')) { ext = 'm4a'; mimetype = 'audio/mp4'; }
            else { ext = 'mp3'; mimetype = 'audio/mpeg'; }
        }
        else if (type === 'text') ext = 'txt';

        // Remove previous custom asset(s): keep only one mention_custom.*
        const stateBefore = loadState();
        try {
            const assetsDir = path.join(__dirname, '..', 'assets');
            if (fs.existsSync(assetsDir)) {
                const files = fs.readdirSync(assetsDir);
                for (const f of files) {
                    if (f.startsWith('mention_custom.')) {
                        // delete all; we'll write the new one below
                        try { fs.unlinkSync(path.join(assetsDir, f)); } catch {}
                    }
                }
            }
            // Also delete previous path if it was not under mention_custom.* and not default
            if (stateBefore.assetPath && stateBefore.assetPath.startsWith('assets/') &&
                !stateBefore.assetPath.endsWith('mention_default.webp')) {
                const prevPath = path.join(__dirname, '..', stateBefore.assetPath);
                if (fs.existsSync(prevPath)) {
                    try { fs.unlinkSync(prevPath); } catch {}
                }
            }
        } catch (e) {
            console.warn('cleanup previous assets failed:', e?.message || e);
        }

        // Save into assets (only one file will exist afterwards)
        const outName = `mention_custom.${ext}`;
        const outPath = path.join(__dirname, '..', 'assets', outName);
        try { fs.writeFileSync(outPath, buf); } catch (e) {
            console.error('write error', e);
            return reply("Failed to save file.", { quoted: fakevCard });
        }

        const state = loadState();
        state.assetPath = path.join('assets', outName);
        state.type = type;
        if (type === 'audio') state.mimetype = mimetype;
        if (type === 'audio') state.ptt = ptt;
        if (type === 'video') state.gifPlayback = gifPlayback;
        saveState(state);
        
        return reply("Mention reply media updated.", { quoted: fakevCard });
    } catch (error) {
        console.error('Set mention error:', error);
        await reply("❌ Error setting mention media!", { quoted: fakevCard });
    }
});

// Export function for use in main bot file
module.exports = {
    handleMentionDetection
};