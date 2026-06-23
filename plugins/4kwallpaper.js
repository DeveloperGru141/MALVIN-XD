const axios = require('axios');
const cheerio = require('cheerio');
const { ademola, fakevCard } = require('../ademola');

class Wallpaper {
    constructor() {
        this.base = 'https://4kwallpapers.com';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        };
    }

    async search(q) {
        if (!q) return 'Missing query.';
        try {
            const { data } = await axios.get(`${this.base}/search/?text=${q}`, {
                headers: this.headers
            });
            const $ = cheerio.load(data);
            let res = [];
            $('div#pics-list .wallpapers__item').each((i, e) => {
                res.push({
                    thumbnail: $(e).find('img').attr('src'),
                    title: $(e).find('.title2').text().trim(),
                    url: $(e).find('a').attr('href')
                });
            });
            return res;
        } catch (e) {
            return e.message;
        }
    }

    async download(url) {
        if (!url) return 'Missing wallpaper URL.';
        try {
            const { data } = await axios.get(url, { headers: this.headers });
            const $ = cheerio.load(data);
            const main = $('#main-pic');
            const list = $('#res-list');
            let res = {
                title: $('.main-id .selected').text().trim(),
                thumbnail: $(main).find('img').attr('src'),
                image: {
                    desktop: [],
                    mobile: [],
                    tablet: []
                }
            };
            $(list).find('span').eq(0).find('a').each((i, e) => {
                res.image.desktop.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            $(list).find('span').eq(1).find('a').each((i, e) => {
                res.image.mobile.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            $(list).find('span').eq(2).find('a').each((i, e) => {
                res.image.tablet.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            return res;
        } catch (e) {
            return e.message;
        }
    }
}

ademola({
    pattern: "4kwallpaper",
    alias: ["wallpaper", "4kwall", "hdwall"],
    desc: "Search and download 4K wallpapers",
    category: "download",
    react: "🌆",
    use: ".4kwallpaper popular|featured|random|collection|search <query>|dl <url>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        const wallpaper = new Wallpaper();
        const args = q ? q.split(' ') : [];
        const type = args[0];

        if (!type) {
            return reply(
                `🌆 *4K Wallpaper Commands*\n\n` +
                `📂 *Browse Categories:*\n` +
                `• .4kwallpaper popular - Most popular wallpapers\n` +
                `• .4kwallpaper featured - Featured wallpapers\n` +
                `• .4kwallpaper random - Random wallpapers\n` +
                `• .4kwallpaper collection - Wallpaper collections\n\n` +
                `🔍 *Search Wallpapers:*\n` +
                `• .4kwallpaper search nature\n` +
                `• .4kwallpaper search car\n` +
                `• .4kwallpaper search anime\n\n` +
                `📥 *Download Wallpaper:*\n` +
                `• .4kwallpaper dl https://4kwallpapers.com/...\n\n` +
                `💡 *Tip:* First browse or search, then use the download link provided!\n\n` +
                `👤 *Requested by:* @${sender.split('@')[0]}`,
                { mentions: [sender] }
            );
        }

        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        if (['popular', 'featured', 'random', 'collection'].includes(type)) {
            let endpoint;
            switch(type) {
                case 'popular': endpoint = 'most-popular-4k-wallpapers/'; break;
                case 'featured': endpoint = 'best-4k-wallpapers/'; break;
                case 'random': endpoint = 'random-wallpapers/'; break;
                case 'collection': endpoint = 'collections-packs/'; break;
            }

            const { data } = await axios.get(`${wallpaper.base}/${endpoint}`, {
                headers: wallpaper.headers
            });
            const $ = cheerio.load(data);
            let result = [];
            
            $('div#pics-list .wallpapers__item').each((i, e) => {
                if (i < 10) {
                    result.push(`${i + 1}. ${$(e).find('.title2').text().trim()}\n🔗 ${$(e).find('a').attr('href')}`);
                }
            });

            await ademola.sendMessage(from, {
                text: `🌆 *${type.toUpperCase()} Wallpapers*\n\n${result.join('\n\n')}\n\n📥 *Download any wallpaper:*\n.4kwallpaper dl [URL]\n\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`,
                mentions: [sender]
            }, { quoted: fakevCard });

        } else if (type === 'search') {
            if (!args[1]) {
                return reply(
                    `❌ *Search Query Required*\n\n` +
                    `*Usage:* .4kwallpaper search <keyword>\n\n` +
                    `*Examples:*\n` +
                    `• .4kwallpaper search ocean\n` +
                    `• .4kwallpaper search mountains\n` +
                    `• .4kwallpaper search cars\n\n` +
                    `👤 *Requested by:* @${sender.split('@')[0]}`,
                    { mentions: [sender] }
                );
            }
            
            const query = args.slice(1).join(' ');
            const searchData = await wallpaper.search(query);
            
            if (typeof searchData === 'string') {
                return reply(`❌ Search failed: ${searchData}`);
            }
            
            if (searchData.length === 0) {
                return reply(`🔍 No wallpapers found for: *${query}*\n\nTry different keywords!\n\n👤 *Requested by:* @${sender.split('@')[0]}`, { mentions: [sender] });
            }
            
            const result = searchData.slice(0, 8).map((item, i) => 
                `${i + 1}. ${item.title}\n🔗 ${item.url}`
            ).join('\n\n');

            await ademola.sendMessage(from, {
                text: `🔍 *Search Results for:* ${query}\n\n${result}\n\n📥 *Download wallpaper:*\n.4kwallpaper dl [URL]\n\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`,
                mentions: [sender]
            }, { quoted: fakevCard });

        } else if (type === 'dl') {
            if (!args[1]) {
                return reply(
                    `❌ *Download URL Required*\n\n` +
                    `*Usage:* .4kwallpaper dl <URL>\n\n` +
                    `*Example:*\n` +
                    `.4kwallpaper dl https://4kwallpapers.com/nature/...\n\n` +
                    `👤 *Requested by:* @${sender.split('@')[0]}`,
                    { mentions: [sender] }
                );
            }
            
            await reply('📥 Fetching wallpaper download links...');
            
            const downloadData = await wallpaper.download(args[1]);
            
            if (typeof downloadData === 'string') {
                return reply(`❌ Download failed: ${downloadData}`);
            }
            
            let msg = `✅ *${downloadData.title}*\n\n`;
            msg += `🖼️ *Preview:* ${downloadData.thumbnail}\n\n`;
            
            if (downloadData.image.desktop.length > 0) {
                msg += `🖥️ *Desktop Resolutions:*\n`;
                downloadData.image.desktop.forEach(x => {
                    msg += `• ${x.res}: ${x.url}\n`;
                });
                msg += '\n';
            }
            
            if (downloadData.image.mobile.length > 0) {
                msg += `📱 *Mobile Resolutions:*\n`;
                downloadData.image.mobile.forEach(x => {
                    msg += `• ${x.res}: ${x.url}\n`;
                });
                msg += '\n';
            }
            
            if (downloadData.image.tablet.length > 0) {
                msg += `📋 *Tablet Resolutions:*\n`;
                downloadData.image.tablet.forEach(x => {
                    msg += `• ${x.res}: ${x.url}\n`;
                });
            }

            msg += `\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

            await ademola.sendMessage(from, {
                text: msg,
                mentions: [sender]
            }, { quoted: fakevCard });

        } else {
            return reply(
                `❌ *Invalid Command*\n\n` +
                `Use .4kwallpaper without parameters to see all available options.\n\n` +
                `👤 *Requested by:* @${sender.split('@')[0]}`,
                { mentions: [sender] }
            );
        }

        await ademola.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('4kwallpaper error:', error);
        await ademola.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return reply(`❌ Failed to process wallpaper request: ${error.message}\n\n👤 *Requested by:* @${sender.split('@')[0]}`, { mentions: [sender] });
    }
});