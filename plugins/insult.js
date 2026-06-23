const { ademola, fakevCard } = require("../ademola");

const goodnightMessages = [
    "As the stars light up the sky, may your dreams be filled with joy and peace. Goodnight, sweet soul 🌙",
    "Close your eyes and let the moonlight wrap you in its gentle embrace. Sleep well 💫",
    "The day is done, the night is here. May your dreams be sweet and your rest be deep. Goodnight 🌟",
    "Every sunset brings a promise of a new dawn. Sleep tight and wake up refreshed 🌄",
    "Let go of today's worries and let the night wash them away. Tomorrow is a new beginning 🌌",
    "Sending you a gentle breeze of love and peace to carry you through the night. Goodnight 💕",
    "The moon is beautiful, the stars are bright, but nothing shines as bright as you. Sleep well ✨",
    "Wrap yourself in cozy dreams and let the night embrace you. Goodnight, beautiful 🌠",
    "May your dreams be as sweet as honey and as warm as sunshine. Goodnight and sweet dreams 🍯",
    "The night is young, but you should rest. Your dreams are waiting to take you on an adventure 🌙",
    "Close your eyes and count the stars. Each one is a wish for your happiness. Goodnight ⭐",
    "Let the silence of the night fill your heart with peace. You deserve all the rest in the world 🌙",
    "Tonight is a chapter ending, tomorrow is a new story. Sleep well and dream big 📖",
    "The stars are singing lullabies just for you. Goodnight, dear one 🎵",
    "Rest your head and let your heart be light. Tomorrow is a beautiful day 💫",
];

const insults = [
    "You're like a cloud. When you disappear, it's a beautiful day!",
    "You bring everyone so much joy when you leave the room!",
    "I'd agree with you, but then we'd both be wrong.",
    "You're not stupid; you just have bad luck thinking.",
    "Your secrets are always safe with me. I never even listen to them.",
    "You're proof that even evolution takes a break sometimes.",
    "You have something on your chin... no, the third one down.",
    "You're like a software update. Whenever I see you, I think, 'Do I really need this right now?'",
    "You bring everyone happiness... you know, when you leave.",
    "You're like a penny—two-faced and not worth much.",
    "You're the reason they put directions on shampoo bottles.",
    "You're like a cloud. Always floating around with no real purpose.",
    "Your jokes are like expired milk—sour and hard to digest.",
    "You're like a candle in the wind... useless when things get tough.",
    "You have something unique—your ability to annoy everyone equally.",
    "You're like a Wi-Fi signal—always weak when needed most.",
    "You're proof that not everyone needs a filter to be unappealing.",
    "Your energy is like a black hole—it just sucks the life out of the room.",
    "You have the perfect face for radio.",
    "You're like a traffic jam—nobody wants you, but here you are.",
    "You're like a broken pencil—pointless.",
    "Your ideas are so original, I'm sure I've heard them all before.",
    "You're living proof that even mistakes can be productive.",
    "You're not lazy; you're just highly motivated to do nothing.",
    "Your brain's running Windows 95—slow and outdated.",
    "You're like a speed bump—nobody likes you, but everyone has to deal with you.",
    "You're like a cloud of mosquitoes—just irritating.",
    "You bring people together... to talk about how annoying you are.",
];

ademola({
    pattern: "goodnight",
    alias: ["gn", "night"],
    desc: "Send romantic goodnight messages",
    category: "fun",
    react: "🌙",
    use: ".goodnight",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        const msg = goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)];
        await reply(`🌙 *Good Night*\n\n${msg}`);
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await reply('❌ Failed to get goodnight message. Please try again later!');
    }
});

ademola({
    pattern: "insult",
    alias: ["roast", "burn"],
    desc: "Roast someone with funny insults",
    category: "fun",
    react: "🔥",
    use: ".insult @user or reply to user",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        let targetJid;

        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
        } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        if (!targetJid) {
            return await reply('❌ Please mention the user or reply to their message to insult them!');
        }

        const insult = insults[Math.floor(Math.random() * insults.length)];

        await ademola.sendMessage(from, { 
            text: `🔥 @${targetJid.split('@')[0]}, ${insult}`,
            mentions: [targetJid]
        }, {
            quoted: fakevCard
        });
    } catch (error) {
        console.error('Error in insult command:', error);
        await reply('❌ Failed to send insult. Please try again!');
    }
});
