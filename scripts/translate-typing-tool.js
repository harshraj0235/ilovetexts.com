const fs = require('fs');
const path = require('path');

const translations = {
  hi: {
    name: 'ऑनलाइन टाइपिंग टूल',
    description: 'अंग्रेजी कीबोर्ड का उपयोग करके 20+ भाषाओं में ध्वन्यात्मक रूप से टाइप करें',
    whatIs: 'ऑनलाइन टाइपिंग टूल आपको एक मानक अंग्रेजी (QWERTY) कीबोर्ड का उपयोग करके कई भाषाओं में टाइप करने की अनुमति देता है। यह आपके अंग्रेजी शब्दों को तुरंत मूल लिपियों में बदलने के लिए ध्वन्यात्मक लिप्यंतरण का उपयोग करता है।',
    whyChoose: [
      { icon: '⚡', title: 'त्वरित रूपांतरण', description: 'अपने अंग्रेजी कीबोर्ड पर सामान्य रूप से टाइप करें और इसे तुरंत मूल लिपि में बदलते हुए देखें।' },
      { icon: '🌐', title: '20+ भाषाएँ', description: 'एक ही स्थान पर कई प्रमुख भाषाओं के लिए समर्थन।' },
      { icon: '💻', title: 'कोई इंस्टॉलेशन नहीं', description: 'इसके लिए किसी सॉफ़्टवेयर इंस्टॉलेशन या विशेष कीबोर्ड लेआउट की आवश्यकता नहीं है। बस अपनी भाषा चुनें, अंग्रेजी में सामान्य रूप से टाइप करें, और इसे मूल रूप से बदलते हुए देखें।' }
    ],
    faqs: [
      { question: 'मैं इस टूल का उपयोग कैसे करूँ?', answer: 'बस ड्रॉपडाउन से अपनी वांछित भाषा का चयन करें, टेक्स्ट क्षेत्र के अंदर क्लिक करें, और अंग्रेजी में ध्वन्यात्मक रूप से टाइप करना शुरू करें। जब आप स्पेस दबाते हैं, तो शब्द मूल लिपि में परिवर्तित हो जाएगा।' },
      { question: 'क्या यह ऑफ़लाइन काम करता है?', answer: 'नहीं, यह टूल सटीक लिप्यंतरण प्रदान करने के लिए एक बाहरी API (Google Input Tools) पर निर्भर करता है, इसलिए एक सक्रिय इंटरनेट कनेक्शन आवश्यक है।' }
    ]
  },
  es: {
    name: 'Herramienta de Escritura en Línea',
    description: 'Escriba fonéticamente en más de 20 idiomas usando un teclado inglés',
    whatIs: 'La herramienta de escritura en línea le permite escribir en varios idiomas utilizando un teclado inglés estándar (QWERTY). Utiliza transliteración fonética para convertir sus palabras en inglés en guiones nativos al instante.',
    whyChoose: [
      { icon: '⚡', title: 'Conversión Instantánea', description: 'Escriba normalmente en su teclado inglés y vea cómo se transforma instantáneamente en el guion nativo.' },
      { icon: '🌐', title: 'Más de 20 Idiomas', description: 'Soporte para múltiples idiomas principales, todo en un solo lugar.' },
      { icon: '💻', title: 'Sin Instalación', description: 'No requiere instalación de software ni distribuciones de teclado especiales. Simplemente seleccione su idioma, escriba normalmente en inglés y observe cómo se convierte sin problemas.' }
    ],
    faqs: [
      { question: '¿Cómo uso esta herramienta?', answer: 'Simplemente seleccione su idioma deseado en el menú desplegable, haga clic dentro del área de texto y comience a escribir fonéticamente en inglés. Cuando presione la barra espaciadora, la palabra se convertirá al guion nativo.' },
      { question: '¿Funciona sin conexión?', answer: 'No, esta herramienta depende de una API externa (Google Input Tools) para proporcionar una transliteración precisa, por lo que se requiere una conexión a Internet activa.' }
    ]
  },
  pt: {
    name: 'Ferramenta de Digitação Online',
    description: 'Digite foneticamente em mais de 20 idiomas usando um teclado em inglês',
    whatIs: 'A Ferramenta de Digitação Online permite que você digite em vários idiomas usando um teclado padrão em inglês (QWERTY). Ele usa transliteração fonética para converter suas palavras em inglês em scripts nativos instantaneamente.',
    whyChoose: [
      { icon: '⚡', title: 'Conversão Instantânea', description: 'Digite normalmente no seu teclado em inglês e veja a transformação instantânea em script nativo.' },
      { icon: '🌐', title: 'Mais de 20 Idiomas', description: 'Suporte para vários idiomas principais, tudo em um só lugar.' },
      { icon: '💻', title: 'Sem Instalação', description: 'Não requer instalação de software ou layouts de teclado especiais. Basta selecionar seu idioma, digitar normalmente em inglês e ver a conversão ocorrer perfeitamente.' }
    ],
    faqs: [
      { question: 'Como uso esta ferramenta?', answer: 'Basta selecionar o idioma desejado no menu suspenso, clicar dentro da área de texto e começar a digitar foneticamente em inglês. Quando você pressionar Espaço, a palavra será convertida para o script nativo.' },
      { question: 'Funciona offline?', answer: 'Não, esta ferramenta depende de uma API externa (Google Input Tools) para fornecer transliteração precisa, portanto, é necessária uma conexão ativa com a Internet.' }
    ]
  },
  de: {
    name: 'Online-Tippwerkzeug',
    description: 'Tippen Sie phonetisch in über 20 Sprachen mit einer englischen Tastatur',
    whatIs: 'Das Online-Tippwerkzeug ermöglicht es Ihnen, in mehreren Sprachen mit einer Standard-englischen (QWERTY) Tastatur zu tippen. Es verwendet phonetische Transliteration, um Ihre englischen Wörter sofort in muttersprachliche Schriften umzuwandeln.',
    whyChoose: [
      { icon: '⚡', title: 'Sofortige Umwandlung', description: 'Tippen Sie ganz normal auf Ihrer englischen Tastatur und sehen Sie zu, wie es sich sofort in die muttersprachliche Schrift verwandelt.' },
      { icon: '🌐', title: 'Über 20 Sprachen', description: 'Unterstützung für mehrere Hauptsprachen, alles an einem Ort.' },
      { icon: '💻', title: 'Keine Installation', description: 'Es ist keine Softwareinstallation oder spezielle Tastaturlayouts erforderlich. Wählen Sie einfach Ihre Sprache, tippen Sie normal auf Englisch und sehen Sie zu, wie es nahtlos konvertiert wird.' }
    ],
    faqs: [
      { question: 'Wie benutze ich dieses Werkzeug?', answer: 'Wählen Sie einfach Ihre gewünschte Sprache aus dem Dropdown-Menü, klicken Sie in den Textbereich und fangen Sie an, phonetisch auf Englisch zu tippen. Wenn Sie die Leertaste drücken, wird das Wort in die muttersprachliche Schrift konvertiert.' },
      { question: 'Funktioniert es offline?', answer: 'Nein, dieses Werkzeug ist auf eine externe API (Google Input Tools) angewiesen, um eine genaue Transliteration bereitzustellen. Daher ist eine aktive Internetverbindung erforderlich.' }
    ]
  },
  id: {
    name: 'Alat Mengetik Online',
    description: 'Ketik secara fonetik dalam 20+ bahasa menggunakan keyboard bahasa Inggris',
    whatIs: 'Alat Mengetik Online memungkinkan Anda mengetik dalam berbagai bahasa menggunakan keyboard standar bahasa Inggris (QWERTY). Alat ini menggunakan transliterasi fonetik untuk mengubah kata-kata bahasa Inggris Anda menjadi skrip asli secara instan.',
    whyChoose: [
      { icon: '⚡', title: 'Konversi Instan', description: 'Ketik secara normal pada keyboard bahasa Inggris Anda dan saksikan kata itu langsung berubah menjadi skrip asli.' },
      { icon: '🌐', title: '20+ Bahasa', description: 'Dukungan untuk berbagai bahasa utama, semuanya dalam satu tempat.' },
      { icon: '💻', title: 'Tanpa Instalasi', description: 'Alat ini tidak memerlukan instalasi perangkat lunak atau tata letak keyboard khusus. Cukup pilih bahasa Anda, ketik secara normal dalam bahasa Inggris, dan saksikan proses konversinya dengan mulus.' }
    ],
    faqs: [
      { question: 'Bagaimana cara menggunakan alat ini?', answer: 'Cukup pilih bahasa yang Anda inginkan dari dropdown, klik di dalam area teks, dan mulai mengetik secara fonetik dalam bahasa Inggris. Saat Anda menekan Spasi, kata tersebut akan dikonversi ke skrip asli.' },
      { question: 'Apakah alat ini berfungsi secara offline?', answer: 'Tidak, alat ini bergantung pada API eksternal (Google Input Tools) untuk menyediakan transliterasi yang akurat, sehingga diperlukan koneksi internet yang aktif.' }
    ]
  }
};

Object.keys(translations).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'locales', 'content', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.tools && data.tools['online-typing-tool']) {
    data.tools['online-typing-tool'] = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Translated online-typing-tool in ${lang}.json`);
  }
});
