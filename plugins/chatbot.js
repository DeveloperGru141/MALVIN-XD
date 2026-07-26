const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// In-memory storage for chat history and user info
const chatMemory = {
    messages: new Map(), // Stores last 5 messages per user
    userInfo: new Map()  // Stores user information
};

// Load user group data
function loadUserGroupData() {
    try {
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch (error) {
        console.error('❌ Error loading user group data:', error.message);
        return { groups: [], chatbot: {} };
    }
}

// Save user group data
function saveUserGroupData(data) {
    try {
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error saving user group data:', error.message);
    }
}

// Add random delay between 2-5 seconds
function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 2000;
}

// Add typing indicator
async function showTyping(ademola, chatId) {
    try {
        await ademola.presenceSubscribe(chatId);
        await ademola.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    } catch (error) {
        console.error('Typing indicator error:', error);
    }
}

// Extract user information from messages
function extractUserInfo(message) {
    const info = {};
    
    // Extract name
    if (message.toLowerCase().includes('my name is')) {
        info.name = message.split('my name is')[1].trim().split(' ')[0];
    }
    
    // Extract age
    if (message.toLowerCase().includes('i am') && message.toLowerCase().includes('years old')) {
        info.age = message.match(/\d+/)?.[0];
    }
    
    // Extract location
    if (message.toLowerCase().includes('i live in') || message.toLowerCase().includes('i am from')) {
        info.location = message.split(/(?:i live in|i am from)/i)[1].trim().split(/[.,!?]/)[0];
    }
    
    return info;
}

