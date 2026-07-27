const fs = require('fs')
const chalk = require('chalk')
const path = require('path')
const PhoneNumber = require('awesome-phonenumber')
const { smsg } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidDecode,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")

const { loadSettings } = require('./lib/settingsManager');
const { commands, setSocket } = require('./ademola')
const { channelInfo } = require('./lib/messageConfig')
const store = require('./lib/lightweight_store')
const isAdmin = require('./lib/isAdmin');
const { isBanned } = require('./lib/isBanned');
const isOwnerOrSudo = require('./lib/isOwner');
const { getPrefix } = require('./lib/prefix');
const { AntiDelete, storeMessage: storeAntideleteMessage, loadAntideleteConfig } = require('./plugins/antidelete');
const { Antilink } = require('./lib/antilink');
const { handleStatusUpdate } = require('./plugins/autostatus');
const { isAutotypingEnabled } = require('./plugins/autotyping');
const { isAutoreadEnabled } = require('./plugins/autoread');
const { handleChatbotResponse } = require('./plugins/chatbot');
const { handleMentionDetection } = require('./plugins/mention');
const { addCommandReaction } = require('./lib/reactions');
const { handleAfkReturn } = require('./plugins/afk');
const { handleStickerReply } = require('./plugins/stickerreply');
const { getConfig: getAutoReplyConfig } = require('./plugins/autoreply');
const { handleTagDetection } = require('./plugins/antitag');
const { addActivity: addAutoStatusActivity } = require('./plugins/autostatus');
const { handleJoinEvent } = require('./plugins/welcome');
const { handleLeaveEvent } = require('./plugins/goodbye');

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

process.env.TMPDIR = tempDir;
process.env.TEMP = tempDir;
process.env.TMP = tempDir;

