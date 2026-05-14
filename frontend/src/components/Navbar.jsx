import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = {
  all: [
    { to: '/dashboard',  icon: '🏠', label: 'Dashboard' },
    { to: '/courses',    icon: '📚', label: 'Catalog'   },
    { to: '/my-courses', icon: '🎯', label: 'My Learning'},
  ],
  student: [
    { to: '/progress',          icon: '📊', label: 'My Progress'  },
    { to: '/my-certificates',   icon: '🏅', label: 'Certificates' },
    { to: '/leaderboard',       icon: '🏆', label: 'Leaderboard'  },
  ],
  instructor: [
    { to: '/courses/new', icon: '✨', label: 'Create Course' },
    { to: '/grading',     icon: '📥', label: 'Submissions'   },
  ],
  admin: [
    { to: '/courses/new', icon: '✨', label: 'Create Course' },
    { to: '/grading',     icon: '📥', label: 'Submissions'   },
    { to: '/admin',       icon: '🛠', label: 'Admin Panel'   },
  ],
};

export default function Navbar() {
  const { user, logout }        = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const [mobileOpen, setMobile] = useState(false);

  const role       = user?.role || 'student';
  const roleItems  = NAV_ITEMS[role] || NAV_ITEMS.instructor;
  const allItems   = [...NAV_ITEMS.all, ...roleItems];

  const isActive = (to) => location.pathname === to ||
    (to !== '/dashboard' && location.pathname.startsWith(to));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobile = () => setMobile(false);

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <Link to="/dashboard" className="sidebar-brand" onClick={closeMobile}>
        <div className="sidebar-brand-icon">AL</div>
        ActionLMS
      </Link>

      {/* Nav items */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {allItems.map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-link${isActive(to) ? ' active' : ''}`}
            onClick={closeMobile}
          >
            <span className="sidebar-link-icon">{icon}</span>
            {label}
          </Link>
        ))}

        <div className="sidebar-divider" />
        <span className="sidebar-section-label">Account</span>
        <Link
          to="/notifications"
          className={`sidebar-link${isActive('/notifications') ? ' active' : ''}`}
          onClick={closeMobile}
        >
          <span className="sidebar-link-icon">🔔</span>
          Notifications
        </Link>
        <Link
          to="/profile"
          className={`sidebar-link${isActive('/profile') ? ' active' : ''}`}
          onClick={closeMobile}
        >
          <span className="sidebar-link-icon">👤</span>
          My Profile
        </Link>
      </nav>

      {/* User card at bottom */}
      <div className="sidebar-user">
        <Link to="/profile" className="sidebar-user-card" onClick={closeMobile}>
          <div className="sidebar-avatar">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </Link>
        <button className="sidebar-logout" onClick={handleLogout}>
          ↩ Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <SidebarContent />
      </aside>

      {/* Backdrop (mobile only) */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobile} />
      )}

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <Link to="/dashboard" className="mobile-topbar-brand" onClick={closeMobile}>
          <div className="sidebar-brand-icon">AL</div>
          ActionLMS
        </Link>
        <div className="mobile-topbar-right">
          <NotificationBell />
          <button
            className="sidebar-hamburger"
            onClick={() => setMobile(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </>
  );
}
