//---------------------------------------------
//           ADEMOLA-XD TRANSLATOR
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const fetch = require('node-fetch');

// Fast loading animation for translation
async function sendTranslateLoading(ademola, from, targetLang) {
    const frames = ['🌐', '🔍', '📝', '🔄', '✨'];
    let loadingMsg = await ademola.sendMessage(from, { 
        text: `${frames[0]} Translating to ${targetLang}...`
    }, { quoted: fakevCard });
    
    let frameIndex = 0;
    const animationInterval = setInterval(async () => {
        frameIndex = (frameIndex + 1) % frames.length;
        try {
            await ademola.sendMessage(from, {
                text: `${frames[frameIndex]} Translating to ${targetLang}...`,
                edit: loadingMsg.key
            });
        } catch (e) {
            clearInterval(animationInterval);
        }
    }, 600); // Fast animation ⚡
    
    return {
        stop: () => clearInterval(animationInterval),
        message: loadingMsg
    };
}

// Language codes mapping
const languageCodes = {
    'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'hy': 'Armenian',
    'az': 'Azerbaijani', 'eu': 'Basque', 'be': 'Belarusian', 'bn': 'Bengali', 'bs': 'Bosnian',
    'bg': 'Bulgarian', 'ca': 'Catalan', 'ceb': 'Cebuano', 'zh': 'Chinese', 'co': 'Corsican',
    'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish', 'nl': 'Dutch', 'en': 'English',
    'eo': 'Esperanto', 'et': 'Estonian', 'fi': 'Finnish', 'fr': 'French', 'fy': 'Frisian',
    'gl': 'Galician', 'ka': 'Georgian', 'de': 'German', 'el': 'Greek', 'gu': 'Gujarati',
    'ht': 'Haitian Creole', 'ha': 'Hausa', 'haw': 'Hawaiian', 'he': 'Hebrew', 'hi': 'Hindi',
    'hmn': 'Hmong', 'hu': 'Hungarian', 'is': 'Icelandic', 'ig': 'Igbo', 'id': 'Indonesian',
    'ga': 'Irish', 'it': 'Italian', 'ja': 'Japanese', 'jw': 'Javanese', 'kn': 'Kannada',
    'kk': 'Kazakh', 'km': 'Khmer', 'ko': 'Korean', 'ku': 'Kurdish', 'ky': 'Kyrgyz',
    'lo': 'Lao', 'la': 'Latin', 'lv': 'Latvian', 'lt': 'Lithuanian', 'lb': 'Luxembourgish',
    'mk': 'Macedonian', 'mg': 'Malagasy', 'ms': 'Malay', 'ml': 'Malayalam', 'mt': 'Maltese',
    'mi': 'Maori', 'mr': 'Marathi', 'mn': 'Mongolian', 'my': 'Myanmar', 'ne': 'Nepali',
    'no': 'Norwegian', 'ny': 'Nyanja', 'or': 'Odia', 'ps': 'Pashto', 'fa': 'Persian',
    'pl': 'Polish', 'pt': 'Portuguese', 'pa': 'Punjabi', 'ro': 'Romanian', 'ru': 'Russian',
    'sm': 'Samoan', 'gd': 'Scots Gaelic', 'sr': 'Serbian', 'st': 'Sesotho', 'sn': 'Shona',
    'sd': 'Sindhi', 'si': 'Sinhala', 'sk': 'Slovak', 'sl': 'Slovenian', 'so': 'Somali',
    'es': 'Spanish', 'su': 'Sundanese', 'sw': 'Swahili', 'sv': 'Swedish', 'tl': 'Tagalog',
    'tg': 'Tajik', 'ta': 'Tamil', 'tt': 'Tatar', 'te': 'Telugu', 'th': 'Thai', 'tr': 'Turkish',
    'tk': 'Turkmen', 'uk': 'Ukrainian', 'ur': 'Urdu', 'ug': 'Uyghur', 'uz': 'Uzbek',
    'vi': 'Vietnamese', 'cy': 'Welsh', 'xh': 'Xhosa', 'yi': 'Yiddish', 'yo': 'Yoruba', 'zu': 'Zulu'
};

// Translate function
async function translateText(text, targetLang) {
    // Try multiple translation APIs in sequence
    const apis = [
        // API 1: Google Translate
        async () => {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    return data[0][0][0];
                }
            }
            throw new Error('Google Translate failed');
        },
        
        // API 2: MyMemory Translate
        async () => {
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.responseData && data.responseData.translatedText) {
                    return data.responseData.translatedText;
                }
            }
            throw new Error('MyMemory failed');
        },
        
        // API 3: Dreaded API
        async () => {
            const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(text)}&lang=${targetLang}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.translated) {
                    return data.translated;
                }
            }
            throw new Error('Dreaded API failed');
        }
    ];

    for (const api of apis) {
        try {
            const result = await api();
            return result;
        } catch (error) {
            console.log(`Translation API failed: ${error.message}`);
            continue;
        }
    }
    
    throw new Error('All translation services are currently unavailable');
}

