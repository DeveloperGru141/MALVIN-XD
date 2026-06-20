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
    const apiUrl = `https://api.nekolabs.web.id/downloader/mediafire?url=${encodedUrl}`;
    
    const response = await axios.get(apiUrl);
    const data = response.data;

    // Check if the API call was successful
    if (!data.success || !data.result) {
      return reply('❌ *Failed to fetch file information.*\n\nPlease check the URL and try again.');
    }

    const fileInfo = data.result;
    const filename = fileInfo.filename;
    const filesize = fileInfo.filesize;
    const mimetype = fileInfo.mimetype;
    const uploaded = fileInfo.uploaded;
    const downloadUrl = fileInfo.download_url;

    if (!downloadUrl) {
      return reply('❌ *Download link not available.*\n\nThe file may be removed or inaccessible.');
    }

    // Send file info first
    const infoMessage = `📁 *MediaFire Download*\n\n📄 *Filename:* ${filename}\n📦 *Size:* ${filesize}\n📅 *Uploaded:* ${uploaded}\n📋 *Type:* ${mimetype}\n\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ`;

    await ademola.sendMessage(from, { 
      text: infoMessage,
      mentions: [sender]
    }, { quoted: fakevCard });

    await reply(`📥 *Downloading ${filename}...*`);

    // Send the file
    await ademola.sendMessage(from, {
      document: { url: downloadUrl },
      fileName: filename,
      mimetype: mimetype,
      caption: `📁 ${filename}\n📦 ${filesize}\n👤 @${sender.split('@')[0]}\n\n © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ`,
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


// Google Drive Download Command
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
      apikey: 'free_key@maher_apis',
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

    const caption = `📥 *File Details*\n\n🔖 *Name:* ${fileName}\n📏 *Size:* ${fileSize}\n👤 *Requested by:* @${sender.split('@')[0]}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ᴍᴀʟᴠɪɴ ᴋɪɴɢ`;

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

// GitHub Download Command
ademola({
    pattern: "githubdl",
    alias: ['gitdl', 'githubdownload'],
    react: '📦',
    desc: "Download GitHub repository as ZIP file",
    category: "download",
    use: ".githubdl <username> <repository> <branch>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    const args = q ? q.split(' ') : [];
    
    if (!args[0]) {
        return reply("❌ *Username is required!*\n\nExample: .githubdl username repository branch");
    }
    if (!args[1]) {
        return reply("❌ *Repository name is required!*\n\nExample: .githubdl username repository branch");
    }
    if (!args[2]) {
        return reply("❌ *Branch name is required!*\n\nExample: .githubdl username repository branch");
    }
    
    const [username, repo, branch] = args;
    const url = `https://github.com/${username}/${repo}/archive/refs/heads/${branch}.zip`;
    
    await reply("📦 *Compressing repository to ZIP file...*");

    await ademola.sendMessage(from, {
        document: { url: url },
        fileName: `${repo}-${branch}.zip`,
        mimetype: 'application/zip',
        caption: `📦 *GitHub Repository Download*\n\n👤 *User:* ${username}\n📁 *Repo:* ${repo}\n🌿 *Branch:* ${branch}\n👤 *Downloaded by:* @${sender.split('@')[0]}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ`,
        mentions: [sender]
    }, { quoted: fakevCard });
});

// Twitter Download Command
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

        const response = await axios.get(`https://www.dark-yasiya-api.site/download/twitter?url=${encodeURIComponent(q)}`);
        const data = response.data;

        if (!data?.status || !data.result) {
            return reply('❌ *Failed to fetch Twitter video*');
        }

        const { desc = 'No description', thumb, video_sd, video_hd } = data.result;

        const caption = `
📹 *Twitter Video Download*

📝 *Description:* ${desc}
🎥 *Quality Options:*
  1️⃣ SD Quality 📼
  2️⃣ HD Quality 🌟

👤 *Requested by:* @${sender.split('@')[0]}

*Reply with 1 or 2 to download*
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ`;

        const sentMsg = await ademola.sendMessage(from, {
            image: { url: thumb },
            caption: caption,
            mentions: [sender]
        }, { quoted: fakevCard });

        // Store the video URLs for later use
        const videoData = {
            sd: video_sd,
            hd: video_hd,
            timestamp: Date.now()
        };

        // Simple response handler (you might want to implement a proper session system)
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

// Image Search Command
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
        
        const url = `https://api.hanggts.xyz/search/gimage?q=${encodeURIComponent(q)}`;
        const response = await axios.get(url);
        
        if (!response.data?.status || !response.data.result?.length) {
            return reply("❌ *No images found. Try different keywords*");
        }
        
        const results = response.data.result;
        const selectedImages = results.sort(() => 0.5 - Math.random()).slice(0, 5);
        
        for (const image of selectedImages) {
            await ademola.sendMessage(from, { 
                image: { url: image.url },
                caption: `📷 *Result for:* ${q}\n👤 *Requested by:* @${sender.split('@')[0]}\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ`,
                mentions: [sender]
            }, { quoted: fakevCard });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
    } catch (error) {
        console.error('Image Search Error:', error);
        reply(`❌ *Error:* ${error.message || "Failed to fetch images"}`);
    }
});

// GitHub Clone Command
ademola({
  pattern: 'gitclone',
  alias: ["git", "github"],
  desc: "Download GitHub repository as a zip file",
  react: '📦',
  category: "download",
  use: ".gitclone <github-url>",
  filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
  if (!q) {
    return reply("❌ *GitHub link missing!*\n\nUsage: .gitclone https://github.com/username/repository");
  }

  if (!/^(https?:\/\/)?github\.com\/.+/.test(q)) {
    return reply("❌ *Invalid GitHub URL!*\nPlease provide a valid GitHub repository link.");
  }

  try {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/i;
    const match = q.match(regex);

    if (!match) throw new Error("Invalid GitHub URL format.");

    const [, username, repo] = match;
    const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;

    const headResp = await axios.head(zipUrl);
    if (headResp.status !== 200) throw new Error("Repository not found or inaccessible.");

    const contentDisp = headResp.headers['content-disposition'] || "";
    const fileNameMatch = contentDisp.match(/filename="?(.+)"?/);
    const fileName = fileNameMatch ? fileNameMatch[1] : `${repo}.zip`;

    await reply(`📥 *Downloading Repository...*\n\n👤 *User:* ${username}\n📁 *Repo:* ${repo}\n👤 *By:* @${sender.split('@')[0]}`);

    await ademola.sendMessage(from, {
      document: { url: zipUrl },
      fileName,
      mimetype: 'application/zip',
      caption: `📦 *GitHub Repository*\n\n👤 *User:* ${username}\n📁 *Repo:* ${repo}\n👤 *Downloaded by:* @${sender.split('@')[0]}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴋɪɴɢ 👑`,
      mentions: [sender]
    }, { quoted: fakevCard });

  } catch (error) {
    console.error("GitClone error:", error);
    reply(`❌ *Download failed!*\n${error.message || "Please try again later."}`);
  }
});