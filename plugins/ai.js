
const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

async function askAI(prompt, model = 'openai', system = 'You are a helpful AI assistant.') {
    const models = [...new Set([model, 'openai', 'mistral'])];
    let lastErr;

    for (const m of models) {
        try {
            const { data } = await axios.post('https://text.pollinations.ai/', {
                messages: [
                    { role: 'system', content: system.slice(0, 1000) },
                    { role: 'user', content: prompt.slice(0, 2000) }
                ],
                model: m
            }, { timeout: 30000 });

            let text = '';
            if (typeof data === 'string') text = data;
            else if (data?.choices?.[0]?.message?.content) text = data.choices[0].message.content;
            else if (data?.output) text = data.output;
            else if (data?.response) text = data.response;
            else if (data?.text) text = data.text;

            if (text.trim()) return text.trim();
        } catch (e) { lastErr = e; }
    }

    try {
        const hfToken = process.env.HUGGINGFACE_API_KEY || '';
        const headers = { 'Content-Type': 'application/json' };
        if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;
        const { data } = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
            { inputs: `[INST] ${system}\n\n${prompt} [/INST]` },
            { headers, timeout: 45000 }
        );
        const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
        if (text?.trim()) return text.trim();
    } catch (e) { lastErr = e; }

    throw lastErr || new Error('All AI models are currently unavailable.');
}

// Claude
ademola({
    pattern: "claude",
    alias: ["claudeai", "anthropic"],
    desc: "Claude-style AI (by Anthropic)",
    category: "ai",
    react: "🤖",
    use: ".claude <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply('Please provide a question.\n\nExample: .claude explain quantum computing');
        await reply('_🤖 Asking Claude... Please wait._');
        const answer = await askAI(q, 'openai', 'You are Claude, an AI assistant created by Anthropic. Be thoughtful, nuanced, and conversational in your responses.');
        await ademola.sendMessage(from, {
            text: `🤖 *Claude Response:*\n\n${answer}\n\n👤 *Asked by:* @${sender.split('@')[0]}`,
            mentions: [sender],
            contextInfo: { mentionedJid: [sender], quotedMessage: mek.message }
        }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error:', error);
        await reply('❌ Failed to get response.');
    }
});

// Llama
ademola({
    pattern: "llama",
    alias: ["llamaai", "metaai"],
    desc: "Llama-style AI (by Meta)",
    category: "ai",
    react: "🦙",
    use: ".llama <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply('Please provide a question.\n\nExample: .llama explain machine learning');
        await reply('_🦙 Asking Llama... Please wait._');
        const answer = await askAI(q, 'openai', 'You are Llama, an AI model created by Meta AI. Be helpful, detailed, and precise in your responses.');
        await ademola.sendMessage(from, {
            text: `🦙 *Llama Response:*\n\n${answer}\n\n👤 *Asked by:* @${sender.split('@')[0]}`,
            mentions: [sender],
            contextInfo: { mentionedJid: [sender], quotedMessage: mek.message }
        }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error:', error);
        await reply('❌ Failed to get response.');
    }
});

// Copilot
ademola({
    pattern: "copilot",
    alias: ["msai", "microsoftai", "bingai"],
    desc: "Chat with Microsoft Copilot AI",
    category: "ai",
    react: "🤖",
    use: ".copilot <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply('Please provide a question.\n\nExample: .copilot explain quantum computing');
        await reply('_🤖 Consulting Microsoft Copilot... Please wait._');
        const answer = await askAI(q, 'openai', 'You are Microsoft Copilot. Provide clear, concise, accurate answers.');
        await ademola.sendMessage(from, {
            text: `🤖 *Copilot Response:*\n\n${answer}\n\n👤 *Asked by:* @${sender.split('@')[0]}`,
            mentions: [sender],
            contextInfo: { mentionedJid: [sender], quotedMessage: mek.message }
        }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error:', error);
        await reply('❌ Failed to get response.');
    }
});

// Deep Think
ademola({
    pattern: "think",
    alias: ["deepthink", "deepai"],
    desc: "Deep reasoning mode",
    category: "ai",
    react: "🧠",
    use: ".think <your complex question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply('Please provide a complex question.\n\nExample: .think analyze the ethics of AI');
        await reply('_🧠 Processing deep analysis... Please wait._');
        const answer = await askAI(q, 'mistral', 'You are a deep reasoning AI. Provide thorough analysis with multiple perspectives and step-by-step reasoning.');
        await ademola.sendMessage(from, {
            text: `🧠 *Deep Analysis:*\n\n${answer}\n\n👤 *Requested by:* @${sender.split('@')[0]}`,
            mentions: [sender],
            contextInfo: { mentionedJid: [sender], quotedMessage: mek.message }
        }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error:', error);
        await reply('❌ Failed to get response.');
    }
});

// GPT
ademola({
    pattern: "gpt",
    alias: ["ai", "chatgpt"],
    desc: "ChatGPT AI response",
    category: "ai",
    react: "🤖",
    use: ".gpt <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a question.\n\nExample: .gpt write html code");
        await reply('_🤖 Getting response... Please wait._');
        const answer = await askAI(q, 'openai');
        await ademola.sendMessage(from, { text: `🤖 *AI Response:*\n\n${answer}` }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error:', error);
        await reply("❌ Failed to get response.");
    }
});

// Gemini
ademola({
    pattern: "gemini",
    alias: ["googleai"],
    desc: "Google Gemini AI response",
    category: "ai",
    react: "🤖",
    use: ".gemini <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a question.\n\nExample: .gemini explain quantum physics");
        await reply('_🤖 Getting Gemini response... Please wait._');
        const answer = await askAI(q, 'openai', 'You are Google Gemini, an AI by Google. Provide informative, well-structured responses.');
        await ademola.sendMessage(from, { text: `🤖 *Gemini Response:*\n\n${answer}` }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error:', error);
        await reply("❌ Failed to get response.");
    }
});

// Venice
ademola({
    pattern: "venice",
    alias: ["veniceai"],
    desc: "Venice AI response",
    category: "ai",
    react: "🤖",
    use: ".venice <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a question.\n\nExample: .venice explain privacy in AI");
        await reply('_🤖 Getting Venice AI response... Please wait._');
        const answer = await askAI(q, 'mistral', 'You are Venice AI, a privacy-focused assistant. Provide thoughtful responses with privacy in mind.');
        await ademola.sendMessage(from, { text: `🤖 *Venice AI Response:*\n\n${answer}` }, { quoted: fakevCard });
    } catch (error) {
        console.error('Error:', error);
        await reply("❌ Failed to get response.");
    }
});
