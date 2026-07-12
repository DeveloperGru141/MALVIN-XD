const { ademola, fakevCard } = require("../ademola");

// ==================== GROUP STATS ====================
ademola({
    pattern: "groupstats",
    alias: ["gstats", "groupinfo"],
    desc: "Show group statistics and information",
    category: "group",
    react: "📊",
    use: ".groupstats",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');
        
        const adminStatus = await isAdmin();
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can view group stats!');

        const groupMetadata = await ademola.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        
        const stats = {
            total: participants.length,
            admins: participants.filter(p => p.admin).length,
            users: participants.filter(p => !p.admin).length
        };

        const analysis = [
            `👥 *Total Members:* ${stats.total}`,
            `👑 *Admins:* ${stats.admins}`,
            `👤 *Regular Users:* ${stats.users}`,
            `📝 *Group Description:* ${groupMetadata.desc || 'No description set'}`,
            `🆔 *Group ID:* ${groupMetadata.id}`
        ];

        await reply(`📊 *Group Statistics*\n\n${analysis.join('\n')}`);

    } catch (error) {
        console.error('GroupStats Error:', error);
        await reply('❌ Failed to get group statistics');
    }
});

// ==================== LEAVE GROUP ====================
ademola({
    pattern: 'leave',
    alias: ['left', 'leavegc', 'exit'],
    desc: 'Leave the current group',
    category: "group",
    react: '👋',
    use: '.leave',
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isGroup, sender }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');

        const isOwner = await require('../lib/isOwner')(sender);
        if (!isOwner) return await reply('❌ Only bot owner can make the bot leave groups!');

        await reply('👋 Leaving the group...');
        await ademola.groupLeave(from);

    } catch (error) {
        console.error('Leave error:', error);
        await reply('❌ Failed to leave group');
    }
});

// ==================== UPDATE GROUP DESCRIPTION ====================
ademola({
    pattern: 'gdesc',
    alias: ['setdesc'],
    desc: 'Change the group description',
    category: "group",
    react: '📜',
    use: '.gdesc <new description>',
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');
        
        const adminStatus = await isAdmin();
        if (!adminStatus.isBotAdmin) return await reply('❌ Bot must be admin!');
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can change group description!');

        if (!q) return await reply('❌ Please provide a new group description');

        await ademola.groupUpdateDescription(from, q);
        await reply('✅ Group description has been updated successfully!');

    } catch (error) {
        console.error('GroupDesc error:', error);
        await reply('❌ Failed to update group description');
    }
});

// ==================== JOIN GROUP ====================
ademola({
    pattern: 'join',
    alias: ['joingroup'],
    desc: 'Join a group via invite link',
    category: "group",
    react: '📬',
    use: '.join <group invite link>',
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const isOwner = await require('../lib/isOwner')(sender);
        if (!isOwner) return await reply('❌ Only bot owner can use this command!');

        if (!q || !q.includes('chat.whatsapp.com')) {
            return await reply('❌ Please provide a valid WhatsApp group invite link');
        }

        const code = q.split('https://chat.whatsapp.com/')[1];
        if (!code) return await reply('❌ Invalid group invite link');

        await ademola.groupAcceptInvite(code);
        await reply('✅ Successfully joined the group!');

    } catch (error) {
        console.error('Join error:', error);
        await reply('❌ Failed to join group. Invalid link or bot is already in the group.');
    }
});

// ==================== GET GROUP INVITE LINK ====================
ademola({
    pattern: 'invite',
    alias: ['grouplink', 'link'],
    desc: 'Get the group invite link',
    category: "group",
    react: '🖇️',
    use: '.invite',
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');
        
        const adminStatus = await isAdmin();
        if (!adminStatus.isBotAdmin) return await reply('❌ Bot must be admin to get invite link!');
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can get group invite link!');

        const code = await ademola.groupInviteCode(from);
        await reply(`🖇️ *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`);

    } catch (error) {
        console.error('Invite error:', error);
        await reply('❌ Failed to get group invite link');
    }
});

