import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const styles = {
  page: {
    fontFamily: "'Inter', system-ui, sans-serif",
    background: '#07051a',
    minHeight: '100vh',
    color: '#fff',
    overflowX: 'hidden',
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    height: '72px',
    display: 'flex', alignItems: 'center',
    background: 'rgba(7,5,26,0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(139,92,246,0.15)',
  },
  navInner: {
    maxWidth: '1200px', margin: '0 auto', width: '100%',
    padding: '0 2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    textDecoration: 'none', fontWeight: 800, fontSize: '1.2rem', color: '#fff',
  },
  logoIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 900, fontSize: '0.85rem', color: '#fff',
    boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: '2rem' },
  navLink: {
    color: '#c4b5fd', fontWeight: 500, fontSize: '0.9375rem',
    textDecoration: 'none', cursor: 'pointer',
    background: 'none', border: 'none', fontFamily: 'inherit',
    transition: 'color 0.2s',
  },
  navCta: {
    padding: '0.55rem 1.4rem',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
    borderRadius: '10px', textDecoration: 'none',
    boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
    transition: 'all 0.2s',
    display: 'inline-block',
  },

  // ── Hero ────────────────────────────────────────────────────
  hero: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '8rem 2rem 5rem',
    overflow: 'hidden',
  },
  heroBgImage: {
    position: 'absolute', inset: 0,
    backgroundImage: "url('/hero_bg_landing.png')",
    backgroundSize: 'cover', backgroundPosition: 'center',
    opacity: 0.35,
    mixBlendMode: 'color-dodge',
    pointerEvents: 'none',
  },
  heroBgGradient: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(99,102,241,0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.15) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  heroOrb1: {
    position: 'absolute', top: '10%', left: '-5%',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
    pointerEvents: 'none', filter: 'blur(40px)',
  },
  heroOrb2: {
    position: 'absolute', bottom: '5%', right: '-5%',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
    pointerEvents: 'none', filter: 'blur(40px)',
  },
  heroContent: {
    position: 'relative', zIndex: 5,
    maxWidth: '820px', textAlign: 'center',
  },
  heroPill: {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.35rem 1.1rem', borderRadius: '999px',
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(165,180,252,0.3)',
    fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '2rem',
  },
  heroTitle: {
    fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
    fontWeight: 900, lineHeight: 1.1,
    letterSpacing: '-1.5px', marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 40%, #a5b4fc 80%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    color: '#c4b5fd', lineHeight: 1.7,
    maxWidth: '620px', margin: '0 auto 3rem', opacity: 0.9,
  },
  heroCta: { display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' },
  btnPrimary: {
    padding: '1rem 2.5rem', fontWeight: 800, fontSize: '1.05rem',
    borderRadius: '14px', color: '#fff', textDecoration: 'none',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    boxShadow: '0 6px 24px rgba(249,115,22,0.4)',
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    transition: 'all 0.2s', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSecondary: {
    padding: '1rem 2.5rem', fontWeight: 700, fontSize: '1.05rem',
    borderRadius: '14px', color: '#e0e7ff', textDecoration: 'none',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    transition: 'all 0.2s', cursor: 'pointer', fontFamily: 'inherit',
  },

  // ── Stats Bar ────────────────────────────────────────────────
  statsBar: {
    background: 'rgba(255,255,255,0.03)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '2.5rem 2rem',
  },
  statsInner: {
    maxWidth: '900px', margin: '0 auto',
    display: 'flex', justifyContent: 'center',
    gap: '4rem', flexWrap: 'wrap',
  },
  statItem: { textAlign: 'center' },
  statNumber: {
    fontSize: '2.25rem', fontWeight: 900,
    background: 'linear-gradient(135deg, #6366f1, #a5b4fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    display: 'block', lineHeight: 1,
  },
  statLabel: { fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.4rem' },

  // ── Section ──────────────────────────────────────────────────
  section: { padding: '7rem 2rem' },
  sectionHeader: { textAlign: 'center', maxWidth: '680px', margin: '0 auto 5rem' },
  sectionBadge: {
    display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
    color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800,
    letterSpacing: '-0.5px', marginBottom: '1.25rem', color: '#fff', lineHeight: 1.2,
  },
  sectionSub: { fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.7 },

  // ── Program Cards ────────────────────────────────────────────
  programsGrid: {
    maxWidth: '1200px', margin: '0 auto',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
    gap: '2rem',
  },
  programCard: {
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px', padding: '2.75rem 2rem',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex', flexDirection: 'column',
    cursor: 'default', position: 'relative', overflow: 'hidden',
  },
  programCardGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
  },
  programIconWrap: {
    width: '60px', height: '60px', borderRadius: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.75rem', marginBottom: '1.75rem',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  programTitle: { fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.9rem', color: '#fff' },
  programDesc: { fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.65, flex: 1, marginBottom: '2rem' },
  programTags: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' },
  tag: {
    padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc',
  },
  programLink: {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    fontWeight: 700, fontSize: '0.9375rem', color: '#818cf8',
    textDecoration: 'none', transition: 'gap 0.2s',
  },

  // ── Feature Cards ────────────────────────────────────────────
  featuresGrid: {
    maxWidth: '1200px', margin: '0 auto',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    padding: '2.5rem 1.75rem', borderRadius: '20px', textAlign: 'center',
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'all 0.3s',
  },
  featureEmoji: { fontSize: '2.5rem', display: 'block', marginBottom: '1.25rem' },
  featureTitle: { fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.625rem', color: '#e0e7ff' },
  featureDesc: { fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 },

  // ── CTA Banner ───────────────────────────────────────────────
  ctaBanner: {
    padding: '7rem 2rem',
    background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)',
  },
  ctaInner: {
    maxWidth: '700px', margin: '0 auto', textAlign: 'center',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(165,180,252,0.15)',
    borderRadius: '28px', padding: '4rem 3rem',
    backdropFilter: 'blur(20px)',
  },
  ctaTitle: {
    fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800,
    color: '#fff', marginBottom: '1.25rem', letterSpacing: '-0.5px',
  },
  ctaSub: { fontSize: '1.05rem', color: '#94a3b8', marginBottom: '2.5rem', lineHeight: 1.6 },

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    padding: '3rem 2rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    textAlign: 'center',
    background: 'rgba(0,0,0,0.3)',
  },
  footerCopy: { fontSize: '0.875rem', color: '#64748b' },
};

