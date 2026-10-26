import React, { useState } from 'react';
import { 
  KanbanSquare, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Shield,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { encryptClientData, decryptClientData } from '../utils/crypto';

export default function LoginScreen({ onLoginSuccess }) {
  // Portal Role Tab: 'admin' | 'user'
  const [portalRole, setPortalRole] = useState('admin');

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('projectation_remember_me') === 'true';
  });

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('projectation_remembered_username') || '';
  });

  // Never store or pre-fill raw passwords from localStorage
  const [password, setPassword] = useState('');

  // Clear any legacy stored passwords on mount for privacy & security
  React.useEffect(() => {
    localStorage.removeItem('projectation_remembered_password');
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Pass portalRole to enforce server-side role separation
      const data = await api.login(username, password, portalRole);

      // Persist or clear Remember Me (remembers username only, NEVER the password)
      if (rememberMe) {
        localStorage.setItem('projectation_remember_me', 'true');
        localStorage.setItem('projectation_remembered_username', username);
      } else {
        localStorage.removeItem('projectation_remember_me');
        localStorage.removeItem('projectation_remembered_username');
      }
      localStorage.removeItem('projectation_remembered_password');

      const loggedInUser = {
        ...data.user,
        name: data.user.name || (portalRole === 'admin' ? 'Admin' : 'Team Member'),
        role: data.user.role || (portalRole === 'admin' ? 'Admin' : 'User')
      };

      localStorage.setItem('projectation_token', encryptClientData(data.token));
      localStorage.setItem('projectation_user', encryptClientData(JSON.stringify(loggedInUser)));
      onLoginSuccess(loggedInUser);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isAdminTab = portalRole === 'admin';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: '#f4f6fa',
      backgroundImage: `
        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.88) 0%, rgba(240, 244, 249, 0.90) 100%),
        url('/whatsapp-pattern.png')
      `,
      backgroundRepeat: 'repeat',
      backgroundSize: 'cover, 331px 298px'
    }}>
      <div 
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '16px',
          padding: '2.25rem 2rem',
          boxShadow: '0 20px 50px -10px rgba(31, 38, 135, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '13px',
            backgroundColor: isAdminTab ? 'var(--accent-primary)' : '#059669',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 20px ${isAdminTab ? 'rgba(37, 99, 235, 0.28)' : 'rgba(5, 150, 105, 0.28)'}`,
            marginBottom: '0.85rem',
            transition: 'all 0.35s cubic-bezier(0.34, 1.28, 0.64, 1)',
            transform: isAdminTab ? 'scale(1)' : 'scale(1.05)'
          }}>
            {isAdminTab ? <Shield size={24} /> : <UserCheck size={24} />}
          </div>
          <h2 style={{ 
            fontSize: '1.45rem', 
            fontWeight: 800, 
            color: 'var(--text-main)', 
            letterSpacing: '-0.02em', 
            marginBottom: '0.25rem',
            transition: 'color 0.25s ease'
          }}>
            {isAdminTab ? 'Administrator Portal' : 'Team Member Portal'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', transition: 'color 0.25s ease' }}>
            {isAdminTab
              ? 'Sign in to access your administrative dashboard'
              : 'Sign in to view your assigned projects and deadlines'}
          </p>
        </div>

        {/* Role Portal Selector Tabs (Flawless Sliding Pill) */}
        <div style={{
          position: 'relative',
          display: 'flex',
          backgroundColor: 'rgba(241, 245, 249, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden'
        }}>
          {/* Active Sliding Indicator Pill */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: '4px',
              width: 'calc(50% - 4px)',
              transform: isAdminTab ? 'translateX(0%)' : 'translateX(100%)',
              transition: 'transform 0.34s cubic-bezier(0.34, 1.28, 0.64, 1), box-shadow 0.25s ease, border-color 0.25s ease',
              borderRadius: '9px',
              backgroundColor: '#ffffff',
              border: isAdminTab ? '1px solid rgba(191, 219, 254, 0.95)' : '1px solid rgba(167, 243, 208, 0.95)',
              boxShadow: isAdminTab 
                ? '0 4px 14px rgba(37, 99, 235, 0.15), 0 1px 3px rgba(15, 23, 42, 0.06)' 
                : '0 4px 14px rgba(5, 150, 105, 0.16), 0 1px 3px rgba(15, 23, 42, 0.06)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />

          <button
            type="button"
            onClick={() => { setPortalRole('admin'); setError(''); }}
            style={{
              position: 'relative',
              zIndex: 2,
              flex: 1,
              padding: '0.55rem 0.6rem',
              borderRadius: '9px',
              fontSize: '0.825rem',
              fontWeight: isAdminTab ? 700 : 500,
              backgroundColor: 'transparent',
              color: isAdminTab ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'color 0.25s ease'
            }}
          >
            <Shield size={15} style={{ transition: 'transform 0.25s ease', transform: isAdminTab ? 'scale(1.08)' : 'scale(1)' }} />
            <span>Administrator</span>
          </button>

          <button
            type="button"
            onClick={() => { setPortalRole('user'); setError(''); }}
            style={{
              position: 'relative',
              zIndex: 2,
              flex: 1,
              padding: '0.55rem 0.6rem',
              borderRadius: '9px',
              fontSize: '0.825rem',
              fontWeight: !isAdminTab ? 700 : 500,
              backgroundColor: 'transparent',
              color: !isAdminTab ? '#059669' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'color 0.25s ease'
            }}
          >
            <UserCheck size={15} style={{ transition: 'transform 0.25s ease', transform: !isAdminTab ? 'scale(1.08)' : 'scale(1)' }} />
            <span>Team Member</span>
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--accent-danger-light)',
            border: '1px solid var(--accent-danger-border)',
            color: 'var(--accent-danger)',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off">
          {/* Username */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '0.85rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: isAdminTab ? 'var(--accent-primary)' : '#059669', 
                  zIndex: 10, 
                  pointerEvents: 'none' 
                }} 
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.45rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isAdminTab ? "Enter admin username" : "Enter user username"}
                autoComplete="off"
                spellCheck="false"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '0.85rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: isAdminTab ? 'var(--accent-primary)' : '#059669', 
                  zIndex: 10, 
                  pointerEvents: 'none' 
                }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.45rem', paddingRight: '2.45rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isAdminTab ? "Enter admin password" : "Enter user password"}
                autoComplete="new-password"
                spellCheck="false"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  zIndex: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.35rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  cursor: 'pointer',
                  accentColor: isAdminTab ? 'var(--accent-primary)' : '#059669',
                  width: '15px',
                  height: '15px',
                  borderRadius: '4px'
                }}
              />
              <span>Remember username</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '0.75rem',
              borderRadius: '10px',
              backgroundColor: isAdminTab ? 'var(--accent-primary)' : '#059669',
              boxShadow: isAdminTab ? '0 6px 18px rgba(37, 99, 235, 0.28)' : '0 6px 18px rgba(5, 150, 105, 0.28)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {loading ? 'Authenticating...' : isAdminTab ? 'Sign In as Administrator' : 'Sign In as Team Member'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Credentials Hint */}
        <div style={{
          marginTop: '1.25rem',
          padding: '0.65rem 0.85rem',
          borderRadius: '10px',
          backgroundColor: isAdminTab ? 'rgba(239, 246, 255, 0.65)' : 'rgba(236, 253, 245, 0.65)',
          fontSize: '0.75rem',
          color: isAdminTab ? 'var(--accent-primary)' : '#047857',
          textAlign: 'center',
          border: isAdminTab ? '1px dashed rgba(191, 219, 254, 0.9)' : '1px dashed rgba(167, 243, 208, 0.9)',
          transition: 'all 0.3s ease'
        }}>
          {isAdminTab ? (
            <span><strong>Administrator</strong> credentials need to be inserted only</span>
          ) : (
            <span><strong>Team Member</strong> credentials need to be inserted only</span>
          )}
        </div>
      </div>
    </div>
  );
}
