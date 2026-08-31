'use client';

import React, { useState, useRef, useEffect } from 'react';

const DEFAULT_PINS = [
  { id: 1, x: 50, y: 30, label: 'Downtown Vice City', type: 'city', desc: 'The main skyline area with skyscrapers' },
  { id: 2, x: 25, y: 55, label: 'Ocean Beach', type: 'beach', desc: 'Famous beach strip and nightlife' },
  { id: 3, x: 72, y: 45, label: 'Little Havana', type: 'city', desc: 'Cuban-influenced neighborhood' },
  { id: 4, x: 40, y: 70, label: 'Vice City Airport', type: 'transport', desc: 'Main international airport' },
  { id: 5, x: 80, y: 20, label: 'Everglades', type: 'nature', desc: 'Swamp/wetlands area' },
  { id: 6, x: 15, y: 25, label: 'Star Island', type: 'luxury', desc: 'Exclusive island for mansions' },
  { id: 7, x: 60, y: 80, label: 'Port Leonida', type: 'transport', desc: 'Shipping port and industrial zone' },
  { id: 8, x: 35, y: 15, label: 'Vice Keys', type: 'nature', desc: 'Island chain south of Vice City' },
];

const PIN_TYPES = {
  city: { color: '#ec4899', icon: '🏙️', label: 'City' },
  beach: { color: '#06b6d4', icon: '🏖️', label: 'Beach' },
  transport: { color: '#f97316', icon: '✈️', label: 'Transport' },
  nature: { color: '#22c55e', icon: '🌴', label: 'Nature' },
  luxury: { color: '#a855f7', icon: '💎', label: 'Luxury' },
  custom: { color: '#facc15', icon: '📌', label: 'Custom' },
};

