const { ademola, fakevCard } = require("../ademola");
const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

// Antitag command handler
ademola({
    pattern: "antitag",
    alias: ["antimention", "notag"],
    desc: "Prevent mass tagging in groups",
    category: "group",
    react: "🚫",
    use: ".antitag [on/off/set delete|kick]",
    filename: __filename,
}, async (ademola, mek, m, { from, sender, isGroup, reply, text, isAdmin }) => {
    try {
        // Check if it's a group
        if (!isGroup) {
            return await reply("❌ This command can only be used in groups!");
        }

        // Check admin status
        const adminStatus = await isAdmin(ademola, from, sender);
        
        if (!adminStatus.isSenderAdmin) {
            return await reply("🔒 Only admins can use the antitag command.");
        }

        if (!adminStatus.isBotAdmin) {
            return await reply("🤖 I need to be an admin to use this command.");
        }

        const args = text ? text.toLowerCase().trim().split(' ') : [];
        const action = args[0];

        if (!action) {
            const usage = `🚫 *Antitag Setup*\n\n📖 *Usage:*\n• .antitag on\n• .antitag set delete | kick\n• .antitag off\n• .antitag get\n\n💡 *Actions:*\ndelete - Delete tagall messages\nkick - Kick users who tagall\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 🤖 ADEMOLA XD 🔥*`;
            return await reply(usage);
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntitag(from, 'on');
                if (existingConfig?.enabled) {
                    return await reply("✅ *Antitag is already ON*");
                }
                const result = await setAntitag(from, 'on', 'delete');
                await reply(result ? "✅ *Antitag has been turned ON*" : "❌ *Failed to turn on Antitag*");
                break;

            case 'off':
                await removeAntitag(from, 'on');
                await reply("✅ *Antitag has been turned OFF*");
                break;

            case 'set':
                if (args.length < 2) {
                    return await reply("❌ *Please specify an action:*\n.antitag set delete | kick");
                }
                const setAction = args[1];
                if (!['delete', 'kick'].includes(setAction)) {
                    return await reply("❌ *Invalid action. Choose delete or kick.*");
                }
                const setResult = await setAntitag(from, 'on', setAction);
                await reply(setResult ? `✅ *Antitag action set to ${setAction}*` : "❌ *Failed to set Antitag action*");
                break;

            case 'get':
                const status = await getAntitag(from, 'on');
                const actionConfig = await getAntitag(from, 'on');
                await reply(
                    `🚫 *Antitag Configuration:*\n\n` +
                    `📊 Status: ${status ? '🟢 ON' : '🔴 OFF'}\n` +
                    `⚡ Action: ${actionConfig ? actionConfig.action : 'Not set'}\n\n` +
                    `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 🤖 ADEMOLA XD 🔥*`
                );
                break;

            default:
                await reply("❌ *Invalid command. Use .antitag for usage.*");
        }
    } catch (error) {
        console.error('Error in antitag command:', error);
        await reply("❌ *Error processing antitag command*");
    }
});

// Tag detection function (for integration in main bot)
async function handleTagDetection(ademola, from, mek, sender) {
    try {
        const antitagSetting = await getAntitag(from, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Check if message contains mentions
        const mentions = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || 
                        mek.message?.conversation?.match(/@\d+/g) ||
                        [];

        // Check if it's a group message and has multiple mentions
        if (mentions.length > 0 && mentions.length >= 3) {
            // Get group participants to check if it's tagging most/all members
            const groupMetadata = await ademola.groupMetadata(from);
            const participants = groupMetadata.participants || [];
            
            // If mentions are more than 50% of group members, consider it as tagall
            const mentionThreshold = Math.ceil(participants.length * 0.5);
            
            if (mentions.length >= mentionThreshold) {
                const action = antitagSetting.action || 'delete';
                
                if (action === 'delete') {
                    // Delete the message
                    await ademola.sendMessage(from, {
                        delete: {
                            remoteJid: from,
                            fromMe: false,
                            id: mek.key.id,
                            participant: sender
                        }
                    });
                    
                    // Send warning
                    await ademola.sendMessage(from, {
                        text: `⚠️ *Tagall Detected!*\n\nMass tagging is not allowed in this group.`,
                        mentions: [sender]
                    }, { quoted: fakevCard });
                    
                } else if (action === 'kick') {
                    // First delete the message
                    await ademola.sendMessage(from, {
                        delete: {
                            remoteJid: from,
                            fromMe: false,
                            id: mek.key.id,
                            participant: sender
                        }
                    });

                    // Then kick the user
                    await ademola.groupParticipantsUpdate(from, [sender], "remove");

                    // Send notification
                    await ademola.sendMessage(from, {
                        text: `🚫 *Antitag Detected!*\n\n@${sender.split('@')[0]} has been kicked for mass tagging members.`,
                        mentions: [sender]
                    }, { quoted: fakevCard });
                }
            }
        }
    } catch (error) {
        console.error('Error in tag detection:', error);
    }
}

// Export for use in main bot file
module.exports = { handleTagDetection };