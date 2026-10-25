import React from 'react';
import { 
  KanbanSquare, 
  FolderKanban, 
  Users, 
  CheckSquare, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';

export default function Sidebar({ 
  collapsed, 
  setCollapsed, 
  mobileOpen,
  setMobileOpen,
  activeTab, 
  setActiveTab, 
  user,
  projectCount = 0
}) {
  const isAdmin = user?.role === 'Admin' || (user?.role && user.role.includes('Admin'));

  const menuItems = [
    { id: 'projects', label: 'Projects & Hub', icon: FolderKanban, badge: projectCount },
    { id: 'tasks', label: 'All Tasks', icon: CheckSquare },
    { id: 'team-progress', label: 'Team Progress', icon: TrendingUp },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'timeline', label: 'Roadmap & Deadlines', icon: Clock }
  ];

  if (isAdmin) {
    menuItems.push({ id: 'users', label: 'User Management', icon: ShieldCheck });
  }

  return (
    <aside
      className={`sidebar-responsive${mobileOpen ? ' open' : ''}`}
      style={{
        width: collapsed ? '72px' : '240px',
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: '4px 0 28px rgba(31, 38, 135, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 50,
        flexShrink: 0,
        overflow: 'hidden'
      }}
    >
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid rgba(226, 232, 240, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <KanbanSquare size={18} />
          </div>
          
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                Projectation
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Software Studio
              </div>
            </div>
          )}
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-collapse-btn"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Mobile close button (shown via CSS on small screens) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="sidebar-mobile-close"
          style={{
            display: 'none',
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-subtle)',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
          title="Close menu"
        >
          <X size={14} />
        </button>
      </div>

      {/* Nav Menu */}
      <div style={{ padding: '0.85rem 0.65rem', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', minHeight: 0 }}>
        {!collapsed && (
          <div style={{
            fontSize: '0.675rem',
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0.4rem 0.65rem'
          }}>
            Workspace
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.8rem',
                borderRadius: '10px',
                backgroundColor: isActive ? 'rgba(239, 246, 255, 0.90)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                border: isActive ? '1px solid rgba(191, 219, 254, 0.85)' : '1px solid transparent',
                boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              
              {!collapsed && (
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}

              {!collapsed && item.badge !== undefined && (
                <span style={{
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'rgba(241, 245, 249, 0.8)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  boxShadow: isActive ? '0 2px 6px rgba(37, 99, 235, 0.2)' : 'none'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Admin Profile — locked at bottom of sidebar */}
      <div style={{
        padding: '0.85rem 1rem',
        borderTop: '1px solid rgba(226, 232, 240, 0.65)',
        backgroundColor: 'rgba(255, 255, 255, 0.50)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.825rem'
            }}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            {/* Active green status */}
            <span style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              border: '2px solid var(--bg-surface)'
            }} />
          </div>

          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                Administrator
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <ShieldCheck size={12} color="#16a34a" />
                <span>Super Admin</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
