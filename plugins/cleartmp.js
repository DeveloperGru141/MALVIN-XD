const fs = require('fs');
const path = require('path');

// Function to clear a single directory
function clearDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return { success: false, message: `Directory does not exist: ${dirPath}` };
        }
        const files = fs.readdirSync(dirPath);
        let deletedCount = 0;
        for (const file of files) {
            try {
                const filePath = path.join(dirPath, file);
                const stat = fs.lstatSync(filePath);
                if (stat.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
                }
                deletedCount++;
            } catch (err) {
                // Only log errors
                console.error(`Error deleting file ${file}:`, err);
            }
        }
        return { success: true, message: `Cleared ${deletedCount} files in ${path.basename(dirPath)}`, count: deletedCount };
    } catch (error) {
        console.error('Error in clearDirectory:', error);
        return { success: false, message: `Failed to clear files in ${path.basename(dirPath)}`, error: error.message };
    }
}

// Function to clear both tmp and temp directories
async function clearTmpDirectory() {
    const tmpDir = path.join(process.cwd(), 'tmp');
    const tempDir = path.join(process.cwd(), 'temp');
    const results = [];
    results.push(clearDirectory(tmpDir));
    results.push(clearDirectory(tempDir));
    // Combine results
    const success = results.every(r => r.success);
    const totalDeleted = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const message = results.map(r => r.message).join(' | ');
    return { success, message, count: totalDeleted };
}

// Ademola XD Clear Temp Command
const { ademola, fakevCard } = require('../ademola');

ademola({
    pattern: "cleartmp",
    alias: ["cleartemp", "tmpclear", "cleanup"],
    desc: "Clear temporary files (Owner Only)",
    category: "owner",
    react: "🧹",
    use: ".cleartmp",
    filename: __filename,
}, async (ademola, mek, m, { from, reply, sender }) => {
    try {
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender));
        if (!isOwner) {
            return reply("❌ This command is only available for the bot owner!", { quoted: fakevCard });
        }

        // Send single loading message
        const loadingMsg = await reply("🧹 *Cleaning temporary files...*", { quoted: fakevCard });

        const result = await clearTmpDirectory();
        
        // Update the same message with results
        await ademola.sendMessage(from, {
            text: result.success ? 
                `✅ *TEMP FILES CLEANED*\n\n${result.message}` :
                `❌ *CLEANUP FAILED*\n\n${result.message}`,
            edit: loadingMsg.key
        });

        console.log(`🧹 Manual temp cleanup by ${m.sender}: ${result.count} files`);

    } catch (error) {
        console.error('Error in cleartmp command:', error);
        return reply("❌ Failed to clear temporary files!", { quoted: fakevCard });
    }
});

// Start automatic clearing every 15 minutes
function startAutoClear() {
    console.log('🔄 Starting auto temp cleanup (15 minute intervals)...');
    
    // Run immediately on startup
    setTimeout(async () => {
        const result = await clearTmpDirectory();
        if (result.count > 0) {
            console.log(`🧹 [Auto-Clean] Cleared ${result.count} temp files on startup`);
        }
    }, 5000); // 5 seconds after startup

    // Set interval for every 15 minutes
    setInterval(async () => {
        const result = await clearTmpDirectory();
        if (result.count > 0) {
            console.log(`🧹 [Auto-Clean ${new Date().toLocaleTimeString()}] Cleared ${result.count} temp files`);
        }
    }, 15 * 60 * 1000); // 15 minutes in milliseconds

    // Also clear every hour for safety
    setInterval(async () => {
        const result = await clearTmpDirectory();
        if (result.count > 0) {
            console.log(`🧹 [Hourly-Clean ${new Date().toLocaleTimeString()}] Cleared ${result.count} temp files`);
        }
    }, 60 * 60 * 1000); // 1 hour in milliseconds
}

// Start the automatic clearing
startAutoClear();

module.exports = {
    clearTmpDirectory,
    startAutoClear
};