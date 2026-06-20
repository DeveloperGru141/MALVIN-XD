const { ademola, fakevCard } = require("../ademola");
const { addWelcome, delWelcome, isWelcomeOn } = require('../lib/index');
const { channelInfo } = require('../lib/messageConfig');
const fetch = require('node-fetch');

ademola({
    pattern: "welcome",
    alias: ["welcomesetup"],
    desc: "Configure welcome messages for this group",
    category: "group",
    react: "👋",
    use: ".welcome [on/off/set]",
    filename: __filename,
}, async (sock, mek, m, { from, q, reply, isGroup, isAdmin }) => {
    try {
        if (!isGroup) {
            return reply("❌ This command can only be used in groups.", { quoted: fakevCard });
        }

        const adminCheck = await isAdmin(sock, from, mek.key.participant || from);
        if (!adminCheck.isSenderAdmin) {
            return reply("🚫 Only group admins can configure welcome messages.", { quoted: fakevCard });
        }

        if (!q) {
            return reply(`📥 *Welcome Message Setup*\n\n✅ *.welcome on* — Enable welcome messages\n🛠️ *.welcome set Your custom message* — Set a custom welcome message\n🚫 *.welcome off* — Disable welcome messages\n\n*Current Status:* ${await isWelcomeOn(from) ? '✅ Enabled' : '❌ Disabled'}`, { quoted: fakevCard });
        }

        const [command, ...args] = q.split(' ');
        const lowerCommand = command.toLowerCase();
        const customMessage = args.join(' ');

        if (lowerCommand === 'on') {
            if (await isWelcomeOn(from)) {
                return reply('⚠️ Welcome messages are *already enabled*.', { quoted: fakevCard });
            }
            await addWelcome(from, true, 'Welcome {user} to {group}! 🎉');
            return reply('✅ Welcome messages *enabled*! New members will be welcomed.', { quoted: fakevCard });
        }

        if (lowerCommand === 'off') {
            if (!(await isWelcomeOn(from))) {
                return reply('⚠️ Welcome messages are *already disabled*.', { quoted: fakevCard });
            }
            await delWelcome(from);
            return reply('✅ Welcome messages *disabled* for this group.', { quoted: fakevCard });
        }

        if (lowerCommand === 'set') {
            if (!customMessage) {
                return reply('⚠️ Please provide a custom welcome message. Example: *.welcome set Welcome to the group!*', { quoted: fakevCard });
            }
            await addWelcome(from, true, customMessage);
            return reply('✅ Custom welcome message *set successfully*.', { quoted: fakevCard });
        }

        return reply('❌ Invalid command. Use: *.welcome on/set/off*', { quoted: fakevCard });

    } catch (error) {
        console.error('Error in welcome command:', error);
        await reply("❌ Error configuring welcome messages!", { quoted: fakevCard });
    }
});

async function handleJoinEvent(sock, groupId, participants) {
    try {
        console.log(`🔍 Checking welcome for group: ${groupId}`);
        console.log(`👥 Participants data:`, JSON.stringify(participants, null, 2));
        
        const isWelcomeEnabled = await isWelcomeOn(groupId);
        console.log(`📋 Welcome enabled for ${groupId}: ${isWelcomeEnabled}`);
        
        if (!isWelcomeEnabled) {
            console.log('❌ Welcome disabled for this group, skipping');
            return;
        }

        const groupMetadata = await sock.groupMetadata(groupId);
        const groupName = groupMetadata.subject;
        const groupDesc = groupMetadata.desc || 'No description available';

        console.log(`🎉 Sending welcome for ${participants.length} new member(s) in ${groupName}`);

        for (const participant of participants) {
            try {
                let participantId;
                let phoneNumber;
                
                if (typeof participant === 'string') {
                    participantId = participant;
                    phoneNumber = participant.split('@')[0];
                } else if (participant && typeof participant === 'object') {
                    participantId = participant.id || participant.phoneNumber;
                    if (participant.phoneNumber) {
                        phoneNumber = participant.phoneNumber.split('@')[0];
                    } else if (participant.id) {
                        phoneNumber = participant.id.split('@')[0];
                    }
                } else {
                    console.log('❌ Unknown participant format:', participant);
                    continue;
                }

                if (!participantId) {
                    console.log('❌ Could not determine participant ID:', participant);
                    continue;
                }

                console.log(`👋 Processing welcome for: ${participantId}`);
                
                let displayName = phoneNumber || 'User';
                try {
                    if (participant && participant.name) {
                        displayName = participant.name;
                    } else {
                        await sock.profilePictureUrl(participantId, 'image');
                    }
                } catch (nameError) {
                    console.log('Using phone number as display name');
                }
                
                let profilePicUrl = `https://img.pyrocdn.com/dbKUgahg.png`;
                try {
                    const profilePic = await sock.profilePictureUrl(participantId, 'image');
                    if (profilePic) {
                        profilePicUrl = profilePic;
                    }
                } catch (profileError) {
                    console.log('Using default profile picture');
                }
                
                const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming3?type=join&textcolor=green&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
                
                console.log(`🖼️ Fetching welcome image from: ${apiUrl}`);
                
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const imageBuffer = await response.buffer();
                    
                    const now = new Date();
                    const timeString = now.toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    });

                    await sock.sendMessage(groupId, {
                        image: imageBuffer,
                        caption: `
╭╼━• \`ɴᴇᴡ ᴍᴇᴍʙᴇʀ\` •
│ᴡᴇʟᴄᴏᴍᴇ: @${displayName} 👋
│ᴍᴇᴍʙᴇʀ ɴᴜᴍʙᴇʀ: #${groupMetadata.participants.length}
│ᴛɪᴍᴇ: ${timeString}⏰
╰━❍
                        
*@${displayName}* Welcome to *${groupName}*! 🎉
*ɢʀᴏᴜᴘ ᴅᴇsᴄ*
 ${groupDesc}
                        
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`,
                        mentions: [participantId]
                    });
                    
                    console.log(`✅ Welcome sent for ${displayName} in ${groupName}`);
                } else {
                    throw new Error('API response not OK');
                }
            } catch (error) {
                console.error(`❌ Error sending welcome for participant:`, error);
                
                let participantId;
                let displayName = 'User';
                
                if (typeof participant === 'string') {
                    participantId = participant;
                    displayName = participant.split('@')[0];
                } else if (participant && typeof participant === 'object') {
                    participantId = participant.id || participant.phoneNumber;
                    if (participant.phoneNumber) {
                        displayName = participant.phoneNumber.split('@')[0];
                    }
                }

                const now = new Date();
                const timeString = now.toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });

                const welcomeMessage = `╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @${displayName} 👋\n┃Member count: #${groupMetadata.participants.length}\n┃𝚃𝙸𝙼𝙴: ${timeString}⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@${displayName}* Welcome to *${groupName}*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\n${groupDesc}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;
                
                await sock.sendMessage(groupId, {
                    text: welcomeMessage,
                    mentions: participantId ? [participantId] : []
                });
                
                console.log(`✅ Fallback welcome sent for ${displayName}`);
            }
        }
    } catch (error) {
        console.error('❌ Fatal error in handleJoinEvent:', error);
    }
}

module.exports = {
    handleJoinEvent
};
