//---------------------------------------------
//           ADEMOLA-XD TEXT MAKER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const mumaker = require('mumaker');

// Fast loading animation for text effects
async function sendTextEffectLoading(ademola, from, effectName) {
    const frames = ['🎨', '✨', '⚡', '🔄', '🌟'];
    let loadingMsg = await ademola.sendMessage(from, { 
        text: `${frames[0]} Creating ${effectName} effect...`
    }, { quoted: fakevCard });
    
    let frameIndex = 0;
    const animationInterval = setInterval(async () => {
        frameIndex = (frameIndex + 1) % frames.length;
        try {
            await ademola.sendMessage(from, {
                text: `${frames[frameIndex]} Creating ${effectName} effect...`,
                edit: loadingMsg.key
            });
        } catch (e) {
            clearInterval(animationInterval);
        }
    }, 100); // Fast animation ⚡
    
    return {
        stop: () => clearInterval(animationInterval),
        message: loadingMsg
    };
}

// Reusable text effect function
async function createMumakerEffect(ademola, mek, m, { from, q, reply, sender }, effectName, effectUrl) {
    try {
        if (!q) {
            return await reply(`🎨 *${effectName.toUpperCase()} EFFECT*\n\n❌ Please provide text.\n\n*Example:* .${effectName} Your Text`);
        }

        // Send initial reaction
        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        // Start loading animation
        const loading = await sendTextEffectLoading(ademola, from, effectName);

        const result = await mumaker.ephoto(effectUrl, q);

        if (!result || !result.image) {
            loading.stop();
            return await reply(`❌ *Failed to create ${effectName} effect!*\n\nPlease try again with different text.`);
        }

        // Stop loading and send result
        loading.stop();

        const caption = `
╭───═══━ • ━═══───╮
   🎨 *${effectName.toUpperCase()} EFFECT*
╰───═══━ • ━═══───╯

📝 *Text:* ${q}
🎯 *Effect:* ${effectName}

> ✨ Powered by Ademola Tech
        `.trim();

        await ademola.sendMessage(from, {
            image: { url: result.image },
            caption: caption,
            ...channelInfo
        }, { quoted: fakevCard });

        // Success reaction
        await ademola.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(`${effectName} error:`, e);
        await reply(`❌ *Failed to create ${effectName} effect!*\n\nError: ${e.message}`);
    }
}

// ========== TEXT MAKER COMMANDS ==========

// Metallic Effect
ademola({
    pattern: "metallic",
    alias: ["metal"],
    desc: "Create metallic 3D text effect",
    category: "textmaker",
    react: "🔩",
    use: ".metallic <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "metallic",
        "https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html");
});

// Ice Effect
ademola({
    pattern: "ice",
    alias: ["iceeffect"],
    desc: "Create ice text effect",
    category: "textmaker",
    react: "❄️",
    use: ".ice <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "ice",
        "https://en.ephoto360.com/ice-text-effect-online-101.html");
});

// Snow Effect
ademola({
    pattern: "snow",
    alias: ["snoweffect"],
    desc: "Create snow 3D text effect",
    category: "textmaker",
    react: "🌨️",
    use: ".snow <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "snow",
        "https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html");
});

// Impressive Paint Effect
ademola({
    pattern: "impressive",
    alias: ["paint3d"],
    desc: "Create impressive 3D paint text effect",
    category: "textmaker",
    react: "🎨",
    use: ".impressive <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "impressive paint",
        "https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html");
});

// Matrix Effect
ademola({
    pattern: "matrix",
    alias: ["matrixeffect"],
    desc: "Create matrix text effect",
    category: "textmaker",
    react: "💚",
    use: ".matrix <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "matrix",
        "https://en.ephoto360.com/matrix-text-effect-154.html");
});

// Light Effect
ademola({
    pattern: "light",
    alias: ["lighteffect"],
    desc: "Create futuristic light text effect",
    category: "textmaker",
    react: "💡",
    use: ".light <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "light",
        "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html");
});

// Neon Effect
ademola({
    pattern: "neon",
    alias: ["neoneffect"],
    desc: "Create neon light text effect",
    category: "textmaker",
    react: "🌈",
    use: ".neon <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "neon",
        "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html");
});

