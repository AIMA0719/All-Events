import fs from 'fs';

async function main() {
  const res = await fetch('https://raw.githubusercontent.com/brave-people/Dev-Event/master/README.md');
  const text = await res.text();
  fs.writeFileSync('/app/applet/readme.md', text);
  console.log('Saved to readme.md. Length:', text.length);
}

main();
