'use client';

import React, { useState } from 'react';

const COMPONENT_OPTIONS = {
  gpu: [
    { name: 'Select your GPU...', score: 0 },
    { name: 'NVIDIA RTX 5090', score: 100 },
    { name: 'NVIDIA RTX 5080', score: 95 },
    { name: 'NVIDIA RTX 5070 Ti', score: 88 },
    { name: 'NVIDIA RTX 5070', score: 82 },
    { name: 'NVIDIA RTX 4090', score: 92 },
    { name: 'NVIDIA RTX 4080 Super', score: 85 },
    { name: 'NVIDIA RTX 4070 Ti Super', score: 78 },
    { name: 'NVIDIA RTX 4070 Super', score: 72 },
    { name: 'NVIDIA RTX 4070', score: 65 },
    { name: 'NVIDIA RTX 4060 Ti', score: 55 },
    { name: 'NVIDIA RTX 4060', score: 45 },
    { name: 'NVIDIA RTX 3090', score: 70 },
    { name: 'NVIDIA RTX 3080', score: 62 },
    { name: 'NVIDIA RTX 3070', score: 52 },
    { name: 'NVIDIA RTX 3060', score: 38 },
    { name: 'NVIDIA GTX 1660 Super', score: 20 },
    { name: 'NVIDIA GTX 1650', score: 10 },
    { name: 'AMD RX 9070 XT', score: 83 },
    { name: 'AMD RX 9070', score: 75 },
    { name: 'AMD RX 7900 XTX', score: 88 },
    { name: 'AMD RX 7900 XT', score: 80 },
    { name: 'AMD RX 7800 XT', score: 65 },
    { name: 'AMD RX 7700 XT', score: 55 },
    { name: 'AMD RX 7600', score: 40 },
    { name: 'AMD RX 6800 XT', score: 55 },
    { name: 'AMD RX 6700 XT', score: 40 },
    { name: 'AMD RX 6600', score: 28 },
    { name: 'Intel Arc B580', score: 38 },
    { name: 'Intel Arc A770', score: 42 },
  ],
  cpu: [
    { name: 'Select your CPU...', score: 0 },
    { name: 'AMD Ryzen 9 9950X', score: 100 },
    { name: 'AMD Ryzen 9 7950X', score: 95 },
    { name: 'AMD Ryzen 7 9800X3D', score: 98 },
    { name: 'AMD Ryzen 7 7800X3D', score: 92 },
    { name: 'AMD Ryzen 7 5800X3D', score: 80 },
    { name: 'AMD Ryzen 7 5800X', score: 72 },
    { name: 'AMD Ryzen 5 7600X', score: 75 },
    { name: 'AMD Ryzen 5 5600X', score: 62 },
    { name: 'AMD Ryzen 5 5600', score: 58 },
    { name: 'AMD Ryzen 5 3600', score: 35 },
    { name: 'Intel Core Ultra 9 285K', score: 96 },
    { name: 'Intel Core i9-14900K', score: 94 },
    { name: 'Intel Core i9-13900K', score: 90 },
    { name: 'Intel Core i7-14700K', score: 85 },
    { name: 'Intel Core i7-13700K', score: 82 },
    { name: 'Intel Core i7-12700K', score: 72 },
    { name: 'Intel Core i5-14600K', score: 75 },
    { name: 'Intel Core i5-13600K', score: 70 },
    { name: 'Intel Core i5-12400F', score: 55 },
    { name: 'Intel Core i5-10400', score: 35 },
    { name: 'Intel Core i3-12100F', score: 30 },
  ],
  ram: [
    { name: 'Select your RAM...', score: 0 },
    { name: '64 GB DDR5', score: 100 },
    { name: '32 GB DDR5', score: 95 },
    { name: '32 GB DDR4', score: 80 },
    { name: '24 GB DDR5', score: 75 },
    { name: '16 GB DDR5', score: 60 },
    { name: '16 GB DDR4', score: 50 },
    { name: '8 GB DDR4', score: 15 },
    { name: '8 GB DDR3', score: 5 },
  ],
  storage: [
    { name: 'Select your storage...', score: 0 },
    { name: 'NVMe Gen5 SSD', score: 100 },
    { name: 'NVMe Gen4 SSD', score: 90 },
    { name: 'NVMe Gen3 SSD', score: 75 },
    { name: 'SATA SSD', score: 50 },
    { name: 'HDD (7200 RPM)', score: 15 },
    { name: 'HDD (5400 RPM)', score: 5 },
  ],
};

