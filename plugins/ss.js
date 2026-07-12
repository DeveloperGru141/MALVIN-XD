const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');

async function takeScreenshot(url) {
  const services = [
    `https://api.miniature.io/?url=${encodeURIComponent(url)}&width=1280&height=720`,
    `https://image.thum.io/get/width/1280/crop/720/${encodeURIComponent(url)}`,
    `https://api.screenshotlayer.com/api/capture?access_key=${process.env.SCREENSHOTLAYER_API_KEY || 'free'}&url=${encodeURIComponent(url)}&viewport=1280x720`
  ];

  for (const serviceUrl of services) {
    try {
      const res = await axios.get(serviceUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (res.data && res.data.length > 1000) return Buffer.from(res.data);
    } catch (e) {
      console.log(`Screenshot service failed:`, e.message);
    }
  }
  return null;
}

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

        const imageBuffer = await takeScreenshot(q);

        if (!imageBuffer) {
            return await reply('❌ Failed to take screenshot. All screenshot services are unavailable.');
        }

        await ademola.sendMessage(from, {
            image: imageBuffer,
            caption: `📸 ${q}\n\nPowered by Ademola Tech`
        }, { quoted: fakevCard });

    } catch (error) {
        console.error('Screenshot error:', error);
        await reply('❌ Failed to take screenshot. Try again later.');
    }
});
