import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listNotifications, markAsRead } from '../api/notifications';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isOpen,        setIsOpen]        = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await listNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  // Show max 5 in the dropdown
  const preview = notifications.slice(0, 5);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.25rem', position: 'relative', padding: '0.5rem',
          color: 'rgba(199,210,254,0.8)', lineHeight: 1,
          borderRadius: 8, transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            background: '#DC2626', color: '#fff',
            borderRadius: '50%', minWidth: 17, height: 17,
            fontSize: '0.62rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, padding: '0 3px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340,
          background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          borderRadius: 14, zIndex: 1000, border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          {/* Dropdown header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            background: '#F8FAFC',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                background: '#DC2626', color: '#fff', borderRadius: 999,
                padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: 700,
              }}>{unreadCount} new</span>
            )}
          </div>

          {/* Items */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {preview.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔔</div>
                No notifications yet.
              </div>
            ) : (
              preview.map((n, i) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: n.is_read ? '#fff' : '#EFF6FF',
                    borderBottom: i < preview.length - 1 ? '1px solid var(--color-border)' : 'none',
                    cursor: n.is_read ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                    borderLeft: `3px solid ${n.is_read ? 'transparent' : 'var(--color-primary)'}`,
                  }}
                  onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = '#DBEAFE'; }}
                  onMouseLeave={e => { if (!n.is_read) e.currentTarget.style.background = '#EFF6FF'; }}
                >
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)', margin: '0 0 0.2rem', lineHeight: 1.45 }}>
                    {n.message}
                  </p>
                  <small style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </small>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--color-border)',
            background: '#F8FAFC',
            display: 'flex', justifyContent: 'center',
          }}>
            <button
              onClick={handleViewAll}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)',
                fontFamily: 'var(--font-base)', padding: '0.25rem 0.75rem',
                borderRadius: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
