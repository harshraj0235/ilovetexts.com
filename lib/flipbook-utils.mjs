export const FLIPBOOK_LIMITS = { maxBytes: 50 * 1024 * 1024, maxPages: 40 };

export const FLIPBOOK_TEMPLATES = {
  studio: { name: 'Studio', background: '#111827', surface: '#ffffff', accent: '#f97316' },
  editorial: { name: 'Editorial', background: '#eee7dc', surface: '#fffdf8', accent: '#8b4513' },
  midnight: { name: 'Midnight', background: '#050816', surface: '#10182c', accent: '#7dd3fc' },
  meadow: { name: 'Meadow', background: '#e8f3eb', surface: '#ffffff', accent: '#237a57' },
  gallery: { name: 'Gallery', background: '#f4f4f5', surface: '#ffffff', accent: '#7c3aed' },
};

export function safeFlipbookTitle(value, fallback = 'My flipbook') {
  const cleaned = String(value || '').replace(/[<>\u0000-\u001F]/g, '').trim().replace(/\s+/g, ' ');
  return (cleaned || fallback).slice(0, 100);
}

export function safeHtmlFileName(title) {
  const slug = safeFlipbookTitle(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'flipbook'}.html`;
}

export function buildStandaloneFlipbook({ title, pages, template = 'studio', pageDuration = 650 }) {
  const theme = FLIPBOOK_TEMPLATES[template] || FLIPBOOK_TEMPLATES.studio;
  const safeTitle = safeFlipbookTitle(title);
  const encodedPages = JSON.stringify(pages).replace(/</g, '\\u003c');
  const encodedTitle = JSON.stringify(safeTitle).replace(/</g, '\\u003c');
  const duration = Math.min(1500, Math.max(200, Number(pageDuration) || 650));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</title><style>*{box-sizing:border-box}body{margin:0;background:${theme.background};color:${theme.surface};font-family:system-ui,sans-serif}.app{min-height:100vh;display:grid;grid-template-rows:auto 1fr auto}.bar{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:12px 18px;background:#0008}.title{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.stage{display:grid;place-items:center;padding:20px;overflow:hidden}.page{max-width:min(900px,92vw);max-height:76vh;object-fit:contain;background:${theme.surface};box-shadow:0 25px 70px #0008;transition:transform ${duration}ms cubic-bezier(.2,.8,.2,1),opacity ${duration}ms}.page.turn{transform:perspective(1400px) rotateY(-10deg) scale(.98);opacity:.55}.controls{display:flex;gap:10px;align-items:center;justify-content:center;padding:14px}.controls button{min-width:44px;min-height:42px;border:0;border-radius:10px;background:${theme.accent};color:#fff;font-weight:800;cursor:pointer}.count{min-width:90px;text-align:center}@media(max-width:600px){.stage{padding:10px}.page{max-width:96vw;max-height:72vh}}</style></head><body><main class="app"><header class="bar"><div class="title" id="title"></div><button onclick="document.documentElement.requestFullscreen?.()" aria-label="Fullscreen">⛶</button></header><section class="stage"><img class="page" id="page" alt=""></section><nav class="controls" aria-label="Page navigation"><button id="prev" aria-label="Previous page">←</button><span class="count" id="count"></span><button id="next" aria-label="Next page">→</button></nav></main><script>const pages=${encodedPages},title=${encodedTitle};let i=0;const img=document.getElementById('page'),count=document.getElementById('count');document.getElementById('title').textContent=title;function show(n){if(!pages.length)return;i=(n+pages.length)%pages.length;img.classList.add('turn');setTimeout(()=>{img.src=pages[i];img.alt='Page '+(i+1);count.textContent=(i+1)+' / '+pages.length;img.classList.remove('turn')},${Math.round(duration/3)})}document.getElementById('prev').onclick=()=>show(i-1);document.getElementById('next').onclick=()=>show(i+1);addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(i-1);if(e.key==='ArrowRight'||e.key===' ')show(i+1)});show(0);<\/script></body></html>`;
}
