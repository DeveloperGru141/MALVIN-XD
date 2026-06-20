const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');

// Define paths
const databaseDir = path.join(process.cwd(), 'data');
const warningsPath = path.join(databaseDir, 'warnings.json');

// Initialize warnings file if it doesn't exist
function initializeWarningsFile() {
    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir, { recursive: true });
    }
    if (!fs.existsSync(warningsPath)) {
        fs.writeFileSync(warningsPath, JSON.stringify({}), 'utf8');
    }
}

ademola({
    pattern: "warn",
    alias: ["warning"],
    desc: "Warn user in group (auto-kick after 3 warnings)",
    category: "group",
    react: "⚠️",
    use: ".warn @user or reply to user's message",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        // Initialize files first
        initializeWarningsFile();

        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        // Check admin status
        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can use the warn command.');
        }

        let userToWarn;
        
        // SIMPLE METHOD: Same as promote/demote - check participant in contextInfo
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = mek.message.extendedTextMessage.contextInfo.participant;
            console.log('✅ Found user to warn:', userToWarn);
        }
        // Check for mentioned users
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToWarn = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            console.log('✅ Found mentioned user to warn:', userToWarn);
        }
        
        if (!userToWarn) {
            return await reply('❌ Error: Please mention the user or reply to their message to warn!');
        }

        try {
            // Read warnings, create empty object if file is empty
            let warnings = {};
            try {
                warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
            } catch (error) {
                warnings = {};
            }

            // Initialize nested objects if they don't exist
            if (!warnings[from]) warnings[from] = {};
            if (!warnings[from][userToWarn]) warnings[from][userToWarn] = 0;
            
            warnings[from][userToWarn]++;
            fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));

            const warningMessage = `*『 WARNING ALERT 』*\n\n` +
                `👤 *Warned User:* @${userToWarn.split('@')[0]}\n` +
                `⚠️ *Warning Count:* ${warnings[from][userToWarn]}/3\n` +
                `👑 *Warned By:* @${sender.split('@')[0]}\n\n` +
                `📅 *Date:* ${new Date().toLocaleString()}`;

            await ademola.sendMessage(from, { 
                text: warningMessage,
                mentions: [userToWarn, sender]
            }, {
                quoted: fakevCard
            });

            // Auto-kick after 3 warnings
            if (warnings[from][userToWarn] >= 3) {
                await ademola.groupParticipantsUpdate(from, [userToWarn], "remove");
                delete warnings[from][userToWarn];
                fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
                
                const kickMessage = `*『 AUTO-KICK 』*\n\n` +
                    `@${userToWarn.split('@')[0]} has been removed from the group after receiving 3 warnings! ⚠️`;

                await ademola.sendMessage(from, { 
                    text: kickMessage,
                    mentions: [userToWarn]
                }, {
                    quoted: fakevCard
                });
            }
        } catch (error) {
            console.error('Error in warn command:', error);
            await reply('❌ Failed to warn user!');
        }
        
    } catch (error) {
        console.error('Error in warn command:', error);
        await reply('❌ Failed to warn user. Make sure the bot is admin and has sufficient permissions.');
    }
});