'use client';

import React, { useState, useRef, useEffect } from 'react';

const PRESET_HEADLINES = [
  { name: 'FLORIDA MAN', headline: 'CAUGHT WRESTLING AN ALLIGATOR OUTSIDE A LIQUOR STORE' },
  { name: 'LEONIDA WOMAN', headline: 'STEALS GOLF CART AND DRIVES TO TACO BELL DRIVE-THRU' },
  { name: 'VICE CITY MAN', headline: 'ROBS BANK WEARING ONLY A COWBOY HAT AND FLIP FLOPS' },
  { name: 'LOCAL RESIDENT', headline: 'ATTEMPTS TO PAY PARKING TICKET WITH CRYPTOCURRENCY' },
  { name: 'FLORIDA MAN', headline: 'USES PET IGUANA AS WEAPON IN ROAD RAGE INCIDENT' },
  { name: 'LEONIDA MAN', headline: 'BREAKS INTO ZOO TO HIGH-FIVE A FLAMINGO' },
];

const TICKER_PRESETS = [
  'BREAKING: LCPD ON HIGH ALERT AS GANG ACTIVITY INCREASES IN VICE CITY... NEW NIGHTCLUB OPENING IN DOWNTOWN LEONIDA...',
  'WEATHER ALERT: TROPICAL STORM APPROACHING LEONIDA COAST... RESIDENTS ADVISED TO STOCK UP ON SUNSCREEN...',
  'TRAFFIC UPDATE: MAJOR PILEUP ON OCEAN DRIVE INVOLVING 3 SUPERCARS AND A GOLF CART...',
];

