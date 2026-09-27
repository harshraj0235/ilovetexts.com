'use client';
// ═══════════════════════════════════════════════════════
// CommentPanel.jsx — Right sidebar: all sticky notes /
// text annotations across all pages. Click to jump.
// NEW component — not in original editor.
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import { ANNOTATION_TOOLS } from './AnnotationLayer';

export default function CommentPanel({
  annotationsMap,   // { [pageIdx]: annotation[] }
  pages,
  currentPage,
  onGoToPage,
  onUpdateAnnotation, // (pageIdx, annId, changes) => void
  onDeleteAnnotation, // (pageIdx, annId) => void
}) {
  const [filter,    setFilter]    = useState('all'); // all | sticky | text-ann
  const [editingId, setEditingId] = useState(null);
  const [editText,  setEditText]  = useState('');

  // Flatten all notes
  const allComments = useMemo(() => {
    const result = [];
    Object.entries(annotationsMap || {}).forEach(([piStr, anns]) => {
      const pi = parseInt(piStr);
      (anns || []).forEach(ann => {
        if (
          ann.tool === ANNOTATION_TOOLS.STICKY ||
          ann.tool === ANNOTATION_TOOLS.TEXT_ANN
        ) {
          result.push({ ...ann, pageIdx: pi });
        }
      });
    });
    // Sort by page then Y position
    result.sort((a, b) => a.pageIdx - b.pageIdx || a.y - b.y);
    return result;
  }, [annotationsMap]);

  const filtered = filter === 'all'
    ? allComments
    : allComments.filter(c => c.tool === filter);

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.note || '');
  };

  const commitEdit = (c) => {
    onUpdateAnnotation(c.pageIdx, c.id, { note: editText });
    setEditingId(null);
  };

  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      borderLeft: '1px solid var(--border-light)',
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px 8px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-main)',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 8 }}>
          💬 Comments & Notes
          <span style={{
            marginLeft: 7, background: '#0070F3', color: '#fff',
            borderRadius: 10, padding: '1px 6px', fontSize: '0.68rem', fontWeight: 800,
          }}>{allComments.length}</span>
        </div>
        {/* Filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'all',      label: 'All' },
            { id: ANNOTATION_TOOLS.STICKY,   label: '📌 Pins' },
            { id: ANNOTATION_TOOLS.TEXT_ANN, label: '📝 Text' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{
                padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer',
                border: `1px solid ${filter === f.id ? '#0070F3' : 'var(--border-light)'}`,
                background: filter === f.id ? 'rgba(0,112,243,0.1)' : 'var(--bg-section)',
                color: filter === f.id ? '#0070F3' : 'var(--text-secondary)',
                fontWeight: filter === f.id ? 700 : 400,
              }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>💬</div>
            No comments yet.<br />
            Use the Annotate tab → Sticky Note to add one.
          </div>
        ) : (
          filtered.map((c, idx) => (
            <div key={c.id}
              style={{
                marginBottom: 10, padding: '10px 12px',
                background: 'var(--bg-main)',
                border: `1px solid ${c.pageIdx === currentPage ? '#0070F3' : 'var(--border-light)'}`,
                borderRadius: 8,
                boxShadow: c.pageIdx === currentPage ? '0 0 0 2px rgba(0,112,243,0.15)' : 'none',
              }}
            >
              {/* Page + type badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <button onClick={() => onGoToPage(c.pageIdx)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#0070F3', fontSize: '0.72rem', fontWeight: 700, padding: 0,
                  }}>
                  Page {c.pageIdx + 1}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{
                    fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3,
                    background: c.tool === ANNOTATION_TOOLS.STICKY ? '#f59e0b' : '#6366f1',
                    color: '#fff', fontWeight: 700,
                  }}>
                    {c.tool === ANNOTATION_TOOLS.STICKY ? '📌' : '📝'}
                  </span>
                  <button onClick={() => onDeleteAnnotation(c.pageIdx, c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', padding: '0 2px' }}>
                    ×
                  </button>
                </div>
              </div>

              {/* Note content */}
              {editingId === c.id ? (
                <div>
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onBlur={() => commitEdit(c)}
                    onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') commitEdit(c); }}
                    style={{
                      width: '100%', minHeight: 64, fontSize: '0.8rem',
                      border: '1px solid #0070F3', borderRadius: 4, padding: 5,
                      resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                      background: 'var(--bg-section)',
                    }}
                  />
                  <button onClick={() => commitEdit(c)}
                    style={{ marginTop: 4, padding: '3px 10px', background: '#0070F3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    Save
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: c.note ? 'var(--text-primary)' : 'var(--text-tertiary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontStyle: c.note ? 'normal' : 'italic', cursor: 'text' }}
                  onClick={() => startEdit(c)}>
                  {c.note || 'Click to add note…'}
                </div>
              )}

              {/* Position */}
              <div style={{ marginTop: 5, fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                x: {Math.round(c.x)}, y: {Math.round(c.y)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg-main)',
        fontSize: '0.72rem',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        {filtered.length} comment{filtered.length !== 1 ? 's' : ''}
        {allComments.length > 0 && ` across ${new Set(allComments.map(c => c.pageIdx)).size} page${new Set(allComments.map(c => c.pageIdx)).size !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
}
