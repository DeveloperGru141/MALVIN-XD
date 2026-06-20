const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');
const { ademola, fakevCard } = require('../ademola');
const { isOwnerOrSudo } = require('../lib/isOwner');
const { channelInfo } = require('../lib/messageConfig');

const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// Ensure tmp dir exists
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

// Function to get folder size in MB
const getFolderSizeInMB = (folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            if (fs.statSync(filePath).isFile()) {
                totalSize += fs.statSync(filePath).size;
            }
        }

        return totalSize / (1024 * 1024); // Convert bytes to MB
    } catch (err) {
        console.error('Error getting folder size:', err);
        return 0;
    }
};

// Function to clean temp folder if size exceeds 200MB
const cleanTempFolderIfLarge = () => {
    try {
        const sizeMB = getFolderSizeInMB(TEMP_MEDIA_DIR);
        
        if (sizeMB > 200) {
            const files = fs.readdirSync(TEMP_MEDIA_DIR);
            for (const file of files) {
                const filePath = path.join(TEMP_MEDIA_DIR, file);
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    // ignore
                }
            }
            console.log('🧹 Temp folder cleaned');
        }
    } catch (err) {
        console.error('Temp cleanup error:', err);
    }
};

// Start periodic cleanup check every 1 minute
setInterval(cleanTempFolderIfLarge, 60 * 1000);

// Load config
function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            // Create default config
            const defaultConfig = { enabled: false };
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
        return JSON.parse(fs.readFileSync(CONFIG_PATH));
    } catch {
        return { enabled: false };
    }
}

// Save config
function saveAntideleteConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Config save error:', err);
    }
}

// Safe media download function
async function downloadMedia(message, mediaType) {
    try {
        let buffer = Buffer.alloc(0);
        const stream = await downloadContentFromMessage(message, mediaType);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        return buffer;
    } catch (error) {
        console.error(`Error downloading ${mediaType}:`, error.message);
        return null;
    }
}

// Safe file write function
async function safeWriteFile(filePath, buffer) {
    try {
        await writeFile(filePath, buffer);
        return true;
    } catch (error) {
        console.error('Error writing file:', error.message);
        return false;
    }
}