// Main translate command
ademola({
    pattern: "translate",
    alias: ["trt", "tr"],
    desc: "Translate text to any language",
    category: "tools",
    react: "🌐",
    use: ".translate <text> <lang> or reply .translate <lang>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        let textToTranslate = '';
        let targetLang = '';

        // Check if it's a reply to a message
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            // Get text from quoted message
            textToTranslate = quotedMessage.conversation || 
                            quotedMessage.extendedTextMessage?.text || 
                            quotedMessage.imageMessage?.caption || 
                            quotedMessage.videoMessage?.caption || '';

            // Get language from command
            targetLang = q.trim().toLowerCase();
        } else {
            // Parse command arguments for direct message
            const args = q.trim().split(' ');
            if (args.length < 2) {
                return await reply(`🌐 *TRANSLATOR*\n\n❌ Please provide text and language code.\n\n*Usage:*\n• Reply to a message: .translate <lang>\n• Direct text: .translate <text> <lang>\n\n*Examples:*\n.translate Hello es\n.translate Bonjour en\n\n💡 Use .langcodes to see all language codes`);
            }

            targetLang = args.pop().toLowerCase();
            textToTranslate = args.join(' ');
        }

        if (!textToTranslate) {
            return await reply(`❌ *No text to translate!*\n\nPlease provide text or reply to a message containing text.`);
        }

        if (!targetLang || !languageCodes[targetLang]) {
            return await reply(`❌ *Invalid language code!*\n\n"${targetLang}" is not a valid language code.\n\n💡 Use .langcodes to see all available language codes.`);
        }

        // Send initial reaction
        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        // Start loading animation
        const loading = await sendTranslateLoading(ademola, from, languageCodes[targetLang]);

        // Perform translation
        const translatedText = await translateText(textToTranslate, targetLang);

        // Stop loading animation
        loading.stop();

        // Create stylish translation result
        const translationResult = `
╭───═══━ • ━═══───╮
   🌐 *TRANSLATION*
╰───═══━ • ━═══───╯

╭──「 📝 𝙊𝙍𝙄𝙂𝙄𝙉𝘼𝙇 」──➣
│ ${textToTranslate}
╰─────

╭──「 🎯 𝙏𝙍𝘼𝙉𝙎𝙇𝘼𝙏𝙄𝙊𝙉 」─➣
│ ${translatedText}
╰─────

╭──「 🌍 𝙇𝘼𝙉𝙂𝙐𝘼𝙂𝙀 」──➣
│ ${languageCodes[targetLang]} (${targetLang})
╰─────

> ✨ Powered by Ademola Tech
        `.trim();

        await ademola.sendMessage(from, {
            text: translationResult,
            ...channelInfo
        }, { quoted: fakevCard });

        // Success reaction
        await ademola.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('❌ Translation error:', error);
        await reply(`❌ *Translation failed!*\n\nError: ${error.message}\n\nPlease try again with a different text or language.`);
    }
});

// Language codes command
ademola({
    pattern: "langcodes",
    alias: ["languages", "langs"],
    desc: "Show all available language codes",
    category: "tools",
    react: "🌍",
    use: ".langcodes",
    filename: __filename
}, async (ademola, mek, m, { from, reply }) => {
    const popularLanguages = `
╭───═══━ • ━═══───╮
   🌍 *LANGUAGE CODES*
╰───═══━ • ━═══───╯

*Popular Languages:*
• 🇬🇧 English: en
• 🇪🇸 Spanish: es  
• 🇫🇷 French: fr
• 🇩🇪 German: de
• 🇮🇹 Italian: it
• 🇵🇹 Portuguese: pt
• 🇷🇺 Russian: ru
• 🇯🇵 Japanese: ja
• 🇰🇷 Korean: ko
• 🇨🇳 Chinese: zh
• 🇦🇪 Arabic: ar
• 🇮🇳 Hindi: hi
• 🇹🇷 Turkish: tr
• 🇳🇱 Dutch: nl
• 🇵🇱 Polish: pl

*Other Languages:*
• 🇸🇦 Arabic: ar
• 🇧🇩 Bengali: bn
• 🇬🇷 Greek: el
• 🇮🇱 Hebrew: he
• 🇮🇩 Indonesian: id
• 🇹🇭 Thai: th
• 🇻🇳 Vietnamese: vi
• 🇺🇦 Ukrainian: uk

💡 *Usage:*
.translate Hello es
.translate Bonjour en

> 🌐 100+ languages supported!
    `.trim();

    await reply(popularLanguages);
});

// Auto-detect language command
ademola({
    pattern: "detectlang",
    alias: ["detect", "langdetect"],
    desc: "Detect the language of text",
    category: "tools",
    react: "🔍",
    use: ".detectlang <text> or reply .detectlang",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        let textToDetect = '';

        // Check if it's a reply
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            textToDetect = quotedMessage.conversation || 
                          quotedMessage.extendedTextMessage?.text || 
                          quotedMessage.imageMessage?.caption || 
                          quotedMessage.videoMessage?.caption || '';
        } else {
            textToDetect = q;
        }

        if (!textToDetect) {
            return await reply(`🔍 *LANGUAGE DETECTION*\n\n❌ Please provide text or reply to a message.\n\n*Usage:*\n• Reply to a message: .detectlang\n• Direct text: .detectlang <text>`);
        }

        // Use Google Translate for language detection
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(textToDetect)}`);
        if (response.ok) {
            const data = await response.json();
            const detectedLang = data[2]; // Google returns detected language in index 2
            
            const detectionResult = `
╭───═══━ • ━═══───╮
   🔍 *LANGUAGE DETECTED*
╰───═══━ • ━═══───╯

📝 *Text:* ${textToDetect}
🌍 *Language:* ${languageCodes[detectedLang] || detectedLang}
🔤 *Code:* ${detectedLang}

> ✨ Powered by Ademola Tech
            `.trim();

            await ademola.sendMessage(from, {
                text: detectionResult,
                ...channelInfo
            }, { quoted: fakevCard });
        } else {
            throw new Error('Language detection failed');
        }

    } catch (error) {
        console.error('❌ Language detection error:', error);
        await reply(`❌ *Failed to detect language!*\n\nPlease try again with different text.`);
    }
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------