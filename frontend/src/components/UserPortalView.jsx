import React, { useState, useEffect, useMemo } from 'react';
import { 
  KanbanSquare, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  FolderKanban, 
  Users, 
  CheckSquare, 
  Shield, 
  Lock,
  CircleDot,
  Search,
  Sparkles,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

/**
 * UserPortalView — Premium Glassmorphic Workspace for Registered Team Members
 * 
 * Architectural Highlights:
 * 1. Pixel-perfect alignment: Both top navbar and main content share the exact same
 *    1400px page-container grid with matching 1.5rem horizontal padding.
 * 2. Enterprise Glassmorphism: Inherits the application's native radial mesh gradient,
 *    frosted cards (.glass-card), and subtle translucent borders.
 * 3. Read-Only Safety: Enforces contributor role boundaries (hiding sensitive admin actions
 *    and other members' personal profiles).
 * 4. Interactive Polish: Built-in workspace search, status filters, and task progression.
 */

export default function UserPortalView({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchMyData = async () => {
      try {
        setLoading(true);
        setError('');
        const myProjects = await api.getMyProjects(user.name, user.email || '', user.username || '');
        if (isMounted) {
          setProjects(myProjects || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load assigned projects');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMyData();
    return () => { isMounted = false; };
  }, [user]);

  // Aggregate stats across all assigned projects
  const totalTasks = projects.reduce((acc, p) => acc + (p.myTasks ? p.myTasks.length : 0), 0);
  const completedTasks = projects.reduce((acc, p) => {
    if (!p.myTasks) return acc;
    return acc + p.myTasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
  }, 0);

  // Find nearest upcoming deadline
  const deadlines = projects
    .map(p => p.deadline)
    .filter(Boolean)
    .sort();
  const nextDeadline = deadlines[0] || 'Ongoing';

  // Filter projects by search and status
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.myTasks && p.myTasks.some(t => t.title && t.title.toLowerCase().includes(q)));

      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'IN_PROGRESS' && p.status !== 'Completed') ||
        (statusFilter === 'COMPLETED' && p.status === 'Completed');

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* ── Top Navbar (Pixel-perfect alignment with 1400px page grid) ── */}
      <header
        style={{
          height: '64px',
          minHeight: '64px',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            width: '100%',
            height: '100%',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxSizing: 'border-box'
          }}
        >
          {/* Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.28)'
              }}
            >
              <KanbanSquare size={20} strokeWidth={2.4} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                Projectation
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Team Portal
              </span>
            </div>
          </div>

          {/* Quick Search across Workspaces & Tasks */}
          <div style={{ flex: '1 1 auto', maxWidth: '380px', position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assigned workspaces or tasks..."
              className="form-input"
              style={{
                width: '100%',
                paddingLeft: '2.3rem',
                paddingRight: '0.85rem',
                height: '36px',
                fontSize: '0.825rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(241, 245, 249, 0.65)',
                border: '1px solid var(--border-subtle)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* User Identity & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                }}
              >
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {user?.name || user?.username}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Assigned Contributor
                </span>
              </div>
            </div>

            <div style={{ height: '22px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

            <button
              onClick={onLogout}
              className="btn-danger"
              style={{
                padding: '0.42rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              title="Sign out of user workspace"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Scrollable Viewport (Glassmorphism + Perfect Alignment) ── */}
      <div className="app-main" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div className="page-container animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1.5rem 5rem 1.5rem' }}>
          
          {/* Hero Welcome Banner */}
          <div
            className="glass-card"
            style={{
              padding: '1.5rem 1.75rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.45) 100%)'
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#059669',
                  marginBottom: '0.35rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '20px'
                }}
              >
                <Sparkles size={13} />
                <span>Contributor Workspace</span>
              </div>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  margin: '0.2rem 0 0.35rem',
                  letterSpacing: '-0.025em'
                }}
              >
                Welcome back, {user?.name || user?.username}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                You are currently assigned to <strong>{projects.length}</strong> active project workspace{projects.length === 1 ? '' : 's'}. Review your deliverables, sprint velocity, and personal task cards below.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
              }}
            >
              <Lock size={14} style={{ color: '#059669' }} />
              <span>Read-Only Contributor View</span>
            </div>
          </div>

          {/* 4 Interactive KPI Stat Cards (Matching Admin Dashboard stats-row) */}
          <div className="stats-row" style={{ marginBottom: '1.75rem' }}>
            {/* Card 1: Assigned Workspaces */}
            <div
              className="glass-card stat-card-clickable"
              onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); }}
              title="Click to view all assigned workspaces"
              style={{
                padding: '1.15rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Assigned Projects
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {projects.length}
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  Active workspaces
                </span>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '11px',
                  backgroundColor: 'var(--accent-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
                }}
              >
                <FolderKanban size={20} />
              </div>
            </div>

            {/* Card 2: Upcoming Milestone */}
            <div
              className="glass-card stat-card-clickable"
              style={{
                padding: '1.15rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Key Milestone
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                  {nextDeadline}
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Next target deadline
                </span>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '11px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
                }}
              >
                <Calendar size={20} />
              </div>
            </div>

            {/* Card 3: Sprint Tasks Completed */}
            <div
              className="glass-card stat-card-clickable"
              style={{
                padding: '1.15rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Assigned Tasks
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {completedTasks} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dim)' }}>/ {totalTasks}</span>
                </div>
                <span style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 600 }}>
                  {completionPct}% completed
                </span>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '11px',
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)'
                }}
              >
                <CheckSquare size={20} />
              </div>
            </div>

            {/* Card 4: Sprint Velocity / Health */}
            <div
              className="glass-card stat-card-clickable"
              style={{
                padding: '1.15rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Contributor Velocity
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '0.35rem' }}>
                  {totalTasks === 0 ? 'Up to date' : completionPct === 100 ? 'All Completed' : 'Sprint Active'}
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Live delivery tracking
                </span>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '11px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                }}
              >
                <TrendingUp size={20} />
              </div>
            </div>
          </div>

          {/* ── Active Workspaces Section ── */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                  My Assigned Workspaces
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '3px 0 0' }}>
                  Milestone timelines, project velocity, and personal tasks assigned to your profile
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '7px',
                    backgroundColor: statusFilter === 'ALL' ? '#059669' : 'transparent',
                    color: statusFilter === 'ALL' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({projects.length})
                </button>
                <button
                  onClick={() => setStatusFilter('IN_PROGRESS')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '7px',
                    backgroundColor: statusFilter === 'IN_PROGRESS' ? '#059669' : 'transparent',
                    color: statusFilter === 'IN_PROGRESS' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatusFilter('COMPLETED')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '7px',
                    backgroundColor: statusFilter === 'COMPLETED' ? '#059669' : 'transparent',
                    color: statusFilter === 'COMPLETED' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Completed
                </button>
              </div>
            </div>

            {loading ? (
              <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    border: '3px solid rgba(16, 185, 129, 0.2)',
                    borderTopColor: '#059669',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 1.25rem'
                  }}
                />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
                  Connecting to workspace repositories...
                </p>
              </div>
            ) : error ? (
              <div
                style={{
                  backgroundColor: 'var(--accent-danger-light)',
                  border: '1px solid var(--accent-danger-border)',
                  color: 'var(--accent-danger)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <AlertCircle size={20} />
                <span style={{ fontWeight: 600 }}>{error}</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <FolderKanban size={48} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem', opacity: 0.7 }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                  {searchQuery ? 'No Matching Workspaces Found' : 'No Projects Assigned'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
                  {searchQuery 
                    ? `No workspaces or tasks match "${searchQuery}". Clear your search query to view all assignments.`
                    : 'Your contributor account is ready. Workspaces will appear here as soon as a project lead assigns you.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="glass-card"
                    style={{
                      padding: '1.75rem',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {/* Project Header Row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--accent-primary-light)',
                              color: 'var(--accent-primary)',
                              border: '1px solid var(--accent-primary-border)',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            {proj.code}
                          </span>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                            {proj.name}
                          </h3>
                          {proj.category && (
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(241, 245, 249, 0.8)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              {proj.category}
                            </span>
                          )}
                        </div>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, maxWidth: '750px', lineHeight: 1.5 }}>
                          {proj.description || 'Sprint workspace with deliverables and scheduled milestones.'}
                        </p>
                      </div>

                      {/* Status & Priority Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: proj.status === 'Completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.1)',
                            color: proj.status === 'Completed' ? '#059669' : '#2563eb',
                            border: `1px solid ${proj.status === 'Completed' ? 'rgba(16, 185, 129, 0.28)' : 'rgba(37, 99, 235, 0.25)'}`
                          }}
                        >
                          {proj.status || 'In Progress'}
                        </span>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: proj.priority === 'Urgent' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                            color: proj.priority === 'Urgent' ? '#dc2626' : '#d97706',
                            border: `1px solid ${proj.priority === 'Urgent' ? 'rgba(220, 38, 38, 0.25)' : 'rgba(217, 119, 6, 0.25)'}`
                          }}
                        >
                          {proj.priority || 'Medium'} Priority
                        </span>
                      </div>
                    </div>

                    {/* Milestone & Team Allocation Strip */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1.25rem',
                        backgroundColor: 'rgba(248, 250, 252, 0.75)',
                        padding: '1.15rem 1.4rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)',
                        margin: '1.25rem 0'
                      }}
                    >
                      {/* Team Assignment */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '9px',
                            backgroundColor: 'var(--accent-primary-light)',
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Users size={17} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Team Assignment
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            Assigned with {proj.assignedMembersCount || 1} team member{proj.assignedMembersCount === 1 ? '' : 's'}
                          </div>
                        </div>
                      </div>

                      {/* Milestone Deadline */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '9px',
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Calendar size={17} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Milestone Deadline
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#dc2626' }}>
                            {proj.deadline ? proj.deadline : 'Continuous Sprint'}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Workspace Progress</span>
                          <span style={{ color: '#059669' }}>{proj.progress || 0}%</span>
                        </div>
                        <div style={{ height: '7px', backgroundColor: 'rgba(226, 232, 240, 0.8)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${proj.progress || 0}%`,
                              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                              borderRadius: '999px',
                              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* My Assigned Tasks List */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          <CheckSquare size={16} style={{ color: '#059669' }} />
                          <span>My Assigned Tasks ({proj.myTasks?.length || 0})</span>
                        </div>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          Read-Only View
                        </span>
                      </div>

                      {(!proj.myTasks || proj.myTasks.length === 0) ? (
                        <div
                          style={{
                            padding: '1.25rem',
                            backgroundColor: 'rgba(248, 250, 252, 0.6)',
                            borderRadius: '10px',
                            border: '1px dashed var(--border-subtle)',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            textAlign: 'center'
                          }}
                        >
                          No specific individual tasks currently assigned to you in this workspace.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {proj.myTasks.map((task) => {
                            const isDone = (task.status || '').toLowerCase() === 'done';
                            const isInProgress = (task.status || '').toLowerCase() === 'in_progress';

                            return (
                              <div
                                key={task.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.75rem 1rem',
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '10px',
                                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div
                                    style={{
                                      width: '22px',
                                      height: '22px',
                                      borderRadius: '50%',
                                      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.15)' : isInProgress ? 'rgba(37, 99, 235, 0.12)' : 'rgba(241, 245, 249, 0.9)',
                                      color: isDone ? '#059669' : isInProgress ? '#2563eb' : 'var(--text-dim)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    {isDone ? <CheckCircle2 size={15} /> : <CircleDot size={13} />}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.875rem',
                                      fontWeight: 600,
                                      color: 'var(--text-main)',
                                      textDecoration: isDone ? 'line-through' : 'none',
                                      opacity: isDone ? 0.7 : 1
                                    }}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  {task.due_date && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <Clock size={12} />
                                      <span>Due: {task.due_date}</span>
                                    </span>
                                  )}

                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      textTransform: 'uppercase',
                                      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.12)' : isInProgress ? 'rgba(37, 99, 235, 0.1)' : 'rgba(241, 245, 249, 0.8)',
                                      color: isDone ? '#059669' : isInProgress ? '#2563eb' : 'var(--text-muted)',
                                      border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : isInProgress ? 'rgba(37, 99, 235, 0.25)' : 'var(--border-subtle)'}`
                                    }}
                                  >
                                    {task.status ? task.status.replace('_', ' ') : 'todo'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
