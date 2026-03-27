import https from 'https';
import fs from 'fs';

https.get('https://raw.githubusercontent.com/brave-people/Dev-Event/master/README.md', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('/app/applet/readme.md', data);
    console.log('Saved to readme.md');
  });
});
