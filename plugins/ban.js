const fs = require('fs');
const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');

// Ademola XD Ban Command
ademola({
    pattern: "ban",
    alias: ["blockuser", "userban"],
    desc: "Ban user from using the bot",
    category: "moderation",
    react: "🔨",
    use: ".ban [mention user or reply to message]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isAdmin, isGroup }) => {
    try {
    
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(m.sender));
        let userToBan;

        // Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToBan = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToBan = mek.message.extendedTextMessage.contextInfo.participant;
        }
        // Check if user ID is provided in query
        else if (q && q.includes('@')) {
            userToBan = q.trim();
        }

        if (!userToBan) {
            return reply(
                "❌ Please mention the user, reply to their message, or provide their JID to ban!\n\n" +
                "Examples:\n" +
                "• .ban @user\n" +
                "• Reply to user's message with .ban\n" +
                "• .ban 1234567890@s.whatsapp.net",
                { quoted: fakevCard }
            );
        }

        // Ensure userToBan is in correct format
        if (!userToBan.includes('@s.whatsapp.net') && !userToBan.includes('@lid')) {
            userToBan = userToBan.replace('@', '') + '@s.whatsapp.net';
        }

        // Prevent banning the bot itself
        try {
            const botId = ademola.user.id.split(':')[0] + '@s.whatsapp.net';
            const botLid = ademola.user.id.split(':')[0] + '@lid';
            
            if (userToBan === botId || userToBan === botLid) {
                return reply("❌ You cannot ban the bot account.", { quoted: fakevCard });
            }
        } catch {}

        // Check permissions
        if (isGroup) {
            const adminStatus = await isAdmin();
            if (!adminStatus.isBotAdmin) {
                return reply("❌ Please make the bot an admin to use ban command.", { quoted: fakevCard });
            }
            if (!adminStatus.isSenderAdmin && !mek.key.fromMe) {
                return reply("❌ Only group admins can use ban command.", { quoted: fakevCard });
            }
        } else {
            if (!isOwner) {
                return reply("❌ Only bot owner can use ban command in private chat.", { quoted: fakevCard });
            }
        }

        // Prevent banning owner/sudo
        const { isSudo } = require('../lib/index');
        const targetIsSudo = await isSudo(userToBan);
        if (targetIsSudo) {
            return reply("❌ Cannot ban sudo/owner users.", { 
                mentions: [userToBan],
                quoted: fakevCard 
            });
        }

        try {
            // Ensure banned.json exists
            const bannedPath = './data/banned.json';
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            if (!fs.existsSync(bannedPath)) {
                fs.writeFileSync(bannedPath, JSON.stringify([], null, 2));
            }

            // Add user to banned list
            const bannedUsers = JSON.parse(fs.readFileSync(bannedPath, 'utf8'));
            
            if (!bannedUsers.includes(userToBan)) {
                bannedUsers.push(userToBan);
                fs.writeFileSync(bannedPath, JSON.stringify(bannedUsers, null, 2));
                
                const userNumber = userToBan.split('@')[0];
                console.log(`🔨 User banned: ${userToBan} by ${m.sender}`);
                
                return reply(
                    `✅ Successfully banned @${userNumber}!\n\nThey can no longer use bot commands.`,
                    { 
                        mentions: [userToBan],
                        quoted: fakevCard 
                    }
                );
            } else {
                const userNumber = userToBan.split('@')[0];
                return reply(
                    `⚠️ @${userNumber} is already banned!`,
                    { 
                        mentions: [userToBan],
                        quoted: fakevCard 
                    }
                );
            }
        } catch (error) {
            console.error('Error in ban command:', error);
            return reply("❌ Failed to ban user! Please try again.", { quoted: fakevCard });
        }
    } catch (error) {
        console.error('Ban command error:', error);
        return reply("❌ Error processing ban command.", { quoted: fakevCard });
    }
});

