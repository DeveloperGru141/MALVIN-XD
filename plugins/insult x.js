const { ademola, fakevCard } = require("../ademola");
const fetch = require('node-fetch');

// ========== GOODNIGHT COMMAND ==========
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
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/lovenight?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const goodnightMessage = json.result;

        await reply(`🌙 *Good Night*\n\n${goodnightMessage}`);
        
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await reply('❌ Failed to get goodnight message. Please try again later!');
    }
});

// ========== INSULT COMMAND ==========
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
    "You have something on your mind... oh wait, never mind.",
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
    "You bring people together... to talk about how annoying you are."
];

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
        
        // SIMPLE METHOD: Same as promote/demote - check participant in contextInfo
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            console.log('✅ Found user to insult:', targetJid);
        }
        // Check for mentioned users
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            console.log('✅ Found mentioned user to insult:', targetJid);
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