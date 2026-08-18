const fs = require('fs');
const path = require('path');
const dir = 'F:/anas al saleh1/dist/assets';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Queue-'));
files.forEach(f => {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  // Find all tone-related string values
  const re = /tone:["'][a-z]+["']/g;
  let m;
  const set = new Set();
  while ((m = re.exec(s))) set.add(m[0]);
  console.log(f, '->', Array.from(set).join(' | '));
  // Also check for useShallow
  if (s.includes('useShallow')) console.log('  HAS useShallow');
  if (s.includes('AlertCircle')) console.log('  HAS AlertCircle');
  if (s.includes('RefreshCw')) console.log('  HAS RefreshCw');
});
