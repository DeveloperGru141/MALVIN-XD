const { ademola, fakevCard } = require("../ademola");
const { loadSettings, saveSettings, updateSetting } = require('../lib/settingsManager');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');

// ==================== BOT MODE SETTING ====================
ademola({
    pattern: "mode",
    alias: ["setmode", "botmode"],
    desc: "Set bot mode to private or public",
    category: "settings",
    react: "🔧",
    use: ".mode <private/public>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) return await reply('❌ Only bot owner can change bot mode!');

        const currentSettings = loadSettings();
        const currentMode = currentSettings.commandMode || "public";

        if (!q) {
            return await reply(`🔧 *Current Bot Mode:* ${currentMode.toUpperCase()}\n\nUsage: .mode private OR .mode public\n\n*Private:* Only owner can use commands\n*Public:* Everyone can use commands`);
        }

        const modeArg = q.toLowerCase();

        if (["private", "public"].includes(modeArg)) {
            // Update settings persistently
            const success = updateSetting('commandMode', modeArg);
            
            // ALSO UPDATE messageCount.json
            try {
                const messageCountPath = './data/messageCount.json';
                let messageCountData = { isPublic: true, messageCount: {} };
                
                if (fs.existsSync(messageCountPath)) {
                    messageCountData = JSON.parse(fs.readFileSync(messageCountPath, 'utf8'));
                }
                
                // Set isPublic based on mode
                messageCountData.isPublic = (modeArg === 'public');
                
                fs.writeFileSync(messageCountPath, JSON.stringify(messageCountData, null, 2));
                console.log(`✅ Updated messageCount.json: isPublic = ${messageCountData.isPublic}`);
                
            } catch (error) {
                console.error('Error updating messageCount.json:', error);
            }
            
            if (success) {
                await reply(`✅ Bot mode set to *${modeArg.toUpperCase()}*\n\n${modeArg === 'private' ? '🔒 Only owner can use commands now' : '🔓 Everyone can use commands now'}`);
                
                // Update global settings for current session
                const updatedSettings = loadSettings();
                Object.assign(global.settings, updatedSettings);
            } else {
                await reply('❌ Failed to save mode setting');
            }
        } else {
            return await reply("❌ Invalid mode. Use: .mode private OR .mode public");
        }

    } catch (error) {
        console.error('Mode error:', error);
        await reply('❌ Failed to change bot mode');
    }
});

// ==================== SET BOT IMAGE ====================
ademola({
    pattern: "setbotimage",
    alias: ["botdp", "botpic", "botimage"],
    desc: "Set the bot's display image (for menu/profile)",
    category: "owner",
    react: "🖼️",
    use: ".setbotimage <url> or reply to image",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) return await reply('❌ Only bot owner can change bot image!');

        let imageUrl = q;

        // Upload image if replying to one
        if (!imageUrl && mek.message?.extendedTextMessage?.contextInfo) {
            const quotedMessage = mek.message.extendedTextMessage.contextInfo;
            
            if (quotedMessage.quotedMessage?.imageMessage) {
                const imageBuffer = await ademola.downloadMediaMessage(quotedMessage, 'buffer', {}, {});
                
                // Upload to catbox
                const tempFilePath = path.join(os.tmpdir(), `botimg_${Date.now()}.jpg`);
                fs.writeFileSync(tempFilePath, imageBuffer);

                const form = new FormData();
                form.append("fileToUpload", fs.createReadStream(tempFilePath), `botimage.jpg`);
                form.append("reqtype", "fileupload");

                const response = await axios.post("https://catbox.moe/user/api.php", form, {
                    headers: form.getHeaders()
                });

                fs.unlinkSync(tempFilePath);

                if (typeof response.data === 'string' && response.data.startsWith('https://')) {
                    imageUrl = response.data;
                } else {
                    throw new Error('Upload failed');
                }
            } else {
                return await reply("❌ Please reply to an image");
            }
        }

        if (!imageUrl || !imageUrl.startsWith("http")) {
            return await reply("❌ Provide a valid image URL or reply to an image");
        }

        // Update settings persistently - ONLY update imageUrl
        const success = updateSetting('imageUrl', imageUrl);
        
        if (success) {
            await reply(`✅ Bot display image updated!\n\n📷 *New Image URL:*\n${imageUrl}\n\n🖼️ *This image will be used in:*\n• Menu commands\n• Profile displays\n• Bot information`);
            
            // Update global settings for current session
            const updatedSettings = loadSettings();
            Object.assign(global.settings, updatedSettings);
        } else {
            await reply('❌ Failed to save bot image setting');
        }

    } catch (error) {
        console.error('SetBotImage error:', error);
        await reply('❌ Failed to update bot image: ' + error.message);
    }
});

