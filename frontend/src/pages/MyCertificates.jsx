import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMyCertificates } from '../api/certificates';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const CERT_ID_DISPLAY = (id) => `CERT-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export default function MyCertificates() {
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCertificates()
      .then(setCerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: 800 }}>
        <div className="dashboard-welcome" style={{ marginBottom: '2rem' }}>
          <h1>🏆 My Certificates</h1>
          <p>Courses you've fully completed and earned a certificate for.</p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 96, borderRadius: 14, background: 'var(--color-border)', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : certs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem', background: '#fff',
            borderRadius: 16, border: '1px dashed var(--color-border)',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎓</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No certificates yet</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Complete all lessons in a course to earn your first certificate.
            </p>
            <Link to="/courses" style={{
              display: 'inline-block', padding: '0.6rem 1.5rem', borderRadius: 8,
              background: 'var(--color-primary)', color: '#fff', textDecoration: 'none',
              fontWeight: 700, fontSize: '0.875rem',
            }}>Browse Courses</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {certs.map(cert => (
              <div key={cert.id} style={{
                background: '#FFFDF5', border: '1.5px solid #D4AF37',
                borderRadius: 14, padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '1rem', flexWrap: 'wrap',
                boxShadow: '0 2px 12px rgba(212,175,55,0.12)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4AF37, #F5D97A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(212,175,55,0.3)',
                  }}>🏆</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1A1A2E', marginBottom: 2 }}>
                      {cert.course_title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                      by {cert.instructor_name}
                      {cert.category && <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.45rem', borderRadius: 999, background: '#EFF6FF', color: '#2563EB', fontSize: '0.7rem', fontWeight: 700 }}>{cert.category}</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#B8960C', marginTop: 3, letterSpacing: '0.05em' }}>
                      {CERT_ID_DISPLAY(cert.id)} · Issued {formatDate(cert.issued_at)}
                    </div>
                  </div>
                </div>
                <Link to={`/certificates/${cert.course_id}`} style={{
                  padding: '0.5rem 1.1rem', borderRadius: 8,
                  border: '1.5px solid #D4AF37', background: '#fff',
                  color: '#B8960C', textDecoration: 'none',
                  fontWeight: 700, fontSize: '0.8125rem', whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}>
                  View Certificate →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
