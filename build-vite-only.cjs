// Direct vite build
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const node = 'F:\\anas al saleh1\\node-portable\\node-v20.18.0-win-x64\\node.exe';
const vite = 'F:\\anas al saleh1\\node_modules\\vite\\bin\\vite.js';
const tsc = 'F:\\anas al saleh1\\node_modules\\typescript\\bin\\tsc';
const cwd = 'F:\\anas al saleh1';

// Delete dist
const distPath = path.join(cwd, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log('Deleted old dist');
}

// Run tsc first
console.log('\n=== Running tsc -b ===');
let result = spawnSync(node, [tsc, '-b'], { cwd, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
console.log('tsc STDOUT:', result.stdout || '(empty)');
console.log('tsc STDERR:', result.stderr || '(empty)');
console.log('tsc exit:', result.status);
if (result.status !== 0) {
  process.exit(result.status || 1);
}

// Run vite build
console.log('\n=== Running vite build ===');
result = spawnSync(node, [vite, 'build'], { cwd, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
console.log('vite STDOUT:', result.stdout || '(empty)');
console.log('vite STDERR:', result.stderr || '(empty)');
console.log('vite exit:', result.status);

if (fs.existsSync(distPath)) {
  console.log('\n=== dist/assets ===');
  const assets = path.join(distPath, 'assets');
  if (fs.existsSync(assets)) {
    const q = fs.readdirSync(assets).filter(f => f.startsWith('Queue-'));
    console.log('Queue files:', q);
  }
}
