const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/afk.json');

if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify({}, null, 2));

function load() {
    try { return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8')); }
    catch { return {}; }
}

function save(data) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

ademola({
    pattern: "afk",
    alias: ["away", "brb"],
    desc: "Set yourself as AFK (auto-reply when mentioned)",
    category: "utility",
    react: "💤",
    use: ".afk <reason>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    const data = load();
    data[sender] = {
        reason: q?.trim() || 'Away',
        since: Date.now(),
        chatId: from
    };
    save(data);
    reply(`💤 *AFK Mode ON*\n\nReason: ${data[sender].reason}\n\nI'll let others know when they mention you.`);
});

async function handleAfkMention(ademola, mek, from, senderId, mentionedJids) {
    try {
        if (!mentionedJids || mentionedJids.length === 0) return;

        const data = load();
        if (Object.keys(data).length === 0) return;

        for (const jid of mentionedJids) {
            const entry = data[jid];
            if (!entry) continue;

            const elapsed = Math.floor((Date.now() - entry.since) / 60000);
            let timeStr = 'just now';
            if (elapsed > 0) timeStr = `${elapsed}m ago`;
            if (elapsed > 60) timeStr = `${Math.floor(elapsed / 60)}h ${elapsed % 60}m ago`;

            await ademola.sendMessage(from, {
                text: `💤 *${jid.split('@')[0]} is AFK*\n\nReason: ${entry.reason}\nSince: ${timeStr}`
            }, { quoted: fakevCard });

            console.log(`💤 AFK notice for ${jid} in ${from}`);
        }
    } catch (error) {
        console.error('AFK handler error:', error.message);
    }
}

async function handleAfkReturn(ademola, mek, from, senderId) {
    const data = load();
    if (data[senderId]) {
        const elapsed = Math.floor((Date.now() - data[senderId].since) / 60000);
        let timeStr = `${elapsed}m`;
        if (elapsed > 60) timeStr = `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;
        delete data[senderId];
        save(data);
        await ademola.sendMessage(from, {
            text: `👋 Welcome back! You were AFK for ${timeStr}.`
        }, { quoted: fakevCard });
        console.log(`👋 ${senderId} returned from AFK (${timeStr})`);
    }
}

module.exports = { handleAfkMention, handleAfkReturn };
