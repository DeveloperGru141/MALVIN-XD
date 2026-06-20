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
    pattern: "tag",
    alias: ["everyone", "mentionall", "alert"],
    desc: "Tag all group members with optional message",
    category: "group",
    react: "📢",
    use: ".tag [message] or reply to a message",
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
            // Send sticker for non-admin users
            const stickerPath = './assets/sticktag.webp';
            if (fs.existsSync(stickerPath)) {
                const stickerBuffer = fs.readFileSync(stickerPath);
                await ademola.sendMessage(from, { sticker: stickerBuffer }, {
                    quoted: fakevCard
                });
            } else {
                await reply('❌ Only group admins can use the tag command.');
            }
            return;
        }

        const groupMetadata = await ademola.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJidList = participants.map(p => p.id);

        if (participants.length === 0) {
            return await reply('❌ No participants found in the group.');
        }

        // Check if replying to a message
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quoted) {
            let messageContent = {};

            // Handle image messages
            if (quoted.imageMessage) {
                const filePath = await downloadMediaMessage(quoted.imageMessage, 'image');
                messageContent = {
                    image: { url: filePath },
                    caption: text || quoted.imageMessage.caption || '📢 Tagged by admin',
                    mentions: mentionedJidList
                };
                // Clean up temp file
                setTimeout(() => {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }, 5000);
            }
            // Handle video messages
            else if (quoted.videoMessage) {
                const filePath = await downloadMediaMessage(quoted.videoMessage, 'video');
                messageContent = {
                    video: { url: filePath },
                    caption: text || quoted.videoMessage.caption || '📢 Tagged by admin',
                    mentions: mentionedJidList
                };
                setTimeout(() => {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }, 5000);
            }
            // Handle document messages
            else if (quoted.documentMessage) {
                const filePath = await downloadMediaMessage(quoted.documentMessage, 'document');
                messageContent = {
                    document: { url: filePath },
                    fileName: quoted.documentMessage.fileName || 'document',
                    caption: text || '📢 Tagged by admin',
                    mentions: mentionedJidList
                };
                setTimeout(() => {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }, 5000);
            }
            // Handle text messages
            else if (quoted.conversation || quoted.extendedTextMessage) {
                messageContent = {
                    text: quoted.conversation || quoted.extendedTextMessage.text,
                    mentions: mentionedJidList
                };
            }

            if (Object.keys(messageContent).length > 0) {
                await ademola.sendMessage(from, messageContent);
            } else {
                await reply('❌ Unsupported message type for tagging.');
            }
        } else {
            // Simple text tag
            await ademola.sendMessage(from, {
                text: text || "📢 Tagged by admin",
                mentions: mentionedJidList
            });
        }
        
    } catch (error) {
        console.error('Error in tag command:', error);
        await reply('❌ Failed to tag members.');
    }
});