import https from 'https';

https.get('https://raw.githubusercontent.com/brave-people/Dev-Event/master/README.md', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.substring(0, 1000));
  });
});
