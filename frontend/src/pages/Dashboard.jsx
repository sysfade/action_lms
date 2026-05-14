import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getDashboardData } from '../api/dashboard';
import { getMyXP } from '../api/xp';

// ── Shared components ──────────────────────────────────────────────────────

function StatTile({ icon, value, label, sub, accent = 'var(--color-primary)', loading }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid var(--color-border)',
      padding: '1.25rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem',
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        {loading ? (
          <div style={{ height: 28, width: 60, borderRadius: 6, background: 'var(--color-border)', marginBottom: 6 }} />
        ) : (
          <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', color: accent, lineHeight: 1 }}>
            {value ?? '—'}
          </div>
        )}
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', opacity: 0.7, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ pct, color = 'var(--color-primary)' }) {
  return (
    <div style={{ width: '100%', height: 7, borderRadius: 10, background: 'var(--color-border)', overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 10,
        background: color, transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </div>
  );
}

// ── Student view ────────────────────────────────────────────────────────────

const LEVEL_COLORS = {
  1: '#94A3B8', 2: '#3B82F6', 3: '#8B5CF6', 4: '#F59E0B',
  5: '#10B981', 6: '#EC4899', 7: '#EF4444',
};

function XPWidget({ xpData }) {
  if (!xpData) return null;
  const color = LEVEL_COLORS[xpData.level] || '#F59E0B';
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid var(--color-border)',
      padding: '1rem 1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        background: color + '18', color, border: `2.5px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', fontWeight: 800,
      }}>
        {xpData.level}
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
            Level {xpData.level} — {xpData.title}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>
            {xpData.currentXP.toLocaleString()} XP
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${xpData.progress}%`,
            background: `linear-gradient(90deg, ${color}, ${color}CC)`,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {xpData.xpForNextLevel
              ? `${xpData.xpForNextLevel - xpData.currentXP} XP to ${xpData.nextTitle}`
              : 'Max level reached! 🏆'}
          </span>
          <Link to="/leaderboard" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StudentDashboard({ data, loading, xpData }) {
  const pct = (done, total) => total > 0 ? Math.round((done / total) * 100) : 0;
  const barColor = (p) => p >= 80 ? '#16A34A' : p >= 40 ? '#D97706' : 'var(--color-primary)';

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatTile loading={loading} icon="📚" value={data?.enrolledCourses} label="Enrolled Courses" accent="#2563EB" />
        <StatTile loading={loading} icon="✅" value={data ? `${data.completedLessons}/${data.totalLessons}` : null} label="Lessons Completed" accent="#16A34A" />
        <StatTile loading={loading} icon="⭐" value={data?.avgScore != null ? `${data.avgScore}%` : '—'} label="Avg Score" accent="#D97706" />
        <StatTile loading={loading} icon="📥" value={data?.pendingGrading} label="Awaiting Grade" accent={data?.pendingGrading > 0 ? '#DC2626' : '#64748B'} />
      </div>

      {/* XP Level Widget */}
      <XPWidget xpData={xpData} />

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
          🎯 Continue Learning
        </h2>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 130, borderRadius: 12, background: 'var(--color-border)', opacity: 0.4 }} />)}
          </div>
        ) : data?.recentCourses?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {data.recentCourses.map(c => {
              const p = pct(c.completed_lessons, c.total_lessons);
              return (
                <div key={c.id} style={{
                  background: '#fff', borderRadius: 14, border: '1px solid var(--color-border)',
                  padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.2rem', lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>by {c.instructor_name}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                      <span>{c.completed_lessons} / {c.total_lessons} lessons</span>
                      <span style={{ fontWeight: 700, color: barColor(p) }}>{p}%</span>
                    </div>
                    <ProgressBar pct={p} color={barColor(p)} />
                  </div>
                  <Link to={`/courses/${c.id}`} style={{
                    display: 'block', textAlign: 'center', padding: '0.4rem 0', borderRadius: 8,
                    fontSize: '0.8125rem', fontWeight: 600,
                    background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                    textDecoration: 'none', marginTop: 'auto',
                  }}>
                    {p === 100 ? '✓ Review' : p > 0 ? 'Continue →' : 'Start →'}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: '#fff', borderRadius: 14, border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎓</div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>You haven't enrolled in any courses yet.</p>
            <Link to="/courses" style={{ display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>Browse Catalog</Link>
          </div>
        )}
      </section>
    </>
  );
}

// ── Instructor view ─────────────────────────────────────────────────────────

function InstructorDashboard({ data, loading }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatTile loading={loading} icon="📚" value={data?.totalCourses} label="My Courses" sub={data ? `${data.publishedCourses} published` : ''} accent="#2563EB" />
        <StatTile loading={loading} icon="🎓" value={data?.totalStudents} label="Total Students" accent="#16A34A" />
        <StatTile loading={loading} icon="📥" value={data?.pendingSubmissions} label="Pending Submissions" accent={data?.pendingSubmissions > 0 ? '#DC2626' : '#64748B'} />
        <StatTile loading={loading} icon="📝" value={data?.totalLessons} label="Total Lessons" accent="#7C3AED" />
      </div>

      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>📋 My Courses at a Glance</h2>
          <Link to="/my-courses" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>View all →</Link>
        </div>
        {loading ? (
          <div style={{ height: 200, borderRadius: 12, background: 'var(--color-border)', opacity: 0.4 }} />
        ) : data?.recentCourses?.length > 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            {data.recentCourses.map((c, i) => (
              <div key={c.id} className="flex-col-mobile" style={{
                padding: '0.875rem 1.25rem',
                borderBottom: i < data.recentCourses.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.lesson_count} lessons · {c.enrollment_count} students</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
                    background: c.status === 'published' ? '#F0FDF4' : '#F1F5F9',
                    color: c.status === 'published' ? '#15803D' : '#475569',
                  }}>{c.status}</span>
                  {parseInt(c.pending_count) > 0 && (
                    <Link to="/grading" style={{ padding: '0.25rem 0.65rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: '#FEF2F2', color: '#DC2626', textDecoration: 'none' }}>
                      {c.pending_count} to grade →
                    </Link>
                  )}
                  <Link to={`/courses/${c.id}`} style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>View →</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: '#fff', borderRadius: 14, border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✨</div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>You haven't created any courses yet.</p>
            <Link to="/courses/new" style={{ display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>Create First Course</Link>
          </div>
        )}
      </section>
    </>
  );
}

// ── Admin / Superadmin view ─────────────────────────────────────────────────

function AdminDashboard({ data, loading }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatTile loading={loading} icon="👥" value={data?.totalUsers} label="Registered Users" accent="#2563EB" />
        <StatTile loading={loading} icon="📚" value={data?.totalCourses} label="Total Courses" sub={data ? `${data.publishedCourses} published · ${data.draftCourses} draft` : ''} accent="#16A34A" />
        <StatTile loading={loading} icon="🎓" value={data?.totalEnrollments} label="Total Enrollments" accent="#7C3AED" />
        <StatTile loading={loading} icon="📥" value={data?.pendingSubmissions} label="Pending Submissions" accent={data?.pendingSubmissions > 0 ? '#DC2626' : '#64748B'} />
      </div>

      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #FAF5FF 0%, #F0F9FF 100%)',
          border: '1px solid #E9D5FF', borderRadius: 14,
          padding: '1.75rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#7E22CE', marginBottom: '0.4rem' }}>🛠 Platform Overview</div>
            <p style={{ fontSize: '0.9rem', color: '#6B21A8', margin: 0, lineHeight: 1.5 }}>
              {loading ? 'Loading...' : `Managing ${data?.totalUsers} users across ${data?.totalCourses} courses with ${data?.totalEnrollments} active enrollments.`}
            </p>
          </div>
          <Link to="/admin" style={{ display: 'inline-block', padding: '0.6rem 1.5rem', borderRadius: 10, background: '#7E22CE', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            Open Admin Panel →
          </Link>
        </div>
      </section>
    </>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [xpData, setXpData]   = useState(null);

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch XP data for students
    if (user?.role === 'student') {
      getMyXP().then(setXpData).catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const subtitles = {
    student:    "Keep the momentum going — your goals are within reach.",
    instructor: "Your students are counting on you. Let's see what needs attention.",
    admin:      "Here's your platform at a glance.",
    superadmin: "You have full control of the platform.",
  };

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: 1100 }}>

        {/* Hero greeting */}
        <div className="dashboard-welcome" style={{ marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {greeting()}, {user?.name}
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          </h1>
          <p>{subtitles[user?.role] ?? 'Welcome back!'}</p>
        </div>

        {/* Role-specific live content */}
        {user?.role === 'student' && <StudentDashboard data={data} loading={loading} xpData={xpData} />}
        {user?.role === 'instructor' && <InstructorDashboard data={data} loading={loading} />}
        {(user?.role === 'admin' || user?.role === 'superadmin') && <AdminDashboard data={data} loading={loading} />}

        {/* Quick action cards */}
        <div>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Quick Actions
          </h2>
          <div className="dashboard-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            <Link to="/courses" className="dashboard-card" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>📚 Explore Catalog</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Browse all available courses.</p>
            </Link>

            <Link to="/my-courses" className="dashboard-card" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>🎯 {user?.role === 'student' ? 'My Learning' : 'Manage Courses'}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {user?.role === 'student' ? 'All your enrolled courses.' : 'View and manage your courses.'}
              </p>
            </Link>

            {user?.role === 'student' && (
              <Link to="/progress" className="dashboard-card" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>📊 My Progress</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Grades, progress, and feedback.</p>
              </Link>
            )}

            {(user?.role === 'instructor' || user?.role === 'admin' || user?.role === 'superadmin') && (
              <>
                <Link to="/courses/new" className="dashboard-card" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>✨ Create Course</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Draft a new course.</p>
                </Link>
                <Link to="/grading" className="dashboard-card" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>📥 Grade Submissions</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Review and grade student work.</p>
                </Link>
              </>
            )}

            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Link to="/admin" className="dashboard-card" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #E9D5FF', background: '#FAF5FF' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#7E22CE' }}>🛠 Admin Panel</h3>
                <p style={{ fontSize: '0.875rem', color: '#A855F7' }}>Full platform management.</p>
              </Link>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
