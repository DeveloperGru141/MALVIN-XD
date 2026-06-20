const fs = require('fs');
const path = require('path');

const dirsToClean = [
  path.join(__dirname, 'temp'),
  path.join(__dirname, 'tmp'),
  path.join(__dirname, '.cache')
];

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  let cleaned = 0;
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile() && Date.now() - stat.mtimeMs > 3600000) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    } catch {}
  }
  console.log(`Cleaned ${cleaned} files from ${path.basename(dir)}`);
}

for (const dir of dirsToClean) {
  if (fs.existsSync(dir)) cleanDir(dir);
}
console.log('Cleanup complete');
