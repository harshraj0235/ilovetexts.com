const fs = require('fs');
const path = require('path');

const locales = ['en', 'hi', 'es', 'pt', 'de', 'id'];

const newTool = {
  name: 'Online Typing Tool',
  description: 'Type phonetically in 20+ languages using English keyboard',
  whatIs: 'The Online Typing Tool allows you to type in multiple languages using a standard English (QWERTY) keyboard. It uses phonetic transliteration to convert your English words into native scripts instantly.',
  whyChoose: 'It requires no software installation or special keyboard layouts. Just select your language, type normally in English, and watch it seamlessly convert.',
  faqs: [
    { question: 'How do I use this tool?', answer: 'Simply select your desired language from the dropdown, click inside the text area, and start typing phonetically in English. When you press Space, the word will convert to the native script.' },
    { question: 'Does it work offline?', answer: 'No, this tool relies on an external API (Google Input Tools) to provide accurate transliteration, so an active internet connection is required.' }
  ]
};

locales.forEach(lang => {
  const filePath = path.join(__dirname, '..', 'locales', 'content', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.tools['online-typing-tool']) {
    data.tools['online-typing-tool'] = newTool;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Added tool to ${lang}.json`);
  }
});