async function getAIResponse(userMessage, userContext) {
    try {
        // Simplified prompt - much shorter and cleaner
        const simplePrompt = `
Respond as a friendly casual AI assistant. Keep it short and conversational.
Use emojis naturally. Be helpful and engaging.

Context: ${userContext.messages.slice(-2).join(' | ')}
User: ${userMessage}
Assistant:`.trim();

        console.log('🔄 Calling AI API...');

        const models = ['openai', 'mistral'];
        let lastErr;

        for (const model of models) {
            try {
                const { data } = await axios.post('https://text.pollinations.ai/', {
                    messages: [
                        { role: 'system', content: 'You are a friendly casual AI assistant. Keep responses short, conversational, and use emojis naturally.' },
                        { role: 'user', content: simplePrompt }
                    ],
                    model
                }, { timeout: 15000 });

                let answer = '';
                if (typeof data === 'string') answer = data;
                else if (data?.choices?.[0]?.message?.content) answer = data.choices[0].message.content;
                else if (data?.output) answer = data.output;
                else if (data?.response) answer = data.response;

                if (answer?.trim()) {
                    console.log(`📥 API response received (model: ${model})`);
                    return answer.trim().replace(/["']/g, '').replace(/\n\s*\n/g, '\n');
                }
                lastErr = new Error('Empty response');
            } catch (e) {
                lastErr = e;
            }
        }

        try {
            const hfToken = process.env.HUGGINGFACE_API_KEY || '';
            const headers = { 'Content-Type': 'application/json' };
            if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;
            const { data: hfData } = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
                { inputs: `[INST] You are a friendly casual AI assistant. Keep responses short.\n\n${simplePrompt} [/INST]` },
                { headers, timeout: 30000 }
            );
            const text = Array.isArray(hfData) ? hfData[0]?.generated_text : hfData?.generated_text;
            if (text?.trim()) return text.trim().replace(/\n\s*\n/g, '\n');
        } catch (e) { lastErr = e; }
        
        throw lastErr || new Error('All AI models unavailable');
        
    } catch (error) {
        console.error('❌ AI API Error:', error.message);
        
        // Fallback responses based on message content
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return "Hey there! 👋 How can I help you today?";
        }
        else if (lowerMessage.includes('how are you')) {
            return "I'm doing great! Thanks for asking 😊 What about you?";
        }
        else if (lowerMessage.includes('thank')) {
            return "You're welcome! 😄";
        }
        else if (lowerMessage.includes('name')) {
            return "I'm Ademola XD! 🤖 Your friendly chatbot!";
        }
        else if (lowerMessage.includes('who are you')) {
            return "I'm Ademola XD, your AI assistant! Created by Ademola King ✨";
        }
        else if (lowerMessage.includes('help')) {
            return "I'm here to chat and help with questions! What do you need? 🤔";
        }
        else {
            const fallbacks = [
                "Interesting! Tell me more about that. 🤔",
                "I see what you mean! 😊",
                "That's cool! What else is on your mind? 💫",
                "Nice! I'm listening... 👂",
                "Got it! Anything specific you want to know? 🧠"
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
}

// Chatbot command using Ademola XD framework
ademola({
    pattern: "gcbot",
    alias: ["gcbot", "aigc"],
    desc: "Enable/disable chatbot in this group",
    category: "ai",
    react: "🤖",
    use: ".gcbot [on/off]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isGroup, isAdmin, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        const data = loadUserGroupData();
        
        // Check permissions
        if (!isGroup) {
            return reply("❌ This command only works in groups!", { quoted: fakevCard });
        }

        if (!isOwner && !isAdmin) {
            return reply("❌ Only group admins or the bot owner can use this command.", { quoted: fakevCard });
        }

        if (!q) {
            await showTyping(ademola, from);
            return reply(
                `*🤖 CHATBOT SETUP*\n\n*.gcbot on*\nEnable chatbot\n\n*.gcbot off*\nDisable chatbot in this group`,
                { quoted: fakevCard }
            );
        }

        const action = q.toLowerCase();
        
        if (action === 'on') {
            await showTyping(ademola, from);
            if (data.chatbot[from]) {
                return reply("*Chatbot is already enabled for this group*", { quoted: fakevCard });
            }
            data.chatbot[from] = true;
            saveUserGroupData(data);
            console.log(`✅ Chatbot enabled for group ${from}`);
            return reply("*Chatbot has been enabled for this group*", { quoted: fakevCard });
        }

        if (action === 'off') {
            await showTyping(ademola, from);
            if (!data.chatbot[from]) {
                return reply("*Chatbot is already disabled for this group*", { quoted: fakevCard });
            }
            delete data.chatbot[from];
            saveUserGroupData(data);
            console.log(`✅ Chatbot disabled for group ${from}`);
            return reply("*Chatbot has been disabled for this group*", { quoted: fakevCard });
        }

        await showTyping(ademola, from);
        return reply("*Invalid command. Use .chatbot to see usage*", { quoted: fakevCard });

    } catch (error) {
        console.error('Error in chatbot command:', error);
        await reply("❌ Error processing command!", { quoted: fakevCard });
    }
});

// Function to handle chatbot responses (for use in main bot file)
async function handleChatbotResponse(ademola, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    if (!data.chatbot[chatId]) return;

    try {
        // Get bot's ID
        const botNumber = ademola.user.id.split(':')[0] + '@s.whatsapp.net';

        // Check for mentions and replies
        let isBotMentioned = false;
        let isReplyToBot = false;

        // Check if message is a reply and contains bot mention
        if (message.message?.extendedTextMessage) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
            const quotedParticipant = message.message.extendedTextMessage.contextInfo?.participant;
            
            // Check if bot is mentioned in the reply
            isBotMentioned = mentionedJid.some(jid => jid === botNumber);
            
            // Check if replying to bot's message
            isReplyToBot = quotedParticipant === botNumber;
        }
        // Also check regular mentions in conversation
        else if (message.message?.conversation) {
            isBotMentioned = userMessage.includes(`@${botNumber.split('@')[0]}`);
        }

        if (!isBotMentioned && !isReplyToBot) return;

        // Clean the message
        let cleanedMessage = userMessage;
        if (isBotMentioned) {
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber.split('@')[0]}`, 'g'), '').trim();
        }

        // Initialize user's chat memory if not exists
        if (!chatMemory.messages.has(senderId)) {
            chatMemory.messages.set(senderId, []);
            chatMemory.userInfo.set(senderId, {});
        }

        // Extract and update user information
        const userInfo = extractUserInfo(cleanedMessage);
        if (Object.keys(userInfo).length > 0) {
            chatMemory.userInfo.set(senderId, {
                ...chatMemory.userInfo.get(senderId),
                ...userInfo
            });
        }

        // Add message to history (keep last 10 messages)
        const messages = chatMemory.messages.get(senderId);
        messages.push(cleanedMessage);
        if (messages.length > 10) {
            messages.shift();
        }
        chatMemory.messages.set(senderId, messages);

        // Show typing indicator
        await showTyping(ademola, chatId);

        // Get AI response with context
        const response = await getAIResponse(cleanedMessage, {
            messages: chatMemory.messages.get(senderId),
            userInfo: chatMemory.userInfo.get(senderId)
        });

        // Add human-like delay before sending response
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        // Send response as a reply with proper context
        await ademola.sendMessage(chatId, {
            text: response
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('❌ Error in chatbot response:', error.message);
        await ademola.sendMessage(chatId, { 
            text: "Oops! 😅 I got a bit confused there. Could you try asking that again?",
            quoted: fakevCard
        });
    }
}

// Export functions for use in main bot file
module.exports = {
    handleChatbotResponse,
    loadUserGroupData,
    saveUserGroupData
};
