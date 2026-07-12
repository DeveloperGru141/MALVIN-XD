const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');
const cheerio = require('cheerio');
const AdmZip = require('adm-zip');
const path = require('path');
const os = require('os');

async function scrapeWebsite(url) {
  const res = await axios.get(url, {
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const $ = cheerio.load(res.data);
  const assets = [];

  $('link[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('data:') && !href.startsWith('#')) assets.push(href);
  });
  $('script[src]').each((i, el) => {
    const src = $(el).attr('src');
    if (src) assets.push(src);
  });
  $('img[src]').each((i, el) => {
    const src = $(el).attr('src');
    if (src && !src.startsWith('data:')) assets.push(src);
  });

  return { html: res.data, assets };
}

function resolveAssetUrl(assetUrl, baseUrl) {
  if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) return assetUrl;
  const base = new URL(baseUrl);
  if (assetUrl.startsWith('//')) return `${base.protocol}${assetUrl}`;
  if (assetUrl.startsWith('/')) return `${base.origin}${assetUrl}`;
  return `${base.origin}/${assetUrl}`;
}

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
        await reply('🔄 Downloading website content...');

        const { html, assets } = await scrapeWebsite(q);
        const zip = new AdmZip();
        const domain = new URL(q).hostname;
        const baseUrl = q.replace(/\/$/, '');

        zip.addFile('index.html', Buffer.from(html));

        let downloaded = 0;
        const assetUrls = [...new Set(assets)].slice(0, 30);
        const assetDir = 'assets';

        for (const assetUrl of assetUrls) {
            try {
                const fullUrl = resolveAssetUrl(assetUrl, baseUrl);
                const res = await axios.get(fullUrl, {
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                const urlPath = new URL(fullUrl).pathname;
                const zipPath = `${assetDir}${urlPath}`;
                zip.addFile(zipPath, Buffer.from(res.data));
                downloaded++;
            } catch (e) {
                // skip failed assets
            }
        }

        const zipBuffer = zip.toBuffer();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `website_archive_${domain}_${timestamp}.zip`;

        const caption = `📦 *Website Archive Created*\n\n` +
                       `🌐 *Website:* ${baseUrl}\n` +
                       `📂 *Assets Archived:* ${downloaded}\n` +
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
            { quoted: fakevCard }
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
