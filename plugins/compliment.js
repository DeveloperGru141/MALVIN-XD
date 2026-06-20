const { ademola, fakevCard } = require('../ademola');

const compliments = [
    "You're amazing just the way you are! ✨",
    "You have a great sense of humor! 😄",
    "You're incredibly thoughtful and kind. 💖",
    "You are more powerful than you know. 💪",
    "You light up the room! 🌟",
    "You're a true friend. 🤝",
    "You inspire me! 🎯",
    "Your creativity knows no bounds! 🎨",
    "You have a heart of gold. 💛",
    "You make a difference in the world. 🌍",
    "Your positivity is contagious! 😊",
    "You have an incredible work ethic. 💼",
    "You bring out the best in people. 🌈",
    "Your smile brightens everyone's day. ☀️",
    "You're so talented in everything you do. 🎭",
    "Your kindness makes the world a better place. 🌸",
    "You have a unique and wonderful perspective. 🔮",
    "Your enthusiasm is truly inspiring! 🚀",
    "You are capable of achieving great things. 🏆",
    "You always know how to make someone feel special. 💫",
    "Your confidence is admirable. 😎",
    "You have a beautiful soul. 🕊️",
    "Your generosity knows no limits. 🎁",
    "You have a great eye for detail. 🔍",
    "Your passion is truly motivating! 🔥",
    "You are an amazing listener. 👂",
    "You're stronger than you think! 💪",
    "Your laughter is infectious. 😂",
    "You have a natural gift for making others feel valued. 💎",
    "You make the world a better place just by being in it. 🌎"
];

// Ademola XD Compliment Command
ademola({
    pattern: "compliment",
    alias: ["praise", "flatter", "nice"],
    desc: "Send a random compliment to someone",
    category: "fun",
    react: "💝",
    use: ".compliment [mention user or reply to message]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner, isGroup }) => {
    try {
        let userToCompliment;
        let userName;

        // Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = mek.message.extendedTextMessage.contextInfo.participant;
        }
        // Check if user wants to compliment themselves
        else if (!q || q.toLowerCase().includes('me')) {
            userToCompliment = mek.key.participant || from;
        }
        // Check if someone specific is mentioned in query
        else if (q && q.includes('@')) {
            userToCompliment = q.trim();
        }
        
        if (!userToCompliment) {
            return reply(
                "💝 *COMPLIMENT COMMAND*\n\n" +
                "Send a random compliment to someone!\n\n" +
                "*Usage:*\n" +
                "• .compliment @user - Compliment mentioned user\n" +
                "• Reply to message with .compliment - Compliment that user\n" +
                "• .compliment me - Compliment yourself\n" +
                "• .compliment - Show this help",
                { quoted: fakevCard }
            );
        }

        // Get user's name for personalized message
        try {
            userName = await ademola.getName(userToCompliment);
        } catch {
            userName = userToCompliment.split('@')[0];
        }

        // Don't allow complimenting the bot to avoid loops
        const botId = ademola.user.id.split(':')[0] + '@s.whatsapp.net';
        if (userToCompliment === botId) {
            return reply(
                "🤖 *BOT COMPLIMENT*\n\n" +
                "Aww, thanks! But I'm just a bot! 😊\n" +
                "Why don't you compliment someone else instead?",
                { quoted: fakevCard }
            );
        }

        // Get random compliment
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];

        // Create the compliment message
        const complimentMessage = `💝 *FOR ${userName}* 💝\n\n${compliment}`;

        // Send the compliment with mention
        await reply(
            complimentMessage,
            { 
                mentions: [userToCompliment],
                quoted: fakevCard 
            }
        );

        console.log(`💝 Compliment sent to ${userName} by ${m.sender}`);

    } catch (error) {
        console.error('Compliment command error:', error);
        return reply(
            "❌ *COMPLIMENT FAILED*\n\n" +
            "Couldn't send the compliment right now.\n" +
            "Try again in a moment! 💝",
            { quoted: fakevCard }
        );
    }
});

// Quick compliment command
ademola({
    pattern: "nice",
    alias: ["good", "praise"],
    desc: "Quick compliment",
    category: "fun",
    react: "😊",
    use: ".nice [mention user]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner, isGroup }) => {
    try {
        let userToCompliment;
        let quickCompliments = [
            "You're awesome! 😎",
            "Looking great today! 🌟",
            "You're doing amazing! 💪",
            "So proud of you! 🎉",
            "You're a star! ⭐",
            "Keep being you! ✨",
            "You've got this! 🚀",
            "Amazing work! 👏",
            "You're incredible! 💫",
            "So talented! 🎨"
        ];

        // Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check if user wants to compliment themselves
        else if (!q || q.toLowerCase().includes('me')) {
            userToCompliment = mek.key.participant || from;
        }

        if (!userToCompliment) {
            return reply(
                "😊 *QUICK COMPLIMENT*\n\n" +
                "Send a quick compliment!\n\n" +
                "*Usage:*\n" +
                "• .nice @user - Quick compliment\n" +
                "• .nice me - Compliment yourself",
                { quoted: fakevCard }
            );
        }

        const compliment = quickCompliments[Math.floor(Math.random() * quickCompliments.length)];
        
        // Get user's name
        let userName;
        try {
            userName = await ademola.getName(userToCompliment);
        } catch {
            userName = userToCompliment.split('@')[0];
        }

        await reply(
            `😊 *FOR ${userName}*\n\n${compliment}`,
            { 
                mentions: [userToCompliment],
                quoted: fakevCard 
            }
        );

    } catch (error) {
        console.error('Nice command error:', error);
        await reply("You're awesome! 😊", { quoted: fakevCard });
    }
});

// Self-compliment command
ademola({
    pattern: "imawesome",
    alias: ["awesome", "loveme"],
    desc: "Compliment yourself",
    category: "fun",
    react: "💖",
    use: ".imawesome",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    try {
        const selfCompliments = [
            "You're absolutely fantastic! 🌟",
            "You're killing it today! 💪",
            "You deserve all the good things! 💫",
            "You're a wonderful human being! 💖",
            "The world is better with you in it! 🌎",
            "You're capable of amazing things! 🚀",
            "Your potential is limitless! ✨",
            "You're stronger than you know! 💎",
            "You're making progress every day! 📈",
            "You're worthy of love and happiness! 💝"
        ];

        const compliment = selfCompliments[Math.floor(Math.random() * selfCompliments.length)];
        const senderId = mek.key.participant || from;
        
        let userName;
        try {
            userName = await ademola.getName(senderId);
        } catch {
            userName = "You";
        }

        await reply(
            `💖 *SELF LOVE TIME* 💖\n\n${userName}, ${compliment}`,
            { 
                mentions: [senderId],
                quoted: fakevCard 
            }
        );

    } catch (error) {
        console.error('Imawesome command error:', error);
        await reply("💖 You're amazing just the way you are!", { quoted: fakevCard });
    }
});

module.exports = {};