// ==================== CLOSE GROUP BY TIME ====================
ademola({
    pattern: 'closetime',
    alias: ['closegroup'],
    desc: 'Close group after specified time',
    category: "group",
    react: '🔒',
    use: '.closetime <number> <s/m/h/d>',
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');
        
        const adminStatus = await isAdmin();
        if (!adminStatus.isBotAdmin) return await reply('❌ Bot must be admin!');
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can use this command!');

        if (!q) return await reply('❌ Please specify time: .closetime 10 m (for 10 minutes)');

        const [time, unit] = q.split(' ');
        const timeValue = parseInt(time);

        if (!timeValue || !unit) {
            return await reply('❌ Invalid format! Use: .closetime <number> <s/m/h/d>\nExample: .closetime 30 m (for 30 minutes)');
        }

        let milliseconds;
        switch(unit.toLowerCase()) {
            case 's': milliseconds = timeValue * 1000; break;
            case 'm': milliseconds = timeValue * 60 * 1000; break;
            case 'h': milliseconds = timeValue * 60 * 60 * 1000; break;
            case 'd': milliseconds = timeValue * 24 * 60 * 60 * 1000; break;
            default: return await reply('❌ Invalid time unit! Use: s (seconds), m (minutes), h (hours), d (days)');
        }

        await reply(`⏰ Group will close in ${time} ${unit}`);

        setTimeout(async () => {
            try {
                await ademola.groupSettingUpdate(from, 'announcement');
                await ademola.sendMessage(from, { text: '🔒 Group has been automatically closed!' });
            } catch (error) {
                console.error('Auto-close error:', error);
            }
        }, milliseconds);

    } catch (error) {
        console.error('CloseTime error:', error);
        await reply('❌ Failed to schedule group closing');
    }
});

// ==================== PIN MESSAGE ====================

ademola({
    pattern: 'pin',
    alias: ['pinmessage'],
    desc: 'Pin a replied message',
    category: "group",
    react: '📌',
    use: '.pin (reply to a message)',
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');
        
        const adminStatus = await isAdmin();
        if (!adminStatus.isBotAdmin) return await reply('❌ Bot must be admin!');
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can pin messages!');

        if (!mek.message?.extendedTextMessage?.contextInfo) {
            return await reply('❌ Please reply to a message to pin it!');
        }

        // Get the message ID correctly
        const quotedMessage = mek.message.extendedTextMessage.contextInfo;
        const messageId = quotedMessage.stanzaId || quotedMessage.id;
        
        if (!messageId) {
            return await reply('❌ Could not find message ID to pin');
        }

        // Pin the message
        await ademola.sendMessage(from, { 
            pin: messageId 
        });

        await reply('📌 Message pinned successfully!');

    } catch (error) {
        console.error('Pin error:', error);
        
        if (error.message?.includes('not authorized')) {
            await reply('❌ Bot does not have permission to pin messages. Make sure bot is admin.');
        } else if (error.message?.includes('message not found')) {
            await reply('❌ Message not found. It may have been deleted.');
        } else {
            await reply('❌ Failed to pin message');
        }
    }
});

// ==================== GROUP SETTINGS ====================
ademola({
    pattern: 'groupsettings',
    alias: ['gsettings'],
    desc: 'Change group settings',
    category: "group",
    react: '⚙️',
    use: '.groupsettings <edit/link> <on/off>',
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');
        
        const adminStatus = await isAdmin();
        if (!adminStatus.isBotAdmin) return await reply('❌ Bot must be admin!');
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can change group settings!');

        const [setting, action] = q ? q.split(' ') : [];
        
        if (!setting || !action) {
            return await reply(`⚙️ *Group Settings*\n\n• Edit: .groupsettings edit on/off\n• Link: .groupsettings link on/off`);
        }

        let result;
        if (setting === 'edit') {
            result = action === 'on' ? 'locked' : 'unlocked';
            await ademola.groupSettingUpdate(from, result);
            await reply(`✅ Group edit settings ${action === 'on' ? 'locked (admins only)' : 'unlocked (all members)'}`);
        } 
        else if (setting === 'link') {
            result = action === 'on' ? 'approval' : 'no_approval';
            await ademola.groupSettingUpdate(from, result);
            await reply(`✅ Group link settings ${action === 'on' ? 'require admin approval' : 'open for anyone to join'}`);
        } 
        else {
            await reply('❌ Invalid setting! Use: edit or link');
        }

    } catch (error) {
        console.error('GroupSettings error:', error);
        await reply('❌ Failed to update group settings');
    }
});

