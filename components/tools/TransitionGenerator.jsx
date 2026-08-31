'use client';

import { useState, useEffect } from 'react';

const transitionData = {
  en: {
    addition: ["Additionally", "Furthermore", "Moreover", "In addition", "Also", "Along with", "As well as", "Not to mention", "Equally important"],
    contrast: ["However", "Nevertheless", "On the other hand", "In contrast", "Conversely", "Yet", "Although", "Despite this", "Even so"],
    cause: ["Therefore", "Consequently", "Thus", "As a result", "Because of this", "Hence", "For this reason", "Due to"],
    sequence: ["First of all", "Meanwhile", "Subsequently", "Following this", "Finally", "Next", "Previously", "Simultaneously"],
    conclusion: ["In conclusion", "To sum up", "Ultimately", "Overall", "In summary", "All in all", "To summarize", "As shown above"]
  },
  es: {
    addition: ["Además", "Asimismo", "También", "Por añadidura", "Igualmente", "Junto con", "Así como", "Sin mencionar", "De igual importancia"],
    contrast: ["Sin embargo", "No obstante", "Por otro lado", "En contraste", "Por el contrario", "Aún así", "Aunque", "A pesar de esto", "Aun así"],
    cause: ["Por lo tanto", "En consecuencia", "Así", "Como resultado", "Debido a esto", "Por ende", "Por esta razón", "Debido a"],
    sequence: ["En primer lugar", "Mientras tanto", "Posteriormente", "Después de esto", "Finalmente", "Luego", "Previamente", "Simultáneamente"],
    conclusion: ["En conclusión", "Para resumir", "En última instancia", "En general", "En resumen", "Considerando todo", "Para sintetizar", "Como se ha mostrado"]
  },
  pt: {
    addition: ["Além disso", "Ademais", "Também", "Do mesmo modo", "Igualmente", "Juntamente com", "Bem como", "Sem mencionar", "De igual importância"],
    contrast: ["No entanto", "Não obstante", "Por outro lado", "Em contraste", "Pelo contrário", "Ainda assim", "Embora", "Apesar disso", "Mesmo assim"],
    cause: ["Portanto", "Consequentemente", "Assim", "Como resultado", "Devido a isso", "Por conseguinte", "Por esta razão", "Devido a"],
    sequence: ["Em primeiro lugar", "Enquanto isso", "Subsequentemente", "Após isso", "Finalmente", "Em seguida", "Anteriormente", "Simultaneamente"],
    conclusion: ["Em conclusão", "Para resumir", "Em última análise", "No geral", "Em suma", "Considerando tudo", "Para sintetizar", "Como mostrado acima"]
  },
  de: {
    addition: ["Zusätzlich", "Darüber hinaus", "Außerdem", "Ebenso", "Des Weiteren", "Zusammen mit", "Sowie", "Ganz zu schweigen von", "Ebenso wichtig"],
    contrast: ["Jedoch", "Dennoch", "Andererseits", "Im Gegensatz dazu", "Umgekehrt", "Trotzdem", "Obwohl", "Trotz dieses", "Auch so"],
    cause: ["Daher", "Folglich", "Somit", "Als Ergebnis", "Deshalb", "Infolgedessen", "Aus diesem Grund", "Aufgrund von"],
    sequence: ["Erstens", "Mittlerweile", "Anschließend", "Danach", "Schließlich", "Als nächstes", "Zuvor", "Gleichzeitig"],
    conclusion: ["Zusammenfassend", "Um es zusammenzufassen", "Letztendlich", "Insgesamt", "Kurz gesagt", "Alles in allem", "Abschließend", "Wie oben gezeigt"]
  },
  hi: {
    addition: ["इसके अतिरिक्त", "इसके अलावा", "तथा", "साथ ही", "समान रूप से", "के साथ", "और भी", "जिक्र ना करते हुए", "समान रूप से महत्वपूर्ण"],
    contrast: ["हालाँकि", "तथापि", "दूसरी ओर", "इसके विपरीत", "उल्टे", "फिर भी", "भले ही", "इसके बावजूद", "ऐसा होने पर भी"],
    cause: ["इसलिए", "नतीजतन", "इस प्रकार", "परिणामस्वरूप", "इस कारण से", "अतः", "इस वजह से", "के कारण"],
    sequence: ["सबसे पहले", "इस बीच", "बाद में", "इसके बाद", "अंत में", "अगला", "पहले से", "एक साथ"],
    conclusion: ["निष्कर्ष के तौर पर", "संक्षेप में", "अंततः", "कुल मिलाकर", "सारांश में", "सब मिलाकर", "संक्षेप करने के लिए", "जैसा कि ऊपर दिखाया गया है"]
  },
  id: {
    addition: ["Selain itu", "Selanjutnya", "Terlebih lagi", "Tambahan pula", "Juga", "Bersama dengan", "Serta", "Belum lagi", "Sama pentingnya"],
    contrast: ["Namun", "Meskipun demikian", "Di sisi lain", "Sebaliknya", "Sebaliknya", "Namun demikian", "Meskipun", "Meskipun begitu", "Walaupun demikian"],
    cause: ["Oleh karena itu", "Akibatnya", "Dengan demikian", "Sebagai hasilnya", "Karena itu", "Maka dari itu", "Untuk alasan ini", "Disebabkan oleh"],
    sequence: ["Pertama-tama", "Sementara itu", "Selanjutnya", "Setelah ini", "Akhirnya", "Berikutnya", "Sebelumnya", "Secara bersamaan"],
    conclusion: ["Kesimpulannya", "Untuk meringkas", "Pada akhirnya", "Secara keseluruhan", "Singkatnya", "Secara keseluruhan", "Untuk menyimpulkan", "Seperti yang ditunjukkan"]
  }
};

