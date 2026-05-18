import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMySubmissions } from '../api/assessments';
import { listMyCourses } from '../api/courses';
import { getMyAchievements } from '../api/xp';

const STATUS_META = {
  graded:          { label: 'Graded',         color: '#15803D', bg: '#F0FDF4', dot: '#22C55E' },
  pending_grading: { label: 'Pending Review', color: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' },
  in_progress:     { label: 'In Progress',    color: '#475569', bg: '#F1F5F9', dot: '#94A3B8' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.in_progress;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.25rem 0.625rem', borderRadius: '999px',
      fontSize: '0.75rem', fontWeight: 600,
      color: meta.color, background: meta.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
      {meta.label}
    </span>
  );
}

function StatTile({ icon, value, label, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid var(--color-border)',
      padding: '1.25rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: accent + '18', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.5px', color: accent }}>
          {value}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function CourseProgressCard({ course }) {
  const total = parseInt(course.total_lessons) || 0;
  const done  = parseInt(course.completed_lessons) || 0;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const barColor = pct >= 80 ? '#22C55E' : pct >= 40 ? '#F59E0B' : '#2563EB';

  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid var(--color-border)',
      padding: '1.25rem 1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>{course.title}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            by {course.instructor_name}
          </div>
        </div>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: barColor }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 8, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${pct}%`,
          background: barColor,
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
        {done} of {total} lesson{total !== 1 ? 's' : ''} complete
      </div>
    </div>
  );
}

function SubmissionRow({ sub }) {
  const [expanded, setExpanded] = useState(false);
  const hasScore    = sub.total_score !== null && sub.total_score !== undefined;
  const hasFeedback = sub.instructor_feedback;
  const passed      = hasScore && sub.passing_score != null && sub.total_score >= sub.passing_score;

  return (
    <>
      <tr
        onClick={() => hasFeedback && setExpanded(e => !e)}
        style={{
          borderBottom: '1px solid var(--color-border)',
          cursor: hasFeedback ? 'pointer' : 'default',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        <td style={{ padding: '0.875rem 1rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.assessment_title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {sub.lesson_title}
          </div>
        </td>
        <td style={{ padding: '0.875rem 1rem' }}>
          <Link
            to={`/courses/${sub.course_id}`}
            style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 500 }}
            onClick={e => e.stopPropagation()}
          >
            {sub.course_title}
          </Link>
        </td>
        <td style={{ padding: '0.875rem 1rem' }}>
          <StatusBadge status={sub.status} />
        </td>
        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
          {hasScore ? (
            <span style={{
              fontWeight: 700, fontSize: '1rem',
              color: sub.status === 'graded' ? (passed ? '#15803D' : '#DC2626') : 'var(--color-text-muted)',
            }}>
              {sub.total_score}
              {sub.passing_score != null && (
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 2 }}>
                  / pass {sub.passing_score}
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>—</span>
          )}
        </td>
        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
          }) : '—'}
        </td>
        <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {hasFeedback ? (expanded ? '▲' : '▼') : ''}
        </td>
      </tr>
      {expanded && hasFeedback && (
        <tr style={{ background: '#FFFBEB' }}>
          <td colSpan={6} style={{ padding: '0.75rem 1rem 1rem 1.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#B45309', marginBottom: '0.25rem' }}>
              💬 Instructor Feedback
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
              {sub.instructor_feedback}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function BadgeCard({ badge }) {
  const isUnlocked = badge.unlocked;
  return (
    <div style={{
      background: isUnlocked ? '#FFFBEB' : '#F8FAFC',
      border: `1px solid ${isUnlocked ? '#FCD34D' : 'var(--color-border)'}`,
      borderRadius: 14, padding: '1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      opacity: isUnlocked ? 1 : 0.6,
      filter: isUnlocked ? 'none' : 'grayscale(100%)',
      transition: 'all 0.2s',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        background: isUnlocked ? '#FEF3C7' : '#E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', border: `2px solid ${isUnlocked ? '#F59E0B' : '#CBD5E1'}`,
      }}>
        {isUnlocked ? badge.emoji : '🔒'}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: isUnlocked ? '#92400E' : 'var(--color-text)' }}>
          {badge.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
          {badge.description}
        </div>
        {isUnlocked && badge.unlockedAt && (
          <div style={{ fontSize: '0.65rem', color: '#D97706', marginTop: 4, fontWeight: 600 }}>
            Earned on {new Date(badge.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyProgress() {
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses]         = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    Promise.all([getMySubmissions(), listMyCourses(), getMyAchievements()])
      .then(([subs, crses, achvs]) => {
        setSubmissions(subs);
        setCourses(crses);
        setAchievements(achvs.badges || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Derived stats
  const graded       = submissions.filter(s => s.status === 'graded');
  const avgScore     = graded.length
    ? Math.round(graded.reduce((acc, s) => acc + (s.total_score || 0), 0) / graded.length)
    : null;
  const totalLessons = courses.reduce((a, c) => a + (parseInt(c.total_lessons) || 0), 0);
  const doneLessons  = courses.reduce((a, c) => a + (parseInt(c.completed_lessons) || 0), 0);

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: 1080 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.25rem' }}>
            My Progress
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Track your learning journey, grades, and instructor feedback all in one place.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
            Loading your progress...
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <>
            {/* ── Stats Bar ─────────────────────────────── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}>
              <StatTile icon="📚" value={courses.length}      label="Courses enrolled"    accent="#2563EB" />
              <StatTile icon="✅" value={`${doneLessons}/${totalLessons}`} label="Lessons completed" accent="#15803D" />
              <StatTile icon="📝" value={submissions.length}  label="Assessments submitted" accent="#7C3AED" />
              <StatTile icon="⭐" value={avgScore !== null ? avgScore : '—'} label="Average score (graded)" accent="#D97706" />
            </div>

            {/* ── Course Progress ────────────────────────── */}
            {courses.length > 0 && (
              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.3px' }}>
                  Course Progress
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1rem',
                }}>
                  {courses.map(c => <CourseProgressCard key={c.id} course={c} />)}
                </div>
              </section>
            )}

            {/* ── My Achievements ────────────────────────── */}
            <section style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.3px' }}>
                  My Achievements
                </h2>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked
                </span>
              </div>
              
              {achievements.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: 14, border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
                  No badges available.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1rem',
                }}>
                  {achievements.map(b => <BadgeCard key={b.key} badge={b} />)}
                </div>
              )}
            </section>

            {/* ── Assessment Results ─────────────────────── */}
            <section>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.3px' }}>
                Assessment Results
              </h2>

              {submissions.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem',
                  background: '#fff', borderRadius: 14,
                  border: '1px dashed var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                  You haven't submitted any assessments yet.
                </div>
              ) : (
                <div style={{
                  background: '#fff', borderRadius: 14,
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)', background: '#F8FAFC' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessment</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem', width: 32 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => <SubmissionRow key={sub.id} sub={sub} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
