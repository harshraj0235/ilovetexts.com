'use client';
// ═══════════════════════════════════════════════════════
// useAutoSave.js — Dual-layer auto-save:
//   Layer 1: localStorage  (always, fast, 4MB limit)
//   Layer 2: sessionStorage (larger, survives tab refresh)
//
// Saves text blocks + annotations + overlays metadata.
// Returns: { lastSavedAt, saveStatus, clearSave, loadSave }
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useCallback, useState } from 'react';

const LS_KEY   = 'ilt-pdf-editor-autosave';
const SS_KEY   = 'ilt-pdf-editor-session';
const DEBOUNCE = 1200; // ms

// Compress pages for storage — strip heavy canvasDataUrl
function compress(pages) {
  return pages.map(p => ({
    pageNumber:  p.pageNumber,
    canvasWidth: p.canvasWidth,
    canvasHeight:p.canvasHeight,
    rotation:    p.rotation || 0,
    textBlocks:  p.textBlocks || [],
  }));
}

export function useAutoSave(pages, fileName, extraData = {}) {
  const timerRef       = useRef(null);
  const lastSavedRef   = useRef(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error

  useEffect(() => {
    if (!pages || pages.length === 0) return;

    setSaveStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        const payload = {
          fileName: fileName || 'untitled',
          savedAt:  Date.now(),
          version:  2,
          pages:    compress(pages),
          ...extraData,
        };
        const json = JSON.stringify(payload);

        // Layer 1: localStorage (persistent across tabs/sessions)
        if (typeof window !== 'undefined') {
          try {
            if (json.length < 4.5 * 1024 * 1024) {
              localStorage.setItem(LS_KEY, json);
            }
          } catch (e) { /* quota exceeded — skip */ }

          // Layer 2: sessionStorage (can hold more, cleared on tab close)
          try {
            sessionStorage.setItem(SS_KEY, json);
          } catch (e) { /* quota exceeded — skip */ }
        }

        lastSavedRef.current = Date.now();
        setSaveStatus('saved');

        // Reset back to idle after 2s so "Saved ✓" fades
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.warn('Auto-save failed:', e);
        setSaveStatus('error');
      }
    }, DEBOUNCE);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pages, fileName]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearSave = useCallback(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(LS_KEY); }   catch (e) { /* ignore */ }
    try { sessionStorage.removeItem(SS_KEY); } catch (e) { /* ignore */ }
    lastSavedRef.current = null;
    setSaveStatus('idle');
  }, []);

  // Load: prefer sessionStorage (freshest), fallback to localStorage
  const loadSave = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      const ss = sessionStorage.getItem(SS_KEY);
      if (ss) return JSON.parse(ss);
      const ls = localStorage.getItem(LS_KEY);
      if (ls) return JSON.parse(ls);
    } catch (e) { /* corrupt data */ }
    return null;
  }, []);

  // Peek: check if a save exists without loading it
  const hasSave = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!(sessionStorage.getItem(SS_KEY) || localStorage.getItem(LS_KEY));
    } catch { return false; }
  }, []);

  return { lastSavedRef, saveStatus, clearSave, loadSave, hasSave };
}
