import React from 'react';
import { 
  Search, 
  LogOut, 
  Plus,
  Menu,
  Users,
  X
} from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ 
  onLogout, 
  user, 
  searchQuery, 
  setSearchQuery,
  searchPlaceholder = 'Search projects by name, code, category...',
  screenLabel = 'Projects',
  onOpenNewProject,
  onOpenUserManager,
  onToggleSidebar,
  onSelectProject,
  refreshTrigger
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
        background: 'rgba(255, 255, 255, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: '0 4px 24px rgba(31, 38, 135, 0.03)',
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

      {/* Screen-Aware Dynamic Search Input */}
      <div 
        className="navbar-search" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '440px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Search size={16} style={{
          position: 'absolute',
          left: '0.85rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-dim)',
          pointerEvents: 'none'
        }} />

        <input
          type="text"
          className="form-input"
          style={{
            paddingLeft: '2.4rem',
            paddingRight: searchQuery ? '6rem' : '4.8rem',
            height: '40px',
            fontSize: '0.85rem',
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '10px',
            width: '100%',
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
            transition: 'all 0.18s ease'
          }}
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Right tags inside search: Clear button + Screen Badge */}
        <div style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Clear search"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'rgba(148, 163, 184, 0.25)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              <X size={11} />
            </button>
          )}

          <span 
            style={{
              fontSize: '0.675rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(37, 99, 235, 0.10)',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(191, 219, 254, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            {screenLabel}
          </span>
        </div>
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

        {/* Live Notification Bell & Dropdown */}
        <NotificationDropdown 
          user={user} 
          onSelectProject={onSelectProject} 
          refreshTrigger={refreshTrigger} 
        />

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
