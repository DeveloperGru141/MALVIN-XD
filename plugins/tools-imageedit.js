const { ademola, fakevCard } = require("../ademola");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Common function for image processing
async function processImageEffect(ademola, mek, from, apiEndpoint, effectName, reply) {
    try {
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quotedMsg || mek.message;

        if (!target || !target.imageMessage) {
            return await reply("❌ Please reply to an image to apply the effect");
        }

        // Send processing message
        await reply(`🔄 Applying ${effectName} effect...`);

        // Download image
        let buffer;
        try {
            const stream = await downloadContentFromMessage(target.imageMessage, "image");
            let _buf = Buffer.from([]);
            for await (const chunk of stream) {
                _buf = Buffer.concat([_buf, chunk]);
            }
            buffer = _buf;
        } catch (e) {
            return await reply("❌ Failed to download image");
        }

        // Save to temp file
        const tempFilePath = path.join(os.tmpdir(), `effect_${Date.now()}.jpg`);
        fs.writeFileSync(tempFilePath, buffer);

        // Upload to Catbox
        const form = new FormData();
        form.append("fileToUpload", fs.createReadStream(tempFilePath));
        form.append("reqtype", "fileupload");

        const uploadResponse = await axios.post(
            "https://catbox.moe/user/api.php",
            form,
            { headers: form.getHeaders(), timeout: 30000 }
        );

        const imageUrl = uploadResponse.data;
        fs.unlinkSync(tempFilePath);

        if (!imageUrl || !imageUrl.startsWith('http')) {
            throw new Error("Image upload failed");
        }

        // Apply effect
        const apiUrl = `https://api.popcat.xyz/v2/${apiEndpoint}?image=${encodeURIComponent(imageUrl)}`;
        const response = await axios.get(apiUrl, { 
            responseType: "arraybuffer",
            timeout: 30000 
        });

        const effectBuffer = Buffer.from(response.data, "binary");

        await ademola.sendMessage(
            from,
            {
                image: effectBuffer,
                caption: `🎨 *${effectName.toUpperCase()} Effect Applied*\n\n> © Powered by Ademola King`
            },
            { quoted: fakevCard }
        );

    } catch (error) {
        console.error(`${effectName} effect error:`, error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. The image processing is taking too long.');
        } else if (error.message?.includes('upload failed')) {
            await reply('❌ Failed to upload image. Please try again.');
        } else {
            await reply(`❌ Failed to apply ${effectName} effect: ${error.message}`);
        }
    }
}

// ==================== WANTED EFFECT ====================
ademola({
    pattern: "wanted",
    alias: ["wantedposter"],
    desc: "Create wanted poster effect",
    category: "image",
    react: "📸",
    use: ".wanted (reply to image)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processImageEffect(ademola, mek, from, "wanted", "wanted", reply);
});

// ==================== NOKIA EFFECT ====================
ademola({
    pattern: "nokia",
    alias: ["nokiaframe"],
    desc: "Add Nokia phone frame",
    category: "image", 
    react: "📱",
    use: ".nokia (reply to image)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processImageEffect(ademola, mek, from, "nokia", "nokia", reply);
});

// ==================== JOKE OVERHEAD EFFECT ====================
ademola({
    pattern: "imgjoke",
    alias: ["jokeoverhead"],
    desc: "Add joke overhead effect", 
    category: "image",
    react: "😂",
    use: ".imgjoke (reply to image)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processImageEffect(ademola, mek, from, "jokeoverhead", "joke overhead", reply);
});

// ==================== JAIL EFFECT ====================
ademola({
    pattern: "jail",
    alias: ["jailbars"],
    desc: "Add jail bars effect",
    category: "image",
    react: "🚔", 
    use: ".jail (reply to image)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processImageEffect(ademola, mek, from, "jail", "jail", reply);
});

// ==================== INVERT EFFECT ====================
ademola({
    pattern: "invert",
    alias: ["invertcolors"],
    desc: "Invert image colors",
    category: "image",
    react: "🔄",
    use: ".invert (reply to image)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processImageEffect(ademola, mek, from, "invert", "invert", reply);
});

// ==================== GREYSCALE EFFECT ====================
ademola({
    pattern: "grey",
    alias: ["greyscale", "grayscale"],
    desc: "Convert to greyscale", 
    category: "image",
    react: "⚫",
    use: ".grey (reply to image)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processImageEffect(ademola, mek, from, "greyscale", "greyscale", reply);
});

// ==================== BLUR EFFECT ====================
ademola({
    pattern: "blurimg",
    alias: ["imageblur"],
    desc: "Apply blur effect to image",
    category: "image",
    react: "🔍",
    use: ".blurimg (reply to image)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processImageEffect(ademola, mek, from, "blur", "blur", reply);
});

// ==================== AD EFFECT ====================
ademola({
    pattern: "ad",
    alias: ["adframe", "advertisement"],
    desc: "Add advertisement frame",
    category: "image",
    react: "📺",
    use: ".ad (reply to image)",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    await processImageEffect(ademola, mek, from, "ad", "advertisement", reply);
});