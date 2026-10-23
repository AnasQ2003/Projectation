import React, { useEffect, useState } from 'react';
import { KanbanSquare, ArrowRight } from 'lucide-react';

export default function SplashLogo({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinish();
          }, 80);
          return 100;
        }
        return prev + 6;
      });
    }, 18); // Crisp and smooth ~300ms loading splash

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: '#0f172a',
      padding: '1.5rem',
      fontFamily: 'var(--font-main)'
    }}>
      {/* Brand Icon with clean subtle pulse */}
      <div style={{
        width: '68px',
        height: '68px',
        borderRadius: '16px',
        backgroundColor: '#2563eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
        marginBottom: '1.25rem',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        <KanbanSquare size={36} strokeWidth={2.2} />
      </div>

      {/* Brand Title */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#0f172a',
          marginBottom: '0.25rem'
        }}>
          Projectation
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          Software House & Sprint Hub
        </p>
      </div>

      {/* Smooth Loading Indicator */}
      <div style={{ width: '220px' }}>
        <div style={{
          height: '4px',
          width: '100%',
          backgroundColor: '#e2e8f0',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#2563eb',
            borderRadius: '999px',
            transition: 'width 0.08s ease-out'
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#94a3b8',
          fontWeight: 500
        }}>
          <span>Loading workspace</span>
          <span>{progress}%</span>
        </div>
      </div>

      <button
        onClick={onFinish}
        style={{
          marginTop: '1.75rem',
          fontSize: '0.8rem',
          color: '#64748b',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px'
        }}
      >
        Skip to Login <ArrowRight size={13} />
      </button>
    </div>
  );
}
