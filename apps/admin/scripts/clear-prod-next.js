const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '.next');
if (fs.existsSync(path.join(dir, 'required-server-files.json'))) {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('Cleared production .next cache before next dev');
}
