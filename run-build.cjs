const { exec } = require('child_process');
const path = require('path');
const vitePath = path.join('f:\\anas al saleh1\\node_modules\\vite\\bin\\vite.js');
const nodeExe = 'f:\\anas al saleh1\\node-portable\\node-v20.18.0-win-x64\\node.exe';
process.chdir('f:\\anas al saleh1');
const child = exec(`"${nodeExe}" "${vitePath}" build --mode production`, { maxBuffer: 50 * 1024 * 1024 });
child.stdout.on('data', d => process.stdout.write(d));
child.stderr.on('data', d => process.stderr.write(d));
child.on('exit', code => {
  console.log('Build process exited with code', code);
  process.exit(code);
});
