const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeMediafire(url) {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  });
  const $ = cheerio.load(res.data);

  const downloadUrl = $('#downloadButton').attr('href') ||
    $('.download_link a[href*="download"]').attr('href') ||
    $('a[aria-label="Download file"]').attr('href') ||
    $('a#downloadButton').attr('href') ||
    $('a.btn[href*="mediafire.com"]').attr('href');

  const filename =
    $('#filename').text().trim() ||
    $('.filename').text().trim() ||
    $('h1[itemprop="name"]').text().trim() ||
    $('.dl-file-name').text().trim() ||
    $('.file-name').text().trim() ||
    url.split('/').pop() || 'file';

  const fileSize =
    $('.file-size').text().trim() ||
    $('#filesize').text().trim() ||
    $('span[aria-label*="size" i]').text().trim() ||
    $('.dl-file-size').text().trim() ||
    '';

  const uploaded =
    $('.uploaded-date').text().trim() ||
    $('#uploaded').text().trim() ||
    $('.dl-uploaded').text().trim() ||
    '';

  return { downloadUrl, filename, fileSize, uploaded };
}

ademola({
    pattern: "mediafire",
    alias: ["mf", "mediafiredl"],
    desc: "Download files from MediaFire",
    category: "download",
    react: "📁",
    use: ".mediafire <url>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
  try {
    if (!q) {
      return reply(`📁 *MediaFire Download*\n\nPlease provide a MediaFire URL.\n\nExample: .mediafire https://www.mediafire.com/file/...\n\n👤 *Requested by:* @${sender.split('@')[0]}`, { mentions: [sender] });
    }

    await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    const { downloadUrl, filename, fileSize, uploaded } = await scrapeMediafire(q);

    if (!downloadUrl) {
      return reply('❌ *Failed to fetch file information.*\n\nPlease check the URL and try again.');
    }

    const infoMessage = `📁 *MediaFire Download*\n\n📄 *Filename:* ${filename}\n📦 *Size:* ${fileSize || 'N/A'}\n📅 *Uploaded:* ${uploaded || 'N/A'}\n\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

    await ademola.sendMessage(from, { 
      text: infoMessage,
      mentions: [sender]
    }, { quoted: fakevCard });

    await reply(`📥 *Downloading ${filename}...*`);

    await ademola.sendMessage(from, {
      document: { url: downloadUrl },
      fileName: filename,
      caption: `📁 ${filename}\n📦 ${fileSize || 'N/A'}\n👤 @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`,
      mentions: [sender]
    }, { quoted: fakevCard });

    await ademola.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (error) {
    console.error('MediaFire Error:', error);
    await ademola.sendMessage(from, { react: { text: '❌', key: mek.key } });
    
    if (error.response?.status === 404) {
      reply('❌ *File not found.*\n\nThe MediaFire link may be invalid or the file has been removed.');
    } else if (error.code === 'ECONNREFUSED') {
      reply('❌ *Service unavailable.*\n\nThe download service is currently down. Please try again later.');
    } else {
      reply(`❌ *Download Error:* ${error.message}`);
    }
  }
});

function extractGdriveId(url) {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/id=([a-zA-Z0-9_-]+)/) ||
                url.match(/\/folders?\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function getGdriveDirectUrl(fileId) {
  const res = await axios.get(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    maxRedirects: 5,
    validateStatus: s => s < 400
  });

  if (res.data && typeof res.data === 'string' && res.data.includes('confirm=')) {
    const $ = cheerio.load(res.data);
    const confirmToken = $('input[name="confirm"]').val();
    if (confirmToken) {
      return `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
    }
  }

  const finalUrl = res.request?.res?.responseUrl ||
    `https://drive.google.com/uc?export=download&id=${fileId}`;

  return finalUrl;
}

function getGdriveFileName(res) {
  const disposition = res.headers?.['content-disposition'];
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;\n]+)/i);
    if (match) return decodeURIComponent(match[1].replace(/"/g, ''));
  }
  return 'gdrive_file';
}

