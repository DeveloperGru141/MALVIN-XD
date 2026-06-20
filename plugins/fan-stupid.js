const { ademola, fakevCard } = require("../ademola");
const fetch = require('node-fetch');

ademola({
    pattern: "stupid",
    alias: ["im-stupid", "dog"],
    desc: "Generate 'its so stupid' meme with custom text",
    category: "fun",
    react: "🐶",
    use: ".stupid [text] or .stupid [text] @user",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        let targetJid;
        const ctx = mek.message?.extendedTextMessage?.contextInfo;
        
        // Determine target user
        if (ctx?.mentionedJid?.length > 0) {
            targetJid = ctx.mentionedJid[0];
        } else if (ctx?.participant) {
            targetJid = ctx.participant;
        } else {
            targetJid = sender;
        }

        // Get custom text or use default
        let stupidText = text || 'im+stupid';
        
        // Get profile picture
        let avatarUrl;
        try {
            avatarUrl = await ademola.profilePictureUrl(targetJid, 'image');
        } catch {
            avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
        }

        // Generate the stupid card
        const apiUrl = `https://some-random-api.com/canvas/misc/its-so-stupid?avatar=${encodeURIComponent(avatarUrl)}&dog=${encodeURIComponent(stupidText)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const imageBuffer = await response.buffer();

        await ademola.sendMessage(from, {
            image: imageBuffer,
            caption: `*@${targetJid.split('@')[0]}*`,
            mentions: [targetJid]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in stupid command:', error);
        await reply('❌ Failed to generate stupid card. Please try again!');
    }
});