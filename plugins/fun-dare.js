const fetch = require('node-fetch');
const { ademola, fakevCard } = require('../ademola');

const dares = [
    "Send a random emoji to the last person you texted 😈",
    "Do 10 pushups right now! 💪",
    "Say 'I'm a potato' in the group chat 🥔",
    "Send your current wallpaper to the group",
    "Talk in rhymes for the next 5 minutes",
    "Let someone draw on your arm with a pen",
    "Sing the chorus of your favorite song",
    "Do a funny dance and record it",
    "Swap your profile picture to a pet for 1 hour",
    "Speak in an accent for the next 10 minutes",
    "Send a voice note saying 'I love cheese' dramatically 🧀",
    "Post an embarrassing photo of yourself",
    "Let the group pick your status for 24 hours",
    "Do your best celebrity impression in voice note 🎤",
    "Text your crush something random right now",
    "Eat something sour without making a face",
    "Do 20 jumping jacks right now",
    "Record yourself doing a TikTok dance 💃",
    "Let someone change your phone wallpaper",
    "Wear your clothes backwards for 10 minutes",
    "Call a random contact and say 'wrong number' 📞",
    "Do a plank for 30 seconds straight",
    "Send a screenshot of your most recent search",
    "Compliment the first person you see",
    "Do your best animal impression 🐒",
];

const truths = [
    "What's the most embarrassing thing you've ever done?",
    "Have you ever lied to your best friend?",
    "What's your biggest fear?",
    "Who was your first crush?",
    "What's the worst date you've ever been on?",
    "Have you ever cheated on a test?",
    "What's one thing you're insecure about?",
    "What's the most trouble you've ever been in?",
    "Have you ever broken something and blamed someone else?",
    "What's a secret you've never told anyone?",
    "Who is your celebrity crush?",
    "What's the biggest lie you've ever told?",
    "Have you ever stalked someone on social media?",
    "What's the most expensive thing you've stolen?",
    "What's the worst gift you've ever given?",
    "Have you ever pretended to like a gift you hated?",
    "What's the most childish thing you still do?",
    "Who do you secretly dislike in this group?",
    "What's the most embarrassing music you listen to?",
    "Have you ever ghosted someone? 👻",
    "What's the weirdest dream you've ever had?",
    "What's one thing you'd change about yourself?",
    "Have you ever read someone else's messages?",
    "What's the most food you've eaten in one sitting?",
    "When was the last time you cried and why?",
];

const wyrQuestions = [
    "Would you rather have the ability to fly or be invisible? 🦸‍♂️",
    "Would you rather always be 10 minutes late or always be 20 minutes early? ⏰",
    "Would you rather have unlimited sushi for life or unlimited tacos for life? 🍣🌮",
    "Would you rather be able to talk to animals or speak all foreign languages? 🐵🗣️",
    "Would you rather have a rewind button or a pause button for your life? ⏪⏸️",
    "Would you rather be famous when you are alive and forgotten when you die or unknown when you are alive but famous after you die? 🌟",
    "Would you rather be able to control fire or water? 🔥💧",
    "Would you rather always have to say everything on your mind or never speak again? 💭🤐",
    "Would you rather have a car that can fly or a car that can drive underwater? 🚀🐠",
    "Would you rather be able to teleport anywhere or read minds? ✨🧠",
    "Would you rather live without music or without TV? 🎵📺",
    "Would you rather be able to speak every language or play every instrument? 🗣️🎸",
    "Would you rather live on the beach or in a cabin in the woods? 🏖️🏡",
    "Would you rather be invisible or be able to read minds? 👻🧠",
    "Would you rather have a pet dinosaur or a pet dragon? 🦕🐉",
];

