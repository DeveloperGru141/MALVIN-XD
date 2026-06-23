const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');

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

    const encodedUrl = encodeURIComponent(q);
    const apiUrl = `https://api.nexoracle.com/downloader/mediafire?apikey=${process.env.NEXORACLE_API_KEY || ''}&url=${encodedUrl}`;
    
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.status || !data.result) {
      return reply('❌ *Failed to fetch file information.*\n\nPlease check the URL and try again.');
    }

    const fileInfo = data.result;
    const filename = fileInfo.filename || fileInfo.name;
    const filesize = fileInfo.filesize || fileInfo.size;
    const mimetype = fileInfo.mimetype || fileInfo.type;
    const uploaded = fileInfo.uploaded || fileInfo.date;
    const downloadUrl = fileInfo.download_url || fileInfo.link;

    if (!downloadUrl) {
      return reply('❌ *Download link not available.*\n\nThe file may be removed or inaccessible.');
    }

    const infoMessage = `📁 *MediaFire Download*\n\n📄 *Filename:* ${filename}\n📦 *Size:* ${filesize}\n📅 *Uploaded:* ${uploaded || 'N/A'}\n📋 *Type:* ${mimetype || 'N/A'}\n\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

    await ademola.sendMessage(from, { 
      text: infoMessage,
      mentions: [sender]
    }, { quoted: fakevCard });

    await reply(`📥 *Downloading ${filename}...*`);

    await ademola.sendMessage(from, {
      document: { url: downloadUrl },
      fileName: filename,
      mimetype: mimetype,
      caption: `📁 ${filename}\n📦 ${filesize}\n👤 @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`,
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

    const apiUrl = `https://api.nexoracle.com/downloader/gdrive`;
    const params = {
      apikey: process.env.NEXORACLE_API_KEY || '',
      url: q,
    };

    const response = await axios.get(apiUrl, { params });

    if (!response.data || response.data.status !== 200 || !response.data.result) {
      return reply('❌ *Unable to fetch the file. Please check the URL and try again.*');
    }

    const { downloadUrl, fileName, fileSize, mimetype } = response.data.result;

    await reply(`📥 *Downloading ${fileName} (${fileSize})... Please wait.*`);

    const fileResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    if (!fileResponse.data) {
      return reply('❌ *Failed to download the file. Please try again later.*');
    }

    const fileBuffer = Buffer.from(fileResponse.data, 'binary');

    const caption = `📥 *File Details*\n\n🔖 *Name:* ${fileName}\n📏 *Size:* ${fileSize}\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

    if (mimetype.startsWith('image')) {
      await ademola.sendMessage(from, {
        image: fileBuffer,
        caption: caption,
        mentions: [sender]
      }, { quoted: fakevCard });
    } else if (mimetype.startsWith('video')) {
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

        const nexoracleKey = process.env.NEXORACLE_API_KEY || '';
        const nexRes = await axios.get(`https://api.nexoracle.com/downloader/twitter?apikey=${nexoracleKey}&url=${encodeURIComponent(q)}`, { timeout: 10000 });
        const data = nexRes.data;

        if (!data?.result) {
            return reply('❌ *Failed to fetch Twitter video*');
        }

        const result = data.result;
        const desc = result.desc || result.text || result.title || 'No description';
        const thumb = result.thumb || result.thumbnail || result.image;
        const video_sd = result.video_sd || result.video || result.url_sd || result.sd;
        const video_hd = result.video_hd || result.video_hd || result.url_hd || result.hd || video_sd;

        const caption = `
📹 *Twitter Video Download*

📝 *Description:* ${desc}
🎥 *Quality Options:*
  1️⃣ SD Quality 📼
  2️⃣ HD Quality 🌟

👤 *Requested by:* @${sender.split('@')[0]}

*Reply with 1 or 2 to download*
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ ᴛᴇᴄʜ`;

        const sentMsg = await ademola.sendMessage(from, {
            image: { url: thumb },
            caption: caption,
            mentions: [sender]
        }, { quoted: fakevCard });

        const videoData = {
            sd: video_sd,
            hd: video_hd,
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
            const pixRes = await axios.get(`https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY || '48810274-0b9f91187a0e243bd5be3abb4'}&q=${encodeURIComponent(q)}&image_type=photo&per_page=5`, { timeout: 10000 });
            if (pixRes.data?.hits?.length) {
                images = pixRes.data.hits.map(h => ({ url: h.largeImageURL || h.webformatURL }));
            }
        } catch {}

        if (!images) {
            try {
                const unsplashRes = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=5&client_id=${process.env.UNSPLASH_API_KEY || 'ab3411e4ac868c2646c0cd48860bb82c0c531c24c3e22068c4393ac7e47a86a7'}`, { timeout: 10000 });
                if (unsplashRes.data?.results?.length) {
                    images = unsplashRes.data.results.map(h => ({ url: h.urls?.regular || h.urls?.small }));
                }
            } catch {}
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


