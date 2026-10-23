import React from 'react';
import { 
  Search, 
  LogOut, 
  Plus,
  Menu,
  Users
} from 'lucide-react';

export default function Navbar({ 
  onLogout, 
  user, 
  searchQuery, 
  setSearchQuery,
  onOpenNewProject,
  onOpenUserManager,
  onToggleSidebar
}) {
  return (
    <header
      className="navbar-inner"
      style={{
        height: '64px',
        minHeight: '64px',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '0.75rem',
        flexShrink: 0
      }}
    >
      {/* Mobile hamburger — only visible on small screens via CSS */}
      <button
        className="sidebar-mobile-toggle"
        onClick={onToggleSidebar}
        title="Toggle menu"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Search Input */}
      <div className="navbar-search" style={{ position: 'relative' }}>
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
            height: '40px',
            fontSize: '0.875rem',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '8px',
            width: '100%'
          }}
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Right Controls */}
      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {onOpenNewProject && (
          <button 
            onClick={onOpenNewProject}
            className="btn-primary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.875rem' }}
          >
            <Plus size={15} />
            <span className="navbar-btn-text">New Project</span>
          </button>
        )}



        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.55rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.875rem',
            fontWeight: 500,
            flexShrink: 0
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
          <span className="logout-label">Logout</span>
        </button>
      </div>
    </header>
  );
}
