'use client';

import React, { useState, useRef } from 'react';

const PLATE_STYLES = {
  leonida: {
    label: 'Leonida (Default)',
    bg: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 30%, #fbbf24 100%)',
    textColor: '#1e3a5f',
    stateText: 'LEONIDA',
    motto: 'THE SUNSHINE STATE',
    borderColor: '#92400e',
    accent: '#dc2626',
  },
  vicecity: {
    label: 'Vice City',
    bg: 'linear-gradient(180deg, #fce7f3 0%, #f9a8d4 40%, #ec4899 100%)',
    textColor: '#4c1d95',
    stateText: 'VICE CITY',
    motto: 'CITY OF NEON',
    borderColor: '#7c3aed',
    accent: '#7c3aed',
  },
  ocean: {
    label: 'Ocean Beach',
    bg: 'linear-gradient(180deg, #cffafe 0%, #67e8f9 30%, #06b6d4 100%)',
    textColor: '#0c4a6e',
    stateText: 'LEONIDA',
    motto: 'OCEAN BEACH',
    borderColor: '#0e7490',
    accent: '#0891b2',
  },
  classic: {
    label: 'Retro 80s',
    bg: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
    textColor: '#f0abfc',
    stateText: 'VICE CITY',
    motto: '★ SINCE 1986 ★',
    borderColor: '#a855f7',
    accent: '#e879f9',
  },
};

export default function ViceCityLicensePlate() {
  const [plateText, setPlateText] = useState('GTA6FAN');
  const [style, setStyle] = useState('leonida');
  const plateRef = useRef(null);

  const currentStyle = PLATE_STYLES[style];

  const handleDownload = async () => {
    if (!plateRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(plateRef.current, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      const link = document.createElement('a');
      link.download = `vice-city-plate-${plateText || 'custom'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="lp-generator">
      <style jsx>{`
        .lp-generator {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          align-items: center;
        }
        .lp-preview-area {
          display: flex;
          justify-content: center;
          padding: 3rem 1rem;
          width: 100%;
          background: #0f172a;
          border-radius: 16px;
          border: 1px solid #1e293b;
          position: relative;
          overflow: hidden;
        }
        .lp-preview-area::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* === PLATE === */
        .lp-plate {
          width: 420px;
          max-width: 90vw;
          aspect-ratio: 2 / 1;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow:
            0 2px 0 rgba(0,0,0,0.3),
            0 8px 25px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.3),
            inset 0 -1px 0 rgba(0,0,0,0.15);
          padding: 0.5rem;
          user-select: none;
        }
        .lp-plate-border {
          position: absolute;
          inset: 6px;
          border: 2px solid;
          border-radius: 8px;
          pointer-events: none;
        }
        .lp-bolts {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .lp-bolt {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #d4d4d8, #71717a);
          border: 1px solid #52525b;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.4);
        }
        .lp-bolt-tl { top: 12px; left: 12px; }
        .lp-bolt-tr { top: 12px; right: 12px; }
        .lp-bolt-bl { bottom: 12px; left: 12px; }
        .lp-bolt-br { bottom: 12px; right: 12px; }

        .lp-state-text {
          font-size: clamp(0.7rem, 3vw, 1.1rem);
          font-weight: 900;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin-bottom: 0.15rem;
          text-shadow: 0 1px 0 rgba(255,255,255,0.3);
        }
        .lp-main-text {
          font-family: 'Arial Black', Impact, sans-serif;
          font-size: clamp(2.5rem, 10vw, 4.5rem);
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          line-height: 1;
          text-shadow: 
            1px 1px 0 rgba(0,0,0,0.1),
            0 2px 4px rgba(0,0,0,0.1);
          min-height: 1.2em;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-motto {
          font-size: clamp(0.5rem, 2vw, 0.7rem);
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-top: 0.15rem;
          opacity: 0.8;
        }
        .lp-reg-sticker {
          position: absolute;
          bottom: 14px;
          right: 22px;
          width: clamp(22px, 5vw, 32px);
          height: clamp(22px, 5vw, 32px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(0.4rem, 1.2vw, 0.55rem);
          font-weight: 900;
          color: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        /* Controls */
        .lp-controls {
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .lp-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .lp-field label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .lp-input {
          width: 100%;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          color: #f1f5f9;
          font-size: 1.2rem;
          font-family: 'Arial Black', Impact, sans-serif;
          text-align: center;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          outline: none;
          transition: all 0.2s;
        }
        .lp-input:focus {
          border-color: #ec4899;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15);
        }
        .lp-char-count {
          text-align: right;
          font-size: 0.7rem;
          color: #64748b;
        }
        .lp-style-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        .lp-style-option {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.65rem 0.85rem;
          background: #1e293b;
          border: 2px solid #334155;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          color: #e2e8f0;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .lp-style-option:hover { border-color: #64748b; }
        .lp-style-option.active {
          border-color: #ec4899;
          background: rgba(236, 72, 153, 0.08);
        }
        .lp-style-swatch {
          width: 28px;
          height: 16px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .lp-btn-row {
          display: flex;
          gap: 0.75rem;
        }
        .lp-btn {
          flex: 1;
          padding: 0.85rem;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #fff;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
        }
        .lp-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(236, 72, 153, 0.45);
        }
      `}</style>

      {/* Preview */}
      <div className="lp-preview-area">
        <div
          className="lp-plate"
          ref={plateRef}
          style={{ background: currentStyle.bg, borderColor: currentStyle.borderColor, border: `3px solid ${currentStyle.borderColor}` }}
        >
          <div className="lp-plate-border" style={{ borderColor: currentStyle.borderColor + '60' }}></div>
          <div className="lp-bolts">
            <div className="lp-bolt lp-bolt-tl"></div>
            <div className="lp-bolt lp-bolt-tr"></div>
            <div className="lp-bolt lp-bolt-bl"></div>
            <div className="lp-bolt lp-bolt-br"></div>
          </div>
          <div className="lp-state-text" style={{ color: currentStyle.textColor }}>{currentStyle.stateText}</div>
          <div className="lp-main-text" style={{ color: currentStyle.textColor }}>{plateText || '•••••••'}</div>
          <div className="lp-motto" style={{ color: currentStyle.textColor }}>{currentStyle.motto}</div>
          <div className="lp-reg-sticker" style={{ background: currentStyle.accent }}>2026</div>
        </div>
      </div>

      {/* Controls */}
      <div className="lp-controls">
        <div className="lp-field">
          <label>Plate Text</label>
          <input
            className="lp-input"
            type="text"
            value={plateText}
            onChange={(e) => setPlateText(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 7))}
            placeholder="GTA6FAN"
            maxLength={7}
          />
          <span className="lp-char-count">{plateText.length} / 7</span>
        </div>
        <div className="lp-field">
          <label>Plate Style</label>
          <div className="lp-style-grid">
            {Object.entries(PLATE_STYLES).map(([key, s]) => (
              <div key={key} className={`lp-style-option ${style === key ? 'active' : ''}`} onClick={() => setStyle(key)}>
                <div className="lp-style-swatch" style={{ background: s.bg }}></div>
                {s.label}
              </div>
            ))}
          </div>
        </div>
        <div className="lp-btn-row">
          <button className="lp-btn" onClick={handleDownload}>⬇️ Download Plate</button>
        </div>
      </div>
    </div>
  );
}