export default function ViceCityHeadlineGenerator() {
  const [characterName, setCharacterName] = useState('FLORIDA MAN');
  const [headline, setHeadline] = useState('CAUGHT WRESTLING AN ALLIGATOR OUTSIDE A LIQUOR STORE');
  const [ticker, setTicker] = useState(TICKER_PRESETS[0]);
  const [timestamp, setTimestamp] = useState('');
  const [bgStyle, setBgStyle] = useState('sunset');
  const [isAnimating, setIsAnimating] = useState(false);
  const graphicRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setTimestamp(timeString + ' EST');
  }, []);

  const handleRandomize = () => {
    setIsAnimating(true);
    const random = PRESET_HEADLINES[Math.floor(Math.random() * PRESET_HEADLINES.length)];
    setCharacterName(random.name);
    setHeadline(random.headline);
    setTicker(TICKER_PRESETS[Math.floor(Math.random() * TICKER_PRESETS.length)]);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleDownload = async () => {
    if (!graphicRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(graphicRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `vice-city-news-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!graphicRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(graphicRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000',
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          alert('Copied to clipboard!');
        }
      });
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const bgGradients = {
    sunset: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 25%, #e91e63 60%, #ff9800 100%)',
    night: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 40%, #2a2a5e 70%, #0f0f2a 100%)',
    neon: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    ocean: 'linear-gradient(135deg, #0c3547 0%, #1565c0 30%, #00bcd4 60%, #e91e63 100%)',
  };

  return (
    <div className="vc-generator">
      <style jsx>{`
        .vc-generator {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .vc-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .vc-controls { grid-template-columns: 1fr; }
        }
        .vc-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .vc-field label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
        }
        .vc-field input, .vc-field textarea, .vc-field select {
          width: 100%;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          color: #f1f5f9;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.2s;
          outline: none;
        }
        .vc-field input:focus, .vc-field textarea:focus, .vc-field select:focus {
          border-color: #ec4899;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15);
        }
        .vc-field textarea {
          resize: none;
          min-height: 80px;
        }
        .vc-field-full {
          grid-column: 1 / -1;
        }
        .vc-btn-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .vc-btn {
          flex: 1;
          min-width: 140px;
          padding: 0.85rem 1.5rem;
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
        }
        .vc-btn-primary {
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #fff;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
        }
        .vc-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(236, 72, 153, 0.45);
        }
        .vc-btn-secondary {
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid #334155;
        }
        .vc-btn-secondary:hover {
          background: #334155;
        }
        .vc-btn-accent {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          color: #fff;
        }
        .vc-btn-accent:hover {
          transform: translateY(-2px);
        }

        /* === PREVIEW === */
        .vc-preview-wrap {
          background: #0f172a;
          border-radius: 16px;
          padding: 1rem;
          border: 1px solid #1e293b;
        }
        .vc-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding: 0 0.25rem;
        }
        .vc-preview-header span {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
        }
        .vc-preview-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
          color: #22d3ee;
          background: rgba(34, 211, 238, 0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          border: 1px solid rgba(34, 211, 238, 0.2);
        }
        .vc-canvas {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 8px;
          box-shadow: 0 0 60px rgba(0, 0, 0, 0.5);
          font-family: 'Arial Black', 'Impact', system-ui, sans-serif;
          user-select: none;
        }
        .vc-canvas-bg {
          position: absolute;
          inset: 0;
        }
        .vc-scanlines {
          position: absolute;
          inset: 0;
          opacity: 0.06;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          );
          pointer-events: none;
          z-index: 2;
        }
        .vc-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%);
          pointer-events: none;
          z-index: 2;
        }

        /* Channel Bug */
        .vc-channel-bug {
          position: absolute;
          top: 1.25rem;
          right: 1.5rem;
          z-index: 10;
          text-align: right;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        }
        .vc-channel-logo {
          background: linear-gradient(180deg, #dc2626, #991b1b);
          color: #fff;
          font-size: clamp(1rem, 2.5vw, 1.6rem);
          font-weight: 900;
          font-style: italic;
          padding: 0.15em 0.5em;
          letter-spacing: -0.03em;
          border-bottom: 3px solid #facc15;
          line-height: 1.2;
        }
        .vc-channel-sub {
          background: #1e3a8a;
          color: #fff;
          font-size: clamp(0.45rem, 1vw, 0.65rem);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          padding: 0.15em 0.5em;
          display: inline-block;
          margin-top: 2px;
        }

        /* Live Badge */
        .vc-live-badge {
          position: absolute;
          top: 1.25rem;
          left: 1.5rem;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          padding: 0.35em 0.75em;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        }
        .vc-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: vc-pulse 1.5s ease-in-out infinite;
        }
        .vc-live-text {
          color: #fff;
          font-size: clamp(0.55rem, 1.2vw, 0.8rem);
          font-weight: 800;
          letter-spacing: 0.15em;
        }

        /* Lower Thirds */
        .vc-lower-thirds {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 10;
        }
        .vc-breaking-row {
          display: flex;
          align-items: flex-end;
          padding: 0 clamp(0.75rem, 3%, 2rem);
          margin-bottom: 3px;
          gap: 0.5rem;
        }
        .vc-breaking-badge {
          background: linear-gradient(180deg, #ef4444, #b91c1c);
          color: #fff;
          font-size: clamp(0.8rem, 2.2vw, 1.75rem);
          font-weight: 900;
          padding: 0.2em 0.6em;
          display: flex;
          align-items: center;
          gap: 0.4em;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }
        .vc-breaking-pulse {
          width: clamp(6px, 1vw, 10px);
          height: clamp(6px, 1vw, 10px);
          border-radius: 50%;
          background: #fff;
          animation: vc-pulse 1s ease-in-out infinite;
        }
        .vc-time-badge {
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: clamp(0.6rem, 1.5vw, 1.1rem);
          font-weight: 700;
          padding: 0.3em 0.6em;
          border-left: 3px solid #ef4444;
          white-space: nowrap;
        }
        .vc-name-row {
          padding: 0 clamp(0.75rem, 3%, 2rem);
        }
        .vc-name-bar {
          display: inline-block;
          background: linear-gradient(180deg, #ef4444, #dc2626);
          color: #fff;
          font-size: clamp(1rem, 3.5vw, 2.8rem);
          font-weight: 900;
          padding: 0.1em 0.5em;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          border-top: 2px solid rgba(255, 255, 255, 0.3);
        }
        .vc-headline-row {
          padding: 0 clamp(0.75rem, 3%, 2rem);
          margin-top: 2px;
        }
        .vc-headline-bar {
          background: #fff;
          color: #0a0a0a;
          font-size: clamp(0.8rem, 2.8vw, 2.2rem);
          font-weight: 900;
          padding: 0.2em 0.5em;
          text-transform: uppercase;
          line-height: 1.15;
          border-bottom: 4px solid #1e40af;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .vc-ticker-wrap {
          width: 100%;
          background: linear-gradient(90deg, #1e3a8a, #1e40af, #1e3a8a);
          display: flex;
          align-items: center;
          height: clamp(1.5rem, 4vw, 2.75rem);
          margin-top: 6px;
          overflow: hidden;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          position: relative;
        }
        .vc-ticker-label {
          background: #facc15;
          color: #0a0a0a;
          font-weight: 900;
          font-size: clamp(0.5rem, 1.2vw, 0.85rem);
          padding: 0 clamp(0.5rem, 1.5vw, 1rem);
          height: 100%;
          display: flex;
          align-items: center;
          white-space: nowrap;
          z-index: 5;
          position: relative;
          box-shadow: 4px 0 15px rgba(0, 0, 0, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .vc-ticker-text {
          flex: 1;
          overflow: hidden;
          white-space: nowrap;
          color: #fff;
          font-weight: 700;
          font-size: clamp(0.45rem, 1.1vw, 0.8rem);
          letter-spacing: 0.04em;
        }
        .vc-ticker-scroll {
          display: inline-block;
          animation: vc-marquee 25s linear infinite;
          padding-left: 1rem;
        }

        /* BG Styles */
        .vc-bg-sunset {
          background: linear-gradient(135deg, #1a0533 0%, #2d1b69 25%, #c2185b 55%, #e65100 90%);
        }
        .vc-bg-night {
          background: linear-gradient(180deg, #020617 0%, #0f172a 40%, #1e1b4b 80%, #312e81 100%);
        }
        .vc-bg-neon {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
        }
        .vc-bg-ocean {
          background: linear-gradient(135deg, #064e3b 0%, #0e7490 35%, #0284c7 65%, #7c3aed 100%);
        }

        /* Palm tree silhouettes for sunset */
        .vc-palm {
          position: absolute;
          bottom: 25%;
          z-index: 1;
        }
        .vc-palm-1 {
          left: 5%;
          width: clamp(40px, 10vw, 100px);
          height: clamp(80px, 20vw, 200px);
          background: linear-gradient(to top, #000 0%, #000 60%, transparent 60%);
          clip-path: polygon(50% 0%, 30% 25%, 0% 35%, 20% 45%, 5% 55%, 25% 60%, 15% 75%, 35% 70%, 40% 100%, 60% 100%, 65% 70%, 85% 75%, 75% 60%, 95% 55%, 80% 45%, 100% 35%, 70% 25%);
          opacity: 0.25;
        }
        .vc-palm-2 {
          right: 15%;
          width: clamp(30px, 8vw, 80px);
          height: clamp(60px, 16vw, 160px);
          background: #000;
          clip-path: polygon(50% 0%, 30% 25%, 0% 35%, 20% 45%, 5% 55%, 25% 60%, 15% 75%, 35% 70%, 40% 100%, 60% 100%, 65% 70%, 85% 75%, 75% 60%, 95% 55%, 80% 45%, 100% 35%, 70% 25%);
          opacity: 0.15;
        }
        .vc-city-silhouette {
          position: absolute;
          bottom: 20%;
          left: 0;
          width: 100%;
          height: 30%;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
          z-index: 1;
        }

        /* Style Selector */
        .vc-style-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .vc-style-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #334155;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .vc-style-btn:hover {
          transform: scale(1.1);
        }
        .vc-style-btn.active {
          border-color: #ec4899;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.3);
        }
        .vc-style-sunset { background: linear-gradient(135deg, #2d1b69, #e91e63, #ff9800); }
        .vc-style-night { background: linear-gradient(135deg, #020617, #1e1b4b, #312e81); }
        .vc-style-neon { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); }
        .vc-style-ocean { background: linear-gradient(135deg, #064e3b, #0284c7, #7c3aed); }

        @keyframes vc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes vc-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes vc-flash-in {
          0% { opacity: 0; transform: scaleX(0.8); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        .vc-animate-in {
          animation: vc-flash-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Preview */}
      <div className="vc-preview-wrap">
        <div className="vc-preview-header">
          <span>📺 Live Preview</span>
          <span className="vc-preview-badge">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', display: 'inline-block' }}></span>
            1920 × 1080
          </span>
        </div>
        <div className={`vc-canvas ${isAnimating ? 'vc-animate-in' : ''}`} ref={graphicRef}>
          <div className={`vc-canvas-bg vc-bg-${bgStyle}`}></div>
          <div className="vc-scanlines"></div>
          <div className="vc-vignette"></div>
          {bgStyle === 'sunset' && (
            <>
              <div className="vc-palm vc-palm-1"></div>
              <div className="vc-palm vc-palm-2"></div>
            </>
          )}
          <div className="vc-city-silhouette"></div>

          {/* Live badge */}
          <div className="vc-live-badge">
            <div className="vc-live-dot"></div>
            <span className="vc-live-text">LIVE</span>
          </div>

          {/* Channel Bug */}
          <div className="vc-channel-bug">
            <div className="vc-channel-logo">WEAZEL</div>
            <div className="vc-channel-sub">Vice City News</div>
          </div>

          {/* Lower Thirds */}
          <div className="vc-lower-thirds">
            <div className="vc-breaking-row">
              <div className="vc-breaking-badge">
                <div className="vc-breaking-pulse"></div>
                BREAKING NEWS
              </div>
              <div className="vc-time-badge">{timestamp}</div>
            </div>
            <div className="vc-name-row">
              <div className="vc-name-bar">{characterName || 'SUBJECT NAME'}</div>
            </div>
            <div className="vc-headline-row">
              <div className="vc-headline-bar">{headline || 'ENTER YOUR HEADLINE...'}</div>
            </div>
            <div className="vc-ticker-wrap">
              <div className="vc-ticker-label">WZN UPDATE</div>
              <div className="vc-ticker-text">
                <span className="vc-ticker-scroll">
                  {ticker} &nbsp;&bull;&nbsp; {ticker} &nbsp;&bull;&nbsp; {ticker}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="vc-controls">
        <div className="vc-field">
          <label>Subject / Name</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value.toUpperCase())}
            placeholder="E.G. FLORIDA MAN"
            maxLength={30}
          />
        </div>
        <div className="vc-field">
          <label>Background Style</label>
          <div className="vc-style-selector" style={{ paddingTop: '0.3rem' }}>
            {['sunset', 'night', 'neon', 'ocean'].map((s) => (
              <button key={s} className={`vc-style-btn vc-style-${s} ${bgStyle === s ? 'active' : ''}`} onClick={() => setBgStyle(s)} title={s} />
            ))}
          </div>
        </div>
        <div className="vc-field vc-field-full">
          <label>Main Headline</label>
          <textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value.toUpperCase())}
            placeholder="WHAT DID THEY DO?"
            maxLength={120}
          />
        </div>
        <div className="vc-field vc-field-full">
          <label>Scrolling Ticker Text</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="SCROLLING TEXT..."
            maxLength={200}
          />
        </div>
        <div className="vc-field vc-field-full">
          <div className="vc-btn-row">
            <button className="vc-btn vc-btn-secondary" onClick={handleRandomize}>🎲 Randomize</button>
            <button className="vc-btn vc-btn-accent" onClick={handleCopyToClipboard}>📋 Copy Image</button>
            <button className="vc-btn vc-btn-primary" onClick={handleDownload}>⬇️ Download PNG</button>
          </div>
        </div>
      </div>
    </div>
  );
}
