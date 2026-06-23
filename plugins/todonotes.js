const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const TODO_PATH = path.join(DATA_DIR, 'todo.json');
const NOTES_PATH = path.join(DATA_DIR, 'notes.json');

if (!fs.existsSync(TODO_PATH)) fs.writeFileSync(TODO_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(NOTES_PATH)) fs.writeFileSync(NOTES_PATH, JSON.stringify({}, null, 2));

function loadTodos() {
    try { return JSON.parse(fs.readFileSync(TODO_PATH, 'utf8')); }
    catch { return {}; }
}

function saveTodos(data) {
    fs.writeFileSync(TODO_PATH, JSON.stringify(data, null, 2));
}

function loadNotes() {
    try { return JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8')); }
    catch { return {}; }
}

function saveNotes(data) {
    fs.writeFileSync(NOTES_PATH, JSON.stringify(data, null, 2));
}

// ==================== TODO ====================

ademola({
    pattern: "todo",
    alias: ["todos", "task"],
    desc: "Manage your todo list",
    category: "utility",
    react: "📝",
    use: ".todo add/list/done/clear <text>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply('Usage:\n.todo add <task>\n.todo list\n.todo done <number>\n.todo clear');

        const args = q.trim().split(' ');
        const cmd = args[0].toLowerCase();
        const rest = args.slice(1).join(' ');

        const todos = loadTodos();
        if (!todos[sender]) todos[sender] = [];

        switch (cmd) {
            case 'add':
                if (!rest) return reply('❌ Usage: `.todo add <task>`');
                todos[sender].push({ text: rest, done: false, added: Date.now() });
                saveTodos(todos);
                reply(`✅ Added: "${rest}"\nYou have ${todos[sender].length} task(s).`);
                break;

            case 'list':
                if (todos[sender].length === 0) return reply('📭 No tasks. Add one with `.todo add <task>`');
                let text = `╭─── 📝 TODO ───╮\n`;
                todos[sender].forEach((t, i) => {
                    const status = t.done ? '✅' : '⬜';
                    text += `\n${i + 1}. ${status} ${t.text}`;
                });
                text += `\n╰──────────────╯`;
                reply(text);
                break;

            case 'done':
                if (!rest || isNaN(rest)) return reply('❌ Usage: `.todo done <number>` (use `.todo list` to see numbers)');
                const idx = parseInt(rest) - 1;
                if (idx < 0 || idx >= todos[sender].length) return reply('❌ Invalid number.');
                todos[sender][idx].done = true;
                saveTodos(todos);
                reply(`✅ Marked done: "${todos[sender][idx].text}"`);
                break;

            case 'clear':
                const undone = todos[sender].filter(t => !t.done);
                if (undone.length === 0) {
                    todos[sender] = [];
                    saveTodos(todos);
                    return reply('✅ All tasks cleared.');
                }
                todos[sender] = undone;
                saveTodos(todos);
                reply(`✅ Cleared completed tasks. ${undone.length} remaining.`);
                break;

            default:
                reply('Usage: `.todo add/list/done/clear`');
        }
    } catch (error) {
        console.error('Todo error:', error);
        reply('❌ Error managing todos.');
    }
});

// ==================== NOTES ====================

ademola({
    pattern: "note",
    alias: ["notes", "savenote"],
    desc: "Save and manage notes",
    category: "utility",
    react: "📄",
    use: ".note save/list/get/del <name> / <content>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply('Usage:\n.note save <name> | <content>\n.note list\n.note get <name>\n.note del <name>');

        const args = q.trim().split(' ');
        const cmd = args[0].toLowerCase();
        const rest = args.slice(1).join(' ');

        const notes = loadNotes();
        if (!notes[sender]) notes[sender] = {};

        switch (cmd) {
            case 'save': {
                const sep = rest.indexOf('|');
                if (sep === -1) return reply('Usage: `.note save <name> | <content>`');
                const name = rest.slice(0, sep).trim();
                const content = rest.slice(sep + 1).trim();
                if (!name || !content) return reply('❌ Provide both name and content.');
                notes[sender][name] = { content, saved: Date.now() };
                saveNotes(notes);
                reply(`✅ Note "${name}" saved!`);
                break;
            }
            case 'list': {
                const names = Object.keys(notes[sender]);
                if (names.length === 0) return reply('📭 No notes. Save one with `.note save <name> | <content>`');
                let text = `╭─── 📄 NOTES ───╮\n`;
                names.forEach((n, i) => { text += `\n${i + 1}. ${n}`; });
                text += `\n╰───────────────╯\n\nUse \`.note get <name>\` to view`;
                reply(text);
                break;
            }
            case 'get': {
                if (!rest) return reply('❌ Usage: `.note get <name>`');
                const entry = notes[sender][rest];
                if (!entry) return reply(`❌ No note named "${rest}".`);
                reply(`📄 *${rest}*\n\n${entry.content}`);
                break;
            }
            case 'del':
            case 'delete':
            case 'remove': {
                if (!rest) return reply('❌ Usage: `.note del <name>`');
                if (!notes[sender][rest]) return reply(`❌ No note named "${rest}".`);
                delete notes[sender][rest];
                saveNotes(notes);
                reply(`✅ Note "${rest}" deleted.`);
                break;
            }
            default:
                reply('Usage: `.note save/list/get/del`');
        }
    } catch (error) {
        console.error('Note error:', error);
        reply('❌ Error managing notes.');
    }
});