export default function ViceCitySpeculationMap() {
  const [pins, setPins] = useState(DEFAULT_PINS);
  const [selectedPin, setSelectedPin] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newPinType, setNewPinType] = useState('custom');
  const [newPinLabel, setNewPinLabel] = useState('');
  const [filter, setFilter] = useState('all');
  const mapRef = useRef(null);
  const nextId = useRef(100);

  const handleMapClick = (e) => {
    if (!isAdding || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const label = newPinLabel.trim() || 'My Pin';
    setPins(prev => [...prev, { id: nextId.current++, x, y, label, type: newPinType, desc: 'User-placed pin' }]);
    setNewPinLabel('');
    setIsAdding(false);
  };

  const removePin = (id) => {
    setPins(prev => prev.filter(p => p.id !== id));
    setSelectedPin(null);
  };

  const filteredPins = filter === 'all' ? pins : pins.filter(p => p.type === filter);

  return (
    <div className="sm-tool">
      <style jsx>{`
        .sm-tool {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .sm-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .sm-filter-btn {
          padding: 0.45rem 0.85rem;
          border-radius: 20px;
          border: 1px solid #334155;
          background: #1e293b;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .sm-filter-btn:hover { border-color: #64748b; color: #e2e8f0; }
        .sm-filter-btn.active {
          border-color: #ec4899;
          background: rgba(236, 72, 153, 0.1);
          color: #f9a8d4;
        }
        .sm-add-btn {
          padding: 0.45rem 1rem;
          border-radius: 20px;
          border: none;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          margin-left: auto;
          transition: all 0.2s;
        }
        .sm-add-btn:hover { transform: scale(1.05); }
        .sm-add-btn.cancel {
          background: #dc2626;
        }

        /* Map Container */
        .sm-map-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 10;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #1e293b;
          cursor: ${isAdding ? 'crosshair' : 'default'};
          user-select: none;
        }
        .sm-map-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 40%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(236, 72, 153, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, rgba(34, 197, 94, 0.08) 0%, transparent 40%),
            linear-gradient(180deg, #0c4a6e 0%, #164e63 20%, #134e4a 50%, #14532d 75%, #1e3a5f 100%);
        }
        /* Grid overlay */
        .sm-map-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 5% 5%;
          pointer-events: none;
        }
        /* Water effect */
        .sm-water {
          position: absolute;
          background: rgba(6, 182, 212, 0.12);
          border-radius: 50%;
          pointer-events: none;
        }
        .sm-water-1 { width: 35%; height: 45%; top: 5%; left: -5%; }
        .sm-water-2 { width: 25%; height: 30%; bottom: -5%; right: -3%; }
        /* Coastline */
        .sm-coast {
          position: absolute;
          left: 8%;
          top: 10%;
          width: 84%;
          height: 80%;
          border: 2px dashed rgba(6, 182, 212, 0.2);
          border-radius: 30% 40% 35% 25%;
          pointer-events: none;
        }
        /* Roads */
        .sm-road {
          position: absolute;
          background: rgba(255, 255, 255, 0.06);
          pointer-events: none;
        }
        .sm-road-h1 { width: 80%; height: 2px; top: 35%; left: 10%; }
        .sm-road-h2 { width: 60%; height: 2px; top: 55%; left: 20%; }
        .sm-road-v1 { width: 2px; height: 60%; top: 20%; left: 45%; }
        .sm-road-v2 { width: 2px; height: 40%; top: 30%; left: 65%; }

        /* Pins */
        .sm-pin {
          position: absolute;
          transform: translate(-50%, -100%);
          cursor: pointer;
          z-index: 5;
          transition: transform 0.15s;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
        }
        .sm-pin:hover {
          transform: translate(-50%, -100%) scale(1.2);
          z-index: 10;
        }
        .sm-pin-icon {
          font-size: 1.5rem;
          display: block;
          line-height: 1;
        }
        .sm-pin-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin: -2px auto 0;
        }
        .sm-pin-label {
          position: absolute;
          top: -1.8rem;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 0.6rem;
          font-weight: 700;
          color: #fff;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .sm-pin:hover .sm-pin-label {
          opacity: 1;
        }

        /* Info Panel */
        .sm-info-panel {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          animation: sm-slide-up 0.3s ease;
        }
        .sm-info-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }
        .sm-info-content {
          flex: 1;
        }
        .sm-info-title {
          font-size: 1rem;
          font-weight: 800;
          color: #f1f5f9;
          margin-bottom: 0.25rem;
        }
        .sm-info-type {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.15rem 0.5rem;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 0.4rem;
        }
        .sm-info-desc {
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.5;
        }
        .sm-info-close {
          background: #1e293b;
          border: 1px solid #334155;
          color: #94a3b8;
          border-radius: 8px;
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sm-info-close:hover { background: #334155; color: #fff; }
        .sm-info-remove {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          border-radius: 8px;
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          margin-left: 0.5rem;
          transition: all 0.2s;
        }
        .sm-info-remove:hover { background: rgba(239, 68, 68, 0.3); }

        /* Add Pin Panel */
        .sm-add-panel {
          background: #0f172a;
          border: 1px solid #ec4899;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          animation: sm-slide-up 0.3s ease;
        }
        .sm-add-panel input {
          flex: 1;
          min-width: 150px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          color: #e2e8f0;
          font-size: 0.85rem;
          outline: none;
        }
        .sm-add-panel input:focus {
          border-color: #ec4899;
        }
        .sm-add-panel select {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          color: #e2e8f0;
          font-size: 0.85rem;
          outline: none;
        }
        .sm-add-hint {
          font-size: 0.75rem;
          color: #f9a8d4;
          font-weight: 600;
          width: 100%;
        }
        .sm-pin-count {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
        }
        @keyframes sm-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toolbar */}
      <div className="sm-toolbar">
        <button className={`sm-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {Object.entries(PIN_TYPES).map(([key, val]) => (
          <button key={key} className={`sm-filter-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {val.icon} {val.label}
          </button>
        ))}
        <span className="sm-pin-count">{pins.length} pins</span>
        <button className={`sm-add-btn ${isAdding ? 'cancel' : ''}`} onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? '✕ Cancel' : '📌 Add Pin'}
        </button>
      </div>

      {/* Add Pin Panel */}
      {isAdding && (
        <div className="sm-add-panel">
          <input
            type="text"
            placeholder="Pin label (e.g. My Safehouse)"
            value={newPinLabel}
            onChange={(e) => setNewPinLabel(e.target.value)}
            maxLength={30}
          />
          <select value={newPinType} onChange={(e) => setNewPinType(e.target.value)}>
            {Object.entries(PIN_TYPES).map(([key, val]) => (
              <option key={key} value={key}>{val.icon} {val.label}</option>
            ))}
          </select>
          <div className="sm-add-hint">👆 Click anywhere on the map to place your pin</div>
        </div>
      )}

      {/* Map */}
      <div className="sm-map-wrap" ref={mapRef} onClick={handleMapClick}>
        <div className="sm-map-bg"></div>
        <div className="sm-map-grid"></div>
        <div className="sm-water sm-water-1"></div>
        <div className="sm-water sm-water-2"></div>
        <div className="sm-coast"></div>
        <div className="sm-road sm-road-h1"></div>
        <div className="sm-road sm-road-h2"></div>
        <div className="sm-road sm-road-v1"></div>
        <div className="sm-road sm-road-v2"></div>

        {filteredPins.map((pin) => (
          <div
            key={pin.id}
            className="sm-pin"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            onClick={(e) => { e.stopPropagation(); setSelectedPin(pin); }}
          >
            <span className="sm-pin-label">{pin.label}</span>
            <span className="sm-pin-icon">{PIN_TYPES[pin.type]?.icon || '📌'}</span>
            <div className="sm-pin-dot" style={{ background: PIN_TYPES[pin.type]?.color || '#facc15' }}></div>
          </div>
        ))}
      </div>

      {/* Info Panel */}
      {selectedPin && (
        <div className="sm-info-panel">
          <div className="sm-info-icon">{PIN_TYPES[selectedPin.type]?.icon || '📌'}</div>
          <div className="sm-info-content">
            <div className="sm-info-type" style={{ color: PIN_TYPES[selectedPin.type]?.color, background: PIN_TYPES[selectedPin.type]?.color + '20', border: `1px solid ${PIN_TYPES[selectedPin.type]?.color}40` }}>
              {PIN_TYPES[selectedPin.type]?.label}
            </div>
            <div className="sm-info-title">{selectedPin.label}</div>
            <div className="sm-info-desc">{selectedPin.desc}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button className="sm-info-close" onClick={() => setSelectedPin(null)}>Close</button>
            <button className="sm-info-remove" onClick={() => removePin(selectedPin.id)}>Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}
