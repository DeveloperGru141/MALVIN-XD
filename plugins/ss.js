//---------------------------------------------
//           ADEMOLA-XD SCREENSHOT
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const fetch = require('node-fetch');

ademola({
    pattern: "ss",
    alias: ["ssweb", "screenshot"],
    desc: "Take screenshot of any website",
    category: "tools",
    react: "📸",
    use: ".ss <url>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📸 *SCREENSHOT TOOL*\n\nUsage: .ss <url>\n\nExamples:\n.ss https://google.com\n.ss https://github.com\n.ss https://instagram.com`);
        }

        // Validate URL
        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            return await reply('❌ Please provide a valid URL starting with http:// or https://');
        }

        await reply(`📸 Taking screenshot of: ${q}`);

        // Call screenshot API
        const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(q)}&theme=light&device=desktop`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            return await reply('❌ Failed to take screenshot. Website might be blocking screenshots.');
        }

        // Get the image buffer
        const imageBuffer = await response.buffer();

        // Send the screenshot
        await ademola.sendMessage(from, {
            image: imageBuffer,
            caption: `📸 ${q}\n\nPowered by Ademola Tech`
        }, {
            quoted: fakevCard
        });

        await reply(`✅ Screenshot taken!`);

    } catch (error) {
        await reply('❌ Failed to take screenshot. Try again later.');
    }
});