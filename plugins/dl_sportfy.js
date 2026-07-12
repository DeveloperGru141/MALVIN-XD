const { ademola, fakevCard } = require('../ademola');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

ademola({
    pattern: "spotify",
    alias: ["spotifydl", "spoti"],
    desc: "Download songs from Spotify (via YouTube)",
    category: "download",
    react: "🎵",
    use: ".spotify <song/artist>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`🎵 *SPOTIFY DOWNLOADER*\n\n❌ Please provide a song name or artist.\n\n*Examples:*\n.spotify Shape of You\n.spotify Ed Sheeran`);
        }

        await reply('_🔍 Searching YouTube for your track..._');

        const searchResults = await yts(`${q} audio`);
        const videos = searchResults.videos;
        if (!videos || videos.length === 0) {
            return await reply('❌ No results found. Try a different search.');
        }

        const video = videos[0];
        const title = video.title;
        const duration = video.duration.timestamp;
        const artist = video.author?.name || 'Unknown';

        await reply(`_🎵 Found: ${title} - ${artist} (${duration})\n📥 Downloading audio..._`);

        if (video.thumbnail) {
            await ademola.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: `🎵 *${title}*\n👤 *Artist:* ${artist}\n⏱ *Duration:* ${duration}\n\n⬇️ *Downloading audio...*`
            }, { quoted: fakevCard });
        }

        const info = await ytdl.getInfo(video.url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        if (!format || !format.url) {
            return await reply('❌ Failed to get audio stream.');
        }

        const fileName = `${title.replace(/[\\/:*?"<>|]/g, '_')}.mp3`;

        await ademola.sendMessage(from, {
            audio: { url: format.url },
            mimetype: 'audio/mpeg',
            fileName: fileName
        }, { quoted: fakevCard });

        await reply(`✅ *Download Complete!*\n\n📁 ${fileName}\n🎵 Enjoy!`);

    } catch (error) {
        console.error('❌ Song download error:', error);
        await reply(`❌ Failed to download.\n\nError: ${error.message}\n\nTry a different search or try again later.`);
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
