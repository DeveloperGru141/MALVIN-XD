const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAntilink, incrementWarningCount, resetWarningCount, isSudo } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const config = require('../config');

const WARN_COUNT = config.WARN_COUNT || 3;

/**
 * Improved URL detection function
 */
function containsURL(str) {
    if (!str || typeof str !== 'string') return false;
    
    // Comprehensive URL patterns
    const urlPatterns = [
        // WhatsApp group links
        /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
        // WhatsApp channel links  
        /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
        // Telegram links
        /t\.me\/[A-Za-z0-9_]+/i,
        // Instagram links
        /instagram\.com\/[A-Za-z0-9_.]+\/?/i,
        /instagr\.am\/[A-Za-z0-9_.]+\/?/i,
        // Facebook links
        /facebook\.com\/[A-Za-z0-9_.]+\/?/i,
        /fb\.me\/[A-Za-z0-9_.]+\/?/i,
        // Twitter/X links
        /twitter\.com\/[A-Za-z0-9_]+\/?/i,
        /x\.com\/[A-Za-z0-9_]+\/?/i,
        // YouTube links
        /youtube\.com\/[A-Za-z0-9_?=&\/-]+/i,
        /youtu\.be\/[A-Za-z0-9_-]+/i,
        // TikTok links
        /tiktok\.com\/[A-Za-z0-9_?=&\/-]+/i,
        /vm\.tiktok\.com\/[A-Za-z0-9]+\/?/i,
        // Generic URL patterns - IMPROVED
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i,
        /www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i,
        /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i
    ];

    // Check each pattern
    for (const pattern of urlPatterns) {
        if (pattern.test(str)) {
            console.log(`🔗 URL detected with pattern: ${pattern}`);
            return true;
        }
    }
    
    return false;
}

/**
 * Handles the Antilink functionality for group chats.
 */
async function Antilink(msg, sock) {
    try {
        const jid = msg.key.remoteJid;
        if (!isJidGroup(jid)) return;

        const SenderMessage = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.imageMessage?.caption ||
                             msg.message?.videoMessage?.caption || '';
        
        if (!SenderMessage || typeof SenderMessage !== 'string') return;

        const sender = msg.key.participant;
        if (!sender) return;
        
        console.log(`🔗 Checking message from ${sender}: "${SenderMessage}"`);
        
        // Skip if sender is group admin or sudo
        try {
            const { isSenderAdmin } = await isAdmin(sock, jid, sender);
            if (isSenderAdmin) {
                console.log('👑 User is admin, skipping antilink');
                return;
            }
        } catch (_) {}
        
        const senderIsSudo = await isSudo(sender);
        if (senderIsSudo) {
            console.log('⭐ User is sudo, skipping antilink');
            return;
        }

        // Check for URLs with improved detection
        if (!containsURL(SenderMessage.trim())) {
            console.log('✅ No URLs detected in message');
            return;
        }
        
        const antilinkConfig = await getAntilink(jid);
        if (!antilinkConfig?.enabled) {
            console.log('❌ Antilink not enabled for this group');
            return;
        }

        const action = antilinkConfig.action || 'delete';
        console.log(`🚫 Taking action: ${action} for URL violation`);
        
        try {
            // Delete message first
            await sock.sendMessage(jid, { delete: msg.key });
            console.log('✅ Message deleted successfully');

            const senderNumber = sender.split('@')[0];
            const mentionedJid = [sender];

            switch (action) {
                case 'delete':
                    await sock.sendMessage(jid, { 
                        text: `⚠️ @${senderNumber}, links are not allowed here! Message deleted.`,
                        mentions: mentionedJid 
                    });
                    break;

                case 'kick':
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                    await sock.sendMessage(jid, {
                        text: `🚫 @${senderNumber} has been removed for sending links.`,
                        mentions: mentionedJid
                    });
                    break;

                case 'warn':
                    const warningCount = await incrementWarningCount(jid, sender);
                    if (warningCount >= WARN_COUNT) {
                        await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                        await resetWarningCount(jid, sender);
                        await sock.sendMessage(jid, {
                            text: `🚫 @${senderNumber} has been removed after ${WARN_COUNT} warnings for sending links.`,
                            mentions: mentionedJid
                        });
                    } else {
                        await sock.sendMessage(jid, {
                            text: `⚠️ @${senderNumber}, warning ${warningCount}/${WARN_COUNT} for sending links!`,
                            mentions: mentionedJid
                        });
                    }
                    break;
            }
            
            console.log(`✅ Antilink action completed: ${action}`);
        } catch (error) {
            console.error('❌ Error executing antilink action:', error);
        }
    } catch (error) {
        console.error('❌ Error in Antilink:', error);
    }
}

module.exports = { Antilink };