setInterval(() => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return;
        let cleaned = 0;
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && now - stats.mtimeMs > 3 * 60 * 60 * 1000) {
                    fs.unlink(filePath, () => {
                        cleaned++;
                        console.log(`🧹 Cleaned temp file: ${file}`);
                    });
                }
            });
        });
        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} temp files`);
        }
    });
}, 60 * 60 * 1000);

console.log('🔧 Temp cleanup system initialized');

store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

if (!global.settings) {
    global.settings = {};
}
console.log('🔧 Global settings initialized');

const activityLog = [];
const MAX_ACTIVITY = 50;
function pushActivity(type, detail) {
    activityLog.unshift({ type, detail, time: new Date().toLocaleString() });
    if (activityLog.length > MAX_ACTIVITY) activityLog.length = MAX_ACTIVITY;
}
global.getActivityLog = () => activityLog;
global.pushActivity = pushActivity;

const persistentSettings = loadSettings();
if (persistentSettings && typeof persistentSettings === 'object') {
    Object.assign(global.settings, persistentSettings);
} else {
    console.log('⚠️ No persistent settings found, using defaults');
}

let msgCountData = null;
let msgCountDirty = false;
let msgCountTimer = null;

function loadMessageCount() {
    if (msgCountData) return msgCountData;
    try {
        msgCountData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
    } catch (e) {
        msgCountData = {};
    }
    return msgCountData;
}

function flushMessageCount() {
    if (!msgCountDirty) return;
    try {
        fs.writeFileSync('./data/messageCount.json', JSON.stringify(msgCountData, null, 2));
        msgCountDirty = false;
    } catch (e) { }
}

function scheduleMessageCountFlush() {
    if (msgCountTimer) return;
    msgCountTimer = setTimeout(() => {
        msgCountTimer = null;
        flushMessageCount();
    }, 30000);
}

function incrementMessageCount(chatId, senderId) {
    const data = loadMessageCount();
    if (!data.messages) data.messages = {};
    if (!data.messages[chatId]) data.messages[chatId] = {};
    data.messages[chatId][senderId] = (data.messages[chatId][senderId] || 0) + 1;
    msgCountDirty = true;
    scheduleMessageCountFlush();
}

process.on('exit', flushMessageCount);
process.on('SIGINT', () => { flushMessageCount(); process.exit(0); });
process.on('SIGTERM', () => { flushMessageCount(); process.exit(0); });

const commandCooldowns = new Map();
const CALL_COOLDOWN_MS = 1200;
const MSG_DEDUP_SET = new Set();
const MSG_DEDUP_TTL = 3000;

function isDuplicateMessage(msgId) {
    if (MSG_DEDUP_SET.has(msgId)) return true;
    MSG_DEDUP_SET.add(msgId);
    setTimeout(() => MSG_DEDUP_SET.delete(msgId), MSG_DEDUP_TTL);
    return false;
}

function enforceCommandCooldown(senderId) {
    const now = Date.now();
    const last = commandCooldowns.get(senderId);
    if (last && now - last < CALL_COOLDOWN_MS) return true;
    commandCooldowns.set(senderId, now);
    return false;
}

function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
}

function topMembers(sock, chatId, isGroup) {
    try {
        if (!isGroup) return;
        flushMessageCount();
        const data = msgCountData || JSON.parse(fs.readFileSync('./data/messageCount.json'));
        const chatData = data.messages?.[chatId];
        if (!chatData) {
            sock.sendMessage(chatId, { text: 'No message data available for this group.' });
            return;
        }

        const sorted = Object.entries(chatData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        let text = '🏆 *TOP MEMBERS*\n\n';
        sorted.forEach(([jid, count], index) => {
            text += `${index + 1}. @${jid.split('@')[0]} - ${count} messages\n`;
        });

        sock.sendMessage(chatId, {
            text,
            mentions: sorted.map(([jid]) => jid)
        });
    } catch (error) {
        console.error('Error in topMembers:', error);
    }
}

const gameStates = {
    tictactoe: new Map(),
    hangman: new Map(),
    trivia: new Map()
};

function readAnticallState() {
    try {
        return JSON.parse(fs.readFileSync('./data/anticall.json', 'utf-8'));
    } catch {
        return { enabled: false };
    }
}

function readPmBlockerState() {
    try {
        return JSON.parse(fs.readFileSync('./data/pmblocker.json', 'utf-8'));
    } catch {
        return { enabled: false, message: 'Private messages are blocked.' };
    }
}

async function handleAutotypingForMessage(sock, chatId, userMessage) {
    try {
        if (await isAutotypingEnabled(chatId)) {
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 2000));
            await sock.sendPresenceUpdate('paused', chatId);
        }
    } catch (error) {
        console.error('Error in autotyping:', error);
    }
}

async function showTypingAfterCommand(sock, chatId) {
    try {
        if (await isAutotypingEnabled(chatId)) {
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.sendPresenceUpdate('paused', chatId);
        }
    } catch (error) {
        console.error('Error in post-command typing:', error);
    }
}

async function handleAutoread(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        if (await isAutoreadEnabled(chatId)) {
            await sock.readMessages([message.key]);
        }
    } catch (error) {
        console.error('Error in autoread:', error);
    }
}

global.botname = "🤖 ADEMOLA XD 🔥";
global.themeemoji = "👌";

const SESSION_DIR = path.join(__dirname, 'session');
const CREDS_PATH = path.join(SESSION_DIR, 'creds.json');
// version must match @whiskeysockets/baileys Defaults/index.js — update when upgrading baileys
const BAILEYS_VERSION = [2, 3000, 1027934701];
const NEWSLETTER_IDS = [
    "120363402507750390@newsletter",
    "120363405304938881@newsletter",
    "120363420989526190@newsletter",
    "120363419136706156@newsletter"
];

const newsletterJids = NEWSLETTER_IDS;
const emojis = ["🎉", "🪀", "🎀", "💫"];

const useMobile = process.argv.includes("--mobile")
const useQr = process.argv.includes("--qr") || process.argv.includes("--use-qr")
const requestPairing = !useQr
const phoneNumber = null

let restarting = false;
let reconnectAttempts = 0;
let pairingCodeRequested = false;
let reconnectTimer = null;
let activeSocketId = 0;
const RATE_LIMIT_CODES = [408, 515, 429];

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 600 && !restarting) {
        restarting = true;
        console.log(`⚠️ RAM too high (${used.toFixed(1)}MB > 600MB), restarting bot gracefully...`)
        flushMessageCount();
        process.exit(1)
    }
}, 30_000)

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    }
    // Fallback for non-TTY: read from stdin directly
    return new Promise((resolve) => {
        process.stdin.once('data', (data) => {
            resolve(data.toString().trim())
        })
    })
}

async function downloadSessionData() {
    try {
        await fs.promises.mkdir(SESSION_DIR, { recursive: true });
        if (fs.existsSync(CREDS_PATH)) {
            try {
                const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
                if (creds.registered === true) {
                    console.log('Using saved session credentials');
                    return true;
                }
                console.log(chalk.yellow('creds.json exists but device is not registered — removing for fresh pairing'));
                fs.rmSync(CREDS_PATH);
            } catch {
                fs.rmSync(CREDS_PATH);
            }
        }

        if (!global.SESSION_ID) {
            console.log(chalk.yellow('No saved session or SESSION_ID found. Pairing is required.'));
            return false;
        }

        const separator = global.SESSION_ID.includes('starcore~') ? 'starcore~' : null;
        const base64Data = separator ? global.SESSION_ID.split(separator)[1] : global.SESSION_ID;
        if (!base64Data) throw new Error('Invalid SESSION_ID format');

        await fs.promises.writeFile(CREDS_PATH, Buffer.from(base64Data, 'base64'));
        console.log(chalk.green('Session credentials seeded from SESSION_ID'));
        return true;
    } catch (error) {
        console.error(chalk.red('Error downloading session data:', error.message));
        return false;
    }
}

function getDisconnectStatus(lastDisconnect) {
    return lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.data?.statusCode;
}

function scheduleReconnect(statusCode) {
    if (reconnectTimer) return;

    reconnectAttempts++;
    const backoffDelay = Math.min(3000 * Math.pow(2, reconnectAttempts), 60000);
    const finalDelay = RATE_LIMIT_CODES.includes(statusCode) ? Math.max(backoffDelay, 30000) : backoffDelay;
    console.log(chalk.yellow(`Reconnecting in ${finalDelay / 1000}s... (code: ${statusCode || 'unknown'}, attempt: ${reconnectAttempts})`));

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        restarting = false;
        startAdemolaXD().catch(error => console.error('Reconnect failed:', error));
    }, finalDelay);
}

function loadPlugins() {
    const pluginsDir = path.join(__dirname, 'plugins');
    if (fs.existsSync(pluginsDir)) {
        const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));

        pluginFiles.forEach(file => {
            try {
                require(path.join(pluginsDir, file));
            } catch (error) {
                console.log(chalk.red(`❌ Failed to load: ${file} - ${error.message}`));
            }
        });

        console.log(chalk.cyan(`🎯 Total commands registered: ${commands.length}`));
    }
}

function cleanStaleSessions() {
    try {
        const files = fs.readdirSync(SESSION_DIR).filter(f => f.startsWith('session-') || f.startsWith('tctoken-'));
        if (files.length < 50) return;
        files.sort((a, b) => fs.statSync(path.join(SESSION_DIR, a)).mtimeMs - fs.statSync(path.join(SESSION_DIR, b)).mtimeMs);
        const toRemove = files.slice(0, files.length - 50);
        toRemove.forEach(f => { try { fs.unlinkSync(path.join(SESSION_DIR, f)); } catch { } });
        if (toRemove.length > 0) console.log(chalk.yellow(`🧹 Pruned ${toRemove.length} old session files (${files.length - toRemove.length} kept)`));
    } catch (e) {
        console.error('Session cleanup error:', e.message);
    }
}

async function followNewsletters(ademolaBot) {
    const followStatus = {
        followed: 0,
        alreadyFollowing: 0,
        failed: 0,
        details: []
    };

    for (const newsletterId of NEWSLETTER_IDS) {
        try {
            let alreadyFollowing = false;
            try {
                const metadata = await ademolaBot.newsletterMetadata(newsletterId);
                if (metadata?.viewer_metadata?.role) {
                    followStatus.alreadyFollowing++;
                    followStatus.details.push({ id: newsletterId, status: 'already_following' });
                    alreadyFollowing = true;
                }
            } catch (metadataError) {
            }

            if (alreadyFollowing) continue;

            try {
                await ademolaBot.newsletterFollow(newsletterId);
                followStatus.followed++;
                followStatus.details.push({ id: newsletterId, status: 'followed' });
            } catch (followError) {
                let errorType = 'unknown';
                let errorMessage = followError.message || 'Unknown error';

                if (errorMessage.includes('Not Allowed') || errorMessage.includes('403')) {
                    errorType = 'permission_denied';
                } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    errorType = 'not_found';
                } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
                    errorType = 'rate_limit';
                }

                followStatus.failed++;
                followStatus.details.push({
                    id: newsletterId,
                    status: 'failed',
                    error: errorType,
                    message: errorMessage
                });
            }

            await delay(2000);

        } catch (error) {
            followStatus.failed++;
            followStatus.details.push({
                id: newsletterId,
                status: 'error',
                error: 'unexpected',
                message: error.message
            });
        }
    }

    return followStatus;
}

async function startAdemolaXD() {
    const socketId = ++activeSocketId;
    const sessionLoaded = await downloadSessionData();
    if (!sessionLoaded) {
        console.log(chalk.yellow(!requestPairing ? '📱 QR code will be displayed for authentication.' : '🔑 Pairing code will be requested...'));
    }

    cleanStaleSessions()
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const msgRetryCounterCache = new NodeCache()

    const ademolaBot = makeWASocket({
        version: BAILEYS_VERSION,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !requestPairing,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })

    store.bind(ademolaBot.ev)
    setSocket(ademolaBot)

    loadPlugins();

    ademolaBot.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action: eventAction } = update;
            const actionLabel = eventAction === 'add' ? '➕ JOIN' : '➖ LEAVE';
            const pList = participants.map(p => (p.phoneNumber || p.id || '').split('@')[0]).join(', ');
            console.log(`👥 ${actionLabel} ${id.split('@')[0]}: ${pList}`);
            pushActivity(eventAction === 'add' ? 'join' : 'leave', `${pList} in ${id.split('@')[0]}`);

            if (eventAction === 'add') {
                await handleJoinEvent(ademolaBot, id, participants);
            }

            if (eventAction === 'remove') {
                await handleLeaveEvent(ademolaBot, id, participants);
            }

        } catch (error) {
            console.error('❌ Error in group participants update:', error);
        }
    });

    ademolaBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return

            if (isDuplicateMessage(mek.key.id)) return;

            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message

            try {
                const antideleteConfig = loadAntideleteConfig();
                if (antideleteConfig.enabled) {
                    await storeAntideleteMessage(mek);
                }
            } catch (storeError) {
                console.error('Error storing message for antidelete:', storeError);
            }

            try {
                await Antilink(mek, ademolaBot);
            } catch (antilinkError) {
                console.error('Error in antilink detection:', antilinkError);
            }

            try {
                await handleStatusUpdate(ademolaBot, chatUpdate);
            } catch (statusError) {
                console.error('Error in auto status handling:', statusError);
            }

            await handleAutoread(ademolaBot, mek);

            try {
                const senderIdAfk = mek.key.participant || mek.key.remoteJid;
                if (!mek.key.fromMe) await handleAfkReturn(ademolaBot, mek, mek.key.remoteJid, senderIdAfk);
            } catch (e) {
                console.error('AFK return error:', e.message);
            }

            if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
                try {
                    const serverId = mek.newsletterServerId;
                    if (serverId) {
                        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await ademolaBot.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
                    }
                } catch (e) {
                    console.error('Newsletter react error:', e);
                }
            }

            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await ademolaBot.readMessages([mek.key]).catch(() => { });
                return;
            }

            let isPublic = true;
            try {
                const currentSettings = loadSettings();
                isPublic = currentSettings.commandMode !== 'private';
            } catch (error) {
                console.error('Error checking bot mode:', error);
            }

            if (!isPublic && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const msgSender = mek.key.participant || mek.key.remoteJid;
                if (!(await isOwnerOrSudo(msgSender))) return;
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            if (ademolaBot?.msgRetryCounterCache) {
                ademolaBot.msgRetryCounterCache.clear()
            }

            try {
                await handleAdemolaMessages(ademolaBot, mek)
            } catch (err) {
                console.error("Error in handleAdemolaMessages:", err)
                if (mek.key && mek.key.remoteJid) {
                    await ademolaBot.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.',
                        ...channelInfo
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    ademolaBot.ev.on('messages.update', async (updates) => {
        try {
            const antideleteConfig = loadAntideleteConfig();
            if (!antideleteConfig.enabled) {
                return;
            }

            for (const update of updates) {
                if (update.key?.remoteJid === 'status@broadcast') {
                    await handleStatusUpdate(ademolaBot, update);
                }
            }

            await AntiDelete(ademolaBot, updates);

        } catch (error) {
            console.error('Error in messages.update handler:', error);
        }
    });

    async function handleAdemolaMessages(ademola, mek) {
        const m = smsg(ademola, mek, store);
        const from = mek.key.remoteJid;
        const senderId = mek.key.participant || from;
        const isGroup = from.endsWith('@g.us');
        const senderShort = senderId.split('@')[0];
        const fromName = isGroup ? from.split('@')[0] : senderShort;

        const body = sanitizeInput(mek.message?.conversation ||
            mek.message?.extendedTextMessage?.text ||
            mek.message?.imageMessage?.caption ||
            mek.message?.videoMessage?.caption || '');

        if (body) {
            console.log(`💬 ${isGroup ? '[GRP]' : '[DM]'} ${senderShort}${isGroup ? ' in ' + from.split('@')[0] : ''}: ${body.slice(0, 100)}`);
            pushActivity(isGroup ? 'group_msg' : 'dm_msg', `${senderShort}: ${body.slice(0, 60)}`);
        }

        const currentPrefix = getPrefix();

        let isPublic = true;
        try {
            const currentSettings = loadSettings();
            isPublic = currentSettings.commandMode !== 'private';
        } catch (error) {
            console.error('Error checking bot mode:', error);
        }

        if (!isPublic && !mek.key.fromMe && !(await isOwnerOrSudo(senderId))) {
            return;
        }

        if (isBanned(senderId) && !body.startsWith(`${currentPrefix}unban`)) {
            if (Math.random() < 0.1) {
                await ademola.sendMessage(from, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        if (!isGroup && !mek.key.fromMe && !(await isOwnerOrSudo(senderId))) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    await ademola.sendMessage(from, { text: pmState.message || 'Private messages are blocked.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await ademola.updateBlockStatus(from, 'block'); } catch (e) {
                        console.error('PM block error:', e);
                    }
                    return;
                }
            } catch (e) {
                console.error('PM blocker error:', e);
            }
        }

        if (!body.startsWith(currentPrefix)) {
            if (!mek.key.fromMe) incrementMessageCount(from, senderId);

            await handleAutotypingForMessage(ademola, from, body);

            if (!isGroup && !mek.key.fromMe && !(await isOwnerOrSudo(senderId))) {
                try {
                    const config = getAutoReplyConfig();
                    if (config && config.enabled) {
                        console.log(`🤖 Auto-reply to ${senderShort}: "${config.message.slice(0, 80)}"`);
                        pushActivity('autoreply', `to ${senderShort}`);
                        await ademola.sendMessage(from, { text: config.message });
                    }
                } catch (e) {
                    console.error('Auto-reply error:', e.message);
                }
            }

            try {
                await handleStickerReply(ademola, mek, from, senderId);
            } catch (e) {
                console.error('Sticker reply error:', e.message);
            }

            if (isGroup) {
                await handleChatbotResponse(ademola, from, mek, body, senderId);

                try {
                    await handleTagDetection(ademola, from, mek, senderId);
                } catch (e) {
                    console.error('Anti-tag error:', e);
                }

                await handleMentionDetection(ademola, from, mek);
            }
            return;
        }

        const commandText = body.slice(currentPrefix.length).trim();
        const cmd = commandText.split(/\s+/)[0].toLowerCase();
        const q = commandText.slice(cmd.length).trim();
        const args = q ? q.split(/\s+/) : [];

        const command = commands.find(cmdObj =>
            cmdObj.pattern === cmd ||
            (cmdObj.alias && cmdObj.alias.includes(cmd))
        );

        if (command) {
            if (!mek.key.fromMe && enforceCommandCooldown(senderId)) {
                return;
            }

            try {
                console.log(`⚡ CMD: .${cmd} by ${senderShort}${isGroup ? ' in ' + from.split('@')[0] : ''}${q ? ' | args: ' + q.slice(0, 80) : ''}`);
                pushActivity('command', `.${cmd} by ${senderShort}`);

                if (!mek.key.fromMe) incrementMessageCount(from, senderId);

                const originalReply = (text, options = {}) => ademola.sendMessage(from, { text, ...options }, { quoted: mek });
                const loggedReply = async (text, options = {}) => {
                    const preview = typeof text === 'string' ? text.slice(0, 80) : '[media]';
                    console.log(`📤 Reply to ${senderShort}: ${preview}`);
                    pushActivity('reply', `to ${senderShort}: ${preview}`);
                    return originalReply(text, options);
                };

                await command.function(ademola, mek, m, {
                    from,
                    args,
                    q,
                    text: q,
                    isGroup,
                    sender: senderId,
                    senderNumber: senderId.split('@')[0],
                    botNumber: ademola.user.id.split(':')[0] + '@s.whatsapp.net',
                    pushname: mek.pushName || 'User',
                    isMe: mek.key.fromMe,
                    isOwner: mek.key.fromMe || await isOwnerOrSudo(senderId),
                    reply: loggedReply,
                    isAdmin: async () => {
                        if (!isGroup) return { isSenderAdmin: false, isBotAdmin: false };
                        return await isAdmin(ademola, from, senderId);
                    }
                });

                try {
                    addAutoStatusActivity('command', `Executed ${currentPrefix}${cmd} from ${isGroup ? 'group' : 'private chat'}`);
                } catch (e) {
                    console.error('Auto-status activity error:', e);
                }

                await showTypingAfterCommand(ademola, from);
                await addCommandReaction(ademola, mek);

            } catch (error) {
                console.error(`❌ Command .${cmd} failed:`, error);
                await ademola.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
            }
        }
    }

    ademolaBot.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    ademolaBot.getName = (jid, withoutContact = false) => {
        let id = ademolaBot.decodeJid(jid)
        withoutContact = ademolaBot.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = ademolaBot.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === ademolaBot.decodeJid(ademolaBot.user.id) ?
            ademolaBot.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    ademolaBot.serializeM = (m) => smsg(ademolaBot, m, store)

    const antiCallNotified = new Set();
    ademolaBot.ev.on('call', async (calls) => {
        try {
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    if (typeof ademolaBot.rejectCall === 'function' && call.id) {
                        await ademolaBot.rejectCall(call.id, callerJid);
                    } else if (typeof ademolaBot.sendCallOfferAck === 'function' && call.id) {
                        await ademolaBot.sendCallOfferAck(call.id, callerJid, 'reject');
                    }
                } catch (e) {
                    console.error('Call reject error:', e);
                }

                if (!antiCallNotified.has(callerJid)) {
                    antiCallNotified.add(callerJid);
                    setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                    await ademolaBot.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                }

                setTimeout(async () => {
                    try { await ademolaBot.updateBlockStatus(callerJid, 'block'); } catch (e) {
                        console.error('Block error:', e);
                    }
                }, 800);
            }
        } catch (e) {
            console.error('Call handler error:', e);
        }
    });

    if (requestPairing && !sessionLoaded && !pairingCodeRequested) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        pairingCodeRequested = true;
        setTimeout(async () => {
            try {
                let pairingPhoneNumber = phoneNumber || process.env.OWNER_NUMBER

                pairingPhoneNumber = pairingPhoneNumber.replace(/[^0-9]/g, '')
                const pn = require('awesome-phonenumber');
                if (!pn('+' + pairingPhoneNumber).isValid()) {
                    console.log(chalk.red('Invalid phone number. Please check your OWNER_NUMBER in .env'));
                    pairingCodeRequested = false;
                    return;
                }

                let code = await ademolaBot.requestPairingCode(pairingPhoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code.'))
            }
        }, 3000)
    }

    let lastInboundTs = Date.now();
    ademolaBot.ev.on('messages.upsert', () => { lastInboundTs = Date.now() });
    ademolaBot.ev.on('message-receipt.update', () => { lastInboundTs = Date.now() });

    ademolaBot.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            lastInboundTs = Date.now();
            reconnectAttempts = 0;
            pairingCodeRequested = false;
            console.log(chalk.magenta(` `))
            console.log(chalk.bold.blue(`🤖 Connected to => ` + JSON.stringify(ademolaBot.user, null, 2)))

            if (!ademolaBot.user) return

            const botUserJid = ademolaBot.user.id.split(':')[0] + '@s.whatsapp.net';
            global.ownerJid = botUserJid;
            console.log(chalk.green(`👑 Owner auto-detected: ${global.ownerJid}`));

            const botNumber = botUserJid;
            const botName = ademolaBot.user?.name || ademolaBot.user?.pushName || 'Ademola Bot';

            const currentSettings = loadSettings();
            const antideleteConfig = loadAntideleteConfig();

            try {
                const welcomeMsg = `╭─ 🤖 *${botName}* ─╮
