'use client';

import React, { useState, useRef } from 'react';

const CRIMES = [
  'Grand Theft Auto', 'Armed Robbery', 'Reckless Driving', 'Public Intoxication',
  'Illegal Street Racing', 'Assault with a Flamingo', 'Jaywalking (Aggressively)',
  'Operating a Jetski Without a License', 'Disturbing the Peace', 'Tax Evasion',
  'Illegal Fireworks Display', 'Impersonating a Police Officer', 'Destruction of Property',
  'Smuggling Exotic Animals', 'Possession of Counterfeit Goods', 'Trespassing on Star Island',
];

const NICKNAMES = [
  'The Ghost', 'El Diablo', 'Neon Shadow', 'Vice King', 'Beach Bandit',
  'The Surgeon', 'Snake Eyes', 'Chrome', 'Two-Timer', 'Gator',
  'The Hurricane', 'Scarface Jr.', 'Palm Tree', 'Sunset Runner', 'The Fixer',
];

const STATUSES = ['WANTED', 'AT LARGE', 'PERSON OF INTEREST', 'DANGEROUS'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBounty() {
  const base = [5000, 10000, 25000, 50000, 75000, 100000, 250000, 500000, 1000000];
  return base[Math.floor(Math.random() * base.length)];
}

function generateCaseNo() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `VC-${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function ViceCityRapSheet() {
  const [name, setName] = useState('JASON DE SANTA');
  const [nickname, setNickname] = useState('The Ghost');
  const [age, setAge] = useState('28');
  const [height, setHeight] = useState("5'11\"");
  const [weight, setWeight] = useState('185 lbs');
  const [crime1, setCrime1] = useState('Grand Theft Auto');
  const [crime2, setCrime2] = useState('Armed Robbery');
  const [crime3, setCrime3] = useState('Reckless Driving');
  const [status, setStatus] = useState('WANTED');
  const [bounty, setBounty] = useState(250000);
  const [caseNo, setCaseNo] = useState('VC-JD-2026');
  const sheetRef = useRef(null);

  const handleRandomize = () => {
    setNickname(randomFrom(NICKNAMES));
    setCrime1(randomFrom(CRIMES));
    setCrime2(randomFrom(CRIMES));
    setCrime3(randomFrom(CRIMES));
    setStatus(randomFrom(STATUSES));
    setBounty(randomBounty());
    setCaseNo(generateCaseNo());
  };

  const handleDownload = async () => {
    if (!sheetRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(sheetRef.current, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
      const link = document.createElement('a');
      link.download = `vcpd-rap-sheet-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rs-tool">
      <style jsx>{`
        .rs-tool {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .rs-layout {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .rs-layout { flex-direction: column; }
        }

        /* === RAP SHEET CARD === */
        .rs-card-wrap {
          flex: 1;
          min-width: 0;
        }
        .rs-card {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          background: #fef3c7;
          border-radius: 4px;
          overflow: hidden;
          font-family: 'Courier New', Courier, monospace;
          color: #1c1917;
          user-select: none;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4), inset 0 0 80px rgba(0,0,0,0.05);
          position: relative;
        }
        .rs-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 28px,
            rgba(0, 0, 0, 0.02) 28px,
            rgba(0, 0, 0, 0.02) 29px
          );
          pointer-events: none;
          z-index: 1;
        }
        .rs-card-header {
          background: linear-gradient(180deg, #1e3a5f, #0f2440);
          color: #fff;
          text-align: center;
          padding: 0.85rem 1rem 0.6rem;
          position: relative;
        }
        .rs-card-badge {
          font-size: 0.55rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #93c5fd;
          margin-bottom: 0.15rem;
        }
        .rs-card-title {
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .rs-card-subtitle {
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: #bfdbfe;
          margin-top: 0.15rem;
        }
        .rs-card-body {
          padding: 1rem 1.25rem;
          position: relative;
          z-index: 2;
        }
        .rs-mugshot-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .rs-mugshot {
          width: 110px;
          height: 130px;
          background: #e7e5e4;
          border: 2px solid #78716c;
          border-radius: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          flex-shrink: 0;
          position: relative;
        }
        .rs-mugshot-height {
          position: absolute;
          right: -15px;
          top: 0;
          height: 100%;
          width: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
        }
        .rs-mugshot-line {
          width: 8px;
          height: 1px;
          background: #78716c;
        }
        .rs-info-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.4rem 0.75rem;
        }
        .rs-info-item {
          display: flex;
          flex-direction: column;
        }
        .rs-info-label {
          font-size: 0.5rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #78716c;
        }
        .rs-info-value {
          font-size: 0.8rem;
          font-weight: 900;
          color: #1c1917;
          border-bottom: 1px solid #d6d3d1;
          padding-bottom: 0.15rem;
        }
        .rs-info-value.alias {
          color: #dc2626;
          font-style: italic;
        }
        .rs-divider {
          border: none;
          border-top: 1px dashed #a8a29e;
          margin: 0.75rem 0;
        }
        .rs-charges-title {
          font-size: 0.55rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #78716c;
          margin-bottom: 0.35rem;
        }
        .rs-charge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0;
          border-bottom: 1px dotted #d6d3d1;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .rs-charge-num {
          color: #dc2626;
          font-weight: 900;
          font-size: 0.65rem;
          min-width: 1.2rem;
        }
        .rs-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 0.75rem;
          padding-top: 0.6rem;
          border-top: 2px solid #1e3a5f;
        }
        .rs-status-badge {
          font-size: 0.85rem;
          font-weight: 900;
          color: #fff;
          background: #dc2626;
          padding: 0.25rem 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          display: inline-block;
          transform: rotate(-2deg);
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }
        .rs-bounty {
          text-align: right;
        }
        .rs-bounty-label {
          font-size: 0.45rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #78716c;
        }
        .rs-bounty-amount {
          font-size: 1.4rem;
          font-weight: 900;
          color: #15803d;
        }
        .rs-case-no {
          text-align: center;
          font-size: 0.5rem;
          color: #a8a29e;
          letter-spacing: 0.15em;
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.03);
        }
        /* Stamp overlay */
        .rs-stamp {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-18deg);
          font-size: 3.5rem;
          font-weight: 900;
          color: rgba(220, 38, 38, 0.12);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          pointer-events: none;
          z-index: 3;
          white-space: nowrap;
          font-family: 'Arial Black', Impact, sans-serif;
        }

        /* === CONTROLS === */
        .rs-controls {
          width: 340px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .rs-controls { width: 100%; }
        }
        .rs-ctrl-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .rs-ctrl-field label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rs-ctrl-field input, .rs-ctrl-field select {
          width: 100%;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 0.65rem 0.85rem;
          color: #e2e8f0;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s;
        }
        .rs-ctrl-field input:focus, .rs-ctrl-field select:focus {
          border-color: #ec4899;
          box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.15);
        }
        .rs-ctrl-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .rs-btn {
          width: 100%;
          padding: 0.8rem;
          border: none;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .rs-btn-primary {
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #fff;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
        }
        .rs-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(236, 72, 153, 0.45);
        }
        .rs-btn-secondary {
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid #334155;
        }
        .rs-btn-secondary:hover { background: #334155; }
      `}</style>

      <div className="rs-layout">
        {/* Rap Sheet Card */}
        <div className="rs-card-wrap">
          <div className="rs-card" ref={sheetRef}>
            <div className="rs-stamp">{status}</div>
            <div className="rs-card-header">
              <div className="rs-card-badge">Vice City Police Department</div>
              <div className="rs-card-title">CRIMINAL RECORD</div>
              <div className="rs-card-subtitle">State of Leonida • Bureau of Criminal Identification</div>
            </div>
            <div className="rs-card-body">
              <div className="rs-mugshot-row">
                <div className="rs-mugshot">
                  🧑
                  <div className="rs-mugshot-height">
                    {[...Array(8)].map((_, i) => <div key={i} className="rs-mugshot-line"></div>)}
                  </div>
                </div>
                <div className="rs-info-grid">
                  <div className="rs-info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="rs-info-label">Full Name</span>
                    <span className="rs-info-value">{name || '—'}</span>
                  </div>
                  <div className="rs-info-item">
                    <span className="rs-info-label">Alias</span>
                    <span className="rs-info-value alias">"{nickname}"</span>
                  </div>
                  <div className="rs-info-item">
                    <span className="rs-info-label">Age</span>
                    <span className="rs-info-value">{age || '—'}</span>
                  </div>
                  <div className="rs-info-item">
                    <span className="rs-info-label">Height</span>
                    <span className="rs-info-value">{height || '—'}</span>
                  </div>
                  <div className="rs-info-item">
                    <span className="rs-info-label">Weight</span>
                    <span className="rs-info-value">{weight || '—'}</span>
                  </div>
                </div>
              </div>
              <hr className="rs-divider" />
              <div className="rs-charges-title">Charges Filed</div>
              <div className="rs-charge"><span className="rs-charge-num">01</span> {crime1}</div>
              <div className="rs-charge"><span className="rs-charge-num">02</span> {crime2}</div>
              <div className="rs-charge"><span className="rs-charge-num">03</span> {crime3}</div>
              <div className="rs-card-footer">
                <div className="rs-status-badge">{status}</div>
                <div className="rs-bounty">
                  <div className="rs-bounty-label">Bounty</div>
                  <div className="rs-bounty-amount">${bounty.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="rs-case-no">CASE NO. {caseNo} • CONFIDENTIAL</div>
          </div>
        </div>

        {/* Controls */}
        <div className="rs-controls">
          <div className="rs-ctrl-field">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="JOHN DOE" maxLength={30} />
          </div>
          <div className="rs-ctrl-row">
            <div className="rs-ctrl-field">
              <label>Alias / Nickname</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="The Ghost" maxLength={20} />
            </div>
            <div className="rs-ctrl-field">
              <label>Age</label>
              <input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="28" maxLength={3} />
            </div>
          </div>
          <div className="rs-ctrl-row">
            <div className="rs-ctrl-field">
              <label>Height</label>
              <input type="text" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="5'11&quot;" maxLength={10} />
            </div>
            <div className="rs-ctrl-field">
              <label>Weight</label>
              <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="185 lbs" maxLength={10} />
            </div>
          </div>
          <div className="rs-ctrl-field">
            <label>Charge 1</label>
            <select value={crime1} onChange={(e) => setCrime1(e.target.value)}>
              {CRIMES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="rs-ctrl-field">
            <label>Charge 2</label>
            <select value={crime2} onChange={(e) => setCrime2(e.target.value)}>
              {CRIMES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="rs-ctrl-field">
            <label>Charge 3</label>
            <select value={crime3} onChange={(e) => setCrime3(e.target.value)}>
              {CRIMES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="rs-ctrl-field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="rs-btn rs-btn-secondary" onClick={handleRandomize}>🎲 Randomize</button>
          <button className="rs-btn rs-btn-primary" onClick={handleDownload}>⬇️ Download Rap Sheet</button>
        </div>
      </div>
    </div>
  );
}