// ==================== CREATE POLL ====================
ademola({
    pattern: 'poll',
    alias: ['createpoll'],
    desc: 'Create a poll in group',
    category: "group",
    react: '📊',
    use: '.poll <question> | <option1> | <option2> | ...',
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');
        
        const adminStatus = await isAdmin();
        if (!adminStatus.isBotAdmin) return await reply('❌ Bot must be admin!');
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can create polls!');

        if (!q || !q.includes('|')) {
            return await reply('❌ Usage: .poll Question | Option1 | Option2 | Option3\nExample: .poll Best color? | Red | Blue | Green');
        }

        const parts = q.split('|').map(p => p.trim());
        const question = parts[0];
        const options = parts.slice(1);

        if (options.length < 2) return await reply('❌ Please provide at least 2 options');
        if (options.length > 5) return await reply('❌ Maximum 5 options allowed');

        await ademola.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        });

        await reply('📊 Poll created successfully!');

    } catch (error) {
        console.error('Poll error:', error);
        await reply('❌ Failed to create poll');
    }
});

// ==================== BAN USER ====================
ademola({
    pattern: 'gcban',
    alias: ['banuser'],
    desc: 'Ban user from group',
    category: "group",
    react: '🚫',
    use: '.ban @user or reply to user',
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isGroup, sender, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');

        let usersToBan = [];
        
        // Check replied message
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            usersToBan = [mek.message.extendedTextMessage.contextInfo.participant];
        } 
        // Check mentioned users
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            usersToBan = mek.message.extendedTextMessage.contextInfo.mentionedJid.filter(jid => !jid.includes('status@broadcast'));
        }
        
        if (usersToBan.length === 0) {
            return await reply('❌ Please mention the user or reply to their message to ban!');
        }

        const adminStatus = await isAdmin();
        if (!adminStatus.isBotAdmin) return await reply('❌ Bot must be admin to ban users!');
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can ban users!');

        const botId = ademola.user.id.split(':')[0] + '@s.whatsapp.net';
        if (usersToBan.some(jid => jid === botId)) {
            return await reply("🤖 I can't ban myself!");
        }

        // Remove users from group
        await ademola.groupParticipantsUpdate(from, usersToBan, "remove");
        
        const usernames = usersToBan.map(jid => `@${jid.split('@')[0]}`);
        await reply(`🚫 *Users Banned:*\n${usernames.map(name => `• ${name}`).join('\n')}\n\n👑 *By:* @${sender.split('@')[0]}`);

    } catch (error) {
        console.error('Ban error:', error);
        await reply('❌ Failed to ban user(s). Make sure the bot is admin.');
    }
});

// ==================== UNBAN USER ====================
ademola({
    pattern: 'gcunban',
    alias: ['unbanuser'],
    desc: 'Unban user (allow them to rejoin group)',
    category: "group",
    react: '✅',
    use: '.unban <phone number>',
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) return await reply('❌ This command can only be used in groups!');

        const adminStatus = await isAdmin();
        if (!adminStatus.isSenderAdmin) return await reply('❌ Only admins can unban users!');

        if (!q) {
            return await reply('❌ Please provide a phone number to unban\nExample: .unban 1234567890');
        }

        // Extract phone number from input
        const phoneNumber = q.replace(/[^0-9]/g, '');
        if (phoneNumber.length < 8) {
            return await reply('❌ Please provide a valid phone number');
        }

        const userJid = `${phoneNumber}@s.whatsapp.net`;
        
        await reply(`✅ User +${phoneNumber} has been unbanned and can now rejoin the group using the invite link.`);

    } catch (error) {
        console.error('Unban error:', error);
        await reply('❌ Failed to unban user');
    }
});

// ==================== SILENCE USER ====================
