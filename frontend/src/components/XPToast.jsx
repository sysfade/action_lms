import { useState, useCallback } from 'react';

/**
 * Animated XP toast pop-up.
 * Usage: const { showXP, XPToastLayer } = useXPToast();
 *        showXP(50);   // triggers "+50 XP" animation
 *        <XPToastLayer /> at the root of your component
 */
export function useXPToast() {
  const [xpEvents, setXpEvents] = useState([]);

  const showXP = useCallback((amount) => {
    if (!amount || amount <= 0) return;
    const id = Date.now() + Math.random();
    setXpEvents(prev => [...prev, { id, amount }]);
    setTimeout(() => {
      setXpEvents(prev => prev.filter(e => e.id !== id));
    }, 2800);
  }, []);

  const XPToastLayer = () => (
    <>
      <style>{`
        @keyframes xp-pop-in {
          0%   { opacity: 0; transform: translateY(20px) scale(0.7); }
          30%  { opacity: 1; transform: translateY(-8px) scale(1.1); }
          50%  { transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: '5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        pointerEvents: 'none',
      }}>
        {xpEvents.map(ev => (
          <div
            key={ev.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.1rem',
              letterSpacing: '-0.3px',
              boxShadow: '0 4px 24px rgba(245, 158, 11, 0.45), 0 0 0 3px rgba(245, 158, 11, 0.15)',
              animation: 'xp-pop-in 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            +{ev.amount} XP
          </div>
        ))}
      </div>
    </>
  );

  return { showXP, XPToastLayer };
}
