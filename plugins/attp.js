const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { writeExifVid } = require('../lib/exif');
const { ademola, fakevCard } = require('../ademola');

// Ademola XD ATTP Command
ademola({
    pattern: "attp",
    alias: ["atp", "textsticker", "blinktext"],
    desc: "Create blinking text sticker",
    category: "sticker",
    react: "✨",
    use: ".attp <text>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply }) => {
    try {
        let text = q?.trim();
        
        if (!text) {
            return reply("❌ Please provide text after the .attp command.\n\nExample: *.attp Hello World*", { quoted: fakevCard });
        }

        // Clean and validate text
        text = cleanText(text);
        
        if (text.length > 50) {
            return reply("❌ Text too long! Maximum 50 characters allowed.", { quoted: fakevCard });
        }

        if (text.length === 0) {
            return reply("❌ Invalid text provided.", { quoted: fakevCard });
        }

        // Show typing indicator
        await ademola.sendPresenceUpdate('composing', from);

        try {
            console.log(`🎨 Generating ATTP for: "${text}"`);
            const mp4Buffer = await renderBlinkingVideoWithFfmpeg(text);
            const webpPath = await writeExifVid(mp4Buffer, { 
                packname: 'Ademola XD', 
                author: 'ATTP Sticker' 
            });
            const webpBuffer = fs.readFileSync(webpPath);
            
            // Clean up temp file
            try { 
                fs.unlinkSync(webpPath); 
            } catch (_) {}
            
            // Send sticker
            await reply(webpBuffer, { 
                sticker: true,
                quoted: fakevCard 
            });
            
            console.log(`✅ ATTP sticker created for: "${text}" by ${m.sender}`);
            
        } catch (error) {
            console.error('Error generating ATTP sticker:', error);
            
            // Check if ffmpeg is available
            const ffmpegCheck = await checkFfmpeg();
            if (!ffmpegCheck.available) {
                return reply(`❌ FFmpeg not found!\n\nPlease install FFmpeg:\n${ffmpegCheck.installInstructions}`, { quoted: fakevCard });
            }
            
            return reply("❌ Failed to generate sticker. Try simpler text without special characters.", { quoted: fakevCard });
        }
    } catch (error) {
        console.error('ATTP command error:', error);
        return reply("❌ Error creating sticker. Please try again.", { quoted: fakevCard });
    }
});

// Clean text function - remove problematic characters
function cleanText(text) {
    return text
        .replace(/[\[\]{}()<>]/g, '') // Remove brackets and parentheses
        .replace(/[^\w\s\u0600-\u06FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, '') // Keep only alphanumeric, spaces, and common unicode chars
        .trim()
        .substring(0, 50); // Limit length
}

// Simple text rendering without complex escaping
function renderBlinkingVideoWithFfmpeg(text) {
    return new Promise((resolve, reject) => {
        // Use simple font path that should work on most systems
        const fontPath = getSystemFont();
        
        if (!fontPath) {
            return reject(new Error('No suitable font found on system'));
        }

        // Use a much simpler text approach - write text to file and use that
        const tempTextFile = path.join(__dirname, `temp_text_${Date.now()}.txt`);
        fs.writeFileSync(tempTextFile, text, 'utf8');

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', 'color=c=black:s=512x512:r=10:d=2',
            '-vf', 
            `drawtext=textfile='${tempTextFile}':fontfile='${fontPath}':fontcolor=white:fontsize=48:borderw=2:bordercolor=black@0.8:x=(w-text_w)/2:y=(h-text_h)/2:enable='lt(mod(t,0.3),0.1)',
             drawtext=textfile='${tempTextFile}':fontfile='${fontPath}':fontcolor=cyan:fontsize=48:borderw=2:bordercolor=black@0.8:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(mod(t,0.3),0.1,0.2)',
             drawtext=textfile='${tempTextFile}':fontfile='${fontPath}':fontcolor=magenta:fontsize=48:borderw=2:bordercolor=black@0.8:x=(w-text_w)/2:y=(h-text_h)/2:enable='gte(mod(t,0.3),0.2)'`,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-t', '2',
            '-f', 'mp4',
            'pipe:1'
        ];

        console.log('🔧 FFmpeg args:', args.join(' '));

        const ff = spawn('ffmpeg', args);
        const chunks = [];
        const errors = [];
        
        ff.stdout.on('data', d => chunks.push(d));
        ff.stderr.on('data', e => {
            errors.push(e);
            console.log('FFmpeg stderr:', e.toString());
        });
        
        ff.on('error', (error) => {
            cleanupTempFile(tempTextFile);
            console.error('FFmpeg spawn error:', error);
            reject(error);
        });
        
        ff.on('close', (code) => {
            cleanupTempFile(tempTextFile);
            
            if (code === 0 && chunks.length > 0) {
                console.log(`✅ FFmpeg success: ${chunks.length} bytes`);
                resolve(Buffer.concat(chunks));
            } else {
                const errorMsg = Buffer.concat(errors).toString() || `FFmpeg exited with code ${code}`;
                console.error('❌ FFmpeg error:', errorMsg);
                reject(new Error(errorMsg));
            }
        });
    });
}

