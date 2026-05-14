import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Category → color mapping
const CATEGORY_COLORS = {
  'Mathematics':       { bg: '#EEF2FF', accent: '#6366F1', text: '#4338CA', emoji: '🔢' },
  'Science':           { bg: '#F0FDF4', accent: '#22C55E', text: '#15803D', emoji: '🔬' },
  'English':           { bg: '#FFF7ED', accent: '#F97316', text: '#EA580C', emoji: '📖' },
  'History':           { bg: '#FFFBEB', accent: '#F59E0B', text: '#D97706', emoji: '🏛️' },
  'Geography':         { bg: '#F0FDFA', accent: '#14B8A6', text: '#0F766E', emoji: '🌍' },
  'Computer Science':  { bg: '#F5F3FF', accent: '#8B5CF6', text: '#7C3AED', emoji: '💻' },
  'Art':               { bg: '#FFF1F2', accent: '#F43F5E', text: '#BE123C', emoji: '🎨' },
  'Music':             { bg: '#FDF4FF', accent: '#A855F7', text: '#7E22CE', emoji: '🎵' },
  'Physical Education':{ bg: '#F0FDF4', accent: '#22C55E', text: '#166534', emoji: '⚽' },
  'Business':          { bg: '#FFFBEB', accent: '#EAB308', text: '#A16207', emoji: '📈' },
};

const getCategoryStyle = (cat) =>
  CATEGORY_COLORS[cat] || { bg: '#EEF2FF', accent: '#6366F1', text: '#4338CA', emoji: '📚' };

export default function CourseCard({ course, onEnroll, onUnenroll }) {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';
  const isAdmin      = user?.role === 'admin' || user?.role === 'superadmin';
  const isOwner      = course.instructor_id === user?.id;
  const catStyle     = getCategoryStyle(course.category);
  const pct          = course.progress_percent || 0;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow-card)',
      transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = '#C4B5FD';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      {/* Category banner */}
      <div style={{
        background: catStyle.bg, padding: '0.875rem 1.25rem',
        borderBottom: `2px solid ${catStyle.accent}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{catStyle.emoji}</span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: catStyle.text,
          }}>
            {course.category || 'General'}
          </span>
        </div>
        {(isAdmin || (isInstructor && isOwner)) && (
          <span className={`role-badge ${course.status}`} style={{ fontSize: '0.66rem' }}>
            {course.status}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '1.125rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text)',
          lineHeight: 1.3, marginBottom: '0.35rem', letterSpacing: '-0.2px',
        }}>
          {course.title}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          by <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{course.instructor_name}</strong>
        </p>
        <p style={{
          fontSize: '0.8375rem', color: 'var(--color-text-muted)', flex: 1,
          marginBottom: '1rem', display: '-webkit-box',
          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          lineHeight: 1.55,
        }}>
          {course.description || 'No description provided.'}
        </p>

        {/* Progress bar for enrolled students */}
        {user?.role === 'student' && course.enrolled && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.73rem', marginBottom: '0.35rem',
            }}>
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {pct === 100 ? '🏆 Complete!' : 'Progress'}
              </span>
              <span style={{
                fontWeight: 800, fontSize: '0.8rem',
                color: pct === 100 ? '#22C55E' : catStyle.accent,
              }}>{pct}%</span>
            </div>
            <div style={{
              width: '100%', height: 7, borderRadius: 99,
              background: 'var(--color-border)', overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 99,
                background: pct === 100
                  ? 'linear-gradient(90deg,#22C55E,#4ADE80)'
                  : `linear-gradient(90deg, ${catStyle.accent}, ${catStyle.accent}BB)`,
                transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '0.5rem',
          paddingTop: '0.875rem',
          borderTop: '1px solid var(--color-border)',
          marginTop: 'auto',
        }}>
          <Link to={`/courses/${course.id}`} style={{
            padding: '0.45rem 1rem', borderRadius: 8,
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text)', fontWeight: 600, fontSize: '0.8125rem',
            textDecoration: 'none', transition: 'all 0.15s',
            background: 'var(--color-surface)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = catStyle.accent; e.currentTarget.style.color = catStyle.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text)'; }}
          >
            View →
          </Link>

          {user?.role === 'student' && (
            course.enrolled ? (
              pct === 100 ? (
                <Link to={`/certificates/${course.id}`} style={{
                  padding: '0.45rem 0.9rem', borderRadius: 8,
                  background: 'linear-gradient(135deg,#D4AF37,#F5D97A)',
                  color: '#78350F', fontWeight: 700, fontSize: '0.8rem',
                  textDecoration: 'none',
                }}>🏆 Certificate</Link>
              ) : (
                <button onClick={() => onUnenroll(course.id)} style={{
                  padding: '0.45rem 0.9rem', borderRadius: 8,
                  border: '1.5px solid #BBF7D0', background: '#F0FDF4',
                  color: '#15803D', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                }}>✓ Enrolled</button>
              )
            ) : (
              <button onClick={() => onEnroll(course.id)} style={{
                padding: '0.45rem 1rem', borderRadius: 8, border: 'none',
                background: `linear-gradient(135deg, ${catStyle.accent}, ${catStyle.accent}CC)`,
                color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                cursor: 'pointer', boxShadow: `0 2px 8px ${catStyle.accent}44`,
              }}>Enroll Free</button>
            )
          )}

          {(isAdmin || (isInstructor && isOwner)) && (
            <Link to={`/courses/${course.id}/edit`} style={{
              padding: '0.45rem 0.875rem', borderRadius: 8,
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem',
              textDecoration: 'none',
            }}>Edit</Link>
          )}
        </div>
      </div>
    </div>
  );
}
