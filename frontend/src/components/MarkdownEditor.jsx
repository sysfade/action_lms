import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Toolbar button ─────────────────────────────────────────────────────────

function ToolbarBtn({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '0.3rem 0.55rem', border: '1px solid var(--color-border)',
        borderRadius: 6, background: '#fff', cursor: 'pointer',
        fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700,
        color: 'var(--color-text)', lineHeight: 1,
        transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
    >
      {children}
    </button>
  );
}

// ── Toolbar groups ─────────────────────────────────────────────────────────

const TOOLBAR = [
  [
    { label: 'H1', title: 'Heading 1',  wrap: null, prefix: '# '   },
    { label: 'H2', title: 'Heading 2',  wrap: null, prefix: '## '  },
    { label: 'H3', title: 'Heading 3',  wrap: null, prefix: '### ' },
  ],
  [
    { label: 'B',  title: 'Bold',       wrap: '**', prefix: null   },
    { label: 'I',  title: 'Italic',     wrap: '_',  prefix: null   },
    { label: '~~', title: 'Strikethrough', wrap: '~~', prefix: null },
  ],
  [
    { label: '`',  title: 'Inline Code', wrap: '`', prefix: null   },
    { label: '```',title: 'Code Block',  codeBlock: true           },
    { label: '—',  title: 'Divider',     divider: true             },
  ],
  [
    { label: '•',  title: 'Bullet List', wrap: null, prefix: '- '  },
    { label: '1.', title: 'Numbered List', wrap: null, prefix: '1. '},
    { label: '❝',  title: 'Blockquote', wrap: null, prefix: '> '  },
  ],
];

// ── Main component ─────────────────────────────────────────────────────────

export default function MarkdownEditor({ value, onChange, rows = 16, placeholder = 'Write your lesson content in Markdown...' }) {
  const [mode, setMode] = useState('write'); // 'write' | 'preview'
  const textareaRef = useRef(null);

  // Insert text at cursor or wrap selection
  const applyFormat = ({ wrap, prefix, codeBlock, divider }) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = value.slice(start, end);
    let newVal, newCursor;

    if (divider) {
      const before = value.slice(0, start);
      const after  = value.slice(end);
      newVal = `${before}\n\n---\n\n${after}`;
      newCursor = start + 6;
    } else if (codeBlock) {
      const before = value.slice(0, start);
      const after  = value.slice(end);
      const inner  = sel || 'code here';
      newVal = `${before}\n\`\`\`\n${inner}\n\`\`\`\n${after}`;
      newCursor = start + 4 + inner.length;
    } else if (prefix) {
      // Prefix each selected line
      const before  = value.slice(0, start);
      const after   = value.slice(end);
      const lines   = (sel || '').split('\n');
      const prefixed = lines.map(l => (l.startsWith(prefix) ? l : prefix + l)).join('\n');
      newVal = `${before}${prefixed}${after}`;
      newCursor = start + prefixed.length;
    } else if (wrap) {
      const inner = sel || 'text';
      newVal = value.slice(0, start) + wrap + inner + wrap + value.slice(end);
      newCursor = start + wrap.length + inner.length + wrap.length;
    }

    onChange({ target: { name: 'content', value: newVal } });

    // Restore focus + cursor
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newCursor);
    });
  };

  const TabBtn = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setMode(id)}
      style={{
        padding: '0.35rem 0.875rem', border: 'none', cursor: 'pointer',
        background: mode === id ? '#fff' : 'transparent',
        color: mode === id ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontWeight: mode === id ? 700 : 500, fontSize: '0.8125rem',
        borderRadius: 6, fontFamily: 'var(--font-base)',
        boxShadow: mode === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ border: '1.5px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      {/* Top bar: tabs + toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.5rem 0.75rem', background: '#F8FAFC',
        borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-border)', borderRadius: 8, padding: '0.2rem' }}>
          <TabBtn id="write"   label="✏️ Write" />
          <TabBtn id="preview" label="👁 Preview" />
        </div>

        {/* Formatting toolbar — only in write mode */}
        {mode === 'write' && (
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {TOOLBAR.map((group, gi) => (
              <div key={gi} style={{ display: 'flex', gap: '0.2rem', paddingRight: gi < TOOLBAR.length - 1 ? '0.375rem' : 0, borderRight: gi < TOOLBAR.length - 1 ? '1px solid var(--color-border)' : 'none', marginRight: gi < TOOLBAR.length - 1 ? '0.375rem' : 0 }}>
                {group.map(btn => (
                  <ToolbarBtn key={btn.label} title={btn.title} onClick={() => applyFormat(btn)}>
                    {btn.label}
                  </ToolbarBtn>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write mode — textarea */}
      {mode === 'write' && (
        <textarea
          ref={textareaRef}
          name="content"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          style={{
            display: 'block', width: '100%', padding: '1rem',
            border: 'none', outline: 'none', resize: 'vertical',
            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            fontSize: '0.875rem', lineHeight: 1.65,
            color: 'var(--color-text)', background: '#fff',
            boxSizing: 'border-box', minHeight: 200,
          }}
        />
      )}

      {/* Preview mode — rendered markdown */}
      {mode === 'preview' && (
        <div style={{ padding: '1.25rem 1.5rem', minHeight: rows * 24 }}>
          {value?.trim() ? (
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Nothing to preview yet.</p>
          )}
        </div>
      )}

      {/* Footer hint */}
      {mode === 'write' && (
        <div style={{
          padding: '0.4rem 0.875rem', background: '#F8FAFC',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.7rem', color: 'var(--color-text-muted)',
        }}>
          Supports <strong>Markdown</strong> — **bold**, *italic*, `code`, ```blocks```, tables, and more. Click Preview to check your formatting.
        </div>
      )}
    </div>
  );
}
