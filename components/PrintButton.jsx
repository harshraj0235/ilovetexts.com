'use client';
import React from 'react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '7px 14px', background: 'rgba(255,255,255,0.25)',
        border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 8,
        color: '#fff', cursor: 'pointer', fontWeight: 700,
        fontSize: '0.78rem', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '5px',
      }}
      title="Print or save as PDF (Ctrl+P)"
    >
      🖨️ Print / PDF
    </button>
  );
}