│ ✅ Connected & Ready
│ 📌 Prefix: *${getPrefix()}*
│ 👑 Owner: ${botNumber.split('@')[0]}
│ ⏰ ${new Date().toLocaleString()}
╰────────────────────╯

💡 Send *${getPrefix()}menu* to see all commands interactively`;
                await ademolaBot.sendMessage(botNumber, { text: welcomeMsg });
            } catch (menuErr) {
                console.error('Failed to send startup message:', menuErr);
                await ademolaBot.sendMessage(botNumber, { text: `🤖 *${botName}* is ready!\n📌 Prefix: ${getPrefix()}\n📦 Commands: ${commands.length}` });
            }

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname} ]`)}\n\n`))

            const followStatus = await followNewsletters(ademolaBot);

            console.log(chalk.bold.yellow(`< =================================== >`))
            console.log(chalk.bold.green(` ✅ Status: Connected & Ready`))
            console.log(chalk.bold.blue(` 🔒 Session: Protected`))
            console.log(chalk.bold.blue(` 🚯 Antidelete: ${antideleteConfig.enabled ? 'ENABLED' : 'DISABLED'}`))
            console.log(chalk.bold.blue(` 🔧 Bot Mode: ${currentSettings.commandMode?.toUpperCase() || 'PUBLIC'}`))
            console.log(chalk.bold.blue(`
 ──[ 🤖 𝚆𝚎𝚕𝚌𝚘𝚖 𝙳𝚎𝚊𝚛 𝚄𝚜𝚎𝚛! ]─

 If you enjoy using this bot please thank ADEMOLA for making it possible😂😂 💙 

