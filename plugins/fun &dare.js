const fetch = require('node-fetch');
const { ademola, fakevCard } = require('../ademola');

// Ademola XD Dare Command
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
        // Show loading message
        const loadingMsg = await reply("🎯 *Finding a dare challenge...*", { quoted: fakevCard });

        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        
        const json = await res.json();
        
        if (!json.result) {
            throw new Error('No dare found in API response');
        }

        const dareMessage = json.result;

        // Update the loading message with the dare
        await ademola.sendMessage(from, {
            text: `😈 *DARE CHALLENGE* 😈\n\n${dareMessage}\n\n*Good luck!* 🎯`,
            edit: loadingMsg.key
        });

        console.log(`😈 Dare challenge sent to ${from} by ${m.sender}`);

    } catch (error) {
        console.error('Dare command error:', error);
        
        // Try to update the loading message with error
        try {
            await ademola.sendMessage(from, {
                text: "❌ *DARE FAILED*\n\nCouldn't get a dare challenge right now.\n\n*Possible reasons:*\n• API is down\n• Network issues\n• Try again later!",
                edit: loadingMsg?.key
            });
        } catch {
            await reply("❌ Failed to get dare. Please try again later!", { quoted: fakevCard });
        }
    }
});

// Truth command using same API
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
        // Show loading message
        const loadingMsg = await reply("🤔 *Finding a truth question...*", { quoted: fakevCard });

        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/truth?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        
        const json = await res.json();
        
        if (!json.result) {
            throw new Error('No truth question found in API response');
        }

        const truthMessage = json.result;

        // Update the loading message with the truth
        await ademola.sendMessage(from, {
            text: `🤔 *TRUTH QUESTION* 🤔\n\n${truthMessage}\n\n*Be honest!* 💯`,
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

// Truth or Dare game command
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
        // Randomly choose between truth and dare
        const isTruth = Math.random() > 0.5;
        
        if (isTruth) {
            // Show loading for truth
            const loadingMsg = await reply("🎮 *Choosing a challenge...*", { quoted: fakevCard });

            const shizokeys = 'shizo';
            const res = await fetch(`https://shizoapi.onrender.com/api/texts/truth?apikey=${shizokeys}`);
            
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            
            const json = await res.json();
            const challenge = json.result;

            await ademola.sendMessage(from, {
                text: `🎮 *TRUTH OR DARE*\n\n🤔 *TRUTH:*\n${challenge}\n\n*Answer honestly!* 💯`,
                edit: loadingMsg.key
            });

        } else {
            // Show loading for dare
            const loadingMsg = await reply("🎮 *Choosing a challenge...*", { quoted: fakevCard });

            const shizokeys = 'shizo';
            const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`);
            
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            
            const json = await res.json();
            const challenge = json.result;

            await ademola.sendMessage(from, {
                text: `🎮 *TRUTH OR DARE*\n\n😈 *DARE:*\n${challenge}\n\n*Good luck!* 🎯`,
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

// Would You Rather command (using same API structure)
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
        // Since the API might not have WYR, we'll create some fallback ones
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
            "Would you rather be able to teleport anywhere or read minds? ✨🧠"
        ];

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