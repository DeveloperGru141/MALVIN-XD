// Ademola🤴 
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// ========== TEMP CLEANUP SYSTEM ==========
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Redirect temp storage away from system /tmp
process.env.TMPDIR = tempDir;
process.env.TEMP = tempDir;
process.env.TMP = tempDir;

// Auto-cleaner every hour
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

// ========= TINYCAP SETTING ================

// Tiny caps mapping
const tinyCapsMap = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
    j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ',
    s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};

const toTinyCaps = (str) => {
    return str.split('').map((char) => tinyCapsMap[char.toLowerCase()] || char).join('');
};

// ========== IMPORT SETTINGS MANAGER ==========
const { loadSettings } = require('./lib/settingsManager');

// Import Ademola XD framework
const { ademola, commands } = require('./ademola')
// ========== CHANNEL INFO CONFIG =======
const { channelInfo } = require('./lib/messageConfig')
// Import lightweight store
const store = require('./lib/lightweight_store')

// ========== IMPORT FROM LIB FILES ==========
const isAdmin = require('./lib/isAdmin');
const { isBanned } = require('./lib/isBanned');
const isOwnerOrSudo = require('./lib/isOwner');

// ========== IMPORT PREFIX SYSTEM ==========
const { getPrefix, setPrefix, resetPrefix } = require('./lib/prefix');

// ========== IMPORT NEW ANTIDELETE ==========
const { AntiDelete, storeMessage: storeAntideleteMessage, loadAntideleteConfig } = require('./plugins/antidelete');

// ========== IMPORT ANTILINK SYSTEM ==========
const { Antilink } = require('./lib/antilink');

// ========== IMPORT AUTO STATUS SYSTEM ==========
const { handleStatusUpdate } = require('./plugins/autostatus');

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// ========== FIX: INITIALIZE GLOBAL.SETTINGS BEFORE USE ==========
// Initialize global.settings if it doesn't exist
if (!global.settings) {
    global.settings = {};
}
console.log('🔧 Global settings initialized');

// ========== ACTIVITY LOG (accessible to plugins) ==========
const activityLog = [];
const MAX_ACTIVITY = 50;
function pushActivity(type, detail) {
    activityLog.unshift({ type, detail, time: new Date().toLocaleString() });
    if (activityLog.length > MAX_ACTIVITY) activityLog.length = MAX_ACTIVITY;
}
global.getActivityLog = () => activityLog;
global.pushActivity = pushActivity;

// ========== LOAD PERSISTENT SETTINGS ==========
const persistentSettings = loadSettings();
// Update global settings with persistent values - WITH SAFETY CHECK
if (persistentSettings && typeof persistentSettings === 'object') {
    Object.assign(global.settings, persistentSettings);
   // console.log('⚙️ Persistent settings loaded');
} else {
    console.log('⚠️ No persistent settings found, using defaults');
}
// ========== PREFIX HANDLING ==========
// Use dynamic prefix from prefix module
//const PREFIX = getPrefix();

// ========== ESSENTIAL FUNCTIONS ==========

// Message count functions
function incrementMessageCount(chatId, senderId) {
    try {
        const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
        if (!data.messages) data.messages = {};
        if (!data.messages[chatId]) data.messages[chatId] = {};
        data.messages[chatId][senderId] = (data.messages[chatId][senderId] || 0) + 1;
        fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
    } catch (error) {
        //console.error('Error incrementing message count:', error);
    }
}

function topMembers(sock, chatId, isGroup) {
    try {
        if (!isGroup) return;
        const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
        const chatData = data.messages?.[chatId];
        if (!chatData) {
            sock.sendMessage(chatId, { text: 'No message data available for this group.' });
            return;
        }
        
        const sorted = Object.entries(chatData)
            .sort(([,a], [,b]) => b - a)
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
        //console.error('Error in topMembers:', error);
    }
}

// Game state management
const gameStates = {
    tictactoe: new Map(),
    hangman: new Map(),
    trivia: new Map()
};

// Anti-call state
function readAnticallState() {
    try {
        return JSON.parse(fs.readFileSync('./data/anticall.json', 'utf-8'));
    } catch {
        return { enabled: false };
    }
}

// PM blocker state
function readPmBlockerState() {
    try {
        return JSON.parse(fs.readFileSync('./data/pmblocker.json', 'utf-8'));
    } catch {
        return { enabled: false, message: 'Private messages are blocked.' };
    }
}

