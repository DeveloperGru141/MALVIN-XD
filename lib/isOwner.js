const { isSudo } = require('./index');

function normalizeJid(jid) {
    if (!jid) return '';
    // Strip device number from JID, e.g., "2348108574293:17@s.whatsapp.net" -> "2348108574293@s.whatsapp.net"
    // LIDs like "102409552584830:16@lid" don't have a meaningful phone number to normalize
    return jid.replace(/:\d+@/, '@');
}

async function isOwnerOrSudo(senderId) {
    if (!senderId) return false;

    const normalizedSender = normalizeJid(senderId);

    // Auto-detected owner JID from bot's own connection
    if (global.ownerJid) {
        const normalizedOwner = normalizeJid(global.ownerJid);
        if (normalizedSender === normalizedOwner) return true;
    }

    // Also store the un-normalized JID for comparison
    if (global.ownerJid && senderId === global.ownerJid) return true;

    // Fallback: match by phone number
    try {
        const settings = require('../settings');
        if (settings.ownerNumber) {
            const ownerJid = settings.ownerNumber + "@s.whatsapp.net";
            if (senderId === ownerJid) return true;
            if (normalizedSender === ownerJid) return true;
            if (senderId && senderId.includes(settings.ownerNumber)) return true;
        }
    } catch {}

    // Check sudo list
    try {
        return await isSudo(senderId);
    } catch {
        return false;
    }
}

module.exports = isOwnerOrSudo;
