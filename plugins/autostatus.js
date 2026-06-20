const fs = require('fs');
const path = require('path');
const { ademola, fakevCard } = require('../ademola');

// Path to store auto status configuration
const configPath = path.join(__dirname, '../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify({ 
        enabled: false, 
        reactOn: false 
    }, null, 2));
}

// Ademola XD Auto Status Command
ademola({
    pattern: "autostatus",
    alias: ["autostat", "statusauto"],
    desc: "Manage auto status viewing and reactions",
    category: "utility",
    react: "🔄",
    use: ".autostatus [on/off/react on/react off]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isGroup }) => {
    try {
         const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        // Only bot owner can use this command
        if (!isOwner) {
            return reply("❌ This command can only be used by the bot owner!", { quoted: fakevCard });
        }

        // Read current config
        let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // If no arguments, show current status
        if (!q) {
            const status = config.enabled ? '✅ Enabled' : '❌ Disabled';
            const reactStatus = config.reactOn ? '✅ Enabled' : '❌ Disabled';
            
            const statusText = `*🔄 AUTO STATUS SETTINGS*\n\n` +
                `• *Auto Status View:* ${status}\n` +
                `• *Status Reactions:* ${reactStatus}\n\n` +
                `*Commands:*\n` +
                `• .autostatus on - Enable auto status view\n` +
                `• .autostatus off - Disable auto status view\n` +
                `• .autostatus react on - Enable status reactions\n` +
                `• .autostatus react off - Disable status reactions`;
            
            return reply(statusText, { quoted: fakevCard });
        }

        const args = q.toLowerCase().trim().split(' ');
        const command = args[0];

        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`✅ Auto status enabled by ${m.sender}`);
            return reply("✅ *Auto status view has been enabled!*\n\nBot will now automatically view all contact statuses.", { quoted: fakevCard });
        
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`❌ Auto status disabled by ${m.sender}`);
            return reply("❌ *Auto status view has been disabled!*\n\nBot will no longer automatically view statuses.", { quoted: fakevCard });
        
        } else if (command === 'react') {
            // Handle react subcommand
            if (!args[1]) {
                return reply("❌ Please specify on/off for reactions!\n\nUse: *.autostatus react on* or *.autostatus react off*", { quoted: fakevCard });
            }
            
            const reactCommand = args[1];
            if (reactCommand === 'on') {
                config.reactOn = true;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(`💫 Status reactions enabled by ${m.sender}`);
                return reply("💫 *Status reactions have been enabled!*\n\nBot will now react to status updates.", { quoted: fakevCard });
            
            } else if (reactCommand === 'off') {
                config.reactOn = false;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(`❌ Status reactions disabled by ${m.sender}`);
                return reply("❌ *Status reactions have been disabled!*\n\nBot will no longer react to status updates.", { quoted: fakevCard });
            
            } else {
                return reply("❌ Invalid reaction command!\n\nUse: *.autostatus react on* or *.autostatus react off*", { quoted: fakevCard });
            }
        
        } else {
            return reply("❌ Invalid command!\n\n*Available commands:*\n• .autostatus on/off\n• .autostatus react on/off\n• .autostatus - Show current settings", { quoted: fakevCard });
        }

    } catch (error) {
        console.error('Auto status command error:', error);
        return reply("❌ Error occurred while managing auto status settings.", { quoted: fakevCard });
    }
});

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        if (!fs.existsSync(configPath)) {
            return false;
        }
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.enabled;
    } catch (error) {
        console.error('Error checking auto status config:', error);
        return false;
    }
}

// Function to check if status reactions are enabled
function isStatusReactionEnabled() {
    try {
        if (!fs.existsSync(configPath)) {
            return false;
        }
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.reactOn;
    } catch (error) {
        console.error('Error checking status reaction config:', error);
        return false;
    }
}

// Function to react to status using proper method
async function reactToStatus(ademola, statusKey) {
    try {
        if (!isStatusReactionEnabled()) {
            return;
        }

        // Use the proper relayMessage method for status reactions
        await ademola.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
        
        console.log(`💚 Reacted to status from ${statusKey.participant || 'unknown'}`);
    } catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}

// Function to handle status updates
async function handleStatusUpdate(ademola, status) {
    try {
        if (!isAutoStatusEnabled()) {
            return;
        }

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await ademola.readMessages([msg.key]);
                    console.log(`👀 Viewed status from ${msg.key.participant || 'unknown'}`);
                    
                    // React to status if enabled
                    await reactToStatus(ademola, msg.key);
                    
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ Rate limit hit, waiting before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await ademola.readMessages([msg.key]);
                    } else {
                        console.error('❌ Error viewing status:', err.message);
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await ademola.readMessages([status.key]);
                console.log(`👀 Viewed status from ${status.key.participant || 'unknown'}`);
                
                // React to status if enabled
                await reactToStatus(ademola, status.key);
                
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await ademola.readMessages([status.key]);
                } else {
                    console.error('❌ Error viewing status:', err.message);
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                await ademola.readMessages([status.reaction.key]);
                console.log(`👀 Viewed status reaction from ${status.reaction.key.participant || 'unknown'}`);
                
                // React to status if enabled
                await reactToStatus(ademola, status.reaction.key);
                
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await ademola.readMessages([status.reaction.key]);
                } else {
                    console.error('❌ Error viewing status reaction:', err.message);
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

// Export functions for use in main bot file
module.exports = {
    handleStatusUpdate,
    isAutoStatusEnabled,
    isStatusReactionEnabled
};