// ========== ADDITIONAL ESSENTIAL FUNCTIONS ==========

// Autotyping functionality
async function handleAutotypingForMessage(sock, chatId, userMessage) {
    try {
        const { isAutotypingEnabled } = require('./plugins/autotyping');
        if (await isAutotypingEnabled(chatId)) {
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 2000));
            await sock.sendPresenceUpdate('paused', chatId);
        }
    } catch (error) {
        //console.error('Error in autotyping:', error);
    }
}

async function showTypingAfterCommand(sock, chatId) {
    try {
        const { isAutotypingEnabled } = require('./plugins/autotyping');
        if (await isAutotypingEnabled(chatId)) {
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.sendPresenceUpdate('paused', chatId);
        }
    } catch (error) {
        //console.error('Error in post-command typing:', error);
    }
}

// Autoread functionality
async function handleAutoread(sock, message) {
    try {
        const { isAutoreadEnabled } = require('./plugins/autoread');
        const chatId = message.key.remoteJid;
        if (await isAutoreadEnabled(chatId)) {
            await sock.readMessages([message.key]);
        }
    } catch (error) {
      //  console.error('Error in autoread:', error);
    }
}

// Chatbot response
async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    try {
        const { handleChatbotResponse } = require('./plugins/chatbot');
        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
    } catch (error) {
       // console.error('Error in chatbot response:', error);
    }
}

// Mention detection
async function handleMentionDetection(sock, chatId, message) {
    try {
        const { handleMentionDetection } = require('./plugins/mention');
        await handleMentionDetection(sock, chatId, message);
    } catch (error) {
        console.error('Error in mention detection:', error);
    }
}

// Command reactions
async function addCommandReaction(sock, message) {
    try {
        const { addCommandReaction } = require('./lib/reactions');
        await addCommandReaction(sock, message);
    } catch (error) {
        console.error('Error adding command reaction:', error);
    }
}

// ========== GLOBAL SETTINGS ==========

global.botname = "🤖 ADEMOLA XD 🔥";
global.themeemoji = "👌";

// ========== BOT CONFIGURATION ==========
const SESSION_DIR = path.join(__dirname, 'session');
const CREDS_PATH = path.join(SESSION_DIR, 'creds.json');
const NEWSLETTER_IDS =[
    "120363402507750390@newsletter",
    "120363405304938881@newsletter",
    "120363420989526190@newsletter", 
    "120363419136706156@newsletter"
];

const newsletterJids = [
    "120363402507750390@newsletter",
    "120363405304938881@newsletter",
    "120363420989526190@newsletter", 
    "120363419136706156@newsletter"
];
const emojis = ["🎉", "🪀", "🎀","💫"];

const useMobile = process.argv.includes("--mobile")
const useQr = process.argv.includes("--qr") || process.argv.includes("--use-qr")
const requestPairing = !useQr
const phoneNumber = process.env.OWNER_NUMBER || "2348108574293"

// Memory optimization
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000)

// Memory monitoring
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...')
        process.exit(1)
    }
}, 30_000)

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    }
    return Promise.resolve(phoneNumber)
}

// Session data function
async function downloadSessionData() {
    try {
        await fs.promises.mkdir(SESSION_DIR, { recursive: true });
        if (!existsSync(CREDS_PATH)) {
            if (!global.SESSION_ID) {
                console.log(chalk.red('Session ID not found and creds.json missing! Falling back to pairing code...'));
                return false;
            }
            const base64Data = global.SESSION_ID.split('starcore~')[1];
            if (!base64Data) throw new Error('Invalid SESSION_ID format');
            await fs.promises.writeFile(CREDS_PATH, Buffer.from(base64Data, 'base64'));
            console.log(chalk.green('Session successfully saved!'));
            return true;
        }
        console.log('creds.json already exists');
        return true;
    } catch (error) {
        console.error(chalk.red('Error downloading session data:', error.message));
        return false;
    }
}

// Load all plugins automatically
function loadPlugins() {
    const pluginsDir = path.join(__dirname, 'plugins');
    if (fs.existsSync(pluginsDir)) {
        const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
        
        pluginFiles.forEach(file => {
            try {
                require(path.join(pluginsDir, file));
            } catch (error) {
              //  console.log(chalk.red(`❌ Failed to load: ${file} - ${error.message}`));
            }
        });
        
        console.log(chalk.cyan(`🎯 Total commands registered: ${commands.length}`));
    }
}

