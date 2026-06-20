//---------------------------------------------
//           ADEMOLA-XD SPOTIFY DOWNLOADER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
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
            return await reply(`🎵 *SPOTIFY DOWNLOADER*\n\n❌ Please provide a song name or artist.\n\n*Usage:*\n.spotify <song/artist>\n\n*Examples:*\n.spotify Shape of You\n.spotify Ed Sheeran\n.spotify Blinding Lights The Weeknd`);
        }

        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/search/spotify?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl, { 
            timeout: 20000, 
            headers: { 
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
            } 
        });

        if (!data?.status || !data?.result) {
            return await reply('❌ No results found for your search. Try a different song or artist.');
        }

        const r = data.result;
        const audioUrl = r.audio;
        
        if (!audioUrl) {
            return await reply('❌ No downloadable audio found for this track.');
        }

        // Create song info
        const songInfo = `
🎵 *${r.title || r.name || 'Unknown Title'}*
👤 *Artist:* ${r.artist || 'Unknown'}
⏱ *Duration:* ${r.duration || 'Unknown'}
🔗 *Spotify:* ${r.url ? 'Available' : 'Not available'}

⬇️ *Downloading audio...*
        `.trim();

        // Send song info with thumbnail if available
        if (r.thumbnails) {
            await ademola.sendMessage(from, { 
                image: { url: r.thumbnails }, 
                caption: songInfo 
            }, { quoted: fakevCard });
        } else {
            await reply(songInfo);
        }

        // Send audio file
        const fileName = `${(r.title || r.name || 'spotify_track').replace(/[\\/:*?"<>|]/g, '_')}.mp3`;
        
        await ademola.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: fileName
        }, { quoted: fakevCard });

        // Success confirmation
        await reply(`✅ *Download Complete!*\n\n📁 ${fileName}\n🎵 Enjoy your music!`);

    } catch (error) {
        console.error('❌ Spotify error:', error);
        await reply(`❌ Failed to download from Spotify.\n\nError: ${error.message}\n\nPlease try a different search query.`);
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
• .spotify Shape of You
• .spotify Ed Sheeran
• .spotify Blinding Lights The Weeknd
• .spotify Bad Guy Billie Eilish

*Features:*
✅ High quality audio
✅ Song metadata
✅ Album artwork
✅ Fast downloads

*Note:*
Searches Spotify's extensive music library.
Works with song titles, artists, or keywords.
    `.trim();

    await reply(helpText);
});

//---------------------------------------------
//           CODE BY ADEMOLA KING
//---------------------------------------------