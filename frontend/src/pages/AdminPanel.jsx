import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAdminStats, listAllUsers, listAdminCourses, updateRole, deleteUser } from '../api/admin';

// ── Role config ────────────────────────────────────────────────────────────

const ROLE_STYLE = {
  student:    { bg: '#EFF6FF', color: '#1D4ED8' },
  instructor: { bg: '#F0FDF4', color: '#15803D' },
  admin:      { bg: '#FFF7ED', color: '#C2410C' },
  superadmin: { bg: '#FDF4FF', color: '#7E22CE' },
};

function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] || { bg: '#F1F5F9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem',
      borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
      textTransform: 'capitalize', background: s.bg, color: s.color,
    }}>
      {role}
    </span>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────

function StatTile({ icon, value, label, sub, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid var(--color-border)',
      padding: '1.25rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', color: accent, lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', opacity: 0.7, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Tab button ─────────────────────────────────────────────────────────────

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1.25rem',
        borderRadius: 8, border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-base)', fontSize: '0.875rem', fontWeight: 600,
        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? '#fff' : 'var(--color-text-muted)',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

// ── Table helpers ──────────────────────────────────────────────────────────

const TH = ({ children, center }) => (
  <th style={{
    padding: '0.75rem 1rem', textAlign: center ? 'center' : 'left',
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '2px solid var(--color-border)', background: '#F8FAFC',
  }}>{children}</th>
);

const TD = ({ children, center, style: extra }) => (
  <td style={{
    padding: '0.875rem 1rem',
    textAlign: center ? 'center' : 'left',
    verticalAlign: 'middle',
    borderBottom: '1px solid var(--color-border)',
    ...extra,
  }}>{children}</td>
);

// ── Stats Tab ──────────────────────────────────────────────────────────────

function StatsTab({ stats }) {
  if (!stats) return <p style={{ color: 'var(--color-text-muted)' }}>Loading stats...</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
      <StatTile icon="👥" value={stats.totalUsers}       label="Registered Users"   accent="#2563EB" />
      <StatTile
        icon="📚"
        value={stats.totalCourses}
        label="Total Courses"
        sub={`${stats.publishedCourses} published · ${stats.draftCourses} draft`}
        accent="#15803D"
      />
      <StatTile icon="🎓" value={stats.totalEnrollments}   label="Total Enrollments"  accent="#7C3AED" />
      <StatTile icon="📥" value={stats.pendingSubmissions}  label="Pending Submissions" accent="#D97706" />
      <StatTile icon="📝" value={stats.totalSubmissions}    label="Total Submissions"   accent="#0891B2" />
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────────────────────

function UsersTab({ users, setUsers, currentUser }) {
  const { success, error: toastError, confirm } = useToast();
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Role options the actor can set
  const roleOptions = isSuperAdmin
    ? ['student', 'instructor', 'admin']
    : ['student', 'instructor'];

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const updated = await updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      success(`Role updated to ${newRole}.`);
    } catch (err) {
      toastError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (user) => {
    const ok = await confirm(`Delete ${user.name}'s account? This cannot be undone.`, {
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      success(`${user.name} has been removed.`);
    } catch (err) {
      toastError(err.message);
    }
  };

  const isSelf = (u) => u.id === currentUser?.id;
  const isUntouchable = (u) => u.role === 'superadmin';
  const canDelete = (u) => {
    if (isSelf(u) || isUntouchable(u)) return false;
    if (!isSuperAdmin && u.role === 'admin') return false;
    return true;
  };

  return (
    <div>
      {/* Search */}
      <input
        className="form-input"
        placeholder="🔍  Search by name or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 380, marginBottom: '1.25rem' }}
      />

      <div style={{
        background: '#fff', borderRadius: 14,
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr>
              <TH>User</TH>
              <TH>Role</TH>
              <TH>Joined</TH>
              <TH center>Change Role</TH>
              <TH center>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No users found.
                </td>
              </tr>
            ) : filtered.map(u => (
              <tr
                key={u.id}
                style={{
                  background: isSelf(u) ? '#EFF6FF' : '',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isSelf(u)) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (!isSelf(u)) e.currentTarget.style.background = ''; }}
              >
                {/* Avatar + name/email */}
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: ROLE_STYLE[u.role]?.bg || '#F1F5F9',
                      color: ROLE_STYLE[u.role]?.color || '#475569',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                    }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {u.name}
                        {isSelf(u) && (
                          <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                            (you)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                </TD>

                {/* Role badge */}
                <TD><RoleBadge role={u.role} /></TD>

                {/* Joined date */}
                <TD>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </TD>

                {/* Role change dropdown */}
                <TD center>
                  {isSelf(u) || isUntouchable(u) ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', opacity: 0.5 }}>—</span>
                  ) : (
                    <select
                      className="form-select"
                      value={u.role}
                      disabled={updatingId === u.id}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.3rem 0.5rem' }}
                    >
                      {roleOptions.map(r => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  )}
                </TD>

                {/* Delete button */}
                <TD center>
                  {canDelete(u) ? (
                    <button
                      onClick={() => handleDelete(u)}
                      style={{
                        padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none',
                        background: '#FEF2F2', color: '#DC2626',
                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                    >
                      Delete
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', opacity: 0.4 }}>—</span>
                  )}
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
        {filtered.length} of {users.length} users shown
      </p>
    </div>
  );
}

// ── Courses Tab ────────────────────────────────────────────────────────────

function CoursesTab({ courses }) {
  const [search, setSearch] = useState('');
  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input
        className="form-input"
        placeholder="🔍  Search by title or instructor..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 380, marginBottom: '1.25rem' }}
      />

      <div style={{
        background: '#fff', borderRadius: 14,
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr>
              <TH>Course</TH>
              <TH>Instructor</TH>
              <TH>Category</TH>
              <TH center>Status</TH>
              <TH center>Lessons</TH>
              <TH center>Enrollments</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No courses found.
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr
                key={c.id}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
                style={{ transition: 'background 0.15s' }}
              >
                <TD>
                  <Link
                    to={`/courses/${c.id}`}
                    style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}
                  >
                    {c.title}
                  </Link>
                </TD>
                <TD><span style={{ fontSize: '0.8125rem' }}>{c.instructor_name}</span></TD>
                <TD>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {c.category || '—'}
                  </span>
                </TD>
                <TD center>
                  <span style={{
                    display: 'inline-block', padding: '0.2rem 0.6rem',
                    borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                    background: c.status === 'published' ? '#F0FDF4' : '#F1F5F9',
                    color: c.status === 'published' ? '#15803D' : '#475569',
                  }}>
                    {c.status}
                  </span>
                </TD>
                <TD center>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{c.lesson_count}</span>
                </TD>
                <TD center>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{c.enrollment_count}</span>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
        {filtered.length} of {courses.length} courses shown
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [tab, setTab]         = useState('stats');
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), listAllUsers(), listAdminCourses()])
      .then(([s, u, c]) => {
        setStats(s);
        setUsers(u);
        setCourses(c);
      })
      .catch(err => toastError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Admin Panel
            </h1>
            <RoleBadge role={user?.role} />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            {isSuperAdmin
              ? 'Full platform control — you are the superadmin.'
              : 'Platform management — user and course oversight.'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '1.75rem',
          background: '#F1F5F9', borderRadius: 10, padding: '0.25rem',
          width: 'fit-content',
        }}>
          <Tab active={tab === 'stats'}   onClick={() => setTab('stats')}>📊 Stats</Tab>
          <Tab active={tab === 'users'}   onClick={() => setTab('users')}>👥 Users</Tab>
          <Tab active={tab === 'courses'} onClick={() => setTab('courses')}>📚 Courses</Tab>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
            Loading panel data...
          </div>
        ) : (
          <>
            {tab === 'stats'   && <StatsTab stats={stats} />}
            {tab === 'users'   && <UsersTab users={users} setUsers={setUsers} currentUser={user} />}
            {tab === 'courses' && <CoursesTab courses={courses} />}
          </>
        )}

      </main>
    </div>
  );
}
