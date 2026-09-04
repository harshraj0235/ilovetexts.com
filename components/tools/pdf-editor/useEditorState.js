'use client';
// ═══════════════════════════════════════════════════════
// useEditorState.js — Undo/redo history + text block state
//
// KEY FIX — stale closure bug:
//   updateBlock closed over `pages` via useCallback([pages]).
//   When the user types fast, React batches renders and the
//   closure sees an old `pages` snapshot → text reverts.
//
// Solution:
//   1. Keep a `pagesRef` that is ALWAYS in sync with state.
//      All mutations read from `pagesRef.current` (never stale).
//   2. Split "text content" updates from "structural" updates:
//      - updateBlockText(): silently updates text, does NOT push
//        undo history on every keystroke (avoids 50-entry spam).
//        Called from onInput/onBlur in TextBlock.
//      - updateBlock(): pushes full undo history entry.
//        Called for position, size, font, color changes.
//   3. The undo history only snapshots on "commit" events
//      (blur, drag-end, resize-end, font change) — not every char.
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

export function useEditorState(initialPages = []) {
  const [pages, setPages]               = useState(initialPages);
  const [currentPage, setCurrentPage]   = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  // ── Always-fresh ref — never stale ─────────────────
  const pagesRef = useRef(initialPages);
  // Keep ref in sync with state on every render
  pagesRef.current = pages;

  // ── History ─────────────────────────────────────────
  const historyRef    = useRef([initialPages]);
  const historyIdxRef = useRef(0);

  // Push a snapshot to undo history and update state
  const pushHistory = useCallback((newPages) => {
    const stack = historyRef.current.slice(0, historyIdxRef.current + 1);
    // Deep clone for history (canvas data excluded — too heavy)
    const snapshot = newPages.map(p => ({
      ...p,
      textBlocks: p.textBlocks.map(b => ({ ...b })),
    }));
    stack.push(snapshot);
    if (stack.length > MAX_HISTORY) stack.shift();
    historyRef.current = stack;
    historyIdxRef.current = stack.length - 1;
    setPages(newPages);
    pagesRef.current = newPages;
  }, []);

  // Update state WITHOUT pushing to history (for live text typing)
  const setPagesSilent = useCallback((newPages) => {
    pagesRef.current = newPages;
    setPages(newPages);
  }, []);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    const prev = historyRef.current[historyIdxRef.current];
    const restored = prev.map(p => ({ ...p, textBlocks: p.textBlocks.map(b => ({ ...b })) }));
    pagesRef.current = restored;
    setPages(restored);
    setSelectedBlockId(null);
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    const next = historyRef.current[historyIdxRef.current];
    const restored = next.map(p => ({ ...p, textBlocks: p.textBlocks.map(b => ({ ...b })) }));
    pagesRef.current = restored;
    setPages(restored);
    setSelectedBlockId(null);
  }, []);

  const canUndo = historyIdxRef.current > 0;
  const canRedo = historyIdxRef.current < historyRef.current.length - 1;

  // ── updateBlockText — SILENT update (no undo history) ──
  // Used during live typing (onInput). Reads from pagesRef
  // so it's NEVER stale even during rapid keystrokes.
  const updateBlockText = useCallback((pageIdx, blockId, text) => {
    const current = pagesRef.current;
    const newPages = current.map((p, i) => {
      if (i !== pageIdx) return p;
      return {
        ...p,
        textBlocks: p.textBlocks.map(b =>
          b.id === blockId ? { ...b, text } : b
        ),
      };
    });
    setPagesSilent(newPages);
  }, [setPagesSilent]);

  // ── updateBlock — WITH undo history ────────────────
  // Used for structural changes: position, size, font,
  // color, bold, italic, underline. Also called from
  // onBlur to "commit" the final typed text to history.
  const updateBlock = useCallback((pageIdx, blockId, changes) => {
    const current = pagesRef.current; // ← ALWAYS fresh, never stale
    const newPages = current.map((p, i) => {
      if (i !== pageIdx) return p;
      return {
        ...p,
        textBlocks: p.textBlocks.map(b =>
          b.id === blockId ? { ...b, ...changes } : b
        ),
      };
    });
    pushHistory(newPages);
  }, [pushHistory]); // ← no `pages` dependency = no stale closure

  const addBlock = useCallback((pageIdx, block) => {
    const current = pagesRef.current;
    const newPages = current.map((p, i) => {
      if (i !== pageIdx) return p;
      return { ...p, textBlocks: [...p.textBlocks, block] };
    });
    pushHistory(newPages);
    setSelectedBlockId(block.id);
  }, [pushHistory]);

  const deleteBlock = useCallback((pageIdx, blockId) => {
    const current = pagesRef.current;
    const newPages = current.map((p, i) => {
      if (i !== pageIdx) return p;
      return { ...p, textBlocks: p.textBlocks.filter(b => b.id !== blockId) };
    });
    pushHistory(newPages);
    setSelectedBlockId(null);
  }, [pushHistory]);

  const replaceAllPages = useCallback((newPages) => {
    historyRef.current = [newPages.map(p => ({ ...p, textBlocks: (p.textBlocks || []).map(b => ({ ...b })) }))];
    historyIdxRef.current = 0;
    pagesRef.current = newPages;
    setPages(newPages);
    setCurrentPage(0);
    setSelectedBlockId(null);
  }, []);

  return {
    pages,
    currentPage,
    setCurrentPage,
    selectedBlockId,
    setSelectedBlockId,
    updateBlock,       // structural changes + final commit
    updateBlockText,   // live typing — silent, no history
    addBlock,
    deleteBlock,
    replaceAllPages,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
