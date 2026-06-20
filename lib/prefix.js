const settings = require('../settings');
const fs = require('fs');
const path = require('path');

const PREFIX_FILE = path.join(__dirname, '../data/prefix.json');

// Load saved prefix or use default
let currentPrefix = settings.prefix || '.';

// Function to reload prefix from file
function reloadPrefix() {
    try {
        if (fs.existsSync(PREFIX_FILE)) {
            const saved = JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8'));
            if (saved.prefix) {
                currentPrefix = saved.prefix;
                console.log(`🔄 Prefix reloaded: ${currentPrefix}`);
                return true;
            }
        }
    } catch (error) {
        console.log('Error reloading prefix, using current:', currentPrefix);
    }
    return false;
}

// Initial load
try {
    if (fs.existsSync(PREFIX_FILE)) {
        const saved = JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8'));
        if (saved.prefix) {
            currentPrefix = saved.prefix;
            console.log(`✅ Loaded saved prefix: ${currentPrefix}`);
        }
    } else {
        // Create data directory if it doesn't exist
        const dataDir = path.dirname(PREFIX_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        // Create initial prefix file
        const initialData = { 
            prefix: currentPrefix, 
            updated: new Date().toISOString()
        };
        fs.writeFileSync(PREFIX_FILE, JSON.stringify(initialData, null, 2));
        console.log(`📁 Created initial prefix file: ${currentPrefix}`);
    }
} catch (error) {
    console.log('Using default prefix:', currentPrefix);
}

function getPrefix() {
    return currentPrefix;
}

function setPrefix(newPrefix) {
    currentPrefix = newPrefix;
    
    // Save to file for persistence
    try {
        const data = { 
            prefix: newPrefix, 
            updated: new Date().toISOString()
        };
        fs.writeFileSync(PREFIX_FILE, JSON.stringify(data, null, 2));
        console.log(`✅ Prefix saved: ${newPrefix}`);
        
        // Force reload in all modules
        reloadPrefix();
        return true;
    } catch (error) {
        console.error('Failed to save prefix:', error);
        return false;
    }
}

// Reset to default
function resetPrefix() {
    currentPrefix = settings.prefix || '.';
    try {
        if (fs.existsSync(PREFIX_FILE)) {
            fs.unlinkSync(PREFIX_FILE);
        }
        console.log(`✅ Prefix reset to default: ${currentPrefix}`);
        
        // Force reload in all modules
        reloadPrefix();
        return true;
    } catch (error) {
        console.error('Failed to reset prefix:', error);
        return false;
    }
}

module.exports = {
    getPrefix,
    setPrefix,
    resetPrefix,
    reloadPrefix
};