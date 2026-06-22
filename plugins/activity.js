const { ademola } = require("../ademola");

ademola({
    pattern: "activity",
    alias: ["log", "recent", "feed"],
    desc: "Show recent bot activity feed",
    category: "owner",
    react: "📊",
    use: ".activity",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Only the owner can view the activity log.");

    const log = global.getActivityLog?.() || [];
    if (log.length === 0) return reply("📭 No recent activity.");

    const lines = log.slice(0, 20).map((entry, i) => {
        const icon = { command: '⚡', reply: '📤', autoreply: '🤖', group_msg: '💬', dm_msg: '💬', join: '➕', leave: '➖' }[entry.type] || '•';
        return `${icon} ${entry.detail}`;
    });

    await reply(`📊 *Recent Activity* (last 20)\n\n${lines.join('\n')}`);
});
