import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await loginUser(form);
      login(token, user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left decorative panel */}
      <div className="auth-panel-left">
        <div className="auth-panel-left-inner">
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', lineHeight: 1.2 }}>
            Ready to level up?
          </h1>
          <p style={{ fontSize: '1.0625rem', color: '#C7D2FE', lineHeight: 1.65, marginBottom: '2.5rem' }}>
            Your courses, progress, and certificates are all waiting for you.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '📚', text: 'Access your courses anytime' },
              { icon: '🏆', text: 'Earn certificates you can share' },
              { icon: '📊', text: 'Track your progress in real time' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>{icon}</div>
                <span style={{ color: '#C7D2FE', fontSize: '0.9375rem' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">AL</div>
            <span className="auth-logo-text">ActionLMS</span>
          </div>

          <h1 className="auth-heading">Welcome back 👋</h1>
          <p className="auth-subheading">Sign in to continue your learning journey.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className="form-input"
                type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="you@school.edu"
                autoComplete="email" required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password" name="password" value={form.password}
                onChange={handleChange} placeholder="••••••••"
                autoComplete="current-password" required
              />
            </div>

            <button id="login-submit" className="btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <hr className="divider" />
          <p className="auth-footer">
            New here?{' '}
            <Link to="/register" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
