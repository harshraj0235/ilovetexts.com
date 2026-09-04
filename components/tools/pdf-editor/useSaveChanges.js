'use client';
// ═══════════════════════════════════════════════════════
// useSaveChanges.js — "Save Changes" button logic
//
// Strategy: Read ALL [data-block-id] elements from the live
// DOM and commit their textContent to state in one batch.
// This is 100% reliable — no stale closures, no React
// batching issues, no cursor state dependency.
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef } from 'react';

export function useSaveChanges(pages, replaceAllPages, onSaved) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const resetRef = useRef(null);

  const saveChanges = useCallback(() => {
    try {
      setSaveStatus('saving');

      // Read every text block from the live DOM
      const domBlocks = document.querySelectorAll('[data-block-id]');

      // Build map: blockId → current DOM text
      const domMap = {};
      domBlocks.forEach(el => {
        const id = el.getAttribute('data-block-id');
        if (id) domMap[id] = el.innerText || el.textContent || '';
      });

      let changed = 0;

      // Merge DOM text into pages state
      const newPages = pages.map(page => ({
        ...page,
        textBlocks: (page.textBlocks || []).map(block => {
          if (block.id in domMap && domMap[block.id] !== block.text) {
            changed++;
            return { ...block, text: domMap[block.id], isEdited: true };
          }
          return block;
        }),
      }));

      // Always commit — even if 0 changes (triggers auto-save, confirms state)
      replaceAllPages(newPages);

      setSaveStatus('saved');
      if (onSaved) onSaved(changed);

      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }, [pages, replaceAllPages, onSaved]);

  return { saveChanges, saveStatus };
}
