const fs = require('fs');
const path = require('path');
const os = require('os');
const { ademola, fakevCard } = require('../ademola');
const isOwnerOrSudo = require('../lib/index'); // Import owner check

// Ademola XD Clear Session Command - Fixed for Groups
ademola({
    pattern: "clearsession",
    alias: ["clearses", "wipesession", "freshstart"],
    desc: "Clear session files for fresh start (Owner Only)",
    category: "owner",
    react: "🔄",
    use: ".clearsession",
    filename: __filename,
}, async (ademola, mek, m, { from, sender, reply }) => {
    try {
        // Fixed owner check - use the imported function directly
        const isOwner = mek.key.fromMe || (await isOwnerOrSudo(sender));
        
        if (!isOwner) {
            return reply("❌ This command can only be used by the bot owner!", { quoted: fakevCard });
        }

        // Define session directory
        const sessionDir = path.join(__dirname, '../session');

        if (!fs.existsSync(sessionDir)) {
            return reply("❌ Session directory not found!", { quoted: fakevCard });
        }

        let filesCleared = 0;
        let errors = 0;
        let errorDetails = [];

        // Send single loading message that we'll update
        let loadingMessage = await reply("🔍 *Scanning session files...*", { quoted: fakevCard });

        // Function to update the loading message
        const updateLoading = async (text) => {
            try {
                await ademola.sendMessage(from, { 
                    text: text,
                    edit: loadingMessage.key 
                });
            } catch (editError) {
                // If edit fails, just continue (don't spam new messages)
                console.log('Edit failed, continuing silently');
            }
        };

        const files = fs.readdirSync(sessionDir);
        
        // Count files by type
        let appStateSyncCount = 0;
        let preKeyCount = 0;
        let otherFiles = 0;
        let credsFound = false;

        await updateLoading("📊 *Analyzing session files...*");

        for (const file of files) {
            if (file.startsWith('app-state-sync-')) appStateSyncCount++;
            else if (file.startsWith('pre-key-')) preKeyCount++;
            else if (file === 'creds.json') credsFound = true;
            else otherFiles++;
        }

        await updateLoading(
            `📊 *SESSION ANALYSIS*\n\n` +
            `• App state sync: ${appStateSyncCount} files\n` +
            `• Pre-keys: ${preKeyCount} files\n` +
            `• Other files: ${otherFiles} files\n` +
            `• Total: ${files.length} files\n\n` +
            `🔄 Starting cleanup...`
        );

        // Delete files
        let processed = 0;
        const totalFiles = files.length - (credsFound ? 1 : 0);

        for (const file of files) {
            if (file === 'creds.json') {
                processed++;
                continue; // Skip creds.json
            }
            
            try {
                const filePath = path.join(sessionDir, file);
                fs.unlinkSync(filePath);
                filesCleared++;
                processed++;

                // Update progress every 10 files or for large operations
                if (totalFiles > 20 && processed % 10 === 0) {
                    const progress = Math.round((processed / totalFiles) * 100);
                    await updateLoading(
                        `🔄 *Cleaning Session Files*\n\n` +
                        `Progress: ${progress}% (${processed}/${totalFiles})\n` +
                        `Cleared: ${filesCleared} files\n` +
                        `Errors: ${errors}`
                    );
                }
                
            } catch (error) {
                errors++;
                errorDetails.push(`${file}: ${error.message}`);
            }
        }

        // System information
        const systemInfo = {
            platform: os.platform(),
            arch: os.arch(),
            totalMem: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
            freeMem: Math.round(os.freemem() / (1024 * 1024 * 1024)),
            uptime: Math.round(os.uptime() / 60)
        };

        // Final completion message
        const completionMessage = 
            `✅ *SESSION CLEANUP COMPLETE!*\n\n` +
            `📊 *Results:*\n` +
            `• Files cleared: ${filesCleared}\n` +
            `• Errors: ${errors}\n` +
            `• Credentials: ${credsFound ? '✅ Preserved' : '❌ Missing'}\n\n` +
            `💾 *File Types:*\n` +
            `• App state sync: ${appStateSyncCount}\n` +
            `• Pre-keys: ${preKeyCount}\n` +
            `• Other: ${otherFiles}\n\n` +
            `🖥️ *System:* ${systemInfo.platform} | ${systemInfo.freeMem}GB free\n\n` +
            `⚠️ *Bot will restart in 3 seconds...*`;

        await updateLoading(completionMessage);

        // Log the operation
        console.log(`🔄 Session cleared: ${filesCleared} files, ${errors} errors by ${sender}`);

        // Auto-restart after cleanup
        setTimeout(() => {
            console.log('🔄 Initiating bot restart after session cleanup...');
            process.exit(0);
        }, 3000);

    } catch (error) {
        console.error('Clear session command error:', error);
        
        // Try to send error to the same message
        try {
            await ademola.sendMessage(from, { 
                text: `❌ *CLEANUP FAILED!*\n\nError: ${error.message}`,
                edit: loadingMessage?.key 
            });
        } catch {
            // If edit fails, send new message as fallback
            await reply(
                `❌ *CLEANUP FAILED!*\n\nError: ${error.message}`,
                { quoted: fakevCard }
            );
        }
    }
});

