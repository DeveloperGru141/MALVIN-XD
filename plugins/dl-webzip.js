const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
const { loadSettings } = require('../lib/settingsManager');

ademola({
    pattern: "webzip",
    alias: ["sitezip", "web", "archive", "websitezip"],
    desc: "Archive website to ZIP file",
    category: "tools",
    react: "📦",
    use: ".webzip <url>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`📦 *Website Archiver*\n\nUsage: .webzip <url>\nExample: .webzip https://example.com`);
        }

        if (!q.match(/^https?:\/\//)) {
            return await reply('❌ Invalid URL. Please include http:// or https://');
        }

        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const apiUrl = `https://api.nexoracle.com/tools/web2zip?apikey=${process.env.NEXORACLE_API_KEY || ''}&url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl, { 
            timeout: 30000 
        });

        if (!response.data?.status || !response.data?.result?.download_url) {
            return await reply('❌ Failed to archive website. The site may be restricted, too large, or unavailable.');
        }

        const { siteUrl, copiedFilesAmount, download_url } = response.data.result;

        await reply('🔄 Archiving website content...');

        const zipResponse = await axios.get(download_url, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        if (!zipResponse.data || zipResponse.data.length === 0) {
            return await reply('❌ Failed to download archive. The file may be empty or too large.');
        }

        const zipBuffer = Buffer.from(zipResponse.data, 'binary');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const domain = q.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        const filename = `website_archive_${domain}_${timestamp}.zip`;

        const caption = `📦 *Website Archive Created*\n\n` +
                       `🌐 *Website:* ${siteUrl}\n` +
                       `📂 *Files Archived:* ${copiedFilesAmount}\n` +
                       `💾 *Archive Size:* ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB\n\n` +
                       `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                       `> © Powered by Ademola King`;

        await ademola.sendMessage(
            from,
            {
                document: zipBuffer,
                fileName: filename,
                mimetype: 'application/zip',
                caption: caption,
                mentions: [sender]
            },
            { 
                quoted: fakevCard 
            }
        );

        await ademola.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('Webzip error:', error);
        await ademola.sendMessage(from, { react: { text: '❌', key: mek.key } });
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. The website is taking too long to archive. Try a smaller site.');
        } else if (error.response?.status === 403) {
            await reply('❌ Website denied access. The site may have anti-scraping protection.');
        } else if (error.response?.status === 404) {
            await reply('❌ Website not found. Please check the URL and try again.');
        } else {
            await reply('❌ Failed to archive website. The site may be too large or unavailable.');
        }
    }
});
