const fs = require('fs');
const path = require('path');

const uiTranslations = {
  en: {
    howToType: 'How to Type',
    howToTypeDesc: 'Type the English letters exactly as they sound phonetically. Press Space or Enter to convert.',
    noteDesc: 'Note: The map shows examples for Hindi, but the same phonetic rules apply across all supported languages.'
  },
  hi: {
    howToType: 'कैसे टाइप करें',
    howToTypeDesc: 'अंग्रेजी अक्षरों को बिल्कुल वैसा ही टाइप करें जैसा वे ध्वन्यात्मक रूप से लगते हैं। बदलने के लिए स्पेस या एंटर दबाएं।',
    noteDesc: 'नोट: नक्शा हिंदी के लिए उदाहरण दिखाता है, लेकिन समान ध्वन्यात्मक नियम सभी समर्थित भाषाओं पर लागू होते हैं।'
  },
  es: {
    howToType: 'Cómo Escribir',
    howToTypeDesc: 'Escriba las letras en inglés exactamente como suenan fonéticamente. Presione Espacio o Enter para convertir.',
    noteDesc: 'Nota: El mapa muestra ejemplos para hindi, pero las mismas reglas fonéticas se aplican a todos los idiomas admitidos.'
  },
  pt: {
    howToType: 'Como Digitar',
    howToTypeDesc: 'Digite as letras em inglês exatamente como soam foneticamente. Pressione Espaço ou Enter para converter.',
    noteDesc: 'Nota: O mapa mostra exemplos para hindi, mas as mesmas regras fonéticas se aplicam a todos os idiomas suportados.'
  },
  de: {
    howToType: 'Wie man tippt',
    howToTypeDesc: 'Tippen Sie die englischen Buchstaben genau so, wie sie phonetisch klingen. Drücken Sie die Leertaste oder die Eingabetaste zum Konvertieren.',
    noteDesc: 'Hinweis: Die Karte zeigt Beispiele für Hindi, aber die gleichen phonetischen Regeln gelten für alle unterstützten Sprachen.'
  },
  id: {
    howToType: 'Cara Mengetik',
    howToTypeDesc: 'Ketik huruf bahasa Inggris persis seperti kedengarannya secara fonetik. Tekan Spasi atau Enter untuk mengonversi.',
    noteDesc: 'Catatan: Peta menunjukkan contoh untuk bahasa Hindi, tetapi aturan fonetik yang sama berlaku untuk semua bahasa yang didukung.'
  }
};

Object.keys(uiTranslations).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'locales', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.ui && data.ui.typingTool) {
    data.ui.typingTool.howToType = uiTranslations[lang].howToType;
    data.ui.typingTool.howToTypeDesc = uiTranslations[lang].howToTypeDesc;
    data.ui.typingTool.noteDesc = uiTranslations[lang].noteDesc;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated typingTool UI strings with sidebar text in ${lang}.json`);
  }
});
