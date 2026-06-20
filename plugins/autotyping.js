const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');

// Path to store the configuration
const configPath = path.join(__dirname, '..', 'data', 'autotyping.json');

// Initialize configuration file if it doesn't exist
function initConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

// Function to check if autotyping is enabled
function isAutotypingEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('Error checking autotyping status:', error);
        return false;
    }
}

// Function to handle autotyping for regular messages
async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (isAutotypingEnabled()) {
        try {
            // First subscribe to presence updates for this chat
            await sock.presenceSubscribe(chatId);
            
            // Send available status first
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Then send the composing status
            await sock.sendPresenceUpdate('composing', chatId);
            
            // Simulate typing time based on message length with increased minimum time
            const typingDelay = Math.max(3000, Math.min(8000, userMessage.length * 150));
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            
            // Send composing again to ensure it stays visible
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Finally send paused status
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true; // Indicates typing was shown
        } catch (error) {
            console.error('❌ Error sending typing indicator:', error);
            return false; // Indicates typing failed
        }
    }
    return false; // Autotyping is disabled
}

// Function to show typing status AFTER command execution
async function showTypingAfterCommand(sock, chatId) {
    if (isAutotypingEnabled()) {
        try {
            // This function runs after the command has been executed and response sent
            // So we just need to show a brief typing indicator
            
            // Subscribe to presence updates
            await sock.presenceSubscribe(chatId);
            
            // Show typing status briefly
            await sock.sendPresenceUpdate('composing', chatId);
            
            // Keep typing visible for a short time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Then pause
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true;
        } catch (error) {
            console.error('❌ Error sending post-command typing indicator:', error);
            return false;
        }
    }
    return false; // Autotyping is disabled
}

// Autotyping command using Ademola XD framework
ademola({
    pattern: "autotyping",
    alias: ["autotype", "typing"],
    desc: "Enable/disable auto-typing indicator",
    category: "utility",
    react: "⌨️",
    use: ".autotyping [on/off]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) {
            return reply("❌ This command is only available for the owner!", { quoted: fakevCard });
        }

        // Initialize or read config
        const config = initConfig();
        
        // Toggle based on argument or toggle current state if no argument
        if (q) {
            const action = q.toLowerCase();
            if (action === 'on' || action === 'enable') {
                config.enabled = true;
            } else if (action === 'off' || action === 'disable') {
                config.enabled = false;
            } else {
                return reply("❌ Invalid option! Use: .autotyping on/off", { quoted: fakevCard });
            }
        } else {
            // Toggle current state
            config.enabled = !config.enabled;
        }
        
        // Save updated configuration
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        // Send confirmation message
        await reply(`✅ Auto-typing has been ${config.enabled ? 'enabled' : 'disabled'}!`, { quoted: fakevCard });
        
    } catch (error) {
        console.error('Error in autotyping command:', error);
        await reply("❌ Error processing command!", { quoted: fakevCard });
    }
});

// Export functions for use in main bot file
module.exports = {
    isAutotypingEnabled,
    handleAutotypingForMessage,
    showTypingAfterCommand
};