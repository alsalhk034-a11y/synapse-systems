// Run npm build and capture output
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const node = 'F:\\anas al saleh1\\node-portable\\node-v20.18.0-win-x64\\node.exe';
const npm = 'F:\\anas al saleh1\\node-portable\\node-v20.18.0-win-x64\\node_modules\\npm\\bin\\npm-cli.js';
const cwd = 'F:\\anas al saleh1';

console.log('Running build...');
const result = spawnSync(node, [npm, 'run', 'build'], { cwd, encoding: 'utf8' });

console.log('=== STDOUT ===');
console.log(result.stdout || '(empty)');
console.log('=== STDERR ===');
console.log(result.stderr || '(empty)');
console.log('=== EXIT CODE ===');
console.log(result.status);

// Verify dist exists
const distPath = path.join(cwd, 'dist');
if (fs.existsSync(distPath)) {
  console.log('\n=== dist contents ===');
  fs.readdirSync(distPath).forEach(f => console.log('  ', f));
  const assets = path.join(distPath, 'assets');
  if (fs.existsSync(assets)) {
    const q = fs.readdirSync(assets).filter(f => f.startsWith('Queue-'));
    console.log('Queue files:', q);
  }
} else {
  console.log('\n[!] dist folder does NOT exist');
}
