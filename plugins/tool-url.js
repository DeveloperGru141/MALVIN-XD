const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { ademola, fakevCard } = require("../ademola");
const { channelInfo } = require('../lib/messageConfig');

// Utility function to format bytes
function formatBytes(bytes) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

const API_KEYS = [
  process.env.IMGBB_API_KEY_1,
  process.env.IMGBB_API_KEY_2,
  process.env.IMGBB_API_KEY_3,
  process.env.IMGBB_API_KEY_4
].filter(Boolean);

ademola({
  pattern: "tourl2",
  alias: ["imgtourl2", "imgurl2", "url2", "geturl2", "upload"],
  react: "📤",
  desc: "Upload media to Catbox and return a direct URL.",
  category: "utility",
  use: ".tourl2 (reply to media)",
  filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
  try {
    if (!m.quoted) {
      return reply("❌ Reply to image, audio or video.");
    }

    const quoted = m.quoted;
    const mime = quoted.mimetype || "";
    
    if (!mime) {
      return reply("❌ Reply to image, audio or video.");
    }

    await reply('📤 Uploading to Catbox...');

    // Download the media
    let buffer;
    try {
      // Try using downloadContentFromMessage first
      const messageType = quoted.mtype?.replace('Message', '') || 'image';
      const stream = await downloadContentFromMessage(quoted.msg || quoted, messageType);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } catch (downloadError) {
      // Fallback to quoted.download()
      try {
        buffer = await quoted.download();
      } catch (fallbackError) {
        throw new Error(`Failed to download media: ${fallbackError.message}`);
      }
    }

    if (!buffer || buffer.length === 0) {
      throw new Error("Downloaded media is empty");
    }

    // Determine file extension
    const ext = mime.includes("image/jpeg") ? ".jpg" :
                mime.includes("png") ? ".png" :
                mime.includes("video") ? ".mp4" :
                mime.includes("audio") ? ".mp3" : ".bin";
    
    const name = `ademola-upload${ext}`;
    const tmp = path.join(os.tmpdir(), `catbox_${Date.now()}${ext}`);
    
    // Write to temporary file
    fs.writeFileSync(tmp, buffer);

    // Upload to Catbox
    const form = new FormData();
    form.append("fileToUpload", fs.createReadStream(tmp), name);
    form.append("reqtype", "fileupload");

    const res = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    if (!res.data || res.data.includes('error')) {
      throw new Error("Upload failed: " + (res.data || 'No response'));
    }

    // Clean up temporary file
    fs.unlinkSync(tmp);

    // Determine media type for display
    const type = mime.includes("image") ? "Image" :
                 mime.includes("video") ? "Video" :
                 mime.includes("audio") ? "Audio" : "File";

    const message = `
*✅ ${type} Uploaded!*

📁 *Size:* ${formatBytes(buffer.length)}
🔗 *URL:* ${res.data}

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀᴅᴇᴍᴏʟᴀ-xᴅ
    `.trim();

    await ademola.sendMessage(from, {
      text: message,
      ...channelInfo
    }, {
      quoted: fakevCard
    });

  } catch (error) {
    console.error("tourl2 error:", error);
    
    // Clean up temp file if it exists
    try {
      const tmpFiles = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('catbox_'));
      tmpFiles.forEach(file => {
        try {
          fs.unlinkSync(path.join(os.tmpdir(), file));
        } catch (e) { console.error('Cleanup error:', e); }
      });
    } catch (cleanupError) { console.error('Cleanup error:', cleanupError); }
    
    await reply(`❌ ${error.message || error}`);
  }
});


ademola({
  pattern: "tourl",
  alias: ["imgtourl", "imgurl", "url", "uploadimg"],
  react: "🔄",
  desc: "Convert an image to a URL using ImgBB.",
  category: "utility",
  use: ".tourl (reply to an image)",
  filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
  try {
    if (!m.quoted) {
      return reply("*[❗] Please reply to an image*");
    }

    const quoted = m.quoted;
    
    if (!quoted.mtype || !quoted.mtype.includes("image")) {
      return reply("*[❗] Oops! Please reply to an image*");
    }

    await reply('🔄 Uploading image to ImgBB...');

    // Download the image
    let buffer;
    try {
      const stream = await downloadContentFromMessage(quoted.msg || quoted, 'image');
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }

    if (!buffer || buffer.length === 0) {
      throw new Error("Downloaded image is empty");
    }

    // Determine file extension based on MIME type
    let extension = ".jpg";
    const mime = quoted.mimetype || "";
    if (mime.includes("png")) extension = ".png";
    else if (mime.includes("gif")) extension = ".gif";
    else if (mime.includes("webp")) extension = ".webp";

    const fileName = `ademola-xd${extension}`;
    const filePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(filePath, buffer);

    let imageUrl, lastError;
    
    // Try each API key until one works
    for (const apiKey of API_KEYS) {
      try {
        const form = new FormData();
        form.append("image", buffer.toString('base64'));
        
        const res = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, form, {
          headers: form.getHeaders()
        });

        if (res.data?.data?.url) {
          imageUrl = res.data.data.url;
          break;
        } else {
          throw new Error("No URL in response");
        }
      } catch (err) {
        lastError = err;
        console.error(`ImgBB key failed [${apiKey.substring(0, 8)}...]:`, err.message);
        continue;
      }
    }

    // Clean up temp file
    try {
      fs.unlinkSync(filePath);
    } catch (e) { console.error('Cleanup error:', e); }

    if (!imageUrl) {
      throw new Error(lastError?.message || "All ImgBB API keys failed");
    }

    const message = `
✅ *IMAGE UPLOADED SUCCESSFULLY!*

📂 *File Size:* ${formatBytes(buffer.length)}
🔗 *URL:* ${imageUrl}

👤 *Uploaded by:* @${sender.split('@')[0]}
    `.trim();

    await ademola.sendMessage(from, {
      text: message,
      mentions: [sender],
      ...channelInfo
    }, {
      quoted: fakevCard
    });

  } catch (error) {
    console.error("tourl error:", error);
    
    // Clean up temp files
    try {
      const tmpFiles = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('ademola-xd'));
      tmpFiles.forEach(file => {
        try {
          fs.unlinkSync(path.join(os.tmpdir(), file));
        } catch (e) { console.error('Cleanup error:', e); }
      });
    } catch (cleanupError) { console.error('Cleanup error:', cleanupError); }
    
    reply(`❌ Error: ${error.message || error}`);
  }
});

