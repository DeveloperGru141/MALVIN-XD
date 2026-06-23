const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');

ademola({
    pattern: "owner",
    alias: ["creator", "dev", "developer"],
    desc: "Send bot owner's contact vCard",
    category: "main",
    react: "📞",
    filename: __filename,
    use: ".owner"
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        // Load owner info from settings
        
        const ownerName = "ᴀᴅᴇᴍᴏʟᴀ ᴋɪɴɢ";
        const ownerNumber = "263780958186";
        
        // Create vCard
        const vcard = 'BEGIN:VCARD\n' + 
                     'VERSION:3.0\n' + 
                     'FN:' + ownerName + '\n' + 
                     'ORG:🤖 Bot Owner & Developer;\n' + 
                     'TEL;type=CELL;type=VOICE;waid=' + ownerNumber + ':+' + ownerNumber + '\n' + 
                     'END:VCARD';

        // Send vCard contact
        await ademola.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            },
            ...channelInfo
        }, { quoted: fakevCard });

        // Send additional info message
        await ademola.sendMessage(from, {
            text: `
*┏──〘 ᴏᴡɴᴇʀ ɪɴꜰᴏ 〙──⊷*
*┃  👤 Name:* ${ownerName}
*┃  📱 Number:* +${ownerNumber}
*┃  💼 Role:* Bot Developer
*┃  🌐 Status:* Online 🟢
*┃  📧 Support:* Available 24/7
*┗─────────────⊷*

*💬 ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ ꜰᴏʀ:*
• Bot Support & Issues
• Feature Requests  
• Business Inquiries
• Technical Help

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ 🪀`,
            ...channelInfo         
        }, { quoted: fakevCard });

    } catch (error) {
        console.error('Owner command error:', error);
        
        await ademola.sendMessage(from, {
            text: `❌ *ᴇʀʀᴏʀ*

Failed to send owner contact. Please try again later.

*Error:* ${error.message}`,
            ...channelInfo
        }, { quoted: fakevCard });
    }
});