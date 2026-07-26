#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

class ProductionReadinessChecker {
    constructor() {
        this.issues = [];
        this.recommendations = [];
        this.checks = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            success: '\x1b[32m✅',
            warning: '\x1b[33m⚠️',
            error: '\x1b[31m❌',
            info: '\x1b[36m🔍',
            neutral: '\x1b[37m•'
        };
        const color = colors[type] || colors.info;
        console.log(`${color} [${timestamp}] ${message}\x1b[0m`);
    }

    addCheck(name, passed, message) {
        this.checks.push({ name, passed, message });
        if (passed) {
            this.log(`${name}: ${message}`, 'success');
        } else {
            this.log(`${name}: ${message}`, 'error');
            this.issues.push({ check: name, message });
        }
    }

    addRecommendation(message) {
        this.recommendations.push(message);
        this.log(`Recommendation: ${message}`, 'warning');
    }

    checkEssentialFiles() {
        this.log('Checking essential project files...');

        const essentialFiles = [
            { path: 'package.json', critical: true },
            { path: 'index.js', critical: true },
            { path: 'Dockerfile', critical: true },
            { path: 'ademola.js', critical: true },
            { path: 'settings.js', critical: false },
            { path: 'settingsManager.js', critical: false },
            { path: '.env', critical: false },
            { path: '.env.example', critical: false },
            { path: 'README.md', critical: false }
        ];

        for (const file of essentialFiles) {
            const exists = fs.existsSync(path.join(ROOT_DIR, file.path));
            this.addCheck(
                `Essential file: ${file.path}`, 
                exists, 
                exists ? 'File exists' : `${file.critical ? 'CRITICAL' : 'WARNING'}: Missing essential file ${file.path}`
            );
        }
    }

    checkNodeDependencies() {
        this.log('Checking Node.js dependencies...');

        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
            const dependencies = packageJson.dependencies || {};
            const devDependencies = packageJson.devDependencies || {};

            // Critical dependencies
            const criticalDeps = [
                '@whiskeysockets/baileys',
                'axios',
                'dotenv',
                'pino',
                'node-cache'
            ];

            for (const dep of criticalDeps) {
                const exists = dependencies[dep] !== undefined;
                this.addCheck(
                    `Critical dependency: ${dep}`, 
                    exists, 
                    exists ? 'Dependency installed' : `ERROR: Missing critical dependency ${dep}`
                );
            }

            // Check for production license
            if (dependencies['@whiskeysockets/baileys'] && !dependencies['@whiskeysockets/baileys'].includes('rc')) {
                this.addRecommendation('Consider updating @whiskeysockets/bailejs to stable version instead of rc.9');
            }

        } catch (error) {
            this.addCheck('Node dependencies', false, `Error reading package.json: ${error.message}`);
        }
    }

    checkDockerfile() {
        this.log('Checking Dockerfile configuration...');

        const dockerfilePath = path.join(ROOT_DIR, 'Dockerfile');
        const content = fs.readFileSync(dockerfilePath, 'utf8');

        const requiredItems = [
            { pattern: /FROM node:/, description: 'Node.js base image' },
            { pattern: /COPY package\\.json/, description: 'Package files copy' },
            { pattern: /RUN npm install/, description: 'Dependencies installation' },
            { pattern: /ENV NODE_ENV=production/, description: 'Production environment' },
            { pattern: /EXPOSE 3000/, description: 'Port exposure' },
            { pattern: /HEALTHCHECK/, description: 'Health check' },
            { pattern: /CMD \\[\"npm\"\\s+\"start\"\\]/, description: 'Default command' }
        ];

        for (const item of requiredItems) {
            const exists = item.pattern.test(content);
            this.addCheck(
                `Dockerfile: ${item.description}`, 
                exists, 
                exists ? 'Present' : `Missing: ${item.description}`
            );
        }

        // Check for volume mounts
        if (!content.includes('VOLUME')) {
            this.addRecommendation('Consider adding VOLUMES to Dockerfile for persistent data');
        }
    }

    checkProductionScripts() {
        this.log('Checking production scripts...');

        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
            const scripts = packageJson.scripts || {};

            const requiredScripts = [
                { name: 'start', description: 'Production start script' },
                { name: 'start:production', description: 'Optimized production script' },
                { name: 'cleanup', description: 'Cleanup script' },
                { name: 'reset-session', description: 'Session reset script' }
            ];

            for (const script of requiredScripts) {
                const exists = scripts[script.name] !== undefined;
                this.addCheck(
                    `Script: ${script.name}`, 
                    exists, 
                    exists ? `Exists: ${scripts[script.name]}` : `Missing: ${script.description}`
                );
            }

            // Check for PM2 configuration
            if (scripts['start:pm2']) {
                this.addRecommendation('PM2 configuration found - consider using PM2 for process management');
            }

        } catch (error) {
            this.addCheck('Production scripts', false, `Error reading scripts: ${error.message}`);
        }
    }

    checkSessionPersistence() {
        this.log('Checking session persistence setup...');

        const sessionDir = path.join(ROOT_DIR, 'session');
        const dataDir = path.join(ROOT_DIR, 'data');
        const tempDir = path.join(ROOT_DIR, 'temp');
        const tmpDir = path.join(ROOT_DIR, 'tmp');

        const directories = [
            { path: sessionDir, name: 'Session directory', critical: true },
            { path: dataDir, name: 'Data directory', critical: true },
            { path: tempDir, name: 'Temp directory', critical: true },
            { path: tmpDir, name: 'Tmp directory', critical: false }
        ];

        for (const dir of directories) {
            const exists = fs.existsSync(dir.path);
            this.addCheck(
                `Directory: ${dir.name}`, 
                exists, 
                exists ? 'Directory exists' : `${dir.critical ? 'CRITICAL' : 'WARNING'}: Missing ${dir.name}`
            );

            if (exists) {
                try {
                    const files = fs.readdirSync(dir.path);
                    const fileCount = files.length;
                    this.log(`  📁 Contains ${fileCount} files`, 'info');

                    // Check for critical files
                    if (dir.path.includes('session')) {
                        const credsExists = files.includes('creds.json');
                        this.addCheck(
                            'creds.json', 
                            credsExists, 
                            credsExists ? 'Session credentials found' : 'WARNING: No creds.json found (first run)'
                        );

                        if (!credsExists) {
                            this.addRecommendation('First run detected - pairing code will be needed to initialize WhatsApp session');
                        }
                    }
                } catch (error) {
                    this.log(`  ❌ Error reading ${dir.name}: ${error.message}`, 'error');
                }
            }
        }
    }

    checkEnvironmentConfiguration() {
        this.log('Checking environment configuration...');

        const envPath = path.join(ROOT_DIR, '.env');
        const envExamplePath = path.join(ROOT_DIR, '.env.example');

        const envExists = fs.existsSync(envPath);
        const envExampleExists = fs.existsSync(envExamplePath);

        this.addCheck('Production environment file (.env)', envExists, envExists ? '.env file exists' : 'Create .env file from .env.example');
        this.addCheck('Environment example file (.env.example)', envExampleExists, 'Environment example template available');

        if (envExists) {
            try {
                const envContent = fs.readFileSync(envPath, 'utf8');

                const requiredEnvVars = [
                    { name: 'OWNER_NUMBER', description: 'WhatsApp owner number' },
                    { name: 'OWNER_NAME', description: 'WhatsApp owner name' },
                    { name: 'BOT_NAME', description: 'Bot display name' }
                ];

                for (const envVar of requiredEnvVars) {
                    const exists = envContent.includes(`${envVar.name}=`);
                    this.addCheck(
                        `Environment variable: ${envVar.name}`, 
                        exists, 
                        exists ? `${envVar.name} is configured` : `${envVar.name} is missing`
                    );
                }

                // Check for sensitive data warning
                const sensitivePatterns = ['PASSWORD=', 'SECRET=', 'KEY='];
                for (const pattern of sensitivePatterns) {
                    if (envContent.includes(pattern)) {
                        this.addWarning(`Warning: Potential sensitive data found in .env file`);
                    }
                }

            } catch (error) {
                this.addCheck('Environment parsing', false, `Error reading .env: ${error.message}`);
            }
        } else {
            this.addRecommendation('Create .env file from .env.example for production configuration');
        }
    }

    checkSecurityConfiguration() {
        this.log('Checking security configuration...');

        const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
        const scripts = packageJson.scripts || {};

        const securityChecks = [
            {
                name: 'Validate env script',
                script: 'validate:env',
                description: 'Environment validation before production start',
                critical: false
            },
            {
                name: 'Production logging',
                check: () => {
                    const indexJs = fs.readFileSync(path.join(ROOT_DIR, 'index.js'), 'utf8');
                    const hasPinoConfig = indexJs.includes('pino') && indexJs.includes('silent');
                    return hasPinoConfig;
                },
                description: 'Production-safe logging configuration'
            }
        ];

        for (const check of securityChecks) {
            if (check.script) {
                const exists = scripts[check.script] !== undefined;
                this.addCheck(`Security: ${check.name}`, exists, exists ? `Script configured: ${scripts[check.script]}` : `${check.description} (optional)`);
            } else if (check.check) {
                const passed = check.check();
                this.addCheck(`Security: ${check.name}`, passed, passed ? check.description : `Improve: ${check.description}`);
            }
        }

        // Check for .gitignore
        const gitignoreExists = fs.existsSync(path.join(ROOT_DIR, '.gitignore'));
        this.addCheck('Gitignore file', gitignoreExists, 'Protect sensitive data from version control');

        if (gitignoreExists) {
            const gitignore = fs.readFileSync(path.join(ROOT_DIR, '.gitignore'), 'utf8');
            const importantIgnores = ['node_modules/', '.env', 'session/', '.cache/', '*.log'];
            const existingIgnores = importantIgnores.filter(ignore => gitignore.includes(ignore));
            this.log(`  ✅ Important patterns in .gitignore: ${existingIgnores.length}/${importantIgnores.length}`, 'info');
        } else {
            this.addRecommendation('Create .gitignore file to protect sensitive data');
        }
    }

    generateProductionConfig() {
        this.log('Generating production configuration files...');

        // 1. Create docker-compose.yml
        const dockerCompose = `version: '3.8'

services:
  ademola-xd:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - SESSION_ID=${SESSION_ID:-}  # Add your SESSION_ID if you have one
      - OWNER_NUMBER=${OWNER_NUMBER:-2348108574293}
      - OWNER_NAME=${OWNER_NAME:-Ademola King}
      - BOT_NAME=${BOT_NAME:-ADEMOLA XD 🔥}
    volumes:
      - ./session:/app/session        # WhatsApp session credentials
      - ./data:/app/data              # Bot data (messageCount.json, settings.json)
      - ./temp:/app/temp              # Temporary files
      - ./tmp:/app/tmp                # Additional temp files
      - ./logs:/app/logs              # Application logs
    ports:
      - "3000:3000"
    healthcheck:
      test: [
        "CMD",
        "node",
        "-e",
        "try { require('fs').accessSync('./session/creds.json'); process.exit(0); } catch(e) { process.exit(1); }"
      ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  session:
  data:
  temp:
  tmp:
  logs:
`;

        try {
            fs.writeFileSync(path.join(ROOT_DIR, 'docker-compose.yml'), dockerCompose);
            this.log('✅ Created: docker-compose.yml', 'success');
        } catch (error) {
            this.addCheck('Docker compose creation', false, `Error creating docker-compose.yml: ${error.message}`);
        }

        // 2. Create pm2.config.js
        const pm2Config = `module.exports = {
  apps: [{
    name: 'ademola-xd',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '512M',
    max_restart_delay: 300000,
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};`;

        try {
            fs.writeFileSync(path.join(ROOT_DIR, 'pm2.config.js'), pm2Config);
            this.log('✅ Created: pm2.config.js', 'success');
        } catch (error) {
            this.addCheck('PM2 config creation', false, `Error creating pm2.config.js: ${error.message}`);
        }

        // 3. Create .dockerignore
        const dockerIgnore = [
'node_modules/',
'.env',
'.env.example',
'data/',
'session/',
'temp/',
'tmp/',
'logs/',
'*.log',
'.git',
'.cache',
'.DS_Store',
'Thumbs.db',
'*.swp',
'*.swo',
'coverage/',
'build/',
'dist/',
'README.md',
'LICENSE',
].join('\n') + '\n';

        try {
            fs.writeFileSync(path.join(ROOT_DIR, '.dockerignore'), dockerIgnore);
            this.log('✅ Created: .dockerignore', 'success');
        } catch (error) {
            this.addCheck('Docker ignore creation', false, `Error creating .dockerignore: ${error.message}`);
        }
    }

    runChecks() {
        console.log('\n'.repeat(2));
        console.log('\x1b[1mProduction Readiness Checker for Ademola XD\x1b[0m');
        console.log('\x1b[1m=======================================================\x1b[0m\n');

        this.checkEssentialFiles();
        this.checkNodeDependencies();
        this.checkDockerfile();
        this.checkProductionScripts();
        this.checkSessionPersistence();
        this.checkEnvironmentConfiguration();
        this.checkSecurityConfiguration();

        console.log('\n'.repeat(2));
        console.log('\x1b[1mCheck Summary\x1b[0m');
        console.log('\x1b[1m==========================\x1b[0m');
        
        const totalChecks = this.checks.length;
        const passedChecks = this.checks.filter(check => check.passed).length;
        const failedChecks = totalChecks - passedChecks;
        
        console.log(`\x1b[37mTotal Checks: ${totalChecks}\x1b[0m`);
        console.log(`\x1b[32m✅ Passed: ${passedChecks}\x1b[0m`);
        console.log(`\x1b[31m❌ Failed: ${failedChecks}\x1b[0m`);

        if (this.issues.length > 0) {
            console.log('\n'.repeat(2));
            console.log('\x1b[1mCritical Issues\x1b[0m');
            console.log('\x1b[1m====================\x1b[0m');
            for (const issue of this.issues) {
                console.log(`\x1b[31m${issue.check}: ${issue.message}\x1b[0m`);
            }
        }

        if (this.recommendations.length > 0) {
            console.log('\n'.repeat(2));
            console.log('\x1b[1mRecommendations\x1b[0m');
            console.log('\x1b[1m====================\x1b[0m');
            for (const recommendation of this.recommendations) {
                console.log(`\x1b[33m• ${recommendation}\x1b[0m`);
            }
        }

        const isProductionReady = this.issues.length === 0;
        
        console.log('\n'.repeat(2));
        console.log('\x1b[1mProduction Status\x1b[0m');
        console.log('\x1b[1m=================\x1b[0m');
        if (isProductionReady) {
            console.log('\x1b[32m✅ The bot is ready for production deployment!\x1b[0m\n');
        } else {
            console.log('\x1b[31m❌ The bot needs fixes before production deployment\x1b[0m\n');
        }

        return isProductionReady;
    }
}

// Run the checker if this file is executed directly
if (require.main === module) {
    const checker = new ProductionReadinessChecker();
    const isReady = checker.runChecks();
    process.exit(isReady ? 0 : 1);
}

module.exports = ProductionReadinessChecker;