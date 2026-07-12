const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

const MODELS = {
    flux: { label: 'Flux', desc: 'Top-tier general (Black Forest Labs)' },
    'flux-realism': { label: 'Flux Realism', desc: 'Photorealistic (Flux fine-tune)' },
    'flux-anime': { label: 'Flux Anime', desc: 'Anime style (Flux fine-tune)' },
    midjourney: { label: 'Midjourney', desc: 'Artistic / cinematic style (approximated via Flux)' },
    'any-dark': { label: 'Dark', desc: 'Dark aesthetic' },
    '3d': { label: '3D', desc: '3D render style' },
};

async function generateImage(prompt, model = 'flux', width = 1024, height = 1024) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 });
    return Buffer.from(res.data);
}

function parseOptions(text) {
    let model = 'flux';
    let width = 1024;
    let height = 1024;
    let prompt = text;

    const modelMatch = text.match(/--model\s+(\S+)|-m\s+(\S+)/i);
    if (modelMatch) {
        const m = modelMatch[1] || modelMatch[2];
        if (MODELS[m]) model = m;
        prompt = prompt.replace(modelMatch[0], '').trim();
    }

    const sizeMatch = text.match(/--size\s+(\d+)x(\d+)|-s\s+(\d+)x(\d+)/i);
    if (sizeMatch) {
        width = parseInt(sizeMatch[1] || sizeMatch[3]);
        height = parseInt(sizeMatch[2] || sizeMatch[4]);
        prompt = prompt.replace(sizeMatch[0], '').trim();
    }

    return { prompt, model, width, height };
}

ademola({
    pattern: "creart",
    alias: ["createart", "art", "aiart", "imagine", "flux"],
    desc: "Generate AI images using Flux & Midjourney",
    category: "ai",
    react: "🎨",
    use: ".creart <prompt> [--model flux-realism|midjourney] [--size 1024x1024]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            const modelsHelp = Object.entries(MODELS)
                .map(([k, v]) => `• \`${k}\` — ${v.desc}`).join('\n');
            return reply(`🎨 *AI Image Generator*\n\nUsage: .creart <prompt> [options]\n\n*Options:*\n• \`--model <name>\` or \`-m <name>\`\n• \`--size WxH\` or \`-s WxH\` (max 2048)\n\n*Models:*\n${modelsHelp}\n\n*Examples:*\n.creart a cyberpunk cat\n.creart cinematic cityscape -m midjourney\n.creart photorealistic lion -m flux-realism`);
        }

        const { prompt, model, width, height } = parseOptions(q);
        let imageBuffer;
        let usedModel = model;

        await reply(`_🎨 Generating with ${MODELS[model].label}... Please wait._`);

        const actualModel = (model === 'midjourney') ? 'flux-realism' : model;
        imageBuffer = await generateImage(prompt, actualModel, width, height);
        usedModel = actualModel;

        await ademola.sendMessage(from, {
            image: imageBuffer,
            caption: `🎨 *${MODELS[usedModel].label}*\n📝 ${prompt}\n👤 @${sender.split('@')[0]}`,
            mentions: [sender]
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in creart command:', error);
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. Try a simpler prompt or different model.');
        } else {
            await reply('❌ Failed to generate image. Please try again later.');
        }
    }
});