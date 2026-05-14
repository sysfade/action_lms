import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getLeaderboard } from '../api/xp';

const LEVEL_COLORS = {
  1: '#94A3B8', // Rookie — slate
  2: '#3B82F6', // Learner — blue
  3: '#8B5CF6', // Scholar — purple
  4: '#F59E0B', // Achiever — amber
  5: '#10B981', // Expert — emerald
  6: '#EC4899', // Master — pink
  7: '#EF4444', // Legend — red
};

function LevelBadge({ level, title, size = 'sm' }) {
  const color = LEVEL_COLORS[level] || '#94A3B8';
  const s = size === 'lg' ? { w: 40, h: 40, font: '0.9rem' } : { w: 28, h: 28, font: '0.7rem' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: s.w, height: s.h, borderRadius: '50%',
      background: color + '20', color, border: `2px solid ${color}`,
      fontSize: s.font, fontWeight: 800, flexShrink: 0,
    }}
      title={`Level ${level} — ${title}`}
    >
      {level}
    </span>
  );
}

function PodiumCard({ entry, medal, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `2px solid ${accent}30`,
      padding: '1.5rem 1.25rem',
      textAlign: 'center',
      boxShadow: `0 4px 20px ${accent}15`,
      flex: 1,
      minWidth: 140,
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{medal}</div>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', margin: '0 auto 0.5rem',
        background: accent + '15', color: accent, border: `3px solid ${accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', fontWeight: 800,
      }}>
        {entry.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.15rem', color: 'var(--color-text)' }}>
        {entry.name}
      </div>
      <div style={{ fontSize: '0.8rem', color: accent, fontWeight: 600, marginBottom: '0.35rem' }}>
        {entry.title}
      </div>
      <div style={{
        fontSize: '1.25rem', fontWeight: 800, color: accent,
        letterSpacing: '-0.5px',
      }}>
        {entry.totalXP.toLocaleString()} XP
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const leaderboard = data?.leaderboard || [];
  const myEntry = data?.myEntry;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: 800 }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.25rem' }}>
            🏆 Leaderboard
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Top students ranked by experience points.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
            Loading leaderboard...
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem',
            background: '#fff', borderRadius: 16,
            border: '1px dashed var(--color-border)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏅</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>
              No XP earned yet. Complete lessons and quizzes to climb the ranks!
            </p>
            <Link to="/courses" style={{
              display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: 8,
              background: 'var(--color-primary)', color: '#fff', textDecoration: 'none',
              fontWeight: 600, fontSize: '0.875rem',
            }}>Browse Courses</Link>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <div style={{
                display: 'flex', gap: '1rem', marginBottom: '2rem',
                justifyContent: 'center', flexWrap: 'wrap',
              }}>
                {top3[1] && <PodiumCard entry={top3[1]} medal="🥈" accent="#94A3B8" />}
                {top3[0] && <PodiumCard entry={top3[0]} medal="🥇" accent="#F59E0B" />}
                {top3[2] && <PodiumCard entry={top3[2]} medal="🥉" accent="#CD7F32" />}
              </div>
            )}

            {/* Remaining table */}
            {rest.length > 0 && (
              <div style={{
                background: '#fff', borderRadius: 14,
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                marginBottom: '1.5rem',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', background: '#F8FAFC' }}>
                      <th style={thStyle}>Rank</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Student</th>
                      <th style={thStyle}>Level</th>
                      <th style={thStyle}>XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map(entry => (
                      <tr
                        key={entry.userId}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          background: entry.userId === user?.id ? '#FFFBEB' : '',
                        }}
                      >
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          #{entry.rank}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <LevelBadge level={entry.level} title={entry.title} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {entry.name}
                                {entry.userId === user?.id && (
                                  <span style={{
                                    marginLeft: '0.4rem', fontSize: '0.7rem', fontWeight: 700,
                                    color: '#D97706', background: '#FFFBEB',
                                    padding: '0.1rem 0.4rem', borderRadius: 4,
                                  }}>YOU</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 700,
                            color: LEVEL_COLORS[entry.level] || '#64748B',
                          }}>
                            {entry.title}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#D97706' }}>
                          {entry.totalXP.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Current user not in top 20 */}
            {myEntry && (
              <div style={{
                background: '#FFFBEB', borderRadius: 14,
                border: '1px solid #FCD34D',
                padding: '1rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <LevelBadge level={myEntry.level} title={myEntry.title} size="lg" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Your Rank: #{myEntry.rank}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#92400E' }}>{myEntry.title}</div>
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>
                  {myEntry.totalXP.toLocaleString()} XP
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}

const thStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
};
