const { ademola, fakevCard, getSocket } = require("../ademola");
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/reminders');
const FILE_PATH = path.join(DATA_DIR, 'reminders.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));

function load() {
    try { return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8')); }
    catch { return []; }
}

function save(data) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

function parseTime(input) {
    const now = Date.now();
    const lower = input.toLowerCase();

    const units = {
        s: 1000, sec: 1000, secs: 1000, second: 1000, seconds: 1000,
        m: 60000, min: 60000, mins: 60000, minute: 60000, minutes: 60000,
        h: 3600000, hour: 3600000, hours: 3600000,
        d: 86400000, day: 86400000, days: 86400000,
        w: 604800000, week: 604800000, weeks: 604800000
    };

    const match = lower.match(/^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hour|hours|d|day|days|w|week|weeks)$/);
    if (match) {
        const ms = parseInt(match[1]) * (units[match[2]] || 0);
        return now + ms;
    }
    return null;
}

setInterval(() => {
    const reminders = load();
    if (reminders.length === 0) return;

    const now = Date.now();
    const due = reminders.filter(r => r.time <= now && !r.fired);
    if (due.length === 0) return;

    const remaining = reminders.filter(r => r.time > now || r.fired);
    due.forEach(r => { r.fired = true; });
    save([...remaining, ...due]);

    due.forEach(async (r) => {
        try {
            const sock = getSocket();
            if (!sock) return;
            const jid = r.chatId.endsWith('@g.us') ? r.chatId : r.sender;
            await sock.sendMessage(jid, {
                text: `⏰ *Reminder!*\n\n${r.message}\n\n_Set ${new Date(r.created).toLocaleString()}_`
            }, { quoted: fakevCard });
            console.log(`⏰ Reminder fired for ${r.sender}: "${r.message.slice(0, 60)}"`);
        } catch (e) {
            console.error('Reminder fire error:', e.message);
        }
    });
}, 15000);

ademola({
    pattern: "remind",
    alias: ["reminder", "remindme"],
    desc: "Set a reminder",
    category: "utility",
    react: "⏰",
    use: ".remind <message> in <time> (e.g. .remind call mom in 30m)",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender, isGroup }) => {
    try {
        if (!q) return reply('Usage: `.remind <message> in <time>`\nExamples:\n.remind call mom in 30m\n.remind drink water in 2h\n.remind meeting in 1d');

        const inMatch = q.match(/\bin\b(.+)/i);
        if (!inMatch) return reply('Include "in <time>" — e.g., `.remind call mom in 30m`');

        const timeStr = inMatch[1].trim();
        const message = q.split(/\bin\b/i)[0].trim();
        const targetTime = parseTime(timeStr);

        if (!targetTime) return reply('Invalid time format. Use: 30s, 10m, 2h, 1d, 1w');

        const reminders = load();
        reminders.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
            sender,
            chatId: from,
            message,
            time: targetTime,
            created: Date.now(),
            fired: false
        });
        save(reminders);

        const display = timeStr;
        reply(`⏰ *Reminder set!*\n\n"${message}" in ${display}`);
    } catch (error) {
        console.error('Reminder error:', error);
        reply('❌ Failed to set reminder.');
    }
});

ademola({
    pattern: "reminders",
    alias: ["mylist", "listreminders"],
    desc: "List your pending reminders",
    category: "utility",
    react: "📋",
    use: ".reminders",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    const reminders = load().filter(r => r.sender === sender && !r.fired);
    if (reminders.length === 0) return reply('⏰ No pending reminders.');

    let text = `╭─── ⏰ REMINDERS ───╮\n\n`;
    reminders.forEach((r, i) => {
        const remaining = Math.max(0, Math.floor((r.time - Date.now()) / 1000));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        text += `${i + 1}. "${r.message}"\n   └ in ${mins > 0 ? mins + 'm ' : ''}${secs}s\n`;
    });
    text += `\n╰────────────────────╯`;
    reply(text);
});