// ========== FIXED NEWSLETTER FOLLOW FUNCTION ==========
async function followNewsletters(ademolaBot) {
    //console.log(chalk.cyan('📡 Starting newsletter follow process...'));
    
    const followStatus = { 
        followed: 0, 
        alreadyFollowing: 0, 
        failed: 0,
        details: []
    };

    for (const newsletterId of NEWSLETTER_IDS) {
        try {
           // console.log(chalk.blue(`🔄 Processing: ${newsletterId}`));
            
            // Check if we're already following this newsletter
            let alreadyFollowing = false;
            try {
                const metadata = await ademolaBot.newsletterMetadata(newsletterId);
                if (metadata?.viewer_metadata?.role) {
                   // console.log(chalk.yellow(`   📌 Already following: ${newsletterId}`));
                    followStatus.alreadyFollowing++;
                    followStatus.details.push({ id: newsletterId, status: 'already_following' });
                    alreadyFollowing = true;
                }
            } catch (metadataError) {
                // If metadata check fails, assume we're not following
              //  console.log(chalk.gray(`   ℹ️  Not following: ${newsletterId}`));
            }

            if (alreadyFollowing) {
                continue;
            }

            // Attempt to follow the newsletter
            try {
                await ademolaBot.newsletterFollow(newsletterId);
                //console.log(chalk.green(`   ✅ Successfully followed: ${newsletterId}`));
                followStatus.followed++;
                followStatus.details.push({ id: newsletterId, status: 'followed' });
            } catch (followError) {
                let errorType = 'unknown';
                let errorMessage = followError.message || 'Unknown error';
                
                if (errorMessage.includes('Not Allowed') || errorMessage.includes('403')) {
                    errorType = 'permission_denied';
                    //console.log(chalk.red(`   ❌ Permission denied: ${newsletterId}`));
                } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    errorType = 'not_found';
                   // console.log(chalk.red(`   ❌ Newsletter not found: ${newsletterId}`));
                } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
                    errorType = 'rate_limit';
                   // console.log(chalk.red(`   ❌ Rate limited: ${newsletterId}`));
                } else {
                   // console.log(chalk.red(`   ❌ Failed to follow ${newsletterId}: ${errorMessage}`));
                }
                
                followStatus.failed++;
                followStatus.details.push({ 
                    id: newsletterId, 
                    status: 'failed', 
                    error: errorType,
                    message: errorMessage
                });
            }

            // Add delay between follow attempts to avoid rate limiting
            await delay(2000);
            
        } catch (error) {
            //console.log(chalk.red(`   💥 Unexpected error with ${newsletterId}: ${error.message}`));
            followStatus.failed++;
            followStatus.details.push({ 
                id: newsletterId, 
                status: 'error', 
                error: 'unexpected',
                message: error.message
            });
        }
    }

 /*   console.log(chalk.cyan(
        `\n📡 Newsletter Follow Summary:\n✅ Newly Followed: ${followStatus.followed}\n📌 Already Following: ${followStatus.alreadyFollowing}\n❌ Failed: ${followStatus.failed}`
    ));
    */

    // Log detailed results
    if (followStatus.details.length > 0) {
      //  console.log(chalk.yellow('\n📋 Detailed Results:'));
        followStatus.details.forEach(detail => {
            const icon = detail.status === 'followed' ? '✅' : 
                        detail.status === 'already_following' ? '📌' : '❌';
         //   console.log(chalk.yellow(`   ${icon} ${detail.id} - ${detail.status}`));
            if (detail.error) {
               // console.log(chalk.gray(`      Error: ${detail.error} - ${detail.message}`));
            }
        });
    }

    return followStatus;
}

