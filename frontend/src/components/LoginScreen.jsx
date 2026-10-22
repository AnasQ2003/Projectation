import React, { useState } from 'react';
import { KanbanSquare, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { encryptClientData, decryptClientData } from '../utils/crypto';

export default function LoginScreen({ onLoginSuccess }) {
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
      const data = await api.login(username, password);

      // Persist or clear Remember Me (remembers username only, NEVER the password)
      if (rememberMe) {
        localStorage.setItem('projectation_remember_me', 'true');
        localStorage.setItem('projectation_remembered_username', username);
      } else {
        localStorage.removeItem('projectation_remember_me');
        localStorage.removeItem('projectation_remembered_username');
      }
      localStorage.removeItem('projectation_remembered_password');

      const adminUser = {
        ...data.user,
        name: data.user.name || 'Admin',
        role: 'Lead Administrator'
      };
      localStorage.setItem('projectation_token', encryptClientData(data.token));
      localStorage.setItem('projectation_user', encryptClientData(JSON.stringify(adminUser)));
      onLoginSuccess(adminUser);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: 'var(--bg-app)'
    }}>
      <div 
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '16px',
          padding: '2.25rem 2rem',
          boxShadow: '0 20px 50px -10px rgba(31, 38, 135, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
            marginBottom: '1rem'
          }}>
            <KanbanSquare size={24} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Sign in to access your project dashboard
          </p>
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
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
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
                  color: 'var(--accent-primary)', 
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
                placeholder="Enter username"
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
                  color: 'var(--accent-primary)', 
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
                placeholder="Enter password"
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
                  accentColor: 'var(--accent-primary)',
                  width: '15px',
                  height: '15px',
                  borderRadius: '4px'
                }}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
