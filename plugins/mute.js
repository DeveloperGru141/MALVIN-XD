const { ademola, fakevCard } = require("../ademola");

ademola({
    pattern: "mute",
    alias: ["mutechat", "silence"],
    desc: "Mute group chat (with optional duration)",
    category: "group",
    react: "🔇",
    use: ".mute [duration in minutes]",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        if (!isGroup) {
            return await reply('❌ This command can only be used in groups!');
        }

        const adminStatus = await isAdmin();
        
        if (!adminStatus.isBotAdmin) {
            return await reply('❌ Error: Please make the bot an admin first to use this command.');
        }

        if (!adminStatus.isSenderAdmin) {
            return await reply('❌ Error: Only group admins can use the mute command.');
        }

        // Parse duration from arguments
        let durationInMinutes = 0;
        if (text && !isNaN(parseInt(text))) {
            durationInMinutes = parseInt(text);
        }

        // Mute the group
        await ademola.groupSettingUpdate(from, 'announcement');
        
        if (durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            await reply(`🔇 Group has been muted for ${durationInMinutes} minutes.`);
            
            // Set timeout to automatically unmute after duration
            setTimeout(async () => {
                try {
                    await ademola.groupSettingUpdate(from, 'not_announcement');
                    await ademola.sendMessage(from, { 
                        text: '🔊 Group has been automatically unmuted!' 
                    });
                } catch (unmuteError) {
                    console.error('Error auto-unmuting group:', unmuteError);
                }
            }, durationInMilliseconds);
        } else {
            await reply('🔇 Group has been muted indefinitely! Use .unmute to unmute.');
        }
        
    } catch (error) {
        console.error('Error in mute command:', error);
        await reply('❌ Failed to mute group. Make sure the bot is admin and has sufficient permissions.');
    }
});