// Main bot function
async function startAdemolaXD() {
    // Add session data handling
    const sessionLoaded = await downloadSessionData();
    if (!sessionLoaded) {
        console.log(chalk.yellow(!requestPairing ? '📱 QR code will be displayed for authentication.' : '🔑 Pairing code will be requested...'));
    }

    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const msgRetryCounterCache = new NodeCache()

    const ademolaBot = makeWASocket({
        version,
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

    // Load all plugins
    loadPlugins();

    // ========== WELCOME & GOODBYE HANDLER INTEGRATION ==========
    const { handleJoinEvent } = require('./plugins/welcome');
    const { handleLeaveEvent } = require('./plugins/goodbye');

    // Group participants update handler for welcome/goodbye messages
    ademolaBot.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action: eventAction } = update;
            const actionLabel = eventAction === 'add' ? '➕ JOIN' : '➖ LEAVE';
            const pList = participants.map(p => (p.phoneNumber || p.id || '').split('@')[0]).join(', ');
            console.log(`👥 ${actionLabel} ${id.split('@')[0]}: ${pList}`);
            pushActivity(eventAction === 'add' ? 'join' : 'leave', `${pList} in ${id.split('@')[0]}`);
            
            // Handle join events - welcome new members
            if (eventAction === 'add') {
                await handleJoinEvent(ademolaBot, id, participants);
            }
            
            // Handle leave events - goodbye messages
            if (eventAction === 'remove') {
                await handleLeaveEvent(ademolaBot, id, participants);
            }
            
        } catch (error) {
           // console.error('❌ Error in group participants update:', error);
        }
    });

    // ========== COMPLETE MESSAGE HANDLING INTEGRATION ==========
    ademolaBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            
            // Enhanced message processing for antidelete
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            
            //console.log(`📨 New message received: ${mek.key.id} from ${mek.key.remoteJid}`);
            
            // Store messages for antidelete system - ONLY IF ANTIDELETE IS ENABLED
            try {
                const antideleteConfig = loadAntideleteConfig();
                if (antideleteConfig.enabled) {
                    await storeAntideleteMessage(mek);
                    //console.log(`💾 Message stored in antidelete cache: ${mek.key.id}`);
                }
            } catch (storeError) {
              //  console.error('Error storing message for antidelete:', storeError);
            }
            
            // === ANTILINK DETECTION ===
            try {
                await Antilink(mek, ademolaBot);
            } catch (antilinkError) {
                //console.error('Error in antilink detection:', antilinkError);
            }
            
            // === AUTO STATUS HANDLING ===
            try {
                await handleStatusUpdate(ademolaBot, chatUpdate);
            } catch (statusError) {
               // console.error('Error in auto status handling:', statusError);
            }
            
            // Handle autoread functionality
            await handleAutoread(ademolaBot, mek);
            
            // Newsletter react functionality
            if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
              try {
                const serverId = mek.newsletterServerId;
                if (serverId) {
                  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                  await ademolaBot.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
                }
              } catch (e) {
                // Silent catch
              }
            }
            
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                return;
            }
            
            // Read bot mode from persistent settings
            let isPublic = true;
            try {
                const currentSettings = loadSettings();
                isPublic = currentSettings.commandMode !== 'private';
            } catch (error) {
              //  console.error('Error checking bot mode:', error);
            }
            
            if (!isPublic && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache to prevent memory bloat
            if (ademolaBot?.msgRetryCounterCache) {
                ademolaBot.msgRetryCounterCache.clear()
            }

            try {
                await handleAdemolaMessages(ademolaBot, mek)
            } catch (err) {
               // console.error("Error in handleAdemolaMessages:", err)
                if (mek.key && mek.key.remoteJid) {
                    await ademolaBot.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.',
                        ...channelInfo 
                    }).catch(console.error);
                }
            }
        } catch (err) {
           // console.error("Error in messages.upsert:", err)
        }
    })

    // ========== FIXED MESSAGE DELETION HANDLER ==========
    ademolaBot.ev.on('messages.update', async (updates) => {
        try {
         //   console.log(`🔄 messages.update event triggered with ${updates.length} update(s)`);
            
            // Check if antidelete is enabled before processing
            const antideleteConfig = loadAntideleteConfig();
            if (!antideleteConfig.enabled) {
                //console.log('🚫 Antidelete is disabled, skipping deletion processing');
                return;
            }
            
            // Handle status updates in message updates
            for (const update of updates) {
                if (update.key?.remoteJid === 'status@broadcast') {
                    await handleStatusUpdate(ademolaBot, update);
                }
            }
            
            // Anti-delete handling - USE ONLY THE MAIN FUNCTION
           // console.log('🔍 Processing deletions with AntiDelete...');
            await AntiDelete(ademolaBot, updates);
            
        } catch (error) {
           // console.error('Error in messages.update handler:', error);
        }
    });

    // Ademola XD message handler
    async function handleAdemolaMessages(ademola, mek) {
        const m = smsg(ademola, mek, store);
        const from = mek.key.remoteJid;
        const senderId = mek.key.participant || from;
        const isGroup = from.endsWith('@g.us');
        const senderShort = senderId.split('@')[0];
        const fromName = isGroup ? from.split('@')[0] : senderShort;
        
        // Get message content
        const body = mek.message?.conversation || 
                    mek.message?.extendedTextMessage?.text || 
                    mek.message?.imageMessage?.caption ||
                    mek.message?.videoMessage?.caption || '';
        
        if (body) {
            console.log(`💬 ${isGroup ? '[GRP]' : '[DM]'} ${senderShort}${isGroup ? ' in ' + from.split('@')[0] : ''}: ${body.slice(0, 100)}`);
            pushActivity(isGroup ? 'group_msg' : 'dm_msg', `${senderShort}: ${body.slice(0, 60)}`);
        }
        
        // Get current prefix dynamically
        const currentPrefix = getPrefix();
        
        // Read bot mode from persistent settings
        let isPublic = true;
        try {
            const currentSettings = loadSettings();
            isPublic = currentSettings.commandMode !== 'private';
        } catch (error) {
            console.error('Error checking bot mode:', error);
        }
        
        // Check bot mode restrictions
        if (!isPublic && !mek.key.fromMe && !(await isOwnerOrSudo(senderId))) {
            return; // Silently ignore in private mode
        }

        // Check if user is banned
        if (isBanned(senderId) && !body.startsWith(`${currentPrefix}unban`)) {
            if (Math.random() < 0.1) {
                await ademola.sendMessage(from, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        // PM blocker
        if (!isGroup && !mek.key.fromMe && !(await isOwnerOrSudo(senderId))) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    await ademola.sendMessage(from, { text: pmState.message || 'Private messages are blocked.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await ademola.updateBlockStatus(from, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        if (!body.startsWith(currentPrefix)) {
            // Increment message count for non-command messages
            if (!mek.key.fromMe) incrementMessageCount(from, senderId);
            
            // Handle autotyping for non-command messages
            await handleAutotypingForMessage(ademola, from, body);
            
            // Handle auto-reply for private messages (away mode)
            if (!isGroup && !mek.key.fromMe && !(await isOwnerOrSudo(senderId))) {
                try {
                    const { getConfig } = require('./plugins/autoreply');
                    const config = getConfig();
                    if (config && config.enabled) {
                        console.log(`🤖 Auto-reply to ${senderShort}: "${config.message.slice(0, 80)}"`);
                        pushActivity('autoreply', `to ${senderShort}`);
                        await ademola.sendMessage(from, { text: config.message });
                    }
                } catch (e) {
                    console.error('Auto-reply error:', e.message);
                }
            }
            
            // Handle group-specific features
            if (isGroup) {
                // Chatbot response
                await handleChatbotResponse(ademola, from, mek, body, senderId);
                
                // Tag detection (antitag)
                const { handleTagDetection } = require('./plugins/antitag');
                await handleTagDetection(ademola, from, mek, senderId);
                
                // Mention detection
                await handleMentionDetection(ademola, from, mek);
            }
            return;
        }

        const cmd = body.slice(currentPrefix.length).trim().split(' ')[0].toLowerCase();
        const args = body.slice(currentPrefix.length + cmd.length).trim().split(' ');
        const q = args.join(' ').trim();
        
        // Find the command
        const command = commands.find(cmdObj => 
            cmdObj.pattern === cmd || 
            (cmdObj.alias && cmdObj.alias.includes(cmd))
        );

        if (command) {
            try {
                console.log(`⚡ CMD: .${cmd} by ${senderShort}${isGroup ? ' in ' + from.split('@')[0] : ''}${q ? ' | args: ' + q.slice(0, 80) : ''}`);
                pushActivity('command', `.${cmd} by ${senderShort}`);

                // Increment message count for commands
                if (!mek.key.fromMe) incrementMessageCount(from, senderId);

                // Wrap reply to log sent messages
                const originalReply = (text, options = {}) => ademola.sendMessage(from, { text, ...options }, { quoted: mek });
                const loggedReply = async (text, options = {}) => {
                    const preview = typeof text === 'string' ? text.slice(0, 80) : '[media]';
                    console.log(`📤 Reply to ${senderShort}: ${preview}`);
                    pushActivity('reply', `to ${senderShort}: ${preview}`);
                    return originalReply(text, options);
                };

                // Execute the command with 3s timeout
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT')), 3000)
                );
                await Promise.race([
                    command.function(ademola, mek, m, {
                        from,
                        args: args.slice(1),
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
                    }),
                    timeout
                ]);
                
                try {
                    const { addActivity } = require('./plugins/autostatus');
                    addActivity('command', `Executed ${currentPrefix}${cmd} from ${isGroup ? 'group' : 'private chat'}`);
                } catch (e) {}
                
                // Show typing after command execution
                await showTypingAfterCommand(ademola, from);
                
                // Add command reaction
                await addCommandReaction(ademola, mek);
                
            } catch (error) {
                if (error.message === 'TIMEOUT') {
                    console.log(`⏱️ CMD .${cmd} timed out after 3s`);
                    pushActivity('timeout', `.${cmd}`);
                    await ademola.sendMessage(from, { text: `⏱️ Command .${cmd} is taking too long. The bot is functional but the response may need more time.` }, { quoted: mek });
                } else {
                    await ademola.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
                }
            }
        }
    }

    // Add utility functions to ademolaBot
    ademolaBot.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    ademolaBot.getName = (jid, withoutContact = false) => {
        id = ademolaBot.decodeJid(jid)
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

    ademolaBot.public = true
    ademolaBot.serializeM = (m) => smsg(ademolaBot, m, store)

    // Handle pairing code
    if (requestPairing && !sessionLoaded) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let pairingPhoneNumber = phoneNumber || await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFormat: 263714757857 (without + or spaces) : `)))

        pairingPhoneNumber = pairingPhoneNumber.replace(/[^0-9]/g, '')
        const pn = require('awesome-phonenumber');
        if (!pn('+' + pairingPhoneNumber).isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 263714757857 for Zimbabwe, 447911123456 for UK, etc.) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await ademolaBot.requestPairingCode(pairingPhoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'))
            }
        }, 3000)
    }

    // Anti-call handler
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
                } catch {}

                if (!antiCallNotified.has(callerJid)) {
                    antiCallNotified.add(callerJid);
                    setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                    await ademolaBot.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                }

                setTimeout(async () => {
                    try { await ademolaBot.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

    // Connection handling
    ademolaBot.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.bold.blue(`🤖 Connected to => ` + JSON.stringify(ademolaBot.user, null, 2)))

            // Auto-detect owner from bot's own identity
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
            
            // ========== FIXED NEWSLETTER FOLLOWING ==========
            const followStatus = await followNewsletters(ademolaBot);
           
            console.log(chalk.bold.yellow(`< =================================== >`))
            console.log(chalk.bold.green(` ✅ Status: Connected & Ready`))
            console.log(chalk.bold.blue(` 🔒 Session: Protected`))
            console.log(chalk.bold.blue(` 🚯 Antidelete: ${antideleteConfig.enabled ? 'ENABLED' : 'DISABLED'}`))
            console.log(chalk.bold.blue(` 🔧 Bot Mode: ${currentSettings.commandMode?.toUpperCase() || 'PUBLIC'}`))
            //console.log(chalk.bold.blue(` 📢 Newsletters: ${followStatus.followed} new, ${followStatus.alreadyFollowing} existing, ${followStatus.failed} failed`))
            console.log(chalk.bold.blue(`
 ──[ 🤖 𝚆𝚎𝚕𝚌𝚘𝚖 𝙳𝚎𝚊𝚛 𝚄𝚜𝚎𝚛! ]─

 If you enjoy using this bot,
 please ⭐  Star it & 🍴  Fork it on GitHub!
 your support keeps it growing! 💙 
 
`))
            console.log(chalk.bold.yellow(`< ================================== >`))
                              
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync(SESSION_DIR, { recursive: true, force: true })
                } catch { }
                console.log(chalk.red('Session logged out. Please re-authenticate.'))
            }
            console.log(chalk.yellow(`🔄 Reconnecting in 3s... (code: ${statusCode || 'unknown'})`));
            await delay(3000);
            startAdemolaXD();
        }
    })

    ademolaBot.ev.on('creds.update', saveCreds)

    return ademolaBot
}

// Start the bot with error handling
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

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
// if u are a real dev stop using my codes