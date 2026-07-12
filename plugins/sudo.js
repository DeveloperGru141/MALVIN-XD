const { ademola, fakevCard } = require("../ademola");
const settings = require('../settings');
const { addSudo, removeSudo, getSudoList } = require('../lib/index');

// ========== SUDO LIST COMMAND ==========
ademola({
    pattern: "sudolist",
    alias: ["listsudo", "sudols"],
    desc: "List all sudo users",
    category: "owner",
    react: "📋",
    use: ".sudolist",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const list = await getSudoList();
        if (list.length === 0) {
            return await reply('📋 No sudo users set.');
        }
        
        const sudoList = list.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n');
        
        await ademola.sendMessage(from, { 
            text: `👑 *Sudo Users:*\n\n${sudoList}\n\n📊 Total: ${list.length} user(s)`,
            mentions: list
        }, {
            quoted: fakevCard
        });
        
    } catch (error) {
        console.error('Error in sudolist command:', error);
        await reply('❌ Failed to get sudo list.');
    }
});

// ========== ADD SUDO COMMAND ==========
ademola({
    pattern: "addsudo",
    alias: ["sudoadd", "makesudo"],
    desc: "Add user to sudo (Owner only)",
    category: "owner",
    react: "➕",
    use: ".addsudo @user or .addsudo 263714757857 or reply to user",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        // Check if user is owner using the same method as promote/demote
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));

        if (!isOwner) {
            return await reply('❌ Only owner can add sudo users.');
        }

        let targetJid;
        
        // METHOD 1: Check for replied message
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            console.log('✅ Found user to add sudo (reply):', targetJid);
        }
        // METHOD 2: Check for mentioned users
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            console.log('✅ Found mentioned user to add sudo:', targetJid);
        }
        // METHOD 3: Check for phone number in text
        else if (text) {
            const numbers = text.match(/\d+/g);
            if (numbers && numbers.length > 0) {
                const number = numbers[0].replace(/\D/g, '');
                if (number.length >= 9) {
                    targetJid = `${number}@s.whatsapp.net`;
                    console.log('✅ Found phone number to add sudo:', targetJid);
                }
            }
        }
        
        if (!targetJid) {
            return await reply('❌ Please mention the user, reply to their message, or provide a phone number!\n\n*Usage:*\n• .addsudo @user\n• .addsudo 263714757857\n• Reply to user\'s message with .addsudo');
        }

        // Check if already sudo
        const sudoList = await getSudoList();
        if (sudoList.includes(targetJid)) {
            return await ademola.sendMessage(from, {
                text: `❌ @${targetJid.split('@')[0]} is already a sudo user!`,
                mentions: [targetJid]
            }, {
                quoted: fakevCard
            });
        }

        const ok = await addSudo(targetJid);
        if (ok) {
            await ademola.sendMessage(from, { 
                text: `✅ *Sudo User Added*\n\n👤 User: @${targetJid.split('@')[0]}\n👑 Added by: @${sender.split('@')[0]}\n📅 Date: ${new Date().toLocaleString()}`,
                mentions: [targetJid, sender]
            }, {
                quoted: fakevCard
            });
        } else {
            await reply('❌ Failed to add sudo user.');
        }
        
    } catch (error) {
        console.error('Error in addsudo command:', error);
        await reply('❌ Failed to add sudo user.');
    }
});

// ========== REMOVE SUDO COMMAND ==========
ademola({
    pattern: "delsudo",
    alias: ["removesudo", "rmsudo"],
    desc: "Remove user from sudo (Owner only)",
    category: "owner",
    react: "➖",
    use: ".delsudo @user or .delsudo 263714757857 or reply to user",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        // Check if user is owner using the same method as promote/demote
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));

        if (!isOwner) {
            return await reply('❌ Only owner can remove sudo users.');
        }

        let targetJid;
        
        // METHOD 1: Check for replied message
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            console.log('✅ Found user to remove sudo (reply):', targetJid);
        }
        // METHOD 2: Check for mentioned users
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            console.log('✅ Found mentioned user to remove sudo:', targetJid);
        }
        // METHOD 3: Check for phone number in text
        else if (text) {
            const numbers = text.match(/\d+/g);
            if (numbers && numbers.length > 0) {
                const number = numbers[0].replace(/\D/g, '');
                if (number.length >= 9) {
                    targetJid = `${number}@s.whatsapp.net`;
                    console.log('✅ Found phone number to remove sudo:', targetJid);
                }
            }
        }
        
        if (!targetJid) {
            return await reply('❌ Please mention the user, reply to their message, or provide a phone number!\n\n*Usage:*\n• .delsudo @user\n• .delsudo 263714757857\n• Reply to user\'s message with .delsudo');
        }

        // Check if target is MAIN owner (not sudo)
        const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
        let isTargetMainOwner = targetJid === ownerJid;
        
        // Handle LID format for main owner check
        if (targetJid.includes('@lid')) {
            const lidNumber = targetJid.split('@')[0];
            const regularJid = `${lidNumber}@s.whatsapp.net`;
            isTargetMainOwner = regularJid === ownerJid;
        }

        if (isTargetMainOwner) {
            return await reply('❌ Main owner cannot be removed from sudo.');
        }

        // Check if user is actually sudo
        const sudoList = await getSudoList();
        if (!sudoList.includes(targetJid)) {
            return await ademola.sendMessage(from, {
                text: `❌ @${targetJid.split('@')[0]} is not a sudo user!`,
                mentions: [targetJid]
            }, {
                quoted: fakevCard
            });
        }

        const ok = await removeSudo(targetJid);
        if (ok) {
            await ademola.sendMessage(from, { 
                text: `✅ *Sudo User Removed*\n\n👤 User: @${targetJid.split('@')[0]}\n👑 Removed by: @${sender.split('@')[0]}\n📅 Date: ${new Date().toLocaleString()}`,
                mentions: [targetJid, sender]
            }, {
                quoted: fakevCard
            });
        } else {
            await reply('❌ Failed to remove sudo user.');
        }
        
    } catch (error) {
        console.error('Error in delsudo command:', error);
        await reply('❌ Failed to remove sudo user.');
    }
});

// ========== SUDO HELP COMMAND ==========
ademola({
    pattern: "sudohelp",
    alias: ["helpsudo"],
    desc: "Show sudo commands help",
    category: "owner",
    react: "❓",
    use: ".sudohelp",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const helpText = `👑 *Sudo Management Commands*\n\n` +
            `➕ *Add Sudo:*\n` +
            `• .addsudo @user\n` +
            `• .addsudo 263714757857\n` +
            `• .addsudo (reply to user)\n\n` +
            `➖ *Remove Sudo:*\n` +
            `• .delsudo @user\n` +
            `• .delsudo 263714757857\n` +
            `• .delsudo (reply to user)\n\n` +
            `📋 *List Sudo:*\n` +
            `• .sudolist\n\n` +
            `⚠️ *Note:* Only bot owner can add/remove sudo users. Sudo users can be removed.`;

        await reply(helpText);
        
    } catch (error) {
        console.error('Error in sudohelp command:', error);
        await reply('❌ Failed to show help.');
    }
});