const categoryLabels = {
  en: { addition: "Addition & Agreement", contrast: "Opposition & Contrast", cause: "Cause & Effect", sequence: "Time & Sequence", conclusion: "Conclusion & Summary" },
  es: { addition: "Adición y Acuerdo", contrast: "Oposición y Contraste", cause: "Causa y Efecto", sequence: "Tiempo y Secuencia", conclusion: "Conclusión y Resumen" },
  pt: { addition: "Adição e Concordância", contrast: "Oposição e Contraste", cause: "Causa e Efeito", sequence: "Tempo e Sequência", conclusion: "Conclusão e Resumo" },
  de: { addition: "Zusatz & Zustimmung", contrast: "Gegensatz & Kontrast", cause: "Ursache & Wirkung", sequence: "Zeit & Abfolge", conclusion: "Fazit & Zusammenfassung" },
  hi: { addition: "जोड़ और सहमति", contrast: "विरोध और कंट्रास्ट", cause: "कारण और प्रभाव", sequence: "समय और क्रम", conclusion: "निष्कर्ष और सारांश" },
  id: { addition: "Penambahan & Persetujuan", contrast: "Oposisi & Kontras", cause: "Sebab & Akibat", sequence: "Waktu & Urutan", conclusion: "Kesimpulan & Ringkasan" }
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`} style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '30px', fontWeight: 600, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000 }}>{type === 'success' ? '✅ ' : '⚠️ '}{message}</div>;
}

export default function TransitionGenerator({ t = {}, lang = 'en' }) {
  const [activeCategory, setActiveCategory] = useState('addition');
  const [toast, setToast] = useState(null);

  // Fallback to english if language data is missing
  const currentData = transitionData[lang] || transitionData['en'];
  const currentLabels = categoryLabels[lang] || categoryLabels['en'];

  const copyWord = (word) => {
    navigator.clipboard.writeText(word);
    setToast({ message: `Copied "${word}"!`, type: 'success' });
  };

  const categories = [
    { id: 'addition', icon: '➕' },
    { id: 'contrast', icon: '⚖️' },
    { id: 'cause', icon: '🎯' },
    { id: 'sequence', icon: '⏳' },
    { id: 'conclusion', icon: '🏁' }
  ];

  return (
    <div className="tool-container-full">
      <div className="tool-panel" style={{ border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
        <div className="tool-panel-header" style={{ background: 'linear-gradient(90deg, #FDF4FF, var(--bg-white))', padding: '24px' }}>
          <div className="tool-panel-title" style={{ color: '#9333EA', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔗</span> TRANSITION WORD GENERATOR
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>
            Find the perfect connecting words to improve the flow and readability of your writing. Click any word to copy it instantly.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                flex: '1 1 auto',
                padding: '16px 20px',
                background: activeCategory === cat.id ? '#F3E8FF' : 'transparent',
                color: activeCategory === cat.id ? '#7E22CE' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: activeCategory === cat.id ? '3px solid #9333EA' : '3px solid transparent',
                fontWeight: activeCategory === cat.id ? 700 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{cat.icon}</span> {currentLabels[cat.id]}
            </button>
          ))}
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-section)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 700 }}>
            {currentLabels[activeCategory]} Phrases
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {currentData[activeCategory].map((word, index) => (
              <button
                key={index}
                onClick={() => copyWord(word)}
                style={{
                  padding: '20px',
                  background: '#fff',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#4B5563',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#C084FC';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(147,51,234,0.1)';
                  e.currentTarget.style.color = '#7E22CE';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                  e.currentTarget.style.color = '#4B5563';
                }}
              >
                {word}
                <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>📋</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
