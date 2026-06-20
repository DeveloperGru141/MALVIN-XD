const { ademola, fakevCard } = require("../ademola");
const axios = require('axios');

// NPM Package Search Command
ademola({
    pattern: "npm",
    alias: ["npmpkg", "package"],
    desc: "Search for a package on npm.",
    category: "download",
    react: "📦",
    use: ".npm <package-name>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return reply('Please provide the name of the npm package you want to search for.\n\nExample: .npm express');
        }

        await reply('_📦 Searching npm registry..._');

        const packageName = q.trim();
        const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

        // Fetch package details from npm registry
        const response = await axios.get(apiUrl);
        
        if (response.status !== 200) {
            throw new Error("Package not found or an error occurred.");
        }

        const packageData = response.data;
        const latestVersion = packageData["dist-tags"]?.latest || "Unknown";
        const description = packageData.description || "No description available.";
        const npmUrl = `https://www.npmjs.com/package/${packageName}`;
        const license = packageData.license || "Unknown";
        const repository = packageData.repository ? 
            (packageData.repository.url || "Not available") : "Not available";
        const author = packageData.author ? 
            (packageData.author.name || JSON.stringify(packageData.author)) : "Unknown";

        // Create the response message
        const message = `
*📦 NPM PACKAGE SEARCH*

*🔰 Package:* ${packageName}
*📄 Description:* ${description}
*⏸️ Latest Version:* ${latestVersion}
*👨‍💻 Author:* ${author}
*🪪 License:* ${license}
*🪩 Repository:* ${repository}
*🔗 NPM URL:* ${npmUrl}

*👤 Requested by:* @${sender.split('@')[0]}
`;

        // Send the message with mentions
        await ademola.sendMessage(from, {
            text: message,
            mentions: [sender],
            contextInfo: {
                mentionedJid: [sender],
                quotedMessage: mek.message
            }
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in npm command:', error);
        
        if (error.response?.status === 404) {
            await reply('❌ Package not found. Please check the package name and try again.');
        } else if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. NPM registry is taking too long to respond. Please try again.');
        } else if (error.response?.status >= 500) {
            await reply('❌ NPM registry is currently unavailable. Please try again later.');
        } else {
            // Send detailed error message for debugging
            const errorMessage = `
*❌ NPM Command Error*

*Error:* ${error.message}
*Package:* ${q || 'Unknown'}

Please try again with a valid package name.
            `;
            await reply(errorMessage.trim());
        }
    }
});

// NPM Package Info with More Details
ademola({
    pattern: "npminfo",
    alias: ["pkginfo", "packageinfo"],
    desc: "Get detailed information about an npm package",
    category: "download", 
    react: "📋",
    use: ".npminfo <package-name>",
    filename: __filename,
}, async (ademola, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return reply('Please provide the name of the npm package.\n\nExample: .npminfo express');
        }

        await reply('_📋 Fetching detailed package information..._');

        const packageName = q.trim();
        const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

        const response = await axios.get(apiUrl);
        
        if (response.status !== 200) {
            throw new Error("Package not found.");
        }

        const packageData = response.data;
        const latestVersion = packageData["dist-tags"]?.latest || "Unknown";
        const description = packageData.description || "No description available.";
        const npmUrl = `https://www.npmjs.com/package/${packageName}`;
        const license = packageData.license || "Unknown";
        const repository = packageData.repository ? 
            (packageData.repository.url || "Not available") : "Not available";
        const author = packageData.author ? 
            (packageData.author.name || JSON.stringify(packageData.author)) : "Unknown";
        const homepage = packageData.homepage || "Not available";
        const keywords = packageData.keywords ? packageData.keywords.join(', ') : "None";
        const versions = Object.keys(packageData.versions || {}).length;
        const maintainers = packageData.maintainers?.length || 0;

        // Create detailed response message
        const message = `
*📋 NPM PACKAGE DETAILS*

*🔰 Package:* ${packageName}
*📄 Description:* ${description}
*⏸️ Latest Version:* ${latestVersion}
*📊 Total Versions:* ${versions}
*👨‍💻 Author:* ${author}
*👥 Maintainers:* ${maintainers}
*🪪 License:* ${license}
*🏠 Homepage:* ${homepage}
*🪩 Repository:* ${repository}
*🏷️ Keywords:* ${keywords}
*🔗 NPM URL:* ${npmUrl}

*👤 Requested by:* @${sender.split('@')[0]}
`;

        await ademola.sendMessage(from, {
            text: message,
            mentions: [sender],
            contextInfo: {
                mentionedJid: [sender],
                quotedMessage: mek.message
            }
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.error('Error in npminfo command:', error);
        
        if (error.response?.status === 404) {
            await reply('❌ Package not found. Please check the package name.');
        } else {
            await reply('❌ Failed to fetch package details. Please try again later.');
        }
    }
});