// Unban command
ademola({
    pattern: "unban",
    alias: ["unblockuser", "userunban"],
    desc: "Unban user from using the bot",
    category: "moderation",
    react: "🔓",
    use: ".unban [mention user or provide JID]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isAdmin, isGroup }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(m.sender));
        let userToUnban;

        // Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToUnban = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check if user ID is provided in query
        else if (q && q.includes('@')) {
            userToUnban = q.trim();
        }

        if (!userToUnban) {
            return reply(
                "❌ Please mention the user or provide their JID to unban!\n\n" +
                "Examples:\n" +
                "• .unban @user\n" +
                "• .unban 1234567890@s.whatsapp.net",
                { quoted: fakevCard }
            );
        }

        // Ensure userToUnban is in correct format
        if (!userToUnban.includes('@s.whatsapp.net') && !userToUnban.includes('@lid')) {
            userToUnban = userToUnban.replace('@', '') + '@s.whatsapp.net';
        }

        // Check permissions
        if (isGroup) {
            const adminStatus = await isAdmin();
            if (!adminStatus.isBotAdmin) {
                return reply("❌ Please make the bot an admin to use unban command.", { quoted: fakevCard });
            }
            if (!adminStatus.isSenderAdmin && !mek.key.fromMe) {
                return reply("❌ Only group admins can use unban command.", { quoted: fakevCard });
            }
        } else {
            if (!isOwner) {
                return reply("❌ Only bot owner can use unban command in private chat.", { quoted: fakevCard });
            }
        }

        try {
            const bannedPath = './data/banned.json';
            if (!fs.existsSync(bannedPath)) {
                return reply("❌ No banned users found.", { quoted: fakevCard });
            }

            // Remove user from banned list
            const bannedUsers = JSON.parse(fs.readFileSync(bannedPath, 'utf8'));
            const userIndex = bannedUsers.indexOf(userToUnban);
            
            if (userIndex !== -1) {
                bannedUsers.splice(userIndex, 1);
                fs.writeFileSync(bannedPath, JSON.stringify(bannedUsers, null, 2));
                
                const userNumber = userToUnban.split('@')[0];
                console.log(`🔓 User unbanned: ${userToUnban} by ${m.sender}`);
                
                return reply(
                    `✅ Successfully unbanned @${userNumber}!\n\nThey can now use bot commands again.`,
                    { 
                        mentions: [userToUnban],
                        quoted: fakevCard 
                    }
                );
            } else {
                const userNumber = userToUnban.split('@')[0];
                return reply(
                    `ℹ️ @${userNumber} is not in the banned list.`,
                    { 
                        mentions: [userToUnban],
                        quoted: fakevCard 
                    }
                );
            }
        } catch (error) {
            console.error('Error in unban command:', error);
            return reply("❌ Failed to unban user! Please try again.", { quoted: fakevCard });
        }
    } catch (error) {
        console.error('Unban command error:', error);
        return reply("❌ Error processing unban command.", { quoted: fakevCard });
    }
});

// Banlist command
ademola({
    pattern: "banlist",
    alias: ["banned", "blockedusers"],
    desc: "Show list of banned users",
    category: "moderation",
    react: "📋",
    use: ".banlist",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isAdmin, isGroup }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(m.sender));
        // Check permissions
        if (isGroup) {
            const adminStatus = await isAdmin();
            if (!adminStatus.isSenderAdmin && !mek.key.fromMe && !isOwner) {
                return reply("❌ Only admins can view the ban list.", { quoted: fakevCard });
            }
        } else {
            if (!isOwner) {
                return reply("❌ Only bot owner can view the ban list.", { quoted: fakevCard });
            }
        }

        try {
            const bannedPath = './data/banned.json';
            if (!fs.existsSync(bannedPath)) {
                return reply("📋 *BANNED USERS LIST*\n\nNo users are currently banned.", { quoted: fakevCard });
            }

            const bannedUsers = JSON.parse(fs.readFileSync(bannedPath, 'utf8'));
            
            if (bannedUsers.length === 0) {
                return reply("📋 *BANNED USERS LIST*\n\nNo users are currently banned.", { quoted: fakevCard });
            }

            let banListText = `📋 *BANNED USERS LIST*\n\n*Total Banned:* ${bannedUsers.length}\n\n`;
            
            bannedUsers.forEach((user, index) => {
                const userNumber = user.split('@')[0];
                banListText += `${index + 1}. @${userNumber}\n`;
            });

            banListText += `\nUse *.unban @user* to unban someone.`;

            return reply(banListText, { 
                mentions: bannedUsers,
                quoted: fakevCard 
            });
        } catch (error) {
            console.error('Error in banlist command:', error);
            return reply("❌ Failed to load ban list! Please try again.", { quoted: fakevCard });
        }
    } catch (error) {
        console.error('Banlist command error:', error);
        return reply("❌ Error processing banlist command.", { quoted: fakevCard });
    }
});

module.exports = {
    // Export for use in isBanned check
};