import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueCertificate } from '../api/certificates';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const CERT_ID_DISPLAY = (id) => `CERT-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function Certificate() {
  const { courseId }  = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const [cert,   setCert]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,  setError]   = useState('');

  useEffect(() => {
    // POST is idempotent — issues if not yet issued, returns existing otherwise
    issueCertificate(courseId)
      .then(setCert)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handlePrint = () => window.print();

  // ── Loading ─────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🏆</div>
        <p style={{ color: 'var(--color-text-muted)' }}>Generating your certificate...</p>
      </main>
    </div>
  );

  // ── Error (not 100% complete yet) ───────────────────────────────────────

  if (error) return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: 560, textAlign: 'center', paddingTop: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h1 style={{ marginBottom: '0.75rem' }}>Certificate Locked</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>{error}</p>
        <button onClick={() => navigate(`/courses/${courseId}`)} style={{
          padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none',
          background: 'var(--color-primary)', color: '#fff',
          fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
        }}>
          ← Back to Course
        </button>
      </main>
    </div>
  );

  // ── Certificate ──────────────────────────────────────────────────────────

  return (
    <>
      {/* Print styles injected inline */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        @media print {
          body * { visibility: hidden !important; }
          #cert-document, #cert-document * { visibility: visible !important; }
          #cert-document {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            margin: 0 !important; padding: 0 !important;
            background: #fff !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Navbar (hidden on print) */}
      <div className="no-print">
        <Navbar />
      </div>

      <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '2rem 1rem' }}>

        {/* Action buttons (hidden on print) */}
        <div className="no-print" style={{
          maxWidth: 860, margin: '0 auto 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <Link to={`/courses/${courseId}`} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--color-text-muted)', textDecoration: 'none',
            fontSize: '0.875rem', fontWeight: 600,
          }}>
            ← Back to Course
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/my-certificates" style={{
              padding: '0.5rem 1.1rem', borderRadius: 8,
              border: '1px solid var(--color-border)', background: '#fff',
              color: 'var(--color-text)', textDecoration: 'none',
              fontSize: '0.875rem', fontWeight: 600,
            }}>
              🏆 My Certificates
            </Link>
            <button onClick={handlePrint} style={{
              padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none',
              background: 'var(--color-primary)', color: '#fff',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              🖨️ Download / Print
            </button>
          </div>
        </div>

        {/* ── The actual certificate ─────────────────────────────────── */}
        <div id="cert-document" style={{
          maxWidth: 860, margin: '0 auto',
          background: '#FFFDF5',
          border: '2px solid #D4AF37',
          borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Corner ornaments */}
          {['top-left','top-right','bottom-left','bottom-right'].map(pos => {
            const isTop    = pos.includes('top');
            const isLeft   = pos.includes('left');
            return (
              <div key={pos} style={{
                position: 'absolute',
                top:    isTop    ? 12 : 'auto',
                bottom: !isTop   ? 12 : 'auto',
                left:   isLeft   ? 12 : 'auto',
                right:  !isLeft  ? 12 : 'auto',
                width: 48, height: 48,
                borderTop:    isTop    ? '3px solid #D4AF37' : 'none',
                borderBottom: !isTop   ? '3px solid #D4AF37' : 'none',
                borderLeft:   isLeft   ? '3px solid #D4AF37' : 'none',
                borderRight:  !isLeft  ? '3px solid #D4AF37' : 'none',
              }} />
            );
          })}

          {/* Inner border */}
          <div style={{
            margin: '28px', border: '1px solid #D4AF3766', borderRadius: 2,
            padding: '3rem 3.5rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: '0',
          }}>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #D4AF37, #F5D97A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', margin: '0 auto 1rem',
                boxShadow: '0 4px 16px rgba(212,175,55,0.35)',
              }}>🏆</div>
              <p style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '0.875rem', letterSpacing: '0.25em', textTransform: 'uppercase',
                color: '#B8960C', fontWeight: 400, margin: 0,
              }}>
                ActionLMS
              </p>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700, color: '#1A1A2E',
              margin: '0 0 0.25rem', letterSpacing: '-0.5px',
            }}>
              Certificate of Completion
            </h1>
            <div style={{ width: 80, height: 2, background: '#D4AF37', margin: '0.75rem auto 1.5rem' }} />

            {/* Body text */}
            <p style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1rem', color: '#6B7280',
              margin: '0 0 1rem', fontStyle: 'italic',
            }}>
              This is to certify that
            </p>

            <h2 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 700, color: '#1A1A2E',
              margin: '0 0 1.25rem', letterSpacing: '-0.5px',
              borderBottom: '2px solid #D4AF3744', paddingBottom: '0.75rem',
            }}>
              {cert.student_name}
            </h2>

            <p style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1rem', color: '#6B7280',
              margin: '0 0 0.75rem', fontStyle: 'italic',
            }}>
              has successfully completed the course
            </p>

            <h3 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(1.2rem, 3vw, 1.65rem)',
              fontWeight: 700, color: '#2563EB',
              margin: '0 0 2.5rem', maxWidth: '80%',
            }}>
              {cert.course_title}
            </h3>

            {/* Footer row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              width: '100%', borderTop: '1px solid #D4AF3744', paddingTop: '1.5rem',
              flexWrap: 'wrap', gap: '1.5rem',
            }}>
              {/* Instructor */}
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  width: 130, height: 1, background: '#1A1A2E44', marginBottom: 6,
                }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1A1A2E' }}>
                  {cert.instructor_name}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Instructor
                </p>
              </div>

              {/* Seal */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.25rem',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '3px solid #D4AF37',
                  background: 'linear-gradient(135deg, #FFFDF5, #FEF3C7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: '0 2px 8px rgba(212,175,55,0.25)',
                }}>⭐</div>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Verified
                </p>
              </div>

              {/* Date & ID */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  width: 130, height: 1, background: '#1A1A2E44', marginBottom: 6, marginLeft: 'auto',
                }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1A1A2E' }}>
                  {formatDate(cert.issued_at)}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Date Issued
                </p>
              </div>
            </div>

            {/* Certificate ID */}
            <p style={{
              marginTop: '1.25rem', fontSize: '0.7rem',
              color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Certificate ID: {CERT_ID_DISPLAY(cert.id)}
            </p>

          </div>
        </div>

        {/* Bottom action bar (hidden on print) */}
        <div className="no-print" style={{ maxWidth: 860, margin: '1.5rem auto 0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Click <strong>Download / Print</strong> and choose "Save as PDF" in the print dialog to save a copy.
          </p>
        </div>

      </main>
    </>
  );
}
