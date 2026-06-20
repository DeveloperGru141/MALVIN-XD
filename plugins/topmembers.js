const { ademola, fakevCard } = require("../ademola");
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data', 'messageCount.json');

function loadMessageCounts() {
    if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath);
        return JSON.parse(data);
    }
    return {};
}

function saveMessageCounts(messageCounts) {
    fs.writeFileSync(dataFilePath, JSON.stringify(messageCounts, null, 2));
}

function incrementMessageCount(groupId, userId) {
    const messageCounts = loadMessageCounts();

    if (!messageCounts[groupId]) {
        messageCounts[groupId] = {};
    }

    if (!messageCounts[groupId][userId]) {
        messageCounts[groupId][userId] = 0;
    }

    messageCounts[groupId][userId] += 1;

    saveMessageCounts(messageCounts);
}

ademola({
    pattern: "top",
    alias: ["topmembers", "leaderboard"],
    desc: "Show top active members in the group",
    category: "group",
    react: "🏆",
    use: ".top",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command is only available in group chats.');
        }

        const messageCounts = loadMessageCounts();
        const groupCounts = messageCounts[from] || {};

        const sortedMembers = Object.entries(groupCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10); // Get top 10 members

        if (sortedMembers.length === 0) {
            return await reply('📊 No message activity recorded yet in this group.');
        }

        let message = `🏆 *TOP ${sortedMembers.length} ACTIVE MEMBERS*\n\n`;
        
        sortedMembers.forEach(([userId, count], index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = index < 3 ? medals[index] : `${index + 1}.`;
            message += `${medal} @${userId.split('@')[0]} - ${count} messages\n`;
        });

        message += `\n📊 *Total tracked messages:* ${Object.values(groupCounts).reduce((a, b) => a + b, 0)}`;
        message += `\n👥 *Group members tracked:* ${Object.keys(groupCounts).length}`;
        
        await ademola.sendMessage(from, { 
            text: message, 
            mentions: sortedMembers.map(([userId]) => userId) 
        }, {
            quoted: fakevCard
        });
        
    } catch (error) {
        console.error('Error in top command:', error);
        await reply('❌ Failed to generate leaderboard.');
    }
});

// Export the increment function for use in main handler
module.exports = { incrementMessageCount };