const { ademola, fakevCard } = require("../ademola");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function downloadMediaMessage(message, mediaType) {
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const filePath = path.join(process.cwd(), 'temp', `${Date.now()}.${mediaType}`);
    if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

ademola({
    pattern: "hidetag",
    alias: ["taghidden", "stealthtag"],
    desc: "Tag all non-admin members (hidden tag)",
    category: "group",
    react: "👻",
    use: ".hidetag [message] or reply to a message",
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

        const groupMetadata = await ademola.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);

        if (nonAdmins.length === 0) {
            return await reply('ℹ️ All group members are admins!');
        }

        // Check if replying to a message
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quoted) {
            let content = {};
            
            // Handle different media types
            if (quoted.imageMessage) {
                const filePath = await downloadMediaMessage(quoted.imageMessage, 'image');
                content = { 
                    image: { url: filePath }, 
                    caption: text || quoted.imageMessage.caption || '', 
                    mentions: nonAdmins 
                };
                // Clean up temp file after sending
                setTimeout(() => {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }, 5000);
            } 
            else if (quoted.videoMessage) {
                const filePath = await downloadMediaMessage(quoted.videoMessage, 'video');
                content = { 
                    video: { url: filePath }, 
                    caption: text || quoted.videoMessage.caption || '', 
                    mentions: nonAdmins 
                };
                setTimeout(() => {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }, 5000);
            }
            else if (quoted.documentMessage) {
                const filePath = await downloadMediaMessage(quoted.documentMessage, 'document');
                content = { 
                    document: { url: filePath }, 
                    fileName: quoted.documentMessage.fileName || 'document',
                    caption: text || '', 
                    mentions: nonAdmins 
                };
                setTimeout(() => {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }, 5000);
            }
            else if (quoted.conversation || quoted.extendedTextMessage) {
                content = { 
                    text: quoted.conversation || quoted.extendedTextMessage.text, 
                    mentions: nonAdmins 
                };
            }

            if (Object.keys(content).length > 0) {
                await ademola.sendMessage(from, content);
            } else {
                await reply('❌ Unsupported message type for hidetag.');
            }
        } else {
            // Simple text hidetag
            await ademola.sendMessage(from, { 
                text: text || '👻 Tagged members (excluding admins)', 
                mentions: nonAdmins 
            });
        }
        
    } catch (error) {
        console.error('Error in hidetag command:', error);
        await reply('❌ Failed to send hidden tag.');
    }
});