// Optimized backup command with fixed owner check
ademola({
    pattern: "backupsession",
    alias: ["backup", "sessionsave"],
    desc: "Create session backup (Owner Only)",
    category: "owner",
    react: "💾",
    use: ".backupsession",
    filename: __filename,
}, async (ademola, mek, m, { from, sender, reply }) => {
    let backupMessage;
    
    try {
        // Fixed owner check
        const isOwner = mek.key.fromMe || (await isOwnerOrSudo(sender));
        
        if (!isOwner) {
            return reply("❌ This command can only be used by the bot owner!", { quoted: fakevCard });
        }

        const sessionDir = path.join(__dirname, '../session');
        const backupDir = path.join(__dirname, '../backup');

        if (!fs.existsSync(sessionDir)) {
            return reply("❌ Session directory not found!", { quoted: fakevCard });
        }

        // Single loading message
        backupMessage = await reply("💾 *Starting session backup...*", { quoted: fakevCard });

        const updateBackupStatus = async (text) => {
            try {
                await ademola.sendMessage(from, { 
                    text: text,
                    edit: backupMessage.key 
                });
            } catch (editError) {
                console.log('Backup status update failed');
            }
        };

        // Create backup directory
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `session-backup-${timestamp}`);

        await updateBackupStatus("💾 *Copying session files...*");

        // Copy session files
        const files = fs.readdirSync(sessionDir);
        let backedUp = 0;

        for (const file of files) {
            try {
                const sourcePath = path.join(sessionDir, file);
                const destPath = path.join(backupPath, file);
                
                if (!fs.existsSync(backupPath)) {
                    fs.mkdirSync(backupPath, { recursive: true });
                }
                
                fs.copyFileSync(sourcePath, destPath);
                backedUp++;
            } catch (error) {
                console.error(`Failed to backup ${file}:`, error);
            }
        }

        await updateBackupStatus(
            `💾 *BACKUP COMPLETE!*\n\n` +
            `• Files backed up: ${backedUp}\n` +
            `• Location: session-backup-${timestamp}\n` +
            `• Time: ${new Date().toLocaleTimeString()}\n\n` +
            `✅ Session safely backed up!`
        );

        console.log(`💾 Session backup created: ${backedUp} files`);

    } catch (error) {
        console.error('Backup session command error:', error);
        
        try {
            await ademola.sendMessage(from, { 
                text: `❌ *BACKUP FAILED!*\n\nError: ${error.message}`,
                edit: backupMessage?.key 
            });
        } catch {
            await reply("❌ Failed to create session backup!", { quoted: fakevCard });
        }
    }
});

// Session info with fixed owner check
ademola({
    pattern: "sessioninfo",
    alias: ["sessionstatus", "sesinfo"],
    desc: "Show session information",
    category: "owner",
    react: "📁",
    use: ".sessioninfo",
    filename: __filename,
}, async (ademola, mek, m, { from, sender, reply }) => {
    try {
        // Fixed owner check
        const isOwner = mek.key.fromMe || (await isOwnerOrSudo(sender));
        
        if (!isOwner) {
            return reply("❌ This command can only be used by the bot owner!", { quoted: fakevCard });
        }

        const sessionDir = path.join(__dirname, '../session');

        if (!fs.existsSync(sessionDir)) {
            return reply("❌ Session directory not found!", { quoted: fakevCard });
        }

        // Single analysis message
        const infoMessage = await reply("📁 *Analyzing session files...*", { quoted: fakevCard });

        const files = fs.readdirSync(sessionDir);
        let totalSize = 0;
        const fileTypes = {};

        for (const file of files) {
            try {
                const filePath = path.join(sessionDir, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;

                // Categorize files
                if (file.startsWith('app-state-sync-')) {
                    fileTypes['app-state-sync'] = (fileTypes['app-state-sync'] || 0) + 1;
                } else if (file.startsWith('pre-key-')) {
                    fileTypes['pre-keys'] = (fileTypes['pre-keys'] || 0) + 1;
                } else if (file.startsWith('session-')) {
                    fileTypes['sessions'] = (fileTypes['sessions'] || 0) + 1;
                } else if (file.startsWith('sender-key-')) {
                    fileTypes['sender-keys'] = (fileTypes['sender-keys'] || 0) + 1;
                } else {
                    fileTypes['other'] = (fileTypes['other'] || 0) + 1;
                }
            } catch (error) {
                console.error(`Error reading ${file}:`, error);
            }
        }

        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

        let fileTypeInfo = '';
        for (const [type, count] of Object.entries(fileTypes)) {
            fileTypeInfo += `• ${type}: ${count} files\n`;
        }

        // Update the same message with final info
        await ademola.sendMessage(from, { 
            text: 
                `📁 *SESSION INFORMATION*\n\n` +
                `• Total files: ${files.length}\n` +
                `• Total size: ${sizeInMB} MB\n` +
                `• Directory: session/\n\n` +
                `📊 *File Types:*\n${fileTypeInfo}` +
                `🕒 ${new Date().toLocaleString()}`,
            edit: infoMessage.key 
        });

    } catch (error) {
        console.error('Session info command error:', error);
        await reply("❌ Failed to get session information!", { quoted: fakevCard });
    }
});

module.exports = {};