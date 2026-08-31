const fs = require('fs');
let f = fs.readFileSync('components/Footer.jsx', 'utf-8');

// Replace standard links
f = f.replace(/href="(\/[^"]*)"/g, 'href={lp("$1")}');
// Replace template literal links
f = f.replace(/href={`(\/[^`]*)`}/g, 'href={lp(`$1`)}');

// Fix language switcher links manually
f = f.replace(/href={lp\("\/"\)} style={{ color: 'var\(--text-muted\)' }}>🇺🇸 English<\/Link>/, 'href={getLangUrl("en")} style={{ color: \'var(--text-muted)\' }}>🇺🇸 English</Link>');
f = f.replace(/href={lp\("\/hi"\)} style={{ color: 'var\(--text-muted\)' }}>🇮🇳 हिंदी<\/Link>/, 'href={getLangUrl("hi")} style={{ color: \'var(--text-muted)\' }}>🇮🇳 हिंदी</Link>');
f = f.replace(/href={lp\("\/pt"\)} style={{ color: 'var\(--text-muted\)' }}>🇧🇷 Português<\/Link>/, 'href={getLangUrl("pt")} style={{ color: \'var(--text-muted)\' }}>🇧🇷 Português</Link>');
f = f.replace(/href={lp\("\/es"\)} style={{ color: 'var\(--text-muted\)' }}>🇲🇽 Español<\/Link>/, 'href={getLangUrl("es")} style={{ color: \'var(--text-muted)\' }}>🇲🇽 Español</Link>');
f = f.replace(/href={lp\("\/de"\)} style={{ color: 'var\(--text-muted\)' }}>🇩🇪 Deutsch<\/Link>/, 'href={getLangUrl("de")} style={{ color: \'var(--text-muted)\' }}>🇩🇪 Deutsch</Link>');
f = f.replace(/href={lp\("\/id"\)} style={{ color: 'var\(--text-muted\)' }}>🇮🇩 Indonesia<\/Link>/, 'href={getLangUrl("id")} style={{ color: \'var(--text-muted)\' }}>🇮🇩 Indonesia</Link>');


fs.writeFileSync('components/Footer.jsx', f);
console.log('Replaced links in Footer.jsx');
