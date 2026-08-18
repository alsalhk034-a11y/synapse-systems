const fs = require('fs');
const buf = fs.readFileSync('F:/anas al saleh1/node-portable/PortableGit.zip', { flag: 'r' });
const head = Array.from(buf.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ');
console.log('First 16 bytes:', head);
console.log('File size:', buf.length, 'bytes');