const PROGRAMS = [
  {
    emoji: '🏝️',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.1)',
    border: 'rgba(14,165,233,0.2)',
    title: 'Vacation Classes',
    desc: 'Stay academically sharp and ahead of the curve during school breaks. We review core concepts and introduce upcoming topics to give you a powerful headstart.',
    tags: ['Math', 'Science', 'English', 'Social Studies'],
    href: '/register?program=vacation',
  },
  {
    emoji: '🎓',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.2)',
    title: 'Pre-SHS Preparation',
    desc: 'Bridge the gap from Junior High to Senior High seamlessly. Master foundational subjects and develop strong study habits before Day 1 of SHS.',
    tags: ['Core Maths', 'English', 'Int. Science', 'History'],
    href: '/register?program=preshs',
  },
  {
    emoji: '🎯',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.2)',
    title: 'WASSCE Remedials',
    desc: 'Intensive, result-focused guidance to help you pass or improve your WASSCE scores. Work through past questions, mock trials, and targeted feedback.',
    tags: ['Past Questions', 'Mock Tests', 'Feedback', 'All Subjects'],
    href: '/register?program=remedial',
  },
];

const FEATURES = [
  { emoji: '🏆', title: 'XP & Leaderboards', desc: 'Earn XP for every activity and climb the leaderboard to show your dedication.' },
  { emoji: '🏅', title: 'Achievement Badges', desc: 'Unlock collectible badges for milestones — First Lesson, Quiz Master, and more.' },
  { emoji: '💬', title: 'Threaded Discussions', desc: 'Ask questions directly under lessons and get replies from instructors and peers.' },
  { emoji: '📝', title: 'Graded Assessments', desc: 'Submit assignments and receive detailed, personalised feedback from your instructor.' },
  { emoji: '📜', title: 'Certificates', desc: 'Earn downloadable completion certificates that validate your academic achievement.' },
  { emoji: '📱', title: 'Mobile Friendly', desc: 'Fully responsive — study from anywhere on any device, any time.' },
];

const STATS = [
  { number: '500+', label: 'Students Enrolled' },
  { number: '3', label: 'Core Programs' },
  { number: '95%', label: 'Pass Rate' },
  { number: '24/7', label: 'Platform Access' },
];

