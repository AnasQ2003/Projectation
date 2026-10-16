import React from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  LogOut, 
  Plus,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ 
  theme, 
  toggleTheme, 
  onLogout, 
  user, 
  searchQuery, 
  setSearchQuery,
  onOpenNewProject
}) {
  return (
    <header style={{
      height: '60px',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      {/* Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1', maxWidth: '380px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-dim)'
          }} />
          <input
            type="text"
            className="form-input"
            style={{
              paddingLeft: '2.2rem',
              height: '36px',
              fontSize: '0.84rem',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '8px'
            }}
            placeholder="Search projects by name, key, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onOpenNewProject && (
          <button 
            onClick={onOpenNewProject}
            className="btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <Plus size={15} />
            <span>New Project</span>
          </button>
        )}

        {/* Theme Switcher (Light is default, toggles dark on demand) */}
        <button
          onClick={toggleTheme}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? (
            <Sun size={17} color="#f59e0b" />
          ) : (
            <Moon size={17} color="#64748b" />
          )}
        </button>

        {/* Admin profile chip: Anas */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.3rem 0.65rem',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-muted)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.825rem',
          color: 'var(--text-main)',
          fontWeight: 600
        }}>
          <ShieldCheck size={15} color="#16a34a" />
          <span>Anas</span>
        </div>

        {/* Top Right Logout Button */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.825rem',
            fontWeight: 500
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-danger-light)';
            e.currentTarget.style.color = 'var(--accent-danger)';
            e.currentTarget.style.borderColor = 'var(--accent-danger-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
          title="Sign out"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