ademola({
  pattern: "gdrive",
  alias: ["gdrivedownload", "gdownloader"],
  react: '📥',
  desc: "Download files from Google Drive",
  category: "download",
  use: ".gdrive <google-drive-url>",
  filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
  try {
    if (!q || !q.includes("drive.google.com")) {
      return reply('❌ *Please provide a valid Google Drive URL*\n\nExample: .gdrive https://drive.google.com/file/d/...');
    }

    await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    const fileId = extractGdriveId(q);
    if (!fileId) {
      return reply('❌ *Could not extract file ID from URL.*');
    }

    const directUrl = await getGdriveDirectUrl(fileId);

    await reply('📥 *Downloading file... Please wait.*');

    const fileResponse = await axios.get(directUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!fileResponse.data) {
      return reply('❌ *Failed to download the file. Please try again later.*');
    }

    const fileBuffer = Buffer.from(fileResponse.data);
    const fileName = getGdriveFileName(fileResponse);
    const mimetype = fileResponse.headers?.['content-type'] || 'application/octet-stream';
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2) + ' MB';

    const caption = `📥 *File Details*\n\n🔖 *Name:* ${fileName}\n📏 *Size:* ${fileSize}\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

    if (mimetype.startsWith('image/')) {
      await ademola.sendMessage(from, {
        image: fileBuffer,
        caption: caption,
        mentions: [sender]
      }, { quoted: fakevCard });
    } else if (mimetype.startsWith('video/')) {
      await ademola.sendMessage(from, {
        video: fileBuffer,
        caption: caption,
        mentions: [sender]
      }, { quoted: fakevCard });
    } else {
      await ademola.sendMessage(from, {
        document: fileBuffer,
        mimetype: mimetype,
        fileName: fileName,
        caption: caption,
        mentions: [sender]
      }, { quoted: fakevCard });
    }

    await ademola.sendMessage(from, { react: { text: '✅', key: mek.key } });
  } catch (error) {
    console.error('GDrive Error:', error);
    reply('❌ *Unable to download the file. Please try again later.*');
    await ademola.sendMessage(from, { react: { text: '❌', key: mek.key } });
  }
});



async function scrapeTwitsave(twitterUrl) {
  const res = await axios.get(`https://twitsave.com/info?url=${encodeURIComponent(twitterUrl)}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const $ = cheerio.load(res.data);

  const text = $('p[class*="lead"]').text().trim() || $('.tweet-text').text().trim() || '';
  const thumb = $('img[src*="twimg"]').first().attr('src') ||
    $('img[src*="pbs.twimg"]').first().attr('src') || '';
  const videoUrls = [];
  $('a[href*="twitsave.com/download"]').each((i, el) => {
    const href = $(el).attr('href');
    const label = $(el).text().trim().toLowerCase();
    if (href) {
      videoUrls.push({ url: href, hd: label.includes('hd') || label.includes('720') || label.includes('1080') });
    }
  });

  let sd, hd;
  for (const v of videoUrls) {
    if (v.hd && !hd) hd = v.url;
    else if (!sd) sd = v.url;
  }
  if (!hd) hd = sd;

  return { desc: text, thumb, sd, hd };
}

ademola({
    pattern: 'twitter',
    alias: ['tweet', 'twdl', 'twitterdl'],
    desc: 'Download Twitter videos',
    category: 'download',
    react: '📹',
    use: '.twitter <twitter-url>',
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q || !q.startsWith('https://')) {
            return reply('❌ *Please provide a valid Twitter URL*');
        }

        await ademola.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const data = await scrapeTwitsave(q);
        if (!data.sd) {
            return reply('❌ *Failed to fetch Twitter video*');
        }

        const caption = `
📹 *Twitter Video Download*

📝 *Description:* ${data.desc || 'No description'}
🎥 *Quality Options:*
  1️⃣ SD Quality 📼
  2️⃣ HD Quality 🌟

👤 *Requested by:* @${sender.split('@')[0]}

*Reply with 1 or 2 to download*
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

        const sentMsg = await ademola.sendMessage(from, {
            image: { url: data.thumb },
            caption: caption,
            mentions: [sender]
        }, { quoted: fakevCard });

        const videoData = {
            sd: data.sd,
            hd: data.hd || data.sd,
            timestamp: Date.now()
        };

        ademola.ev.on('messages.upsert', async ({ messages }) => {
            const receivedMsg = messages[0];
            if (!receivedMsg.message || receivedMsg.key.remoteJid !== from) return;

            const text = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const isReply = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
            
            if (isReply && (text === '1' || text === '2')) {
                try {
                    await ademola.sendMessage(from, { react: { text: '⬇️', key: receivedMsg.key } });

                    const videoUrl = text === '1' ? videoData.sd : videoData.hd;
                    if (!videoUrl) {
                        return reply('❌ *Invalid video URL*');
                    }

                    await ademola.sendMessage(from, {
                        video: { url: videoUrl },
                        caption: `📥 *Downloaded in ${text === '1' ? 'SD' : 'HD'} quality*\n👤 *By:* @${sender.split('@')[0]}`,
                        mentions: [sender]
                    }, { quoted: fakevCard });

                    await ademola.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });

                } catch (err) {
                    console.error('Download error:', err);
                    reply('❌ *Failed to download video*');
                }
            }
        });

    } catch (err) {
        console.error('Twitter Error:', err);
        await ademola.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply('❌ *Error processing Twitter URL*');
    }
});

ademola({
    pattern: "img",
    alias: ["image", "searchimg"],
    react: "🖼️",
    desc: "Search and download images",
    category: "search",
    use: ".img <query>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return reply("🖼️ *Please provide a search query*\n\nExample: .img ademola xd");
        }

        await reply(`🔍 *Searching for "${q}"...*`);
        
        let images;

        try {
            if (!process.env.PIXABAY_API_KEY) throw new Error('PIXABAY_API_KEY not configured');
            const pixRes = await axios.get(`https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=5`, { timeout: 10000 });
            if (pixRes.data?.hits?.length) {
                images = pixRes.data.hits.map(h => ({ url: h.largeImageURL || h.webformatURL }));
            }
            } catch (e) { console.error('[plugin] error:', e); }

        if (!images) {
            try {
                if (!process.env.UNSPLASH_API_KEY) throw new Error('UNSPLASH_API_KEY not configured');
                const unsplashRes = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=5&client_id=${process.env.UNSPLASH_API_KEY}`, { timeout: 10000 });
                if (unsplashRes.data?.results?.length) {
                    images = unsplashRes.data.results.map(h => ({ url: h.urls?.regular || h.urls?.small }));
                }
            } catch (e) { console.error('[plugin] error:', e); }
        }

        if (!images || images.length === 0) {
            return reply("❌ *No images found. Try different keywords*");
        }
        
        for (const image of images) {
            await ademola.sendMessage(from, { 
                image: { url: image.url },
                caption: `📷 *Result for:* ${q}\n👤 *Requested by:* @${sender.split('@')[0]}\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`,
                mentions: [sender]
            }, { quoted: fakevCard });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
    } catch (error) {
        console.error('Image Search Error:', error);
        reply(`❌ *Error:* ${error.message || "Failed to fetch images"}`);
    }
});


