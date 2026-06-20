const axios = require('axios');
const { ademola, fakevCard } = require('../ademola');

// Ademola XD Character Analysis Command
ademola({
    pattern: "character",
    alias: ["char", "analyze", "personality"],
    desc: "Analyze user's character traits",
    category: "fun",
    react: "🔮",
    use: ".character [mention user or reply to message]",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner, isGroup }) => {
    try {
        let userToAnalyze;
        let userName;

        // Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToAnalyze = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToAnalyze = mek.message.extendedTextMessage.contextInfo.participant;
        }
        // Check if sender wants to analyze themselves
        else if (!q || q.toLowerCase().includes('me')) {
            userToAnalyze = mek.key.participant || from;
        }
        // Use sender if no specific user provided
        else {
            userToAnalyze = mek.key.participant || from;
        }

        // Get user's name
        try {
            userName = await ademola.getName(userToAnalyze);
        } catch {
            userName = userToAnalyze.split('@')[0];
        }

        console.log(`🔮 Analyzing character for: ${userName} (${userToAnalyze})`);

        // Comprehensive list of traits
        const traits = [
            "Intelligent", "Creative", "Determined", "Ambitious", "Caring",
            "Charismatic", "Confident", "Empathetic", "Energetic", "Friendly",
            "Generous", "Honest", "Humorous", "Imaginative", "Independent",
            "Intuitive", "Kind", "Logical", "Loyal", "Optimistic",
            "Passionate", "Patient", "Persistent", "Reliable", "Resourceful",
            "Sincere", "Thoughtful", "Understanding", "Versatile", "Wise",
            "Adventurous", "Analytical", "Artistic", "Brave", "Calm",
            "Compassionate", "Curious", "Diplomatic", "Disciplined", "Easygoing",
            "Enthusiastic", "Flexible", "Focused", "Gentle", "Helpful",
            "Innovative", "Insightful", "Motivated", "Observant", "Organized",
            "Perceptive", "Practical", "Proactive", "Resilient", "Responsible",
            "Sensitive", "Spontaneous", "Strategic", "Tactful", "Trustworthy"
        ];

        // Get 5-7 random traits
        const numTraits = Math.floor(Math.random() * 3) + 5; // Random number between 5 and 7
        const selectedTraits = [];
        const usedIndices = new Set();
        
        while (selectedTraits.length < numTraits) {
            const randomIndex = Math.floor(Math.random() * traits.length);
            if (!usedIndices.has(randomIndex)) {
                selectedTraits.push(traits[randomIndex]);
                usedIndices.add(randomIndex);
            }
        }

        // Calculate random percentages for each trait
        const traitPercentages = selectedTraits.map(trait => {
            const basePercentage = Math.floor(Math.random() * 41) + 55; // 55-95%
            const percentage = Math.min(basePercentage, 98); // Cap at 98%
            return { trait, percentage };
        });

        // Sort by percentage (highest first)
        traitPercentages.sort((a, b) => b.percentage - a.percentage);

        // Generate personality type based on traits
        const personalityTypes = [
            "The Visionary Leader", "The Creative Genius", "The Reliable Guardian",
            "The Analytical Thinker", "The Compassionate Helper", "The Adventurous Explorer",
            "The Charismatic Influencer", "The Wise Mentor", "The Innovative Problem-Solver",
            "The Loyal Companion", "The Strategic Planner", "The Energetic Optimist"
        ];
        
        const personalityType = personalityTypes[Math.floor(Math.random() * personalityTypes.length)];

        // Calculate overall rating (weighted average)
        const totalPercentage = traitPercentages.reduce((sum, trait) => sum + trait.percentage, 0);
        const overallRating = Math.round(totalPercentage / traitPercentages.length);

        // Create character analysis message
        const analysis = `🔮 *CHARACTER ANALYSIS REPORT* 🔮\n\n` +
            `👤 *Subject:* ${userName}\n` +
            `⭐ *Personality Type:* ${personalityType}\n\n` +
            `📊 *TRAIT BREAKDOWN:*\n` +
            `${traitPercentages.map(trait => `• ${trait.trait}: ${trait.percentage}%`).join('\n')}\n\n` +
            `🎯 *OVERALL RATING:* ${overallRating}%\n\n` +
            `💫 *Summary:* ${getPersonalitySummary(personalityType, overallRating)}\n\n` +
            `📝 *Note:* This is a fun analysis for entertainment purposes only! ✨`;

        // Try to get profile picture, but don't fail if it doesn't work
        try {
            const profilePic = await ademola.profilePictureUrl(userToAnalyze, 'image');
            console.log(`📸 Profile picture found for ${userName}`);
            
            // Send with profile picture
            await reply(
                { 
                    image: { url: profilePic },
                    caption: analysis,
                    mentions: [userToAnalyze]
                },
                { quoted: fakevCard }
            );
        } catch (picError) {
            console.log(`📸 No profile picture for ${userName}, sending text only`);
            
            // Send without profile picture
            await reply(
                analysis,
                { 
                    mentions: [userToAnalyze],
                    quoted: fakevCard 
                }
            );
        }

        console.log(`✅ Character analysis generated for ${userName}`);

    } catch (error) {
        console.error('Character command error:', error);
        return reply(
            "🔮 *Character Analysis Failed* 🔮\n\n" +
            "The mystical energies are not aligned right now!\n" +
            "But here's a quick insight:\n\n" +
            "✨ You're definitely an amazing person!\n" +
            "⭐ Keep being your wonderful self!",
            { quoted: fakevCard }
        );
    }
});

