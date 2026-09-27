const http = require('http');

http.get('http://localhost:3000/hi/word-counting-tools/word-counter', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const alternates = data.match(/<link[^>]*rel="alternate"[^>]*>/g);
    console.log(alternates ? alternates.join('\n') : 'No match');
  });
});
