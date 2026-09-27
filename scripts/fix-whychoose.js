const fs = require('fs');
const path = require('path');

const locales = ['en', 'hi', 'es', 'pt', 'de', 'id'];

locales.forEach(lang => {
  const filePath = path.join(__dirname, '..', 'locales', 'content', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.tools && data.tools['online-typing-tool']) {
    const tool = data.tools['online-typing-tool'];
    if (typeof tool.whyChoose === 'string') {
      tool.whyChoose = [
        {
          icon: '⚡',
          title: 'Instant Conversion',
          description: 'Type normally on your English keyboard and watch it instantly transform into native script.'
        },
        {
          icon: '🌐',
          title: '20+ Languages',
          description: 'Support for multiple major languages, all in one place.'
        },
        {
          icon: '💻',
          title: 'No Installation',
          description: tool.whyChoose // Reusing the string I provided earlier
        }
      ];
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Fixed whyChoose for ${lang}.json`);
    }
  }
});
