import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { updateProfile } from '../api/auth';
import { useToast } from '../context/ToastContext';
import { getMyXP, getMyAchievements } from '../api/xp';

const ROLE_STYLE = {
  student:    { bg: '#EFF6FF', color: '#1D4ED8' },
  instructor: { bg: '#F0FDF4', color: '#15803D' },
  admin:      { bg: '#FFF7ED', color: '#C2410C' },
  superadmin: { bg: '#FDF4FF', color: '#7E22CE' },
};

export default function UserProfile() {
  const { user, setUser }             = useAuth();
  const { success, error: toastError } = useToast();

  // Name form
  const [name,        setName]        = useState(user?.name || '');
  const [savingName,  setSavingName]  = useState(false);

  // Password form
  const [currentPw,   setCurrentPw]  = useState('');
  const [newPw,       setNewPw]      = useState('');
  const [confirmPw,   setConfirmPw]  = useState('');
  const [savingPw,    setSavingPw]   = useState(false);
  const [showPw,      setShowPw]     = useState(false);

  // XP & Achievements
  const [xpData,      setXpData]      = useState(null);
  const [badges,      setBadges]      = useState([]);

  useEffect(() => {
    if (user?.role === 'student') {
      getMyXP().then(setXpData).catch(console.error);
      getMyAchievements().then(d => setBadges(d.badges || [])).catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toastError('Name cannot be empty.');
    if (name.trim() === user.name) return toastError('No changes to save.');
    setSavingName(true);
    try {
      const { user: updated } = await updateProfile({ name: name.trim() });
      setUser(updated);
      success('Name updated successfully!');
    } catch (err) {
      toastError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) return toastError('All password fields are required.');
    if (newPw !== confirmPw) return toastError('New passwords do not match.');
    if (newPw.length < 6) return toastError('New password must be at least 6 characters.');
    setSavingPw(true);
    try {
      await updateProfile({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      success('Password changed successfully!');
    } catch (err) {
      toastError(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  // ── Avatar initials ──────────────────────────────────────────────────────

  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rs = ROLE_STYLE[user?.role] || { bg: '#F1F5F9', color: '#475569' };

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: 680 }}>

        {/* Page header */}
        <div className="dashboard-welcome" style={{ marginBottom: '2rem' }}>
          <h1>My Profile</h1>
          <p>Manage your account details and security settings.</p>
        </div>

        {/* Profile card */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)',
          padding: '2rem', marginBottom: '1.5rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: '1.5rem',
        }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: rs.bg, color: rs.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px',
            border: `3px solid ${rs.color}30`,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{user?.email}</div>
            <span style={{
              display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999,
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
              background: rs.bg, color: rs.color,
            }}>
              {user?.role}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Member since</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>

        {/* XP & Achievements (students only) */}
        {user?.role === 'student' && xpData && (
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)',
            padding: '1.75rem 2rem', marginBottom: '1.5rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
              ⚡ XP & Achievements
            </h2>

            {/* Level bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: '#F59E0B18', color: '#F59E0B', border: '2.5px solid #F59E0B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 800,
              }}>
                {xpData.level}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                    Level {xpData.level} — {xpData.title}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F59E0B' }}>
                    {xpData.currentXP.toLocaleString()} XP
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${xpData.progress}%`,
                    background: 'linear-gradient(90deg, #F59E0B, #D97706)',
                    transition: 'width 1s ease',
                  }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {xpData.xpForNextLevel
                    ? `${xpData.xpForNextLevel - xpData.currentXP} XP to ${xpData.nextTitle}`
                    : 'Max level reached! 🏆'}
                </div>
              </div>
            </div>

            {/* Badge grid */}
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Badges
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
              {badges.map(badge => (
                <div
                  key={badge.key}
                  title={badge.description}
                  style={{
                    textAlign: 'center', padding: '0.875rem 0.5rem',
                    borderRadius: 12,
                    background: badge.unlocked ? '#FFFBEB' : '#F8FAFC',
                    border: `1px solid ${badge.unlocked ? '#FCD34D' : 'var(--color-border)'}`,
                    opacity: badge.unlocked ? 1 : 0.45,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                    {badge.unlocked ? badge.emoji : '🔒'}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: badge.unlocked ? '#92400E' : 'var(--color-text-muted)' }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                    {badge.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Update name */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)',
          padding: '1.75rem 2rem', marginBottom: '1.5rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
            ✏️ Update Display Name
          </h2>
          <form onSubmit={handleNameSave}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Display Name</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                maxLength={80}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={savingName}
                style={{
                  padding: '0.55rem 1.5rem', borderRadius: 8, border: 'none',
                  background: 'var(--color-primary)', color: '#fff',
                  fontWeight: 600, fontSize: '0.875rem', cursor: savingName ? 'not-allowed' : 'pointer',
                  opacity: savingName ? 0.7 : 1, fontFamily: 'var(--font-base)',
                }}
              >
                {savingName ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)',
          padding: '1.75rem 2rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>🔒 Change Password</h2>
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600,
              }}
            >
              {showPw ? 'Hide' : 'Show'} fields
            </button>
          </div>

          {showPw && (
            <form onSubmit={handlePasswordSave}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Current Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {/* Password strength indicator */}
              {newPw && (
                <div style={{ marginBottom: '1rem' }}>
                  {(() => {
                    const strength = newPw.length >= 12 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw)
                      ? { label: 'Strong', color: '#16A34A', width: '100%' }
                      : newPw.length >= 8
                      ? { label: 'Fair', color: '#D97706', width: '66%' }
                      : { label: 'Weak', color: '#DC2626', width: '33%' };
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Password strength</span>
                          <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 10, background: 'var(--color-border)', overflow: 'hidden' }}>
                          <div style={{ width: strength.width, height: '100%', background: strength.color, transition: 'width 0.3s ease, background 0.3s ease', borderRadius: 10 }} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={savingPw}
                  style={{
                    padding: '0.55rem 1.5rem', borderRadius: 8, border: 'none',
                    background: '#DC2626', color: '#fff',
                    fontWeight: 600, fontSize: '0.875rem', cursor: savingPw ? 'not-allowed' : 'pointer',
                    opacity: savingPw ? 0.7 : 1, fontFamily: 'var(--font-base)',
                  }}
                >
                  {savingPw ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {!showPw && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Click "Show fields" to change your password. You'll need your current password.
            </p>
          )}
        </div>

      </main>
    </div>
  );
}
