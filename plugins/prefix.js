//---------------------------------------------
//           ADEMOLA-XD PREFIX SYSTEM
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola } = require('../ademola');
const { getPrefix, setPrefix, resetPrefix } = require('../lib/prefix');

// PREFIX COMMAND - Show current prefix
ademola({
    pattern: "prefix",
    alias: ["botprefix", "pref"],
    desc: "Show current bot prefix",
    category: "general", 
    react: "🔧",
    filename: __filename
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
       const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        const currentPrefix = getPrefix();
        const defaultPrefix = '.';
        
        let text = `🔧 *PREFIX INFORMATION*\n\n`;
        text += `• Current prefix: \`${currentPrefix}\`\n`;
        text += `• Default prefix: \`${defaultPrefix}\`\n`;
        text += `• Usage: ${currentPrefix}command\n\n`;
        
        if (isOwner) {
            text += `💡 *OWNER COMMANDS:*\n`;
            text += `• ${currentPrefix}setprefix <new prefix> - Change prefix\n`;
            text += `• ${currentPrefix}resetprefix - Reset to default`;
        } else {
            text += `💡 Contact bot owner to change prefix.`;
        }
        
        await reply(text);
        
    } catch (error) {
        await reply('❌ Error fetching prefix information');
        console.error('Prefix command error:', error);
    }
});

// SETPREFIX COMMAND - Change prefix (FIXED VERSION)
ademola({
    pattern: "setprefix",
    alias: ["changeprefix", "newprefix"],
    desc: "Change the bot prefix", 
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (ademola, mek, m, { from, reply, text, body, args, sender }) => {
    try {
    
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) {
            return await reply('❌ Only bot owner can change prefix!');
        }
        
        const currentPrefix = getPrefix();
        
        // DEBUG: Log what we're receiving
        console.log('🔧 Setprefix Debug:', { 
            text: text, 
            body: body, 
            args: args,
            currentPrefix: currentPrefix 
        });
        
        let newPrefix;
        
        // Method 1: Try using 'text' parameter first
        if (text && text.trim().length > 0) {
            newPrefix = text.trim().split(' ')[0];
            console.log('🔧 Using text parameter, newPrefix:', newPrefix);
        }
        // Method 2: Try using 'body' parameter
        else if (body) {
            // Remove the command part and get the argument
            const commandPart = `${currentPrefix}setprefix`;
            const prefixArg = body.replace(commandPart, '').trim();
            if (prefixArg) {
                newPrefix = prefixArg.split(' ')[0];
                console.log('🔧 Using body parameter, newPrefix:', newPrefix);
            }
        }
        // Method 3: Try using 'args' parameter
        else if (args && args.length > 0) {
            newPrefix = args[0];
            console.log('🔧 Using args parameter, newPrefix:', newPrefix);
        }
        
        console.log('🔧 Final newPrefix:', newPrefix);
        
        // If no prefix provided, show usage
        if (!newPrefix || newPrefix.trim().length === 0) {
            return await reply(`⚙️ *SET PREFIX*\n\nCurrent prefix: \`${currentPrefix}\`\n\nUsage: ${currentPrefix}setprefix <new prefix>\n\nExample: ${currentPrefix}setprefix !`);
        }
        
        // Clean up the prefix
        newPrefix = newPrefix.trim();
        
        // Validate prefix
        if (newPrefix.length > 3) {
            return await reply('❌ Prefix must be 1-3 characters long');
        }
        
        if (newPrefix === currentPrefix) {
            return await reply(`❌ Prefix is already set to: \`${newPrefix}\``);
        }
        
        // Special characters validation
        const invalidChars = /[\\/<>{}[\]()]/;
        if (invalidChars.test(newPrefix)) {
            return await reply('❌ Prefix contains invalid characters. Use only letters, numbers, or symbols like ! @ # $ % & * etc.');
        }
        
        // Set new prefix
        setPrefix(newPrefix);
        
        const successText = `✅ *PREFIX UPDATED*\n\nNew prefix: \`${newPrefix}\`\n\n*Example usage:*\n${newPrefix}help\n${newPrefix}menu\n${newPrefix}ping\n\n💡 The prefix change is permanent and will persist after bot restart.`;
        
        await reply(successText);
        
        // Also send a test message with new prefix
        await ademola.sendMessage(from, { 
            text: `🔧 *Test message with new prefix:*\nType \`${newPrefix}ping\` to test if it works!` 
        });
        
    } catch (error) {
        console.error('Setprefix command error:', error);
        await reply('❌ Failed to change prefix: ' + error.message);
    }
});

// RESETPREFIX COMMAND - Reset to default
ademola({
    pattern: "resetprefix", 
    alias: ["defaultprefix", "restoreprefix"],
    desc: "Reset prefix to default",
    category: "owner",
    react: "🔄",
    filename: __filename
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) {
            return await reply('❌ Only bot owner can reset prefix!');
        }
        
        const currentPrefix = getPrefix();
        const defaultPrefix = '.';
        
        if (currentPrefix === defaultPrefix) {
            return await reply(`❌ Prefix is already the default: \`${defaultPrefix}\``);
        }
        
        // Reset to default
        resetPrefix();
        
        await reply(`🔄 *PREFIX RESET*\n\nPrefix reset to default: \`${defaultPrefix}\`\n\nAll commands now use: ${defaultPrefix}command`);
        
    } catch (error) {
        await reply('❌ Failed to reset prefix');
        console.error('Resetprefix command error:', error);
    }
});