// Get system font path
function getSystemFont() {
    if (process.platform === 'win32') {
        const possibleFonts = [
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/arialbd.ttf',
            'C:/Windows/Fonts/times.ttf'
        ];
        for (const font of possibleFonts) {
            if (fs.existsSync(font)) return font;
        }
    } else {
        const possibleFonts = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            '/System/Library/Fonts/Arial.ttf' // macOS
        ];
        for (const font of possibleFonts) {
            if (fs.existsSync(font)) return font;
        }
    }
    return null;
}

// Cleanup temp file
function cleanupTempFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.log('Could not delete temp file:', error.message);
    }
}

// Alternative simple method without text file
function renderSimpleBlinkingVideo(text) {
    return new Promise((resolve, reject) => {
        const fontPath = getSystemFont();
        if (!fontPath) return reject(new Error('No font found'));

        // Use very simple text - replace problematic chars
        const safeText = text.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
        
        if (!safeText) {
            return reject(new Error('Text became empty after cleaning'));
        }

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', `color=c=black:s=512x512:r=10:d=2`,
            '-vf', 
            `drawtext=text='${safeText}':fontfile='${fontPath}':fontcolor=red:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='lt(mod(t,1),0.5)',
             drawtext=text='${safeText}':fontfile='${fontPath}':fontcolor=blue:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='gte(mod(t,1),0.5)'`,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-t', '2',
            '-f', 'mp4',
            'pipe:1'
        ];

        console.log('🔧 Simple FFmpeg args:', args.join(' '));

        const ff = spawn('ffmpeg', args);
        const chunks = [];
        const errors = [];
        
        ff.stdout.on('data', d => chunks.push(d));
        ff.stderr.on('data', e => errors.push(e));
        
        ff.on('error', reject);
        ff.on('close', (code) => {
            if (code === 0) {
                resolve(Buffer.concat(chunks));
            } else {
                reject(new Error(Buffer.concat(errors).toString() || `FFmpeg code ${code}`));
            }
        });
    });
}

// FFmpeg availability check
async function checkFfmpeg() {
    return new Promise((resolve) => {
        const ff = spawn('ffmpeg', ['-version']);
        let output = '';
        let error = '';
        
        ff.stdout.on('data', (data) => output += data.toString());
        ff.stderr.on('data', (data) => error += data.toString());
        
        ff.on('close', (code) => {
            if (code === 0) {
                resolve({
                    available: true,
                    version: output.split('\n')[0] || 'Unknown'
                });
            } else {
                resolve({
                    available: false,
                    installInstructions: process.platform === 'win32' 
                        ? 'Download from: https://ffmpeg.org/download.html'
                        : 'Run: sudo apt install ffmpeg (Ubuntu) or brew install ffmpeg (macOS)'
                });
            }
        });
        
        ff.on('error', () => {
            resolve({
                available: false,
                installInstructions: process.platform === 'win32' 
                    ? 'Download from: https://ffmpeg.org/download.html'
                    : 'Run: sudo apt install ffmpeg (Ubuntu) or brew install ffmpeg (macOS)'
            });
        });
    });
}

module.exports = {
    renderBlinkingVideoWithFfmpeg,
    renderSimpleBlinkingVideo
};
