const { ademola, fakevCard } = require('../ademola');
const { setAntilink, getAntilink, removeAntilink } = require('../lib/index');

// Ademola XD Antilink Command
ademola({
    pattern: "antilink",
    alias: ["antilnk", "nolink"],
    desc: "Manage anti-link protection in groups",
    category: "moderation", 
    react: "🔗",
    use: ".antilink [on/off/set/get]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner, isAdmin, isGroup }) => {
    try {
        // Only group admins can use this command
        if (!isGroup) {
            return reply("❌ This command can only be used in groups.", { quoted: fakevCard });
        }

        const adminStatus = await isAdmin();
        if (!adminStatus.isSenderAdmin) {
            return reply("❌ This command can only be used by group admins.", { quoted: fakevCard });
        }

        const args = q ? q.toLowerCase().trim().split(' ') : [];
        const action = args[0];

        if (!action) {
            const usage = `*🔗 ANTILINK SETUP*\n\n` +
                `*.antilink on* - Enable anti-link protection\n` +
                `*.antilink set delete | kick | warn* - Set action for violators\n` +
                `*.antilink off* - Disable anti-link protection\n` +
                `*.antilink get* - Show current settings\n\n` +
                `*Actions:*\n` +
                `• delete - Delete message with link\n` +
                `• kick - Remove user from group\n` +
                `• warn - Warn user (default)`;
            return reply(usage, { quoted: fakevCard });
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(from);
                if (existingConfig?.enabled) {
                    return reply("⚠️ Anti-link protection is already enabled.", { quoted: mek });
                }
                const result = await setAntilink(from, 'on', 'delete');
                return reply(
                    result ? 
                    "✅ *Anti-link protection has been enabled!*\n\nDefault action: Delete messages with links" :
                    "❌ Failed to enable anti-link protection",
                    { quoted: fakevCard }
                );

            case 'off':
                await removeAntilink(from);
                return reply("✅ *Anti-link protection has been disabled.*", { quoted: fakevCard });

            case 'set':
                if (args.length < 2) {
                    return reply("❌ Please specify an action: *.antilink set delete | kick | warn*", { quoted: fakevCard });
                }
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    return reply("❌ Invalid action. Choose: delete, kick, or warn", { quoted: fakevCard });
                }
                
                // Update existing config with new action
                const currentConfig = await getAntilink(from) || {};
                const setResult = await setAntilink(from, 'on', setAction);
                return reply(
                    setResult ? 
                    `✅ *Anti-link action set to: ${setAction.toUpperCase()}*` :
                    "❌ Failed to set anti-link action",
                    { quoted: fakevCard }
                );

            case 'get':
            case 'status':
                const status = await getAntilink(from);
                const statusText = `*🔗 ANTILINK STATUS*\n\n` +
                    `• Status: ${status?.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                    `• Action: ${status?.action ? status.action.toUpperCase() : 'Not set'}\n` +
                    `• Group: ${from}`;
                return reply(statusText, { quoted: fakevCard });

            default:
                return reply("❌ Invalid option. Use *.antilink* for usage instructions.", { quoted: fakevCard });
        }
    } catch (error) {
        console.error('Antilink command error:', error);
        return reply("❌ Error processing anti-link command.", { quoted: fakevCard });
    }
});