// Antidelete command using Ademola XD framework
ademola({
    pattern: "antidelete",
    alias: ["antidel", "adelete"],
    desc: "Enable/disable antidelete feature",
    category: "owner",
    react: "🚯",
    use: ".antidelete [on/off]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner }) => {
    try {
        // Check if user is owner/sudo
        if (!isOwner) {
            return reply("❌ Only bot owner can use this command.", { quoted: fakevCard });
        }

        const config = loadAntideleteConfig();

        if (!q) {
            return reply(
                `*🚯 ANTIDELETE SETUP*\n\n` +
                `*Current Status:* ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
                `*Commands:*\n` +
                `• *.antidelete on* - Enable antidelete\n` +
                `• *.antidelete off* - Disable antidelete\n\n` +
                `*Features:*\n` +
                `• Captures deleted messages\n` +
                `• Captures view-once media\n` +
                `• Sends alerts to bot owner`,
                { quoted: fakevCard }
            );
        }

        const lowerQ = q.toLowerCase();
        
        if (lowerQ === 'on') {
            if (config.enabled) {
                return reply('⚠️ Antidelete is *already enabled*.', { quoted: fakevCard });
            }
            config.enabled = true;
            saveAntideleteConfig(config);
            return reply('✅ *Antidelete enabled!*\n\nI will now capture deleted messages and view-once media.', { quoted: fakevCard });
        } 
        
        else if (lowerQ === 'off') {
            if (!config.enabled) {
                return reply('⚠️ Antidelete is *already disabled*.', { quoted: fakevCard });
            }
            config.enabled = false;
            saveAntideleteConfig(config);
            return reply('✅ *Antidelete disabled!*\n\nI will no longer capture deleted messages.', { quoted: fakevCard });
        } 
        
        else {
            return reply('❌ Invalid command. Use *.antidelete* to see usage.', { quoted: fakevCard });
        }

    } catch (error) {
        console.error('Error in antidelete command:', error);
        await reply("❌ Error configuring antidelete!", { quoted: fakevCard });
    }
});

// Debug command to check stored messages
ademola({
    pattern: "checkstore",
    alias: ["storecheck"],
    desc: "Check antidelete message store",
    category: "owner",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply("❌ Only bot owner can use this command.");
        }

        const storeSize = messageStore.size;
        let text = `*📊 ANTIDELETE STORE STATUS*\n\n`;
        text += `*Stored Messages:* ${storeSize}\n`;
        text += `*Store Enabled:* ${loadAntideleteConfig().enabled ? '✅ Yes' : '❌ No'}\n\n`;
        
        if (storeSize > 0) {
            text += `*Recent Messages:*\n`;
            let count = 0;
            for (let [id, msg] of messageStore) {
                if (count >= 5) break; // Show only last 5
                text += `▫️ ${id}: ${msg.mediaType || 'text'} from ${msg.sender}\n`;
                count++;
            }
        }
        
        await reply(text);
    } catch (error) {
        console.error('Error in checkstore:', error);
        await reply("❌ Error checking store");
    }
});

// Clear store command
ademola({
    pattern: "clearstore",
    alias: ["clearantidelete"],
    desc: "Clear antidelete message store",
    category: "owner",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply("❌ Only bot owner can use this command.");
        }

        const storeSize = messageStore.size;
        messageStore.clear();
        
        // Clean temp files
        try {
            const files = fs.readdirSync(TEMP_MEDIA_DIR);
            for (const file of files) {
                const filePath = path.join(TEMP_MEDIA_DIR, file);
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {}
            }
        } catch (e) {}
        
        await reply(`✅ Cleared ${storeSize} messages from antidelete store and temp files.`);
    } catch (error) {
        console.error('Error in clearstore:', error);
        await reply("❌ Error clearing store");
    }
});

// Store incoming messages - FIXED TO IGNORE BOT'S OWN MESSAGES
async function storeMessage(message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        if (!message.key?.id) return;

        const messageId = message.key.id;
        const chatId = message.key.remoteJid;
        
        // Skip status broadcasts, newsletters, and bot's own messages
        if (chatId === 'status@broadcast' || chatId.includes('newsletter') || message.key.fromMe) {
            return;
        }

        let content = '';
        let mediaType = '';
        let mediaPath = '';
        let isViewOnce = false;

        const sender = message.key.participant || chatId;
        const isGroup = chatId.endsWith('@g.us');

        console.log(`💾 Storing message ${messageId} from ${sender}`);

        // Detect content (including view-once wrappers)
        const viewOnceContainer = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
        
        if (viewOnceContainer) {
            // unwrap view-once content
            if (viewOnceContainer.imageMessage) {
                mediaType = 'image';
                content = viewOnceContainer.imageMessage.caption || '';
                const buffer = await downloadMedia(viewOnceContainer.imageMessage, 'image');
                if (buffer) {
                    mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                    const writeSuccess = await safeWriteFile(mediaPath, buffer);
                    if (!writeSuccess) mediaPath = '';
                }
                isViewOnce = true;
            } else if (viewOnceContainer.videoMessage) {
                mediaType = 'video';
                content = viewOnceContainer.videoMessage.caption || '';
                const buffer = await downloadMedia(viewOnceContainer.videoMessage, 'video');
                if (buffer) {
                    mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                    const writeSuccess = await safeWriteFile(mediaPath, buffer);
                    if (!writeSuccess) mediaPath = '';
                }
                isViewOnce = true;
            }
        } else if (message.message?.conversation) {
            content = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
            content = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage) {
            mediaType = 'image';
            content = message.message.imageMessage.caption || '';
            const buffer = await downloadMedia(message.message.imageMessage, 'image');
            if (buffer) {
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                const writeSuccess = await safeWriteFile(mediaPath, buffer);
                if (!writeSuccess) mediaPath = '';
            }
        } else if (message.message?.stickerMessage) {
            mediaType = 'sticker';
            const buffer = await downloadMedia(message.message.stickerMessage, 'sticker');
            if (buffer) {
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
                const writeSuccess = await safeWriteFile(mediaPath, buffer);
                if (!writeSuccess) mediaPath = '';
            }
        } else if (message.message?.videoMessage) {
            mediaType = 'video';
            content = message.message.videoMessage.caption || '';
            const buffer = await downloadMedia(message.message.videoMessage, 'video');
            if (buffer) {
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                const writeSuccess = await safeWriteFile(mediaPath, buffer);
                if (!writeSuccess) mediaPath = '';
            }
        } else if (message.message?.audioMessage) {
            mediaType = 'audio';
            const mime = message.message.audioMessage.mimetype || '';
            const ext = mime.includes('mpeg') ? 'mp3' : (mime.includes('ogg') ? 'ogg' : 'mp3');
            const buffer = await downloadMedia(message.message.audioMessage, 'audio');
            if (buffer) {
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
                const writeSuccess = await safeWriteFile(mediaPath, buffer);
                if (!writeSuccess) mediaPath = '';
            }
        } else if (message.message?.documentMessage) {
            mediaType = 'document';
            content = message.message.documentMessage.fileName || '';
            const buffer = await downloadMedia(message.message.documentMessage, 'document');
            if (buffer) {
                const ext = message.message.documentMessage.fileName?.split('.').pop() || 'bin';
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
                const writeSuccess = await safeWriteFile(mediaPath, buffer);
                if (!writeSuccess) mediaPath = '';
            }
        }

        // Only store if we have content or media
        if (content || mediaType) {
            messageStore.set(messageId, {
                content,
                mediaType,
                mediaPath,
                sender,
                chatId,
                isGroup,
                isViewOnce,
                timestamp: Date.now()
            });

            console.log(`💾 Stored message for antidelete: ${messageId} (${mediaType || 'text'}) from ${sender}`);

            // Anti-ViewOnce: forward immediately to owner if captured
            if (isViewOnce && mediaType && mediaPath && fs.existsSync(mediaPath)) {
                try {
                    const ownerNumber = ademola.user.id.split(':')[0] + '@s.whatsapp.net';
                    const senderName = sender.split('@')[0];
                    const mediaOptions = {
                        caption: `*🚯 Anti-ViewOnce ${mediaType.toUpperCase()}*\n\n` +
                                `*From:* @${senderName}\n` +
                                `*Time:* ${new Date().toLocaleString()}\n\n` +
                                `> This view-once media was automatically captured.`,
                        mentions: [sender]
                    };
                    
                    if (mediaType === 'image') {
                        await ademola.sendMessage(ownerNumber, { image: { url: mediaPath }, ...mediaOptions });
                    } else if (mediaType === 'video') {
                        await ademola.sendMessage(ownerNumber, { video: { url: mediaPath }, ...mediaOptions });
                    }
                    
                    console.log(`📸 View-once ${mediaType} captured and forwarded`);
                    
                    // Cleanup immediately for view-once forward
                    try { 
                        if (fs.existsSync(mediaPath)) {
                            fs.unlinkSync(mediaPath); 
                        }
                        // Remove from store since we've already forwarded it
                        messageStore.delete(messageId);
                    } catch (e) {
                        console.error('Error cleaning view-once media:', e);
                    }
                } catch (e) {
                    console.error('Error forwarding view-once media:', e);
                }
            }
        }

    } catch (err) {
        console.error('storeMessage error:', err.message);
    }
}

// Handle message deletion - FIXED TO PREVENT LOOPS
async function handleMessageRevocation(ademola, update) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        // Skip if this is from the bot itself
        if (update.key?.fromMe) {
            console.log('🤖 Skipping bot\'s own message update');
            return;
        }

        console.log('🔄 Processing potential deletion...');

        let messageId;
        let deletedBy;

        // Only process if we have a valid message ID
        if (update.key && update.key.id) {
            messageId = update.key.id;
            deletedBy = update.participant || update.key.participant;
            
            console.log(`🔍 Found message ID in key: ${messageId}`);
        }

        if (!messageId) {
            console.log('❌ No message ID found in update');
            return;
        }

        console.log(`🗑️ Checking if message was deleted: ${messageId}`);

        const original = messageStore.get(messageId);
        if (!original) {
            console.log(`❌ No stored message found for: ${messageId}`);
            return;
        }

        const ownerNumber = ademola.user.id.split(':')[0] + '@s.whatsapp.net';

        // Don't alert if bot deleted the message
        if (deletedBy && (deletedBy.includes(ademola.user.id) || deletedBy === ownerNumber)) {
            console.log('🤖 Bot deleted the message, ignoring');
            messageStore.delete(messageId);
            if (original.mediaPath && fs.existsSync(original.mediaPath)) {
                try { fs.unlinkSync(original.mediaPath); } catch (e) {}
            }
            return;
        }

        console.log(`🚯 DELETION DETECTED: ${messageId}`);
        
        const sender = original.sender;
        const senderName = sender.split('@')[0];
        const deleterName = deletedBy ? deletedBy.split('@')[0] : 'Unknown';
        let groupName = '';

        // Get group name if it's a group message
        if (original.isGroup && original.chatId) {
            try {
                const groupMetadata = await ademola.groupMetadata(original.chatId);
                groupName = groupMetadata.subject;
            } catch (err) {
                console.error('Error getting group metadata:', err);
            }
        }

        const time = new Date(original.timestamp).toLocaleString();

        // Create alert message - DON'T include antidelete alerts in the content
        let alertText = `*🚯 ANTIDELETE ALERT 🚯*\n\n` +
            `*🗑️ Message Deleted!*\n` +
            `*👤 Original Sender:* @${senderName}\n` +
            `*📱 Number:* ${sender}\n` +
            `*🕒 Time Sent:* ${time}\n`;

        if (deleterName !== 'Unknown') {
            alertText += `*🗑️ Deleted By:* @${deleterName}\n`;
        }

        if (groupName) {
            alertText += `*👥 Group:* ${groupName}\n`;
        }

        if (original.content && !original.content.includes('🚯 ANTIDELETE ALERT')) {
            alertText += `\n*💬 Deleted Message:*\n${original.content}\n`;
        }

        if (original.mediaType) {
            alertText += `\n*📎 Media Type:* ${original.mediaType.toUpperCase()}`;
            if (original.isViewOnce) {
                alertText += ` (View Once)`;
            }
        }

        // Remove from store FIRST to prevent loops
        messageStore.delete(messageId);
        console.log(`🧹 Cleared message ${messageId} from store`);

        // Send text alert to owner
        console.log(`📤 Sending alert to owner for deleted message: ${messageId}`);
        await ademola.sendMessage(ownerNumber, {
            text: alertText,
            mentions: deletedBy && deleterName !== 'Unknown' ? [deletedBy, sender] : [sender]
        });

        console.log(`✅ Alert sent for deleted message: ${messageId}`);

        // Send media if available (not view-once since those are already forwarded)
        if (original.mediaType && original.mediaPath && fs.existsSync(original.mediaPath) && !original.isViewOnce) {
            console.log(`📎 Forwarding deleted media: ${original.mediaType}`);
            
            const mediaOptions = {
                caption: `*🗑️ Deleted ${original.mediaType.toUpperCase()}*\n\n` +
                        `*From:* @${senderName}\n` +
                        `${deleterName !== 'Unknown' ? `*Deleted By:* @${deleterName}\n` : ''}` +
                        `*Time:* ${time}`,
                mentions: deletedBy && deleterName !== 'Unknown' ? [sender, deletedBy] : [sender]
            };

            try {
                switch (original.mediaType) {
                    case 'image':
                        await ademola.sendMessage(ownerNumber, {
                            image: { url: original.mediaPath },
                            ...mediaOptions
                        });
                        break;
                    case 'sticker':
                        await ademola.sendMessage(ownerNumber, {
                            sticker: { url: original.mediaPath }
                        });
                        break;
                    case 'video':
                        await ademola.sendMessage(ownerNumber, {
                            video: { url: original.mediaPath },
                            ...mediaOptions
                        });
                        break;
                    case 'audio':
                        await ademola.sendMessage(ownerNumber, {
                            audio: { url: original.mediaPath },
                            mimetype: 'audio/mpeg',
                            ...mediaOptions
                        });
                        break;
                    case 'document':
                        await ademola.sendMessage(ownerNumber, {
                            document: { url: original.mediaPath },
                            fileName: original.content || 'document',
                            mimetype: 'application/octet-stream',
                            ...mediaOptions
                        });
                        break;
                }
                
                console.log(`✅ Deleted ${original.mediaType} forwarded`);
            } catch (err) {
                console.error('Error sending deleted media:', err.message);
            }

            // Cleanup media file
            try {
                if (fs.existsSync(original.mediaPath)) {
                    fs.unlinkSync(original.mediaPath);
                }
            } catch (err) {
                console.error('Media cleanup error:', err.message);
            }
        }

    } catch (err) {
        console.error('handleMessageRevocation error:', err.message);
    }
}

// Main antidelete handler - PROCESS EVERY UPDATE BUT WITH BOT FILTER
async function AntiDelete(ademola, updates) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) {
            return;
        }

        console.log(`🔍 AntiDelete checking ${updates.length} update(s)`);

        for (const update of updates) {
            // Skip bot's own message updates to prevent loops
            if (update.key?.fromMe) {
                console.log('🤖 Skipping bot\'s own update');
                continue;
            }
            
            console.log('📝 Processing update for potential deletion...');
            
            // Try to handle every update - let the function decide if it's a deletion
            await handleMessageRevocation(ademola, update);
        }
    } catch (error) {
        console.error('Error in AntiDelete handler:', error.message);
    }
}

module.exports = {
    AntiDelete,
    storeMessage,
    handleMessageRevocation,
    loadAntideleteConfig
};