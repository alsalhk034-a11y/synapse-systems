// Extract PortableGit.zip using Node.js built-in streams
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const zipPath = 'F:/anas al saleh1/node-portable/PortableGit.zip';
const outDir  = 'F:/anas al saleh1/node-portable/git';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Use a manual ZIP parser (no external deps)
function readUInt16LE(buf, off) { return buf.readUInt16LE(off); }
function readUInt32LE(buf, off) { return buf.readUInt32LE(off); }

const data = fs.readFileSync(zipPath);
let offset = 0;
let count = 0;

while (offset < data.length) {
  // End of central directory record
  if (data.readUInt32LE(offset) === 0x06054b50) break;

  // Local file header
  if (data.readUInt32LE(offset) !== 0x04034b50) {
    console.error('Bad header at', offset);
    break;
  }
  const compMethod = readUInt16LE(data, offset + 8);
  const compSize   = readUInt32LE(data, offset + 18);
  const uncompSize = readUInt32LE(data, offset + 22);
  const nameLen    = readUInt16LE(data, offset + 26);
  const extraLen   = readUInt16LE(data, offset + 28);
  const nameStart  = offset + 30;
  const name = data.toString('utf8', nameStart, nameStart + nameLen);
  const dataStart = nameStart + nameLen + extraLen;
  const compData = data.slice(dataStart, dataStart + compSize);

  let uncompData;
  if (compMethod === 0) {
    uncompData = compData;
  } else if (compMethod === 8) {
    uncompData = zlib.inflateRawSync(compData);
  } else {
    console.error('Unsupported method', compMethod, 'for', name);
    offset = dataStart + compSize;
    continue;
  }

  const outPath = path.join(outDir, name);
  if (name.endsWith('/')) {
    fs.mkdirSync(outPath, { recursive: true });
  } else {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, uncompData);
  }
  count++;
  offset = dataStart + compSize;
}

console.log('Extracted', count, 'files to', outDir);
