
const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

// Microsoft Copilot Command
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
        if (!q) {
            return reply('Please provide a question for Microsoft Copilot.\n\nExample: .copilot explain quantum computing in simple terms');
        }

        await reply('_🤖 Consulting with Microsoft Copilot... Please wait._');

        const response = await axios.get(`https://ademola-api.vercel.app/ai/copilot?text=${encodeURIComponent(q)}`);
        
        if (response.data && response.data.result) {
            const answer = response.data.result;
            
            await ademola.sendMessage(from, {
                text: `🤖 *Microsoft Copilot Response:*\n\n${answer}\n\n👤 *Asked by:* @${sender.split('@')[0]}`,
                mentions: [sender],
                contextInfo: {
                    mentionedJid: [sender],
                    quotedMessage: mek.message
                }
            }, {
                quoted: fakevCard
            });
        } else {
            throw new Error('Invalid response from Copilot API');
        }

    } catch (error) {
        console.error('Error in copilot command:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. Copilot is taking too long to respond. Please try again.');
        } else if (error.response?.status === 429) {
            await reply('❌ Rate limit exceeded. Please wait a few minutes before asking another question.');
        } else {
            await reply('❌ Failed to get response from Microsoft Copilot. Please try again later.');
        }
    }
});

// Microsoft Copilot Deep Thinking Command
ademola({
    pattern: "think",
    alias: ["deepthink", "copilotthink", "deepai"],
    desc: "Deep thinking mode with Microsoft Copilot",
    category: "ai",
    react: "🧠",
    use: ".think <your complex question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return reply('Please provide a complex question for deep thinking mode.\n\nExample: .think analyze the ethical implications of artificial intelligence in healthcare');
        }

        await reply('_🧠 Microsoft Copilot is thinking deeply... This may take a moment._');

        const response = await axios.get(`https://ademola-api.vercel.app/ai/copilot-think?text=${encodeURIComponent(q)}`);
        
        if (response.data && response.data.result) {
            const answer = response.data.result;
            
            await ademola.sendMessage(from, {
                text: `🧠 *Microsoft Copilot - Deep Thinking:*\n\n${answer}\n\n💭 *Deep analysis completed*\n👤 *Requested by:* @${sender.split('@')[0]}`,
                mentions: [sender],
                contextInfo: {
                    mentionedJid: [sender],
                    quotedMessage: mek.message
                }
            }, {
                quoted: fakevCard
            });
        } else {
            throw new Error('Invalid response from Copilot Deep Thinking API');
        }

    } catch (error) {
        console.error('Error in think command:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. Deep thinking is taking longer than expected. Please try again.');
        } else if (error.response?.status === 429) {
            await reply('❌ Rate limit exceeded. Please wait before another deep thinking request.');
        } else {
            await reply('❌ Failed to get deep thinking response. Please try again later.');
        }
    }
});

// Microsoft Copilot GPT-5 Command
ademola({
    pattern: "gpt5",
    alias: ["gpt5", "copilotgpt5", "msgpt5"],
    desc: "Advanced GPT-5 mode with Microsoft Copilot",
    category: "ai",
    react: "🚀",
    use: ".gpt5 <your advanced question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return reply('Please provide an advanced question for GPT-5 mode.\n\nExample: .gpt5 explain the potential applications of quantum machine learning in drug discovery');
        }

        await reply('_🚀 Engaging GPT-5 advanced mode... Please wait._');

        const response = await axios.get(`https://ademola-api.vercel.app/ai/gpt-5?text=${encodeURIComponent(q)}`);
        
        if (response.data && response.data.result) {
            const answer = response.data.result;
            
            await ademola.sendMessage(from, {
                text: `🚀 *Microsoft Copilot - GPT-5 Advanced:*\n\n${answer}\n\n⚡ *Powered by GPT-5 Technology*\n👤 *Requested by:* @${sender.split('@')[0]}`,
                mentions: [sender],
                contextInfo: {
                    mentionedJid: [sender],
                    quotedMessage: mek.message
                }
            }, {
                quoted: fakevCard
            });
        } else {
            throw new Error('Invalid response from GPT-5 API');
        }

    } catch (error) {
        console.error('Error in gpt5 command:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. GPT-5 processing is taking longer than expected. Please try again.');
        } else if (error.response?.status === 429) {
            await reply('❌ Rate limit exceeded. Please wait before another GPT-5 request.');
        } else {
            await reply('❌ Failed to get GPT-5 response. Please try again later.');
        }
    }
});


ademola({
    pattern: "gpt",
    alias: ["ai", "chatgpt"],
    desc: "Get AI response from ChatGPT",
    category: "ai",
    react: "🤖",
    use: ".gpt <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("Please provide a question after .gpt\n\nExample: .gpt write a basic html code");
        }

        // Use Ademola API for GPT
        const response = await axios.get(`https://ademola-api.vercel.app/ai/openai?text=${encodeURIComponent(q)}`);
        
        if (response.data && response.data.result) {
            const answer = response.data.result;
            
            await ademola.sendMessage(from, {
                text: `🤖 *ChatGPT Response:*\n\n${answer}`,
                contextInfo: {
                    mentionedJid: [m.sender],
                    quotedMessage: mek.message
                }
            }, {
                quoted: fakevCard
            });
        } else {
            throw new Error('Invalid response from API');
        }
    } catch (error) {
        console.error('GPT Error:', error);
        await reply("❌ Failed to get GPT response. Please try again later.");
    }
});

ademola({
    pattern: "gemini",
    alias: ["googleai"],
    desc: "Get AI response from Gemini",
    category: "ai",
    react: "🤖", 
    use: ".gemini <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("Please provide a question after .gemini");
        }

        // Use Ademola API for Gemini (Venice)
        const response = await axios.get(`https://ademola-api.vercel.app/ai/venice?text=${encodeURIComponent(q)}`);
        
        if (response.data && response.data.result) {
            const answer = response.data.result;
            
            await ademola.sendMessage(from, {
                text: `🤖 *Gemini Response:*\n\n${answer}`,
                contextInfo: {
                    mentionedJid: [m.sender],
                    quotedMessage: mek.message
                }
            }, {
                quoted: fakevCard
            });
        } else {
            throw new Error('Invalid response from API');
        }
    } catch (error) {
        console.error('Gemini Error:', error);
        await reply("❌ Failed to get Gemini response. Please try again later.");
    }
});

ademola({
    pattern: "venice",
    alias: ["veniceai"],
    desc: "Get AI response from Venice AI",
    category: "ai",
    react: "🤖",
    use: ".venice <your question>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("Please provide a question after .venice");
        }

        // Use Ademola API for Venice AI
        const response = await axios.get(`https://ademola-api.vercel.app/ai/venice?text=${encodeURIComponent(q)}`);
        
        if (response.data && response.data.result) {
            const answer = response.data.result;
            
            await ademola.sendMessage(from, {
                text: `🤖 *Venice AI Response:*\n\n${answer}`,
                contextInfo: {
                    mentionedJid: [m.sender],
                    quotedMessage: mek.message
                }
            }, {
                quoted: fakevCard
            });
        } else {
            throw new Error('Invalid response from Venice API');
        }
    } catch (error) {
        console.error('Venice AI Error:', error);
        await reply("❌ Failed to get Venice AI response. Please try again later.");
    }
});