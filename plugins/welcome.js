const { ademola, fakevCard } = require("../ademola");
const { addWelcome, delWelcome, isWelcomeOn } = require('../lib/index');
const { channelInfo } = require('../lib/messageConfig');
const fetch = require('node-fetch');

// Welcome command using Ademola XD framework
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
        // Check if it's a group
        if (!isGroup) {
            return reply("❌ This command can only be used in groups.", { quoted: fakevCard });
        }

        // Check admin permissions
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

// Function to handle join events (for use in main bot file)
async function handleJoinEvent(sock, groupId, participants) {
    try {
        console.log(`🔍 Checking welcome for group: ${groupId}`);
        console.log(`👥 Participants data:`, JSON.stringify(participants, null, 2));
        
        // Check if welcome is enabled for this group
        const isWelcomeEnabled = await isWelcomeOn(groupId);
        console.log(`📋 Welcome enabled for ${groupId}: ${isWelcomeEnabled}`);
        
        if (!isWelcomeEnabled) {
            console.log('❌ Welcome disabled for this group, skipping');
            return;
        }

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(groupId);
        const groupName = groupMetadata.subject;
        const groupDesc = groupMetadata.desc || 'No description available';

        console.log(`🎉 Sending welcome for ${participants.length} new member(s) in ${groupName}`);

        // Send welcome message for each new participant
        for (const participant of participants) {
            try {
                // Extract participant ID correctly (handle both string and object formats)
                let participantId;
                let phoneNumber;
                
                if (typeof participant === 'string') {
                    // Old format: string like "123456789@s.whatsapp.net"
                    participantId = participant;
                    phoneNumber = participant.split('@')[0];
                } else if (participant && typeof participant === 'object') {
                    // New format: object with id or phoneNumber
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
                
                // Get user's display name
                let displayName = phoneNumber || 'User';
                try {
                    // Try to get user's name from the participant object or profile
                    if (participant && participant.name) {
                        displayName = participant.name;
                    } else {
                        // Try to get from WhatsApp profile
                        const profile = await sock.profilePictureUrl(participantId, 'image');
                        // For now, use phone number as display name
                        // You can enhance this to fetch actual profile name if needed
                    }
                } catch (nameError) {
                    console.log('Using phone number as display name');
                }
                
                // Get user profile picture (with fallback)
                let profilePicUrl = `https://img.pyrocdn.com/dbKUgahg.png`;
                try {
                    const profilePic = await sock.profilePictureUrl(participantId, 'image');
                    if (profilePic) {
                        profilePicUrl = profilePic;
                    }
                } catch (profileError) {
                    console.log('Using default profile picture');
                }
                
                // Construct API URL for welcome image
                const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming3?type=join&textcolor=green&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
                
                console.log(`🖼️ Fetching welcome image from: ${apiUrl}`);
                
                // Fetch the welcome image
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const imageBuffer = await response.buffer();
                    
                    // Get current time
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

                    // Send welcome image with stylish caption
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
                        
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ`,
                        mentions: [participantId],
                        ...channelInfo
                    });
                    
                    console.log(`✅ Welcome sent for ${displayName} in ${groupName}`);
                } else {
                    throw new Error('API response not OK');
                }
            } catch (error) {
                console.error(`❌ Error sending welcome for participant:`, error);
                
                // Fallback to text message
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

                const welcomeMessage = `╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @${displayName} 👋\n┃Member count: #${groupMetadata.participants.length}\n┃𝚃𝙸𝙼𝙴: ${timeString}⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@${displayName}* Welcome to *${groupName}*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\n${groupDesc}\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ`;
                
                await sock.sendMessage(groupId, {
                    text: welcomeMessage,
                    mentions: participantId ? [participantId] : [],
                    ...channelInfo
                });
                
                console.log(`✅ Fallback welcome sent for ${displayName}`);
            }
        }
    } catch (error) {
        console.error('❌ Fatal error in handleJoinEvent:', error);
    }
}

// Export function for use in main bot file
module.exports = {
    handleJoinEvent
};