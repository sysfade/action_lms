import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // Track confirm callbacks by id
  const confirmCallbacks = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    delete confirmCallbacks.current[id];
  }, []);

  const toast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((message, opts) => toast({ type: 'success', message, ...opts }), [toast]);
  const error   = useCallback((message, opts) => toast({ type: 'error',   message, duration: 6000, ...opts }), [toast]);
  const info    = useCallback((message, opts) => toast({ type: 'info',    message, ...opts }), [toast]);
  const warning = useCallback((message, opts) => toast({ type: 'warning', message, ...opts }), [toast]);

  /**
   * Replacement for window.confirm().
   * Returns a Promise that resolves to true (confirm) or false (cancel).
   */
  const confirm = useCallback((message, { confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = {}) => {
    return new Promise((resolve) => {
      const id = ++_id;
      confirmCallbacks.current[id] = resolve;
      setToasts(prev => [...prev, { id, type: 'confirm', message, confirmLabel, cancelLabel, danger }]);
    });
  }, []);

  const handleConfirmAction = useCallback((id, result) => {
    if (confirmCallbacks.current[id]) {
      confirmCallbacks.current[id](result);
    }
    dismiss(id);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, confirm, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} onConfirmAction={handleConfirmAction} />
    </ToastContext.Provider>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const STYLES = {
  success: { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A', text: '#14532D' },
  error:   { bg: '#FEF2F2', border: '#FCA5A5', icon: '#DC2626', text: '#7F1D1D' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', icon: '#D97706', text: '#78350F' },
  info:    { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB', text: '#1E3A8A' },
};

// ── Individual Toast ───────────────────────────────────────────────────────────

function Toast({ toast, onDismiss, onConfirmAction }) {
  const isConfirm = toast.type === 'confirm';
  const style = STYLES[isConfirm ? 'warning' : toast.type] || STYLES.info;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isConfirm ? '0.875rem' : 0,
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        padding: '0.875rem 1rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        minWidth: 280,
        maxWidth: 360,
        animation: 'toast-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
        {/* Icon */}
        <span style={{ color: style.icon, marginTop: 1, flexShrink: 0 }}>
          {isConfirm ? ICONS.warning : ICONS[toast.type]}
        </span>

        {/* Message */}
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: style.text, flex: 1, lineHeight: 1.45 }}>
          {toast.message}
        </span>

        {/* Dismiss button (non-confirm toasts) */}
        {!isConfirm && (
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: style.icon, opacity: 0.6, padding: 0, lineHeight: 1,
              fontSize: '1rem', flexShrink: 0,
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      {/* Confirm actions */}
      {isConfirm && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onConfirmAction(toast.id, false)}
            style={{
              padding: '0.35rem 0.875rem', borderRadius: 8,
              border: `1px solid ${style.border}`,
              background: 'transparent', cursor: 'pointer',
              fontSize: '0.8125rem', fontWeight: 600, color: style.text,
            }}
          >
            {toast.cancelLabel}
          </button>
          <button
            onClick={() => onConfirmAction(toast.id, true)}
            style={{
              padding: '0.35rem 0.875rem', borderRadius: 8,
              border: 'none',
              background: toast.danger ? '#DC2626' : style.icon,
              cursor: 'pointer',
              fontSize: '0.8125rem', fontWeight: 600, color: '#fff',
            }}
          >
            {toast.confirmLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Container ──────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss, onConfirmAction }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <Toast toast={t} onDismiss={onDismiss} onConfirmAction={onConfirmAction} />
          </div>
        ))}
      </div>
    </>
  );
}
