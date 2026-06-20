const { ademola, fakevCard } = require('../ademola');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');
const yts = require('yt-search');

// Optimized axios instance
const axiosInstance = axios.create({
  timeout: 15000,
  maxRedirects: 5,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

// Store active listeners and audio data
const activeSessions = new Map();

ademola(
    {
        pattern: 'song',
        alias: ['ytaudio'],
        desc: 'High quality YouTube audio downloader',
        category: 'download',
        react: '🎵',
        use: '<YouTube URL or search query>',
        filename: __filename
    },
    async (ademola, mek, m, { text, from, sender, reply }) => {
        try {
            if (!text) {
                return await reply(`🎵 *Usage:* .song <query/url>\n\n*Examples:*\n• .song https://youtu.be/ox4tmEV6-QU\n• .song Alan Walker faded\n• .song shape of you\n\n💡 *Tip:* You can search by song name or paste YouTube URL`);
            }

            // Send initial reaction
            try {
                if (mek?.key?.id) {
                    await ademola.sendMessage(from, { react: { text: "⏳", key: mek.key } });
                }
            } catch (reactError) {
                console.error('Reaction error:', reactError);
            }

            let videoUrl, videoInfo;
            const isYtUrl = text.match(/(youtube\.com|youtu\.be)/i);
            
            // Send processing message
            const processingMsg = await reply('🔍 Searching for your song...');

            if (isYtUrl) {
                // Handle YouTube URL
                const videoId = text.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
                if (!videoId) {
                    return await reply('❌ *Invalid YouTube URL format!*\n\nPlease provide a valid YouTube URL.\n*Example:* https://youtu.be/ox4tmEV6-QU');
                }
                
                videoUrl = `https://youtu.be/${videoId}`;
                try {
                    videoInfo = await yts({ videoId });
                    if (!videoInfo) throw new Error('Could not fetch video info');
                } catch (e) {
                    console.error('YT-Search error:', e);
                    return await reply('❌ *Failed to get video information!*\n\nPlease check the URL and try again.');
                }
            } else {
                // Handle search query
                try {
                    const searchResults = await yts(text);
                    if (!searchResults?.videos?.length) {
                        return await reply(`❌ *No results found for:* "${text}"\n\nTry different keywords or check spelling.`);
                    }

                    const validVideos = searchResults.videos.filter(v => 
                        !v.live && v.seconds < 7200 && v.views > 10000
                    );

                    if (!validVideos.length) {
                        return await reply(`❌ *Only found unsuitable videos!*\n\nSearch results contained only:\n• Live streams\n• Very long videos\n• Unpopular content\n\nTry a different search term.`);
                    }

                    videoInfo = validVideos[0];
                    videoUrl = videoInfo.url;

                    console.log('Selected video:', {
                        title: videoInfo.title,
                        duration: videoInfo.timestamp,
                        views: videoInfo.views.toLocaleString(),
                        url: videoInfo.url
                    });
                } catch (searchError) {
                    console.error('Search error:', searchError);
                    return await reply('❌ *Search failed!*\n\nPlease try again later or use a YouTube URL instead.');
                }
            }

            // Update to downloading message
            await ademola.sendMessage(from, {
                text: '📥 Downloading audio...',
                edit: processingMsg.key
            });

            // Try multiple download APIs
            let audioUrl = null;
            let apiUsed = null;

            // API endpoints
            const apis = [
                {
                    name: "Izumi",
                    url: `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=mp3`,
                    check: (data) => data?.result?.download
                },
                {
                    name: "Okatsu", 
                    url: `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`,
                    check: (data) => data?.dl
                },
                {
                    name: "David Cyril",
                    url: `https://apis.davidcyriltech.my.id/youtube?url=${encodeURIComponent(videoUrl)}`,
                    check: (data) => data?.downloadUrl
                }
            ];

            for (const api of apis) {
                try {
                    const response = await axiosInstance.get(api.url);
                    if (api.check(response.data)) {
                        audioUrl = api.check(response.data);
                        apiUsed = api.name;
                        console.log(`✅ Using ${api.name} API`);
                        break;
                    }
                } catch (e) {
                    console.log(`${api.name} API failed:`, e.message);
                }
            }

            if (!audioUrl) {
                return await reply('❌ *All download services are currently busy!*\n\nPlease try again in a few minutes.');
            }

            // Download audio buffer once and store it
            let audioBuffer;
            try {
                const audioResponse = await axiosInstance.get(audioUrl, {
                    responseType: 'arraybuffer',
                    headers: { 
                        Referer: 'https://www.youtube.com/',
                        'Accept-Encoding': 'identity'
                    },
                    timeout: 30000
                });
                audioBuffer = Buffer.from(audioResponse.data, 'binary');
            } catch (error) {
                console.error('Audio download error:', error);
                return await reply(`❌ *Failed to download audio!*\n\nError: ${error.message || 'Network error'}`);
            }

            const fileName = `${(videoInfo?.title || 'audio').replace(/[<>:"\/\\|?*]+/g, '_').slice(0, 60)}.mp3`;
            const fileSize = (audioBuffer.length / 1024 / 1024).toFixed(2);

            // Get thumbnail
            let thumbnailBuffer;
            try {
                const thumbnailUrl = videoInfo?.thumbnail;
                if (thumbnailUrl) {
                    const response = await axiosInstance.get(thumbnailUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 5000
                    });
                    thumbnailBuffer = Buffer.from(response.data, 'binary');
                }
            } catch (e) {
                console.error('Thumbnail error:', e);
                thumbnailBuffer = null;
            }

            // Enhanced song information message
            const songInfo = `

   \`🎧 SONG DOWNLOADER\`

╭──「 📋 𝙎𝙊𝙉𝙂 𝙄𝙉𝙁𝙊 」──➣
│ ▸ 📀 *ᴛɪᴛᴛʟᴇ*: ${videoInfo?.title || 'Unknown'}
│ ▸ ⏱️ *ᴅᴜʀᴀᴛɪᴏɴ*: ${videoInfo?.timestamp || 'Unknown'}
│ ▸ 👁️ *ᴠɪᴇᴡs*: ${videoInfo?.views?.toLocaleString() || 'Unknown'}
│ ▸ 👤 *ᴀʀᴛɪsᴛ*: ${videoInfo?.author?.name || 'Unknown'}
│ ▸ 📅 *ᴀɢᴏ*: ${videoInfo?.ago || 'Unknown'}
╰─────

╭──「 🎯 ᴅʟ ᴏᴘᴛɪᴏɴs 」─➣
│ ➊  🎵 *ᴀᴜᴅɪᴏ ғɪʟᴇ* (Play directly)
│ ➋  📁 *ᴅᴏᴄᴜᴍᴇɴᴛ* (Save to device)
│ ➌  *ʙᴏᴛʜ* (Get both formats)
╰─────

> 💡 *Reply with 1, 2, or 3 to choose download type*
            `.trim();

            // Send song info
            const songMessage = {
                image: thumbnailBuffer ? thumbnailBuffer : { url: 'https://files.catbox.moe/ceeo6k.jpg' },
                caption: songInfo,
                ...channelInfo
            };

            const sentMsg = await ademola.sendMessage(from, songMessage, { quoted: fakevCard });

            // Clean up any existing session for this chat
            if (activeSessions.has(from)) {
                const oldSession = activeSessions.get(from);
                ademola.ev.off('messages.upsert', oldSession.listener);
                if (oldSession.timeout) clearTimeout(oldSession.timeout);
                activeSessions.delete(from);
            }

            // Set up response listener with timeout
            const timeout = setTimeout(() => {
                if (activeSessions.has(from)) {
                    const session = activeSessions.get(from);
                    ademola.ev.off('messages.upsert', session.listener);
                    activeSessions.delete(from);
                    reply("⏰ *Download session timed out!*\n\nUse .song again to restart.");
                }
            }, 180000); // 3 minutes timeout

            const messageListener = async (messageUpdate) => {
                try {
                    const mekInfo = messageUpdate?.messages[0];
                    if (!mekInfo?.message || mekInfo.key.remoteJid !== from) return;

                    const message = mekInfo.message;
                    const messageType = message.conversation || message.extendedTextMessage?.text;
                    const isReplyToSentMsg = message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

                    // Check if this is a valid response to our message
                    if (!isReplyToSentMsg || !['1', '2', '3'].includes(messageType?.trim())) return;

                    // Send processing message based on choice
                    let processingText = '📥 Preparing your download...';
                    if (messageType.trim() === '1') processingText = '🎵 Preparing audio file...';
                    if (messageType.trim() === '2') processingText = '📁 Preparing document...';
                    if (messageType.trim() === '3') processingText = '📦 Preparing both formats...';
                    
                    await reply(processingText);

                    try {
                        const successCaption = `✅ *Download Complete!*\n\n📁 *File:* ${fileName}\n💾 *Size:* ${fileSize}MB\n\n🎵 *Enjoy your music!*`;

                        // Handle different download options
                        if (messageType.trim() === "1") {
                            // Send as audio only
                            await ademola.sendMessage(from, {
                                audio: audioBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                ptt: false,
                                caption: successCaption,
                               // ...channelInfo
                            }, { quoted: fakevCard });

                        } else if (messageType.trim() === "2") {
                            // Send as document only
                            await ademola.sendMessage(from, {
                                document: audioBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                caption: successCaption,
                                ...channelInfo
                            }, { quoted: fakevCard });

                        } else if (messageType.trim() === "3") {
                            // Send BOTH formats
                            await ademola.sendMessage(from, {
                                audio: audioBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                ptt: false,
                                caption: `🎵 *Audio File*\n📁 ${fileName}\n💾 ${fileSize}MB`,
                                ...channelInfo
                            }, { quoted: fakevCard });

                            await ademola.sendMessage(from, {
                                document: audioBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                caption: `📁 *Document File*\n📁 ${fileName}\n💾 ${fileSize}MB\n\n✅ Both formats sent successfully!`,
                                ...channelInfo
                            }, { quoted: fakevCard });
                        }

                        // Send success reaction
                        try {
                            if (mekInfo?.key?.id) {
                                await ademola.sendMessage(from, { react: { text: "✅", key: mekInfo.key } });
                            }
                        } catch (reactError) {
                            console.error('Success reaction failed:', reactError);
                        }

                        // IMPORTANT: Don't remove the listener immediately - allow multiple choices
                        // The listener will stay active until timeout or new .song command

                    } catch (error) {
                        console.error('Send message error:', error);
                        await reply(`❌ *Failed to send file!*\n\nError: ${error.message || 'Unknown error'}`);
                    }

                } catch (error) {
                    console.error('Listener error:', error);
                }
            };

            // Store session data
            const sessionData = {
                listener: messageListener,
                timeout: timeout,
                audioBuffer: audioBuffer,
                fileName: fileName,
                fileSize: fileSize,
                videoInfo: videoInfo
            };

            // Register the listener and store session
            ademola.ev.on('messages.upsert', messageListener);
            activeSessions.set(from, sessionData);

        } catch (error) {
            console.error('Main error:', error);
            await reply(`❌ *Unexpected Error!*\n\nSomething went wrong. Please try again later.\n\nError: ${error.message || 'Unknown error'}`);
        }
    }
);