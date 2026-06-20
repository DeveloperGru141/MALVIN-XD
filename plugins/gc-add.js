const { ademola, fakevCard } = require("../ademola");
const { phoneNumberToJid } = require('@whiskeysockets/baileys');

ademola({
    pattern: "groupadd",
    alias: ["add", "gadd"],
    desc: "Add user to group by mention, reply, or phone number",
    category: "group",
    react: "➕",
    use: ".groupadd @user OR .groupadd 263714757857 OR reply to user's message",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can use this command.');
        }

        let usersToAdd = [];
        
        // Method 1: Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            usersToAdd = mek.message.extendedTextMessage.contextInfo.mentionedJid.filter(jid => !jid.includes('status@broadcast'));
            console.log('✅ Found mentioned users:', usersToAdd);
        }
        // Method 2: Check for replied message
        else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            usersToAdd = [mek.message.extendedTextMessage.contextInfo.participant];
            console.log('✅ Found replied user:', usersToAdd);
        }
        // Method 3: Check for phone number in text
        else if (text) {
            const numbers = text.match(/\d+/g);
            if (numbers && numbers.length > 0) {
                for (let number of numbers) {
                    // Clean the number and convert to JID
                    number = number.replace(/\D/g, ''); // Remove non-digits
                    if (number.length >= 9) { // Basic validation for phone number
                        const jid = `${number}@s.whatsapp.net`;
                        usersToAdd.push(jid);
                    }
                }
                console.log('✅ Found phone numbers:', usersToAdd);
            }
        }
        
        if (usersToAdd.length === 0) {
            return await reply('❌ Please mention the user, reply to their message, or provide a phone number!\n\n*Usage:*\n• .groupadd @user\n• .groupadd 263714757857\n• Reply to user\'s message with .groupadd');
        }

        const successUsers = [];
        const failedUsers = [];

        // Add users one by one
        for (const userJid of usersToAdd) {
            try {
                await ademola.groupParticipantsUpdate(from, [userJid], "add");
                successUsers.push(userJid);
                console.log('✅ Successfully added:', userJid);
                
                // Add delay between adds to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error('❌ Failed to add:', userJid, error);
                failedUsers.push(userJid);
            }
        }

        // Prepare result message
        let resultMessage = '';
        
        if (successUsers.length > 0) {
            const successNames = successUsers.map(jid => `@${jid.split('@')[0]}`);
            resultMessage += `✅ *Successfully Added:*\n${successNames.map(name => `• ${name}`).join('\n')}\n\n`;
        }
        
        if (failedUsers.length > 0) {
            const failedNames = failedUsers.map(jid => `@${jid.split('@')[0]}`);
            resultMessage += `❌ *Failed to Add:*\n${failedNames.map(name => `• ${name}`).join('\n')}\n\n`;
            resultMessage += `*Possible reasons:*\n• User privacy settings\n• User blocked the bot\n• Invalid phone number\n• User already in group`;
        }

        resultMessage += `\n👑 *Added By:* @${sender.split('@')[0]}`;

        const allMentions = [...successUsers, ...failedUsers, sender];
        
        await ademola.sendMessage(from, { 
            text: resultMessage,
            mentions: allMentions
        }, {
            quoted: fakevCard
        });
        
    } catch (error) {
        console.error('Error in groupadd command:', error);
        await reply('❌ Failed to add user(s). Make sure the numbers are valid and users can be added to groups.');
    }
});