// Devil Wings Effect
ademola({
    pattern: "devil",
    alias: ["devilwings"],
    desc: "Create devil wings neon text effect",
    category: "textmaker",
    react: "😈",
    use: ".devil <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "devil wings",
        "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html");
});

// Purple Effect
ademola({
    pattern: "purple",
    alias: ["purpleeffect"],
    desc: "Create purple text effect",
    category: "textmaker",
    react: "💜",
    use: ".purple <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "purple",
        "https://en.ephoto360.com/purple-text-effect-online-100.html");
});

// Thunder Effect
ademola({
    pattern: "thunder",
    alias: ["thundereffect"],
    desc: "Create thunder text effect",
    category: "textmaker",
    react: "⚡",
    use: ".thunder <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "thunder",
        "https://en.ephoto360.com/thunder-text-effect-online-97.html");
});

// Leaves Effect
ademola({
    pattern: "leaves",
    alias: ["leafeffect"],
    desc: "Create green leaves text effect",
    category: "textmaker",
    react: "🍃",
    use: ".leaves <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "leaves",
        "https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html");
});

// 1917 Style Effect
ademola({
    pattern: "1917",
    alias: ["vintage"],
    desc: "Create 1917 vintage text effect",
    category: "textmaker",
    react: "🎞️",
    use: ".1917 <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "1917 style",
        "https://en.ephoto360.com/1917-style-text-effect-523.html");
});

// Arena Effect
ademola({
    pattern: "arena",
    alias: ["arenaeffect"],
    desc: "Create arena of valor cover effect",
    category: "textmaker",
    react: "🛡️",
    use: ".arena <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "arena",
        "https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html");
});

// Hacker Effect
ademola({
    pattern: "hacker",
    alias: ["hackereffect"],
    desc: "Create hacker avatar text effect",
    category: "textmaker",
    react: "💻",
    use: ".hacker <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "hacker",
        "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html");
});

// Sand Effect
ademola({
    pattern: "sand",
    alias: ["sandeffect"],
    desc: "Create sand writing text effect",
    category: "textmaker",
    react: "🏖️",
    use: ".sand <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "sand",
        "https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html");
});

// Blackpink Effect
ademola({
    pattern: "blackpink",
    alias: ["bp"],
    desc: "Create Blackpink style text effect",
    category: "textmaker",
    react: "🖤",
    use: ".blackpink <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "blackpink",
        "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html");
});

// Glitch Effect
ademola({
    pattern: "glitch",
    alias: ["glitcheffect"],
    desc: "Create digital glitch text effect",
    category: "textmaker",
    react: "📱",
    use: ".glitch <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "glitch",
        "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html");
});

// Fire Effect
ademola({
    pattern: "fire",
    alias: ["fireeffect"],
    desc: "Create flame lettering text effect",
    category: "textmaker",
    react: "🔥",
    use: ".fire <text>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply }) => {
    await createMumakerEffect(ademola, mek, m, { from, q, reply }, "fire",
        "https://en.ephoto360.com/flame-lettering-effect-372.html");
});

// Text Effects Help Command
ademola({
    pattern: "textmaker",
    alias: ["textfx", "effects"],
    desc: "Show all available text effects",
    category: "textmaker",
    react: "📖",
    use: ".textmaker",
    filename: __filename
}, async (ademola, mek, m, { from, reply }) => {
    const effectsList = `
╭───═══━ • ━═══───╮
   🎨 *TEXT EFFECTS*
╰───═══━ • ━═══───╯

🔩 *Metallic & 3D:*
• .metallic <text>
• .impressive <text>
• .snow <text>

🌈 *Neon & Light:*
• .neon <text>
• .light <text> 
• .purple <text>
• .thunder <text>

🎮 *Gaming & Tech:*
• .matrix <text>
• .hacker <text>
• .arena <text>
• .glitch <text>

🌿 *Nature & Vintage:*
• .leaves <text>
• .sand <text>
• .ice <text>
• .1917 <text>

🔥 *Special Effects:*
• .fire <text>
• .devil <text>
• .blackpink <text>

💡 *Usage:*
.effect <text>

> 🚀 18+ effects available!
    `.trim();

    await reply(effectsList);
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------