export default function Landing() {
  const headerRef = useRef(null);

  useEffect(() => {
    document.title = 'ActionLMS | Vacation Classes, Pre-SHS & WASSCE Remedials';

    const onScroll = () => {
      if (!headerRef.current) return;
      if (window.scrollY > 40) {
        headerRef.current.style.background = 'rgba(7,5,26,0.95)';
      } else {
        headerRef.current.style.background = 'rgba(7,5,26,0.75)';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <header style={styles.header} ref={headerRef}>
        <div style={styles.navInner}>
          <Link to="/" style={styles.logoWrap}>
            <div style={styles.logoIcon}>A</div>
            <span>ActionLMS</span>
          </Link>
          <nav style={styles.navLinks}>
            <button style={styles.navLink} onClick={() => scrollTo('programs')}>Programs</button>
            <button style={styles.navLink} onClick={() => scrollTo('features')}>Features</button>
            <Link to="/login" style={{ ...styles.navLink, textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={styles.navCta}>Get Started →</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        <div style={styles.heroBgImage} />
        <div style={styles.heroBgGradient} />
        <div style={styles.heroOrb1} />
        <div style={styles.heroOrb2} />
        <div style={styles.heroContent}>
          <div style={styles.heroPill}>✨ Gamified Learning Platform</div>
          <h1 style={styles.heroTitle}>
            Unlock Academic<br />Excellence Today
          </h1>
          <p style={styles.heroSub}>
            Tailored programs for Vacation Classes, Pre-SHS preparation, and WASSCE Remedials — with gamified XP rewards, expert instructors, and instant feedback.
          </p>
          <div style={styles.heroCta}>
            <Link to="/register" style={styles.btnPrimary}>Enroll Now 🚀</Link>
            <button style={styles.btnSecondary} onClick={() => scrollTo('programs')}>Explore Programs</button>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div style={styles.statsBar}>
        <div style={styles.statsInner}>
          {STATS.map((s) => (
            <div key={s.label} style={styles.statItem}>
              <span style={styles.statNumber}>{s.number}</span>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Programs ── */}
      <section style={{ ...styles.section, background: 'linear-gradient(180deg, #07051a 0%, #0d0b26 100%)' }} id="programs">
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>Our Offerings</span>
          <h2 style={styles.sectionTitle}>Designed to Help You Excel</h2>
          <p style={styles.sectionSub}>Expert-curated curriculums built for every stage of your senior high journey.</p>
        </div>
        <div style={styles.programsGrid}>
          {PROGRAMS.map((p) => (
            <ProgramCard key={p.title} {...p} />
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ ...styles.section, background: '#0a0820' }} id="features">
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>Why ActionLMS</span>
          <h2 style={styles.sectionTitle}>Learning Meets Engagement</h2>
          <p style={styles.sectionSub}>We combine modern technology with academic rigour to keep students motivated and moving forward.</p>
        </div>
        <div style={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={styles.ctaBanner}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaTitle}>Ready to Start Your Journey?</h2>
          <p style={styles.ctaSub}>Join hundreds of students already learning, growing, and winning on ActionLMS. Enroll today — it's free to get started.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" style={styles.btnPrimary}>Create Free Account</Link>
            <Link to="/login" style={styles.btnSecondary}>Sign In</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={{ ...styles.logoWrap, justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={styles.logoIcon}>A</div>
          <span>ActionLMS</span>
        </div>
        <p style={styles.footerCopy}>© {new Date().getFullYear()} ActionLMS. Elevating education through technology.</p>
      </footer>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ProgramCard({ emoji, color, bg, border, title, desc, tags, href }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        ...styles.programCard,
        ...(hovered ? {
          transform: 'translateY(-10px)',
          background: 'rgba(255,255,255,0.055)',
          border: `1px solid ${color}40`,
          boxShadow: `0 24px 48px rgba(0,0,0,0.35), 0 0 40px ${color}18`,
        } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.programCardGlow} />
      <div style={{ ...styles.programIconWrap, background: bg, border: `1px solid ${border}` }}>
        {emoji}
      </div>
      <h3 style={styles.programTitle}>{title}</h3>
      <p style={styles.programDesc}>{desc}</p>
      <div style={styles.programTags}>
        {tags.map((t) => <span key={t} style={styles.tag}>{t}</span>)}
      </div>
      <Link to={href} style={{ ...styles.programLink, color }}>
        Enroll in this Program <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: hovered ? 'translateX(4px)' : 'none' }}>→</span>
      </Link>
    </div>
  );
}

function FeatureCard({ emoji, title, desc }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        ...styles.featureCard,
        ...(hovered ? {
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.15)',
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={styles.featureEmoji}>{emoji}</span>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  );
}