ademola({
    pattern: "dare",
    alias: ["challenge", "truthordare"],
    desc: "Get a random dare challenge",
    category: "fun",
    react: "😈",
    use: ".dare",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner, isGroup }) => {
    try {
        const loadingMsg = await reply("🎯 *Finding a dare challenge...*", { quoted: fakevCard });
        const dare = dares[Math.floor(Math.random() * dares.length)];

        await ademola.sendMessage(from, {
            text: `😈 *DARE CHALLENGE* 😈\n\n${dare}\n\n*Good luck!* 🎯`,
            edit: loadingMsg.key
        });

        console.log(`😈 Dare challenge sent to ${from} by ${m.sender}`);
    } catch (error) {
        console.error('Dare command error:', error);
        try {
            await ademola.sendMessage(from, {
                text: "❌ *DARE FAILED*\n\nCouldn't get a dare challenge right now.\n\nTry again later!",
                edit: loadingMsg?.key
            });
        } catch {
            await reply("❌ Failed to get dare. Please try again later!", { quoted: fakevCard });
        }
    }
});

ademola({
    pattern: "truth",
    alias: ["question", "truthq"],
    desc: "Get a random truth question",
    category: "fun",
    react: "🤔",
    use: ".truth",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner, isGroup }) => {
    try {
        const loadingMsg = await reply("🤔 *Finding a truth question...*", { quoted: fakevCard });
        const truth = truths[Math.floor(Math.random() * truths.length)];

        await ademola.sendMessage(from, {
            text: `🤔 *TRUTH QUESTION* 🤔\n\n${truth}\n\n*Be honest!* 💯`,
            edit: loadingMsg.key
        });

        console.log(`🤔 Truth question sent to ${from} by ${m.sender}`);
    } catch (error) {
        console.error('Truth command error:', error);
        try {
            await ademola.sendMessage(from, {
                text: "❌ *TRUTH FAILED*\n\nCouldn't get a truth question right now.\n\nTry again later!",
                edit: loadingMsg?.key
            });
        } catch {
            await reply("❌ Failed to get truth question. Please try again later!", { quoted: fakevCard });
        }
    }
});

ademola({
    pattern: "tod",
    alias: ["truthordare", "game"],
    desc: "Random truth or dare challenge",
    category: "fun",
    react: "🎮",
    use: ".tod",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner, isGroup }) => {
    try {
        const isTruth = Math.random() > 0.5;

        if (isTruth) {
            const loadingMsg = await reply("🎮 *Choosing a challenge...*", { quoted: fakevCard });
            const truth = truths[Math.floor(Math.random() * truths.length)];

            await ademola.sendMessage(from, {
                text: `🎮 *TRUTH OR DARE*\n\n🤔 *TRUTH:*\n${truth}\n\n*Answer honestly!* 💯`,
                edit: loadingMsg.key
            });
        } else {
            const loadingMsg = await reply("🎮 *Choosing a challenge...*", { quoted: fakevCard });
            const dare = dares[Math.floor(Math.random() * dares.length)];

            await ademola.sendMessage(from, {
                text: `🎮 *TRUTH OR DARE*\n\n😈 *DARE:*\n${dare}\n\n*Good luck!* 🎯`,
                edit: loadingMsg.key
            });
        }

        console.log(`🎮 Truth or Dare game in ${from} by ${m.sender}`);
    } catch (error) {
        console.error('TOD command error:', error);
        try {
            await ademola.sendMessage(from, {
                text: "❌ *GAME FAILED*\n\nCouldn't start Truth or Dare right now.\n\nTry again later! 🎮",
                edit: loadingMsg?.key
            });
        } catch {
            await reply("❌ Failed to start game. Please try again later!", { quoted: fakevCard });
        }
    }
});

ademola({
    pattern: "wyr",
    alias: ["rather", "choose"],
    desc: "Get a 'Would You Rather' question",
    category: "fun",
    react: "🤷‍♂️",
    use: ".wyr",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, isOwner, isGroup }) => {
    try {
        const randomQuestion = wyrQuestions[Math.floor(Math.random() * wyrQuestions.length)];

        await reply(
            `🤷‍♂️ *WOULD YOU RATHER?* 🤷‍♀️\n\n${randomQuestion}\n\n*Choose wisely!* 🤔`,
            { quoted: fakevCard }
        );

        console.log(`🤷‍♂️ WYR question sent to ${from} by ${m.sender}`);
    } catch (error) {
        console.error('WYR command error:', error);
        await reply("❌ Failed to get question. Try again later!", { quoted: fakevCard });
    }
});

module.exports = {};
