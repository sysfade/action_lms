import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  useEffect(() => {
    // SEO Title
    document.title = "ActionLMS | Vacation Classes, Pre-SHS & WASSCE Remedials";
    
    // SEO Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "ActionLMS is a modern, gamified learning platform offering premium courses for Vacation Classes, Pre-SHS preparation, and WASSCE Remedials. Unlock your potential today!";
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: '#0f0c2d', minHeight: '100vh', fontFamily: 'var(--font-base)' }}>
      {/* Sticky Header */}
      <header className="landing-header" id="landing-header">
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo" id="nav-logo-link">
            <div className="landing-logo-icon">A</div>
            <span>ActionLMS</span>
          </Link>
          
          <nav className="landing-nav-actions">
            <button 
              onClick={() => scrollToSection('programs')} 
              className="landing-nav-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              id="nav-link-programs"
            >
              Programs
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="landing-nav-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              id="nav-link-features"
            >
              Why Us
            </button>
            <Link to="/login" className="landing-nav-link" id="nav-link-login">
              Login
            </Link>
            <Link to="/register" className="btn btn-landing-primary" id="nav-btn-register">
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero" id="hero-section">
        <div className="landing-hero-bg"></div>
        <div className="landing-hero-content">
          <div className="landing-badge" id="hero-badge">
            ✨ Interactive Gamified LMS
          </div>
          <h1 className="landing-title" id="hero-heading">
            Unlock Academic Excellence with ActionLMS
          </h1>
          <p className="landing-subtitle" id="hero-subtext">
            Tailored courses for Vacation Classes, Pre-SHS preparation, and intensive WASSCE Remedials.
            Earn XP, unlock badges, and stay ahead in your studies.
          </p>
          <div className="landing-hero-cta">
            <Link to="/register" className="btn-landing-hero-primary" id="hero-cta-register">
              Start Learning Now <span>→</span>
            </Link>
            <button 
              onClick={() => scrollToSection('programs')} 
              className="btn-landing-hero-secondary"
              id="hero-cta-programs"
            >
              Explore Programs
            </button>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="landing-section" id="programs">
        <div className="landing-section-header">
          <span className="landing-section-badge">Academic Offerings</span>
          <h2 className="landing-section-title" id="programs-heading">Our Core Programs</h2>
          <p className="landing-section-subtitle">
            Expertly structured curriculums designed to help students transition, catch up, and excel in senior high school and beyond.
          </p>
        </div>

        <div className="landing-programs-grid">
          {/* Vacation Classes */}
          <div className="landing-program-card" id="program-vacation">
            <div className="landing-program-icon">🏝️</div>
            <h3 className="landing-program-title">Vacation Classes</h3>
            <p className="landing-program-desc">
              Stay sharp and ahead of the game during school breaks. We review key concepts and introduce future topics to give you an academic headstart.
            </p>
            <Link to="/register?program=vacation" className="landing-program-link" id="link-program-vacation">
              Enroll in Vacation Classes <span>→</span>
            </Link>
          </div>

          {/* Pre-SHS */}
          <div className="landing-program-card" id="program-preshs">
            <div className="landing-program-icon">🎓</div>
            <h3 className="landing-program-title">Pre-SHS Preparation</h3>
            <p className="landing-program-desc">
              Make the transition to Senior High School smooth and stress-free. Master core English, Maths, Integrated Science, and Social Studies before classes begin.
            </p>
            <Link to="/register?program=preshs" className="landing-program-link" id="link-program-preshs">
              Start Pre-SHS Prep <span>→</span>
            </Link>
          </div>

          {/* WASSCE Remedials */}
          <div className="landing-program-card" id="program-remedial">
            <div className="landing-program-icon">🎯</div>
            <h3 className="landing-program-title">WASSCE Remedials</h3>
            <p className="landing-program-desc">
              Intensive, result-oriented guidance to help you clear your exams. Access mock trials, extensive review question sets, and custom feedback.
            </p>
            <Link to="/register?program=remedial" className="landing-program-link" id="link-program-remedial">
              Register for Remedials <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="landing-section-alt" id="features">
        <div className="landing-section-header">
          <span className="landing-section-badge">Why ActionLMS</span>
          <h2 className="landing-section-title" id="features-heading">The LMS of the Future</h2>
          <p className="landing-section-subtitle">
            We merge premium academic content with modern technology to keep students highly engaged and motivated.
          </p>
        </div>

        <div className="landing-features-grid">
          <div className="landing-feature-card" id="feature-gamified">
            <span className="landing-feature-icon">🏆</span>
            <h3 className="landing-feature-title">Gamified Rewards</h3>
            <p className="landing-feature-desc">
              Earn XP for submitting tasks, passing quizzes, and participating in forums. Level up and show off your achievements.
            </p>
          </div>

          <div className="landing-feature-card" id="feature-discussion">
            <span className="landing-feature-icon">💬</span>
            <h3 className="landing-feature-title">Threaded Discussions</h3>
            <p className="landing-feature-desc">
              Get stuck on a lesson? Ask questions directly under lessons and get detailed replies from peers and instructors.
            </p>
          </div>

          <div className="landing-feature-card" id="feature-feedback">
            <span className="landing-feature-icon">📝</span>
            <h3 className="landing-feature-title">Direct Grading & Feedback</h3>
            <p className="landing-feature-desc">
              Instructors grade submissions with descriptive comments, helping you understand where to improve.
            </p>
          </div>

          <div className="landing-feature-card" id="feature-certificates">
            <span className="landing-feature-icon">📜</span>
            <h3 className="landing-feature-title">Certificates of Honor</h3>
            <p className="landing-feature-desc">
              Finish courses with passing marks to unlock professional, downloadable completion certificates.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-logo" id="footer-logo">
          <div className="landing-logo-icon">A</div>
          <span>ActionLMS</span>
        </div>
        <p style={{ marginBottom: '1rem', opacity: 0.8 }} id="footer-tagline">
          Elevating education through technology.
        </p>
        <p className="landing-footer-copy" id="footer-copyright">
          &copy; {new Date().getFullYear()} ActionLMS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
