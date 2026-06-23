//---------------------------------------------
//           ADEMOLA-XD SPOTIFY DOWNLOADER
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');

ademola({
    pattern: "spotify",
    alias: ["spotifydl", "spoti"],
    desc: "Download songs from Spotify",
    category: "download",
    react: "🎵",
    use: ".spotify <song/artist>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`🎵 *SPOTIFY DOWNLOADER*\n\n❌ Please provide a song name or artist.\n\n*Examples:*\n.spotify Shape of You\n.spotify Ed Sheeran`);
        }

        await reply('_🔍 Searching Spotify..._');

        const searchRes = await axios.get(`https://api.fabdl.com/spotify/search?q=${encodeURIComponent(q)}`, {
            timeout: 15000
        });

        const tracks = searchRes.data?.result;
        if (!tracks || tracks.length === 0) {
            return await reply('❌ No results found. Try a different search.');
        }

        const track = tracks[0];
        const trackId = track.id;
        const title = track.name || track.title || 'Unknown';
        const artist = track.artists || 'Unknown';

        await reply(`_🎵 Found: ${title} - ${artist}\n📥 Downloading..._`);

        const dlRes = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-task/${trackId}`, {
            timeout: 15000
        });

        const taskId = dlRes.data?.result?.tid || dlRes.data?.tid;
        if (!taskId) {
            return await reply('❌ Failed to get download link.');
        }

        // Wait for conversion
        await new Promise(r => setTimeout(r, 3000));

        const convertRes = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-progress/${taskId}`, {
            timeout: 15000
        });

        const downloadUrl = convertRes.data?.result?.download_url || convertRes.data?.download_url;
        if (!downloadUrl) {
            return await reply('❌ Conversion failed. Try again.');
        }

        const fullUrl = `https://api.fabdl.com${downloadUrl}`;
        const imageUrl = track.image || track.album_art;

        const songInfo = `🎵 *${title}*\n👤 *Artist:* ${artist}\n\n⬇️ *Downloading audio...*`;

        if (imageUrl) {
            await ademola.sendMessage(from, {
                image: { url: imageUrl },
                caption: songInfo
            }, { quoted: fakevCard });
        } else {
            await reply(songInfo);
        }

        const fileName = `${title.replace(/[\\/:*?"<>|]/g, '_')}.mp3`;

        await ademola.sendMessage(from, {
            audio: { url: fullUrl },
            mimetype: 'audio/mpeg',
            fileName: fileName
        }, { quoted: fakevCard });

        await reply(`✅ *Download Complete!*\n\n📁 ${fileName}\n🎵 Enjoy!`);

    } catch (error) {
        console.error('❌ Spotify error:', error);
        await reply(`❌ Failed to download from Spotify.\n\nError: ${error.message}\n\nTry a different search or try again later.`);
    }
});

// Spotify help command
ademola({
    pattern: "spotifyhelp",
    alias: ["spotihelp"],
    desc: "Show Spotify download help",
    category: "download",
    react: "📖",
    use: ".spotifyhelp",
    filename: __filename
}, async (ademola, mek, m, { from, reply }) => {
    const helpText = `
🎵 *SPOTIFY DOWNLOADER*

*Usage:*
.spotify <song/artist>

*Examples:*
* .spotify Shape of You
* .spotify Ed Sheeran
* .spotify Blinding Lights The Weeknd

*Features:*
High quality audio
Song metadata
Album artwork
Fast downloads
    `.trim();

    await reply(helpText);
});
