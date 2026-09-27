const fs = require('fs');
const path = require('path');

const locales = ['en', 'hi', 'es', 'pt', 'de', 'id'];

const keywordsData = {
  metaTitle: 'Free Online Typing Tool — English to Hindi, Arabic, Russian & More',
  metaDescription: 'Instantly type in 20+ languages using a standard English keyboard. Free online phonetic typing tool for Hindi, Gujarati, Marathi, Bengali, Arabic, and more.',
  keywords: 'hindi typing tool, gujarati typing tool, marathi typing tool, bengali typing tool, arabic typing tool, russian typing tool, phonetic typing online, english to hindi typing, english to arabic typing tool free, online transliteration tool, type in native language keyboard, punjabi typing tool, tamil typing tool, telugu typing tool',
  relatedSearches: [
    'english to hindi typing tool free online',
    'gujarati typing tool online',
    'marathi typing tool phonetic',
    'bengali typing keyboard online',
    'arabic typing tool online free',
    'type in native language using english keyboard'
  ]
};

locales.forEach(lang => {
  const filePath = path.join(__dirname, '..', 'locales', 'content', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.tools && data.tools['online-typing-tool']) {
    data.tools['online-typing-tool'].metaTitle = keywordsData.metaTitle;
    data.tools['online-typing-tool'].metaDescription = keywordsData.metaDescription;
    data.tools['online-typing-tool'].keywords = keywordsData.keywords;
    data.tools['online-typing-tool'].relatedSearches = keywordsData.relatedSearches;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated keywords for ${lang}.json`);
  }
});
