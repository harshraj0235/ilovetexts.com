'use client';

import { useState } from 'react';

export default function EmbedWidget({ toolUrl, toolName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derive the embed URL from the tool URL by inserting /embed/
  // e.g. https://ilovetexts.com/en/text-converter/uppercase -> https://ilovetexts.com/embed/en/text-converter/uppercase
  const getEmbedUrl = () => {
    try {
      const url = new URL(toolUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      // If pathParts.length is 2, it's English (no lang prefix). If 3, it has a lang prefix.
      const embedPath = pathParts.length === 2 
        ? `/embed/en${url.pathname}` 
        : `/embed${url.pathname}`;
      return `${url.origin}${embedPath}`;
    } catch (e) {
      return '';
    }
  };

  const embedCode = `<iframe src="${getEmbedUrl()}" width="100%" height="600" style="border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" title="${toolName} by ilovetexts.com"></iframe><div style="text-align: right; font-size: 12px; margin-top: 4px; font-family: sans-serif;">Powered by <a href="https://ilovetexts.com" style="color: #3b82f6; text-decoration: none;">ilovetexts.com</a></div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button 
        className="share-btn share-embed" 
        onClick={() => setIsOpen(true)}
        aria-label="Embed this tool" 
        title="Embed"
        style={{ fontSize: '1rem', padding: '0 8px', fontWeight: 'bold' }}
      >
        &lt;/&gt;
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card, #fff)', 
            color: 'var(--text-main, #333)',
            padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '600px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem' }}>Embed {toolName}</h3>
            <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted, #666)' }}>
              Copy the code below to embed this tool on your own website or blog. 
              The embedded tool is fully functional and free of ads.
            </p>
            
            <textarea 
              readOnly 
              value={embedCode}
              style={{
                width: '100%', height: '120px', padding: '12px', 
                fontFamily: 'monospace', fontSize: '0.85rem',
                border: '1px solid var(--border-color, #e2e8f0)', 
                borderRadius: '6px', backgroundColor: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-main, #333)',
                resize: 'none', marginBottom: '16px'
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '8px 16px', border: 'none', background: 'transparent',
                  color: 'var(--text-muted, #666)', cursor: 'pointer', fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCopy}
                style={{
                  padding: '8px 16px', border: 'none', borderRadius: '6px',
                  background: copied ? '#10b981' : '#3b82f6', color: '#fff',
                  cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s'
                }}
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
