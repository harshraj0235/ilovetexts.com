const fs = require('fs');
const path = require('path');

const uiTranslations = {
  en: {
    selectLang: 'Select Typing Language',
    copy: 'Copy',
    download: 'Download',
    clear: 'Clear',
    converting: 'Converting...',
    placeholder: 'Start typing in English, e.g., "namaste". Press space to convert...',
    proTip: 'Pro tip:',
    tipText: 'Simply type a word in English and press Space or Enter to instantly convert it to the selected language script.'
  },
  hi: {
    selectLang: 'टाइपिंग भाषा चुनें',
    copy: 'कॉपी करें',
    download: 'डाउनलोड करें',
    clear: 'साफ़ करें',
    converting: 'परिवर्तित कर रहा है...',
    placeholder: 'अंग्रेजी में टाइप करना शुरू करें, उदाहरण के लिए "namaste"। बदलने के लिए स्पेस दबाएं...',
    proTip: 'प्रो टिप:',
    tipText: 'बस अंग्रेजी में एक शब्द टाइप करें और इसे तुरंत चयनित भाषा स्क्रिप्ट में बदलने के लिए Space या Enter दबाएं।'
  },
  es: {
    selectLang: 'Seleccionar idioma de escritura',
    copy: 'Copiar',
    download: 'Descargar',
    clear: 'Borrar',
    converting: 'Convirtiendo...',
    placeholder: 'Comience a escribir en inglés, ej., "namaste". Presione la barra espaciadora para convertir...',
    proTip: 'Consejo profesional:',
    tipText: 'Simplemente escriba una palabra en inglés y presione la Barra espaciadora o Enter para convertirla instantáneamente a la escritura del idioma seleccionado.'
  },
  pt: {
    selectLang: 'Selecione o Idioma de Digitação',
    copy: 'Copiar',
    download: 'Baixar',
    clear: 'Limpar',
    converting: 'Convertendo...',
    placeholder: 'Comece a digitar em inglês, ex: "namaste". Pressione espaço para converter...',
    proTip: 'Dica de ouro:',
    tipText: 'Basta digitar uma palavra em inglês e pressionar Espaço ou Enter para convertê-la instantaneamente para o script do idioma selecionado.'
  },
  de: {
    selectLang: 'Tippsprache auswählen',
    copy: 'Kopieren',
    download: 'Herunterladen',
    clear: 'Leeren',
    converting: 'Konvertiere...',
    placeholder: 'Fangen Sie an, auf Englisch zu tippen, z.B. "namaste". Drücken Sie die Leertaste zum Konvertieren...',
    proTip: 'Profi-Tipp:',
    tipText: 'Tippen Sie einfach ein Wort auf Englisch und drücken Sie die Leertaste oder Enter, um es sofort in die gewählte Sprache umzuwandeln.'
  },
  id: {
    selectLang: 'Pilih Bahasa Pengetikan',
    copy: 'Salin',
    download: 'Unduh',
    clear: 'Bersihkan',
    converting: 'Mengonversi...',
    placeholder: 'Mulai mengetik dalam bahasa Inggris, misal "namaste". Tekan spasi untuk mengonversi...',
    proTip: 'Kiat ahli:',
    tipText: 'Cukup ketik sebuah kata dalam bahasa Inggris dan tekan Spasi atau Enter untuk langsung mengonversinya ke skrip bahasa yang dipilih.'
  }
};

Object.keys(uiTranslations).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'locales', 'content', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.ui) data.ui = {};
  data.ui.typingTool = uiTranslations[lang];
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Injected typingTool UI strings into ${lang}.json`);
});
