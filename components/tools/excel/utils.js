// ─── SheetJS lazy loader ──────────────────────────────────────────────────────
export async function getXLSX() { return await import('xlsx'); }

// ─── Column / cell helpers ────────────────────────────────────────────────────
export function colLetter(i) {
  let s = '', n = i + 1;
  while (n > 0) { const r = (n-1)%26; s = String.fromCharCode(65+r)+s; n = Math.floor((n-1)/26); }
  return s;
}
export function cellAddr(r, c) { return `${colLetter(c)}${r + 1}`; }

// ─── Cell-type detectors ──────────────────────────────────────────────────────
export const EXCEL_ERRORS = ['#REF!','#VALUE!','#NAME?','#DIV/0!','#N/A','#NULL!','#NUM!','#GETTING_DATA'];
export function hasError(v) { return EXCEL_ERRORS.some(e => String(v ?? '').includes(e)); }
export function isNumericStr(v) {
  const s = String(v ?? '').trim();
  return s !== '' && !isNaN(Number(s)) && isNaN(v);
}
export function looksLikeDate(v) {
  const s = String(v ?? '').trim();
  if (!s || !isNaN(Number(s))) return false;
  return /\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(s) || /^\d{1,2}\s+\w+\s+\d{4}/.test(s);
}
export function hasLeadingTrailingSpace(v) { const s = String(v ?? ''); return s !== s.trim() && s.trim() !== ''; }
export function isBlankRow(row) { return row.every(c => String(c ?? '').trim() === ''); }

// ─── Shared CSS (injected once in the root wrapper) ───────────────────────────
export const CSS = `
@keyframes slideUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes tourFade{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
.xd-wrap *{box-sizing:border-box}
.xd-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;border:1px solid var(--border-light);background:var(--bg-main);color:var(--text-primary);font-size:.83rem;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit}
.xd-btn:hover{background:var(--bg-tertiary);border-color:var(--border-strong)}
.xd-btn:disabled{opacity:.4;cursor:not-allowed}
.xd-btn.primary{background:#16a34a;color:#fff;border-color:#16a34a}
.xd-btn.primary:hover{background:#15803d}
.xd-btn.danger{background:#ef4444;color:#fff;border-color:#ef4444}
.xd-btn.danger:hover{background:#dc2626}
.xd-btn.blue{background:#2563eb;color:#fff;border-color:#2563eb}
.xd-btn.blue:hover{background:#1d4ed8}
.xd-btn.ghost{background:transparent;border-color:transparent}
.xd-btn.ghost:hover{background:var(--bg-secondary)}
.xd-tab{padding:8px 14px;border:none;border-bottom:2px solid transparent;background:none;cursor:pointer;font-size:.83rem;color:var(--text-secondary);transition:all .15s;white-space:nowrap;font-family:inherit;flex-shrink:0}
.xd-tab.active{border-bottom-color:#16a34a;color:#16a34a;font-weight:700}
.xd-tab:hover:not(.active){color:var(--text-primary);background:var(--bg-secondary)}
.xd-input{padding:7px 11px;border:1px solid var(--border-light);border-radius:7px;background:var(--bg-main);color:var(--text-primary);font-size:.85rem;font-family:inherit}
.xd-input:focus{outline:none;border-color:#16a34a;box-shadow:0 0 0 2px rgba(22,163,74,.15)}
.xd-card{background:var(--bg-main);border:1px solid var(--border-light);border-radius:12px;padding:16px}
.xd-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:.72rem;font-weight:700}
.xd-cell:hover{background:rgba(22,163,74,.05)!important}
.xd-cell.selected{outline:2px solid #16a34a!important;background:rgba(22,163,74,.08)!important}
.xd-cell.error-cell{background:rgba(239,68,68,.08)!important}
.xd-cell.warn-cell{background:rgba(245,158,11,.08)!important}
.xd-hdr-btn:hover{background:rgba(0,0,0,.05)!important}
.xd-issue-row{padding:10px 14px;border-radius:8px;border:1px solid var(--border-light);cursor:pointer;transition:all .15s;display:flex;align-items:flex-start;gap:10px}
.xd-issue-row:hover{border-color:#16a34a;background:rgba(22,163,74,.04)}
.xd-issue-row.critical{border-left:3px solid #ef4444}
.xd-issue-row.warning{border-left:3px solid #f59e0b}
.xd-issue-row.info{border-left:3px solid #3b82f6}
.xd-issue-row.success{border-left:3px solid #16a34a}
.xd-score-ring{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800}
.xd-chat-bubble{padding:10px 14px;border-radius:10px;font-size:.88rem;line-height:1.55;max-width:90%;animation:slideUp .2s ease}
.xd-chat-bubble.user{background:#16a34a;color:#fff;margin-left:auto;border-bottom-right-radius:3px}
.xd-chat-bubble.ai{background:var(--bg-secondary);color:var(--text-primary);border-bottom-left-radius:3px}
.xd-diff-add{background:#dcfce7;color:#15803d}
.xd-diff-remove{background:#fee2e2;color:#dc2626}
.xd-diff-change{background:#fef9c3;color:#854d0e}
.xd-wrap.fullscreen{position:fixed;inset:0;z-index:10000;background:var(--bg-main);overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column}
.xd-wrap.fullscreen .xd-table-container{max-height:calc(100vh - 240px)!important}
.xd-wrap.fullscreen .xd-chat-area{height:calc(100vh - 280px)!important}
.xd-wrap:fullscreen{background:var(--bg-main)}
.xd-wrap:-webkit-full-screen{background:var(--bg-main)}
#xd-tabbar::-webkit-scrollbar{display:none}
/* Tour */
.xd-tour-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10100;display:flex;align-items:center;justify-content:center}
.xd-tour-box{background:var(--bg-main);border-radius:16px;padding:28px 32px;max-width:460px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.35);animation:tourFade .25s ease}
/* Search dropdown */
.xd-search-drop{position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--bg-main);border:1px solid var(--border-light);border-radius:10px;box-shadow:var(--shadow-float);z-index:200;max-height:320px;overflow-y:auto}
.xd-search-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .12s}
.xd-search-item:hover{background:var(--bg-secondary)}
`;
