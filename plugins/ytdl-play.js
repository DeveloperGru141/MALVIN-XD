//---------------------------------------------
//           ADEMOLA-XD SONG DOWNLOADER
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { ademola, fakevCard } = require('../ademola');
const axios = require('axios');
const yts = require('yt-search');

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

        // Try download APIs
        let audioUrl;
        
        // Try Izumi API first
        try {
            const izumiRes = await axios.get(`https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(video.url)}&format=mp3`);
            audioUrl = izumiRes.data?.result?.download;
        } catch (e) {
            // Try Okatsu API as fallback
            try {
                const okatsuRes = await axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(video.url)}`);
                audioUrl = okatsuRes.data?.dl;
            } catch (e2) {
                return await reply('❌ All download services are busy. Try again later.');
            }
        }

        if (!audioUrl) {
            return await reply('❌ Failed to get download link.');
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