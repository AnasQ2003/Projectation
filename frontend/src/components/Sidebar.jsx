import React from 'react';
import { 
  KanbanSquare, 
  FolderKanban, 
  Users, 
  CheckSquare, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ 
  collapsed, 
  setCollapsed, 
  activeTab, 
  setActiveTab, 
  user,
  projectCount = 0
}) {
  const menuItems = [
    { id: 'projects', label: 'Projects & Hub', icon: FolderKanban, badge: projectCount },
    { id: 'tasks', label: 'All Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'timeline', label: 'Roadmap & Deadlines', icon: Clock }
  ];

  return (
    <aside style={{
      width: collapsed ? '72px' : '240px',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'width 0.2s ease',
      zIndex: 50,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between'
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

        <button
          onClick={() => setCollapsed(!collapsed)}
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
      </div>

      {/* Nav Menu */}
      <div style={{ padding: '0.85rem 0.65rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: isActive ? 'var(--accent-primary-light)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                border: isActive ? '1px solid var(--accent-primary-border)' : '1px solid transparent'
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
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-muted)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  fontWeight: 600
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Admin Profile: Anas */}
      <div style={{
        padding: '0.85rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-subtle)'
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
              AN
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