function getVerdict(score) {
  if (score >= 90) return { label: 'ULTRA READY', emoji: '🟢', color: '#22c55e', desc: 'Your PC will crush GTA 6 at max settings. You\'re ready for 4K Ultra with ray tracing.' };
  if (score >= 75) return { label: 'HIGH READY', emoji: '🟢', color: '#4ade80', desc: 'You\'ll run GTA 6 very well at high/ultra settings at 1440p. Great build!' };
  if (score >= 60) return { label: 'MEDIUM-HIGH', emoji: '🟡', color: '#facc15', desc: 'GTA 6 will run at medium-high settings at 1080p. Consider upgrading your GPU for better performance.' };
  if (score >= 40) return { label: 'PLAYABLE', emoji: '🟠', color: '#f97316', desc: 'You\'ll be able to play GTA 6 at low-medium settings. Expect 30-60 FPS at 1080p.' };
  if (score >= 20) return { label: 'BELOW MINIMUM', emoji: '🔴', color: '#ef4444', desc: 'Your PC is below the expected minimum specs. Major upgrades needed.' };
  return { label: 'NOT READY', emoji: '❌', color: '#dc2626', desc: 'Your hardware is too old for GTA 6. A new build is recommended.' };
}

export default function Gta6PcBuilder() {
  const [gpu, setGpu] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [ram, setRam] = useState(0);
  const [storage, setStorage] = useState(0);
  const [checked, setChecked] = useState(false);

  const gpuScore = COMPONENT_OPTIONS.gpu[gpu]?.score || 0;
  const cpuScore = COMPONENT_OPTIONS.cpu[cpu]?.score || 0;
  const ramScore = COMPONENT_OPTIONS.ram[ram]?.score || 0;
  const storageScore = COMPONENT_OPTIONS.storage[storage]?.score || 0;

  const totalScore = Math.round(gpuScore * 0.45 + cpuScore * 0.3 + ramScore * 0.15 + storageScore * 0.1);
  const verdict = getVerdict(totalScore);

  const handleCheck = () => {
    if (gpu === 0 || cpu === 0 || ram === 0 || storage === 0) {
      alert('Please select all components first!');
      return;
    }
    setChecked(true);
  };

  return (
    <div className="pc-builder">
      <style jsx>{`
        .pc-builder {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .pc-specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .pc-specs-grid { grid-template-columns: 1fr; }
        }
        .pc-spec-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          transition: border-color 0.2s;
        }
        .pc-spec-card:focus-within {
          border-color: #ec4899;
        }
        .pc-spec-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .pc-spec-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .pc-spec-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pc-spec-sublabel {
          font-size: 0.65rem;
          color: #64748b;
        }
        .pc-select {
          width: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 0.7rem 0.85rem;
          color: #e2e8f0;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%2394a3b8' viewBox='0 0 20 20'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7rem center;
          background-size: 1.2rem;
          padding-right: 2.5rem;
        }
        .pc-select:focus {
          border-color: #ec4899;
          box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.15);
        }
        .pc-score-bar-bg {
          height: 6px;
          border-radius: 3px;
          background: #1e293b;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .pc-score-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease, background 0.3s;
        }
        .pc-check-btn {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #fff;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pc-check-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(236, 72, 153, 0.45);
        }

        /* Result */
        .pc-result {
          background: #0f172a;
          border-radius: 16px;
          border: 1px solid #1e293b;
          padding: 2rem;
          text-align: center;
          animation: pc-fade-in 0.5s ease;
        }
        .pc-result-score {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 0.5rem;
        }
        .pc-result-label {
          font-size: 1.2rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
        }
        .pc-result-desc {
          color: #94a3b8;
          font-size: 0.95rem;
          max-width: 500px;
          margin: 0 auto 1.5rem;
          line-height: 1.6;
        }
        .pc-breakdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        @media (max-width: 640px) {
          .pc-breakdown { grid-template-columns: repeat(2, 1fr); }
        }
        .pc-bd-item {
          background: #1e293b;
          border-radius: 10px;
          padding: 0.85rem 0.5rem;
          text-align: center;
        }
        .pc-bd-icon {
          font-size: 1.3rem;
          margin-bottom: 0.3rem;
        }
        .pc-bd-score {
          font-size: 1.4rem;
          font-weight: 800;
          color: #f1f5f9;
        }
        .pc-bd-label {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pc-gauge-ring {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .pc-gauge-inner {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        @keyframes pc-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Spec Cards */}
      <div className="pc-specs-grid">
        <div className="pc-spec-card">
          <div className="pc-spec-header">
            <div className="pc-spec-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>🎮</div>
            <div>
              <div className="pc-spec-label">Graphics Card (GPU)</div>
              <div className="pc-spec-sublabel">Most important for gaming</div>
            </div>
          </div>
          <select className="pc-select" value={gpu} onChange={(e) => { setGpu(Number(e.target.value)); setChecked(false); }}>
            {COMPONENT_OPTIONS.gpu.map((g, i) => <option key={i} value={i}>{g.name}</option>)}
          </select>
          {gpu > 0 && <div className="pc-score-bar-bg"><div className="pc-score-bar-fill" style={{ width: `${gpuScore}%`, background: gpuScore >= 60 ? '#22c55e' : gpuScore >= 30 ? '#facc15' : '#ef4444' }}></div></div>}
        </div>

        <div className="pc-spec-card">
          <div className="pc-spec-header">
            <div className="pc-spec-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>⚡</div>
            <div>
              <div className="pc-spec-label">Processor (CPU)</div>
              <div className="pc-spec-sublabel">Handles game logic</div>
            </div>
          </div>
          <select className="pc-select" value={cpu} onChange={(e) => { setCpu(Number(e.target.value)); setChecked(false); }}>
            {COMPONENT_OPTIONS.cpu.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
          </select>
          {cpu > 0 && <div className="pc-score-bar-bg"><div className="pc-score-bar-fill" style={{ width: `${cpuScore}%`, background: cpuScore >= 60 ? '#22c55e' : cpuScore >= 30 ? '#facc15' : '#ef4444' }}></div></div>}
        </div>

        <div className="pc-spec-card">
          <div className="pc-spec-header">
            <div className="pc-spec-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>🧠</div>
            <div>
              <div className="pc-spec-label">Memory (RAM)</div>
              <div className="pc-spec-sublabel">Open-world needs 32GB+</div>
            </div>
          </div>
          <select className="pc-select" value={ram} onChange={(e) => { setRam(Number(e.target.value)); setChecked(false); }}>
            {COMPONENT_OPTIONS.ram.map((r, i) => <option key={i} value={i}>{r.name}</option>)}
          </select>
          {ram > 0 && <div className="pc-score-bar-bg"><div className="pc-score-bar-fill" style={{ width: `${ramScore}%`, background: ramScore >= 60 ? '#22c55e' : ramScore >= 30 ? '#facc15' : '#ef4444' }}></div></div>}
        </div>

        <div className="pc-spec-card">
          <div className="pc-spec-header">
            <div className="pc-spec-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>💾</div>
            <div>
              <div className="pc-spec-label">Storage</div>
              <div className="pc-spec-sublabel">SSD required for fast loads</div>
            </div>
          </div>
          <select className="pc-select" value={storage} onChange={(e) => { setStorage(Number(e.target.value)); setChecked(false); }}>
            {COMPONENT_OPTIONS.storage.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
          </select>
          {storage > 0 && <div className="pc-score-bar-bg"><div className="pc-score-bar-fill" style={{ width: `${storageScore}%`, background: storageScore >= 60 ? '#22c55e' : storageScore >= 30 ? '#facc15' : '#ef4444' }}></div></div>}
        </div>
      </div>

      <button className="pc-check-btn" onClick={handleCheck}>
        🎯 Check My System
      </button>

      {/* Result */}
      {checked && (
        <div className="pc-result">
          <div className="pc-gauge-ring" style={{ background: `conic-gradient(${verdict.color} ${totalScore * 3.6}deg, #1e293b ${totalScore * 3.6}deg)` }}>
            <div className="pc-gauge-inner">
              <div className="pc-result-score" style={{ color: verdict.color }}>{totalScore}</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>/ 100</div>
            </div>
          </div>
          <div className="pc-result-label" style={{ color: verdict.color }}>{verdict.emoji} {verdict.label}</div>
          <div className="pc-result-desc">{verdict.desc}</div>
          <div className="pc-breakdown">
            <div className="pc-bd-item">
              <div className="pc-bd-icon">🎮</div>
              <div className="pc-bd-score" style={{ color: gpuScore >= 60 ? '#22c55e' : gpuScore >= 30 ? '#facc15' : '#ef4444' }}>{gpuScore}</div>
              <div className="pc-bd-label">GPU</div>
            </div>
            <div className="pc-bd-item">
              <div className="pc-bd-icon">⚡</div>
              <div className="pc-bd-score" style={{ color: cpuScore >= 60 ? '#22c55e' : cpuScore >= 30 ? '#facc15' : '#ef4444' }}>{cpuScore}</div>
              <div className="pc-bd-label">CPU</div>
            </div>
            <div className="pc-bd-item">
              <div className="pc-bd-icon">🧠</div>
              <div className="pc-bd-score" style={{ color: ramScore >= 60 ? '#22c55e' : ramScore >= 30 ? '#facc15' : '#ef4444' }}>{ramScore}</div>
              <div className="pc-bd-label">RAM</div>
            </div>
            <div className="pc-bd-item">
              <div className="pc-bd-icon">💾</div>
              <div className="pc-bd-score" style={{ color: storageScore >= 60 ? '#22c55e' : storageScore >= 30 ? '#facc15' : '#ef4444' }}>{storageScore}</div>
              <div className="pc-bd-label">Storage</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
