const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "poll",
    alias: ["createpoll", "makevote"],
    desc: "Create a WhatsApp poll",
    category: "utility",
    react: "📊",
    use: ".poll <question> | <opt1> | <opt2> | ...",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isGroup }) => {
    try {
        if (!q) return reply('Usage: `.poll <question> | <option1> | <option2> | ...`\n\nExample:\n.poll Best programming language? | JavaScript | Python | Go');

        const parts = q.split('|').map(s => s.trim());
        if (parts.length < 3) return reply('❌ Need at least a question and 2 options.\n\nUsage: `.poll <question> | <opt1> | <opt2>`');
        if (parts.length > 13) return reply('❌ Max 12 options allowed.');

        const question = parts[0];
        const values = parts.slice(1);

        await ademola.sendMessage(from, {
            poll: {
                name: question,
                values,
                selectableCount: 1
            }
        }, { quoted: fakevCard });

        console.log(`📊 Poll created: "${question.slice(0, 60)}" (${values.length} options)`);
    } catch (error) {
        console.error('Poll error:', error);
        reply('❌ Failed to create poll.');
    }
});