// ==================== SET BOT NAME ====================
ademola({
    pattern: "setbotname",
    alias: ["botname", "changebotname"],
    desc: "Set the bot's display name",
    category: "owner",
    react: "🤖",
    use: ".setbotname <new name>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) return await reply('❌ Only bot owner can change bot name!');

        if (!q) return await reply('❌ Please provide a new bot name');

        // Update settings persistently
        const success = updateSetting('botName', q);
        
        if (success) {
            // Update bot profile name
            try {
                await ademola.updateProfileName(q);
            } catch (err) {
                console.log('Profile name update error:', err);
            }

            await reply(`✅ Bot name updated to: *${q}*`);
            
            // Update global settings for current session
            const updatedSettings = loadSettings();
            Object.assign(global.settings, updatedSettings);
        } else {
            await reply('❌ Failed to save bot name setting');
        }

    } catch (error) {
        console.error('SetBotName error:', error);
        await reply('❌ Failed to update bot name');
    }
});

// ==================== SET OWNER NAME ====================
ademola({
    pattern: "setownername",
    alias: ["ownername", "changeownername"],
    desc: "Set the owner's display name",
    category: "owner",
    react: "👑",
    use: ".setownername <new name>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) return await reply('❌ Only bot owner can change owner name!');

        if (!q) return await reply('❌ Please provide a new owner name');

        // Update settings persistently
        const success = updateSetting('botOwner', q);
        
        if (success) {
            await reply(`✅ Owner name updated to: *${q}*`);
            
            // Update global settings for current session
            const updatedSettings = loadSettings();
            Object.assign(global.settings, updatedSettings);
        } else {
            await reply('❌ Failed to save owner name setting');
        }

    } catch (error) {
        console.error('SetOwnerName error:', error);
        await reply('❌ Failed to update owner name');
    }
});

// ==================== SET BOT AUDIO ====================
ademola({
    pattern: "setbotaudio",
    alias: ["botaudio", "changeaudio"],
    desc: "Set bot's menu/status audio",
    category: "owner",
    react: "🎵",
    use: ".setbotaudio <menu/alive> <url>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) return await reply('❌ Only bot owner can change bot audio!');

        const [type, ...urlParts] = q.split(' ');
        const url = urlParts.join(' ');

        const currentSettings = loadSettings();

        if (!type || !url) {
            return await reply(`🎵 *Usage:* .setbotaudio <menu/alive> <audio_url>\n\n*Current Audio URLs:*\n• Menu: ${currentSettings.MENU_AUDIO_URL || 'Not set'}\n• Alive: ${currentSettings.ALIVE_AUDIO_URL || 'Not set'}`);
        }

        if (!['menu', 'alive'].includes(type.toLowerCase())) {
            return await reply('❌ Invalid type! Use: menu OR alive');
        }

        if (!url.startsWith('http')) {
            return await reply('❌ Please provide a valid audio URL');
        }

        // Update settings persistently
        const settingKey = type.toLowerCase() === 'menu' ? 'MENU_AUDIO_URL' : 'ALIVE_AUDIO_URL';
        const success = updateSetting(settingKey, url);
        
        if (success) {
            await reply(`✅ ${type.toUpperCase()} audio updated!\n\n🔊 *New URL:*\n${url}`);
            
            // Update global settings for current session
            const updatedSettings = loadSettings();
            Object.assign(global.settings, updatedSettings);
        } else {
            await reply('❌ Failed to save audio setting');
        }

    } catch (error) {
        console.error('SetBotAudio error:', error);
        await reply('❌ Failed to update bot audio');
    }
});