ademola({
  pattern: "docanalyze",
  alias: ["analyzedoc", "docai", "askdoc"],
  react: "📄",
  desc: "Upload document and ask AI about its contents.",
  category: "utility",
  use: ".docanalyze [your question] [reply to doc]",
  filename: __filename
}, async (ademola, mek, m, { from, q, reply, sender }) => {
  try {
    if (!m.quoted) {
      return reply("❌ Reply to a PDF or Word document.");
    }

    const quoted = m.quoted;
    const mimeType = quoted.mtype;
    
    if (!mimeType || mimeType !== "document") {
      return reply("❌ Reply to a PDF or Word document.");
    }

    const question = q || "Summarize this document";
    
    await reply('📄 Uploading document and analyzing with AI...');

    // Download the document
    let buffer;
    try {
      const stream = await downloadContentFromMessage(quoted.msg || quoted, 'document');
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Failed to download document: ${error.message}`);
    }

    if (!buffer || buffer.length === 0) {
      throw new Error("Downloaded document is empty");
    }

    const originalFileName = quoted.filename || "document.pdf";
    const ext = path.extname(originalFileName) || ".pdf";
    const fileName = `ademola-doc-${Date.now()}${ext}`;
    const tmp = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tmp, buffer);

    // Upload to Catbox first
    const form = new FormData();
    form.append("fileToUpload", fs.createReadStream(tmp), fileName);
    form.append("reqtype", "fileupload");

    const catboxRes = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    if (!catboxRes.data) throw new Error("Catbox upload failed.");
    
    // Clean up temp file
    fs.unlinkSync(tmp);

    const docUrl = catboxRes.data;
    
    let aiResponse;

    try {
      const { data } = await axios.post('https://text.pollinations.ai/', {
        messages: [
          { role: 'system', content: 'You are a document analysis AI. Analyze documents and answer questions about them. Be concise and accurate.' },
          { role: 'user', content: `Document URL: ${docUrl}\n\nQuestion: ${question}` }
        ],
        model: 'openai'
      }, { timeout: 30000 });
      aiResponse = data?.choices?.[0]?.message?.content || (typeof data === 'string' ? data.trim() : 'Analysis completed.');
    } catch {
      try {
        const { data: mistralData } = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: `Document: ${docUrl}\nQ: ${question}\n\nAnalyze:` }],
          model: 'mistral'
        }, { timeout: 30000 });
        aiResponse = mistralData?.choices?.[0]?.message?.content || (typeof mistralData === 'string' ? mistralData.trim() : 'Analysis completed.');
      } catch {
        try {
          const hfToken = process.env.HUGGINGFACE_API_KEY || '';
          const headers = { 'Content-Type': 'application/json' };
          if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;
          const { data: hfData } = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
            { inputs: `[INST] Document URL: ${docUrl}\n\nQuestion: ${question}\n\nAnalyze this document: [/INST]` },
            { headers, timeout: 45000 }
          );
          aiResponse = Array.isArray(hfData) ? hfData[0]?.generated_text?.trim() :
            hfData?.generated_text?.trim() || 'Analysis completed.';
        } catch {
          aiResponse = `Document uploaded to ${docUrl}\n\nQuestion: ${question}\n\nI was unable to analyze the document content directly. Please try asking a more specific question.`;
        }
      }
    }

    const message = `
📄 *Document Analysis*

❓ *Question:* ${question}
📁 *Document:* ${fileName}
🔗 *URL:* ${docUrl}

🧠 *AI Response:*
${aiResponse}

👤 *Requested by:* @${sender.split('@')[0]}
    `.trim();

    await ademola.sendMessage(from, {
      text: message,
      mentions: [sender],
      ...channelInfo
    }, {
      quoted: fakevCard
    });

  } catch (error) {
    console.error("docanalyze error:", error);
    
    // Clean up temp files
    try {
      const tmpFiles = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('ademola-doc-'));
      tmpFiles.forEach(file => {
        try {
          fs.unlinkSync(path.join(os.tmpdir(), file));
        } catch (e) { console.error('Cleanup error:', e); }
      });
    } catch (cleanupError) { console.error('Cleanup error:', cleanupError); }
    
    reply(`❌ ${error.message || error}`);
  }
});
