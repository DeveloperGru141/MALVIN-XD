//---------------------------------------------
//           ADEMOLA-XD SONG DOWNLOADER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

ademola({
    pattern: "play",
    alias: ["music"],
    desc: "Download songs from YouTube",
    category: "download",
    react: "🎵",
    use: ".play <song name or YouTube link>",
    filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return await reply(`🎵 *SONG DOWNLOADER*\n\nUsage: .play <song name or YouTube link>\n\nExamples:\n.play shape of you\n.play https://youtu.be/ABC123`);
        }

        let video;
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            video = { url: q };
        } else {
            const search = await yts(q);
            if (!search?.videos?.length) {
                return await reply('❌ No results found for your search.');
            }
            video = search.videos[0];
        }

        // Show song info
        await ademola.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: `🎵 *${video.title}*\n⏱ ${video.timestamp}\n\n⬇️ Downloading...`
        }, { quoted: fakevCard });

        let audioUrl;

        try {
            const info = await ytdl.getInfo(video.url);
            const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
            audioUrl = format?.url;
        } catch (e) {
            console.error('ytdl-core failed:', e.message);
        }

        if (!audioUrl) {
            return await reply('❌ Failed to get download link. Try again later.');
        }

        // Send audio
        const fileName = `${video.title.replace(/[<>:"\/\\|?*]/g, '')}.mp3`;
        
        await ademola.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: fileName
        }, { quoted: fakevCard });

        await reply(`✅ Downloaded: ${video.title}`);

    } catch (error) {
        await reply('❌ Failed to download song. Try again.');
    }
});