const http = require('http');

http.get('http://localhost:3000/hi/word-counting-tools/word-counter', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTML lang:', data.match(/<html[^>]*>/)[0]);
    
    const canonical = data.match(/<link[^>]*rel="canonical"[^>]*>/);
    console.log('Canonical:', canonical ? canonical[0] : 'None');
    
    const alternates = data.match(/<link[^>]*rel="alternate"[^>]*hreflang[^>]*>/g);
    console.log('Alternates:', alternates ? alternates.join('\n') : 'None');
  });
});