// ==================== SHOW SETTINGS ====================
ademola({
    pattern: "env",
    alias: ["config", "env"],
    desc: "Show current bot settings",
    category: "settings",
    react: "⚙️",
    use: ".env",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) return await reply('❌ Only bot owner can view settings!');

        const currentSettings = loadSettings();

        // Helper functions
        const getStatus = (value) => value ? "✅ Set" : "❌ Not set";
        const getModeIcon = (mode) => mode === 'private' ? '🔒' : '🔓';
        const getModeText = (mode) => mode === 'private' ? 'PRIVATE' : 'PUBLIC';

        const settingsInfo = `
╭───『 *${currentSettings.botName} SETTINGS* 』───◆
│
├─◆ *🤖 BOT IDENTITY*
│  ├─◦ *Name:* ${currentSettings.botName}
│  ├─◦ *Prefix:* [ ${currentSettings.prefix} ]
│  ├─◦ *Version:* ${currentSettings.version}
│  └─◦ *Timezone:* ${currentSettings.timezone}
│
├─◆ *👑 OWNERSHIP*
│  ├─◦ *Owner:* ${currentSettings.botOwner}
│  ├─◦ *Number:* ${currentSettings.ownerNumber}
│  └─◦ *Author:* ${currentSettings.author}
│
├─◆ *🔧 BOT MODE*
│  ├─◦ *Status:* ${getModeIcon(currentSettings.commandMode)} ${getModeText(currentSettings.commandMode)}
│  ├─◦ *Access:* ${currentSettings.commandMode === 'private' ? 'Owner Only' : 'Everyone'}
│  └─◦ *Packname:* ${currentSettings.packname}
│
├─◆ *🎵 AUDIO FILES*
│  ├─◦ *Menu Audio:* ${currentSettings.MENU_AUDIO_URL ? '🔊 Set' : '🔇 Not set'}
│  └─◦ *Alive Audio:* ${currentSettings.ALIVE_AUDIO_URL ? '🔊 Set' : '🔇 Not set'}
│
├─◆ *🖼️ MEDIA ASSETS*
│  ├─◦ *Bot Image:* ${currentSettings.imageUrl ? '🖼️ Set' : '📷 Not set'}
│  └─◦ *Description:* ${currentSettings.description}
│
├─◆ *⚡ QUICK ACTIONS*
│  ├─◦ ${currentSettings.prefix}prefix 
│  ├─◦ ${currentSettings.prefix}setprefix <new>
│  ├─◦ ${currentSettings.prefix}resetprefix 
│  ├─◦ ${currentSettings.prefix}setbotname <name>
│  ├─◦ ${currentSettings.prefix}setownername <name>
│  ├─◦ ${currentSettings.prefix}mode <private/public>
│  ├─◦ ${currentSettings.prefix}setbotimage <url>
│  ├─◦ ${currentSettings.prefix}setbotaudio <menu/alive> <url>
│  └─◦ ${currentSettings.prefix}resetsettings
│
💡 *Usage: ${currentSettings.prefix}command*
🔙 *Back to main: ${currentSettings.prefix}settings*
╰───◆
『 *${currentSettings.description}* 』
        `.trim();

        await reply(settingsInfo);

    } catch (error) {
        console.error('Settings error:', error);
        await reply('❌ Failed to retrieve settings');
    }
});

// ==================== RESET SETTINGS ====================
ademola({
    pattern: "resetsettings",
    alias: ["defaultsettings"],
    desc: "Reset all settings to default",
    category: "owner",
    react: "🔄",
    use: ".resetsettings",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) return await reply('❌ Only bot owner can reset settings!');

        const { getDefaultSettings, saveSettings } = require('../lib/settingsManager');
        const defaultSettings = getDefaultSettings();
        const success = saveSettings(defaultSettings);
        
        if (success) {
            // Update global settings for current session
            Object.assign(global.settings, defaultSettings);
            await reply('✅ All settings reset to default values!');
        } else {
            await reply('❌ Failed to reset settings');
        }

    } catch (error) {
        console.error('ResetSettings error:', error);
        await reply('❌ Failed to reset settings');
    }
});