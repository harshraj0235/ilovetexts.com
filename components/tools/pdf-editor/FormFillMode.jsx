'use client';
// ═══════════════════════════════════════════════════════
// FormFillMode.jsx — Detect form-like text blocks and
// render them as fillable input fields directly on the page.
// "Form-like" = blocks that end with : or __ or look like
// label patterns (Name:, Date:, Signature:, etc.)
// Also supports blank-line detection for fill-in forms.
// NEW component — not in original editor.
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useEffect } from 'react';

// Patterns that suggest a form field follows
const LABEL_RE = /[:：]\s*$|_{3,}|-{3,}|\[\s*\]|(\bName\b|\bDate\b|\bSign|\bEmail\b|\bAddress\b|\bPhone\b|\bTitle\b|\bCompany\b)/i;

function detectFields(textBlocks) {
  return textBlocks.reduce((acc, block, idx) => {
    if (LABEL_RE.test(block.text)) {
      acc.push({
        blockId:  block.id,
        label:    block.text,
        x:        block.x,
        y:        block.y,
        width:    Math.max(block.width, 140),
        height:   block.height || 22,
        fontSize: block.fontSize || 12,
      });
    }
    return acc;
  }, []);
}

export default function FormFillMode({
  page, pageIndex, zoom,
  formValues, onFormChange,
}) {
  const blocks   = page?.textBlocks || [];
  const fields   = detectFields(blocks);

  const handleChange = useCallback((blockId, value) => {
    onFormChange(pageIndex, blockId, value);
  }, [pageIndex, onFormChange]);

  if (!fields.length) {
    return (
      <div style={{
        position: 'absolute',
        bottom: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.5)', color: '#fff',
        padding: '6px 16px', borderRadius: 20,
        fontSize: '0.78rem', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 14,
      }}>
        No form fields detected on this page
      </div>
    );
  }

  const s = v => v * zoom;

  return (
    <>
      {fields.map(field => {
        const value  = formValues?.[field.blockId] || '';
        // Place the fill input to the RIGHT of the label text
        const inputX = field.x + field.width + 4;
        const inputW = Math.max(120, (page.canvasWidth || 794) - inputX - 10);

        return (
          <div
            key={field.blockId}
            style={{
              position: 'absolute',
              left:   s(inputX),
              top:    s(field.y),
              width:  s(Math.min(inputW, 280)),
              height: s(field.height + 4),
              zIndex: 14,
            }}
          >
            <input
              type="text"
              value={value}
              onChange={e => handleChange(field.blockId, e.target.value)}
              placeholder="Type here…"
              style={{
                width: '100%',
                height: '100%',
                padding: `${s(2)}px ${s(4)}px`,
                fontSize:   s(field.fontSize),
                fontFamily: 'sans-serif',
                border:     '1.5px solid #0070F3',
                borderRadius: 3,
                background: 'rgba(239,246,255,0.97)',
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 1px 4px rgba(0,112,243,0.15)',
              }}
            />
          </div>
        );
      })}

      {/* Overlay count badge */}
      <div style={{
        position: 'absolute',
        top: 8, right: 8, zIndex: 15,
        background: '#0070F3', color: '#fff',
        padding: '3px 10px', borderRadius: 12,
        fontSize: '0.72rem', fontWeight: 700,
        pointerEvents: 'none',
      }}>
        {fields.length} form field{fields.length !== 1 ? 's' : ''} found
      </div>
    </>
  );
}

// Helper: merge form values back into text blocks for export
export function applyFormValues(pages, formValuesMap) {
  return pages.map((page, pi) => ({
    ...page,
    textBlocks: (page.textBlocks || []).map(block => {
      const val = formValuesMap?.[pi]?.[block.id];
      if (!val) return block;
      // Replace trailing __/--- or append after colon
      const filled = block.text.replace(/_{3,}|-{3,}|\[\s*\]/, val)
        .replace(/([:：]\s*)$/, `$1${val}`);
      return { ...block, text: filled, isEdited: true };
    }),
  }));
}
