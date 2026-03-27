import fs from 'fs';
const text = fs.readFileSync('/readme.md', 'utf8');
const lines = text.split('\n');
console.log(lines.slice(68, 125).join('\n'));
