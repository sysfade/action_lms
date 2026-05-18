import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useToast } from '../context/ToastContext';
import {
  listNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
} from '../api/notifications';

// ── Notification type config ───────────────────────────────────────────────

const TYPE_CONFIG = {
  grade_released:   { icon: '⭐', accent: '#D97706', bg: '#FFFBEB', label: 'Grade Released' },
  course_enrolled:  { icon: '🎓', accent: '#2563EB', bg: '#EFF6FF', label: 'Enrollment' },
  submission_graded:{ icon: '✅', accent: '#16A34A', bg: '#F0FDF4', label: 'Graded' },
  new_submission:   { icon: '📥', accent: '#7C3AED', bg: '#F5F3FF', label: 'Submission' },
  xp:               { icon: '⚡', accent: '#D97706', bg: '#FFFBEB', label: 'XP Earned' },
  achievement:      { icon: '🏅', accent: '#F59E0B', bg: '#FEF3C7', label: 'Achievement' },
  system:           { icon: '🔔', accent: '#64748B', bg: '#F8FAFC', label: 'System' },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.system;
}

// ── Filter tabs ────────────────────────────────────────────────────────────

function FilterTab({ active, onClick, children, count }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.45rem 1rem', borderRadius: 8, border: 'none',
      cursor: 'pointer', fontFamily: 'var(--font-base)', fontSize: '0.8125rem', fontWeight: 600,
      background: active ? 'var(--color-primary)' : 'transparent',
      color: active ? '#fff' : 'var(--color-text-muted)',
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      transition: 'all 0.15s ease',
    }}>
      {children}
      {count > 0 && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.3)' : 'var(--color-border)',
          color: active ? '#fff' : 'var(--color-text-muted)',
          borderRadius: 999, padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: 700,
        }}>{count}</span>
      )}
    </button>
  );
}

// ── Single notification row ─────────────────────────────────────────────────

function NotificationRow({ n, onRead, onDelete }) {
  const cfg = getTypeConfig(n.type);
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '1rem',
      padding: '1rem 1.25rem',
      background: n.is_read ? '#fff' : cfg.bg,
      borderLeft: `3px solid ${n.is_read ? 'transparent' : cfg.accent}`,
      transition: 'background 0.2s',
      cursor: n.is_read ? 'default' : 'pointer',
    }}
      onClick={() => !n.is_read && onRead(n.id)}
    >
      {/* Type icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.accent}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', marginTop: 1,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            color: cfg.accent, letterSpacing: '0.04em',
          }}>{cfg.label}</span>
          {!n.is_read && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: cfg.accent, display: 'inline-block', flexShrink: 0,
            }} />
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
          {n.message}
        </p>
        <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {timeAgo(n.created_at)}
          {!n.is_read && (
            <span style={{ marginLeft: '0.75rem', color: cfg.accent, fontWeight: 600, cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); onRead(n.id); }}
            >
              Mark read
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(n.id); }}
        title="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '1rem', padding: '0.2rem 0.4rem',
          borderRadius: 6, opacity: 0.5, transition: 'opacity 0.15s',
          flexShrink: 0, lineHeight: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
      >
        ✕
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function NotificationCenter() {
  const { success, error: toastError, confirm } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('all'); // 'all' | 'unread' | 'read'

  const fetchAll = async () => {
    try {
      const data = await listNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      success('All notifications marked as read.');
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleClearAll = async () => {
    const ok = await confirm('Clear all notifications? This cannot be undone.', {
      confirmLabel: 'Clear All', cancelLabel: 'Cancel', danger: true,
    });
    if (!ok) return;
    try {
      await clearAllNotifications();
      setNotifications([]);
      success('All notifications cleared.');
    } catch (err) {
      toastError(err.message);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const unread = notifications.filter(n => !n.is_read);
  const read   = notifications.filter(n => n.is_read);

  const visible = filter === 'unread' ? unread
                : filter === 'read'   ? read
                : notifications;

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: 760 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="dashboard-welcome" style={{ marginBottom: 0 }}>
            <h1>🔔 Notifications</h1>
            <p>
              {unread.length > 0
                ? `You have ${unread.length} unread notification${unread.length > 1 ? 's' : ''}.`
                : "You're all caught up!"}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
            {unread.length > 0 && (
              <button onClick={handleMarkAllRead} style={{
                padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--color-border)',
                background: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                color: 'var(--color-primary)', fontFamily: 'var(--font-base)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                ✓ Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={handleClearAll} style={{
                padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #FECACA',
                background: '#FEF2F2', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                color: '#DC2626', fontFamily: 'var(--font-base)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
              >
                🗑 Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '1.25rem',
          background: '#F1F5F9', borderRadius: 10, padding: '0.25rem',
          width: 'fit-content',
        }}>
          <FilterTab active={filter === 'all'}    onClick={() => setFilter('all')}    count={notifications.length}>All</FilterTab>
          <FilterTab active={filter === 'unread'} onClick={() => setFilter('unread')} count={unread.length}>Unread</FilterTab>
          <FilterTab active={filter === 'read'}   onClick={() => setFilter('read')}   count={read.length}>Read</FilterTab>
        </div>

        {/* Notification list */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)',
          overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }}>🔔</div>
              Loading notifications...
            </div>
          ) : visible.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {filter === 'unread' ? '✅' : '🔔'}
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {filter === 'unread'
                  ? 'No unread notifications right now.'
                  : filter === 'read'
                  ? 'No read notifications yet.'
                  : 'Notifications about grades and activity will appear here.'}
              </p>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} style={{
                  marginTop: '1rem', padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none',
                  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                }}>View all</button>
              )}
            </div>
          ) : (
            <div>
              {visible.map((n, i) => (
                <div key={n.id} style={{
                  borderBottom: i < visible.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <NotificationRow n={n} onRead={handleRead} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {visible.length > 0 && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Click an unread notification to mark it as read. Click ✕ to dismiss.
          </p>
        )}

      </main>
    </div>
  );
}
