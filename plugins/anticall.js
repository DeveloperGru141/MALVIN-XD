const fs = require('fs');
const { ademola, fakevCard } = require('../ademola');

const ANTICALL_PATH = './data/anticall.json';

// Ensure data directory exists
function ensureDataDir() {
    const dataDir = require('path').dirname(ANTICALL_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readState() {
    try {
        ensureDataDir();
        if (!fs.existsSync(ANTICALL_PATH)) {
            writeState(false);
            return { enabled: false };
        }
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { 
            enabled: !!data.enabled,
            lastUpdated: data.lastUpdated || Date.now()
        };
    } catch (error) {
        console.error('Error reading anticall state:', error);
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        ensureDataDir();
        const state = { 
            enabled: !!enabled,
            lastUpdated: Date.now()
        };
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify(state, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing anticall state:', error);
        return false;
    }
}

// Ademola XD command
ademola({
    pattern: "anticall",
    alias: ["antcall", "blockcall"],
    desc: "Enable/disable anti-call feature",
    category: "security",
    react: "📵",
    use: ".anticall [on/off/status]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner, isGroup }) => {
    try {
        // Only bot owner can use this command
        if (!isOwner) {
            return reply("❌ This command can only be used by the bot owner.", { quoted: fakevCard });
        }

        const state = readState();
        const action = q ? q.toLowerCase().trim() : '';

        if (!action) {
            const statusText = `*📵 ANTICALL SETTINGS*\n\nCurrent Status: ${state.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n*.anticall on* - Enable call blocking\n*.anticall off* - Disable call blocking\n*.anticall status* - Show current status`;
            return reply(statusText, { quoted: fakevCard });
        }

        if (action === 'status') {
            const statusDetails = `*📵 ANTICALL STATUS*\n\n• Status: ${state.enabled ? '✅ Enabled' : '❌ Disabled'}\n• Last Updated: ${new Date(state.lastUpdated).toLocaleString()}\n\nWhen enabled, all incoming calls will be automatically rejected and the caller will be blocked.`;
            return reply(statusDetails, { quoted: fakevCard });
        }

        if (action === 'on' || action === 'off') {
            const enable = action === 'on';
            
            if (state.enabled === enable) {
                return reply(`⚠️ Anticall is already ${enable ? 'enabled' : 'disabled'}.`, { quoted: fakevCard });
            }

            const success = writeState(enable);
            if (success) {
                console.log(`📵 Anticall ${enable ? 'enabled' : 'disabled'} by ${m.sender}`);
                return reply(`✅ Anticall has been ${enable ? 'ENABLED' : 'DISABLED'}.\n\n${enable ? 'All incoming calls will now be automatically rejected and callers will be blocked.' : 'Incoming calls will no longer be automatically blocked.'}`, { quoted: fakevCard });
            } else {
                return reply("❌ Failed to update anticall settings. Please try again.", { quoted: fakevCard });
            }
        }

        // Invalid action
        return reply("*Invalid option!*\n\nUse:\n*.anticall on* - Enable call blocking\n*.anticall off* - Disable call blocking\n*.anticall status* - Show current status", { quoted: fakevCard });

    } catch (error) {
        console.error('Anticall command error:', error);
        await reply("❌ Error processing anticall command.", { quoted: fakevCard });
    }
});

// Export for use in main bot file
module.exports = {
    readState
};