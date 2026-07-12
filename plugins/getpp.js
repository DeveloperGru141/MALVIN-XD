const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

ademola({
    pattern: "getpp",
    alias: ["getprofile", "profilepic"],
    desc: "Get user's profile picture (Owner only)",
    category: "owner",
    react: "🖼️",
    use: ".getpp @user or reply to user's message",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        // Check if user is owner (using your framework's isOwner function)
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        
        if (!isOwner) {
            return await reply('😡 Command only for the owner.');
        }

        let userToAnalyze;
        
        // Check for mentioned users
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToAnalyze = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToAnalyze = mek.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToAnalyze) {
            return await reply('Please mention someone or reply to their message to get their profile picture🫴');
        }

        try {
            // Get user's profile picture
            let profilePic;
            try {
                profilePic = await ademola.profilePictureUrl(userToAnalyze, 'image');
            } catch {
                profilePic = ''; // Default image
            }

            // Send the profile picture to the chat
            await ademola.sendMessage(from, {
                image: { url: profilePic },
                caption: `\n\n _💙 hey 👋 Success in getting profile of: @${userToAnalyze.split('@')[0]} ✅._`,
                mentions: [userToAnalyze]
            }, {
                quoted: fakevCard
            });

        } catch (error) {
            console.error('⚠️ Error in getpp command:', error);
            await reply('🚯 Failed to retrieve profile picture. The user might not have one set.');
        }
    } catch (error) {
        console.error('⚠️ Unexpected error in getpp command:', error);
        await reply('❌ An unexpected error occurred.');
    }
});