`))
            console.log(chalk.bold.yellow(`< ================================== >`))

            setInterval(cleanStaleSessions, 6 * 60 * 60 * 1000);

        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    fs.rmSync(SESSION_DIR, { recursive: true, force: true })
                } catch { }
                global.SESSION_ID = null;
                console.log(chalk.red('Session logged out. Manual re-authentication required.'))
                pairingCodeRequested = false;
                return;
            }
            reconnectAttempts++;
            const backoffDelay = Math.min(3000 * Math.pow(2, reconnectAttempts), 60000);
            const isRateLimited = RATE_LIMIT_CODES.includes(statusCode);
            const finalDelay = isRateLimited ? Math.max(backoffDelay, 30000) : backoffDelay;
            console.log(chalk.yellow(`🔄 Reconnecting in ${finalDelay/1000}s... (code: ${statusCode || 'unknown'}, attempt: ${reconnectAttempts})`));
            await delay(finalDelay);
            restarting = false;
            startAdemolaXD();
        }
    })

    ademolaBot.ev.on('creds.update', saveCreds)

    const DEAF_THRESHOLD_MS = 5 * 60 * 1000;
    setInterval(() => {
        if (Date.now() - lastInboundTs > DEAF_THRESHOLD_MS) {
            console.log('[watchdog] socket deaf — no inbound events for 5+ min while connected, restarting');
            process.exit(1);
        }
    }, 30_000);

    return ademolaBot
}

startAdemolaXD().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})
