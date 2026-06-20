const fs = require('fs');
const path = require('path');
const { rmSync } = fs;

const sessionDir = path.join(__dirname, 'session');
if (fs.existsSync(sessionDir)) {
  rmSync(sessionDir, { recursive: true, force: true });
  console.log('Session cleared. You will need to re-authenticate on next start.');
} else {
  console.log('No session found to clear.');
}