// Helper function to generate personality summary
function getPersonalitySummary(type, rating) {
    const summaries = {
        "The Visionary Leader": `A natural leader with ${rating}% potential to inspire and guide others toward great achievements.`,
        "The Creative Genius": `Possesses ${rating}% creative energy, bringing innovative ideas and artistic expression to everything.`,
        "The Reliable Guardian": `With ${rating}% reliability, this person is the rock that others can always depend on.`,
        "The Analytical Thinker": `Boasts ${rating}% analytical prowess, solving complex problems with logical precision.`,
        "The Compassionate Helper": `Shows ${rating}% empathy and compassion, always ready to support and care for others.`,
        "The Adventurous Explorer": `Has ${rating}% adventurous spirit, constantly seeking new experiences and challenges.`,
        "The Charismatic Influencer": `Radiates ${rating}% charisma, naturally attracting and influencing people.`,
        "The Wise Mentor": `Demonstrates ${rating}% wisdom, offering valuable guidance based on deep understanding.`,
        "The Innovative Problem-Solver": `Exhibits ${rating}% innovation, finding unique solutions to difficult challenges.`,
        "The Loyal Companion": `Shows ${rating}% loyalty, making them an incredibly trustworthy and devoted friend.`,
        "The Strategic Planner": `Possesses ${rating}% strategic thinking, always planning several steps ahead.`,
        "The Energetic Optimist": `Radiates ${rating}% positive energy, uplifting everyone around them.`
    };
    
    return summaries[type] || `A unique individual with ${rating}% overall character strength and distinctive qualities.`;
}

// Simple character command without profile pictures
ademola({
    pattern: "mychar",
    alias: ["mycharacter", "myanalysis"],
    desc: "Quick analysis of your own character",
    category: "fun",
    react: "🌟",
    use: ".mychar",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    try {
        const userToAnalyze = mek.key.participant || from;
        let userName;
        
        try {
            userName = await ademola.getName(userToAnalyze);
        } catch {
            userName = "You";
        }
        
        // Quick traits for mychar command
        const quickTraits = ["Confident", "Creative", "Friendly", "Intelligent", "Loyal", "Amazing", "Awesome"];
        const selectedTraits = [];
        
        for (let i = 0; i < 3; i++) {
            const randomTrait = quickTraits[Math.floor(Math.random() * quickTraits.length)];
            if (!selectedTraits.includes(randomTrait)) {
                selectedTraits.push(randomTrait);
            }
        }

        const traitText = selectedTraits.map(trait => {
            const percentage = Math.floor(Math.random() * 31) + 70; // 70-100%
            return `• ${trait}: ${percentage}%`;
        }).join('\n');

        const overallRating = Math.floor(Math.random() * 16) + 85; // 85-100%

        const quickAnalysis = `🌟 *QUICK CHARACTER CHECK* 🌟\n\n` +
            `👤 *Analyzing:* ${userName}\n\n` +
            `✨ *Top Traits:*\n${traitText}\n\n` +
            `🎯 *Quick Rating:* ${overallRating}%\n\n` +
            `💫 *Verdict:* Absolutely fantastic personality detected! ✨`;

        await reply(quickAnalysis, { quoted: fakevCard });
        
        console.log(`🌟 Quick character check for ${userName}`);

    } catch (error) {
        console.error('Mychar command error:', error);
        
        // Fallback simple response
        await reply(
            `🌟 *QUICK CHARACTER CHECK* 🌟\n\n` +
            `👤 *Analyzing:* You!\n\n` +
            `✨ *Top Traits:*\n• Amazing: 95%\n• Wonderful: 92%\n• Awesome: 90%\n\n` +
            `🎯 *Quick Rating:* 96%\n\n` +
            `💫 *Verdict:* You're absolutely fantastic! 🌟`,
            { quoted: fakevCard }
        );
    }
});

// Ultra simple character test command
ademola({
    pattern: "chartest",
    alias: ["testchar"],
    desc: "Simple character test",
    category: "fun", 
    react: "🎭",
    use: ".chartest",
    filename: __filename,
}, async (ademola, mek, m, { from, reply }) => {
    try {
        const results = [
            "🎭 *Personality: The Hero* - Brave and determined!",
            "🎭 *Personality: The Sage* - Wise and knowledgeable!",
            "🎭 *Personality: The Explorer* - Adventurous and curious!",
            "🎭 *Personality: The Creator* - Innovative and artistic!",
            "🎭 *Personality: The Caregiver* - Compassionate and nurturing!",
            "🎭 *Personality: The Jester* - Fun-loving and humorous!",
            "🎭 *Personality: The Ruler* - Leadership qualities!",
            "🎭 *Personality: The Lover* - Passionate and romantic!"
        ];
        
        const randomResult = results[Math.floor(Math.random() * results.length)];
        const rating = Math.floor(Math.random() * 21) + 80; // 80-100%
        
        const testResult = `${randomResult}\n\n⭐ *Confidence Level:* ${rating}%\n\n✨ Embrace your unique personality!`;
        
        await reply(testResult, { quoted: fakevCard });
        
    } catch (error) {
        console.error('Chartest error:', error);
        await reply("🎭 *Your Personality:* Absolutely Amazing!\n⭐ *Rating:* 100%\n✨ You're wonderful!", { quoted: fakevCard });
    }
});

module.exports = {};