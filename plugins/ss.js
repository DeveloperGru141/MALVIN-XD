const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');

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
            return await reply(`📸 *SCREENSHOT TOOL*\n\nUsage: .ss <url>\n\nExamples:\n.ss https://google.com\n.ss https://instagram.com`);
        }

        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            return await reply('❌ Please provide a valid URL starting with http:// or https://');
        }

        await reply(`📸 Taking screenshot of: ${q}`);

        const apiUrl = `https://api.nexoracle.com/tools/ssweb?apikey=${process.env.NEXORACLE_API_KEY || ''}&url=${encodeURIComponent(q)}&device=desktop`;
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        if (!response.data) {
            return await reply('❌ Failed to take screenshot. Website might be blocking screenshots.');
        }

        await ademola.sendMessage(from, {
            image: Buffer.from(response.data),
            caption: `📸 ${q}\n\nPowered by Ademola Tech`
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Screenshot error:', error);
        if (error.response?.status === 403) {
            await reply('❌ Website denied screenshot access.');
        } else {
            await reply('❌ Failed to take screenshot. Try again later.');
        }
    }
});
