import React, { useState, useEffect } from 'react';
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
  CircleDot
} from 'lucide-react';
import { api } from '../services/api';

/**
 * UserPortalView — Executive Read-Only Workspace for Registered Team Members
 * 
 * Rules enforced:
 * 1. User sees ONLY projects they are assigned to.
 * 2. Does NOT reveal other members' details — only shows "You are assigned with X members".
 * 3. User can view deadlines, schedule, progress, and their personal tasks.
 * 4. Strictly read-only: No editing, deleting, or admin features. Logout only.
 * 5. High-performance, zero-overlap, crisp SaaS layout.
 */

export default function UserPortalView({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Aggregate stats
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      color: '#0f172a',
      fontFamily: 'var(--font-main)'
    }}>
      {/* ── Solid Top Header Bar (100% Opaque, No Content Bleed) ────────────── */}
      <header style={{
        height: '68px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
      }}>
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#059669',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 8px rgba(5, 150, 105, 0.25)'
          }}>
            <KanbanSquare size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Projectation
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Team Member Portal
              </span>
            </div>
          </div>
        </div>

        {/* User Identity & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.95rem',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
            }}>
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                {user?.name || user?.username}
              </span>
              <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 500 }}>
                Assigned Contributor
              </span>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: '#e2e8f0' }} />

          <button
            onClick={onLogout}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Sign out of user workspace"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace Content Area ────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        padding: '2.5rem 2rem 4rem',
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Welcome Greeting Banner */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#059669',
              marginBottom: '0.4rem'
            }}>
              <span>👋</span>
              <span>Contributor Workspace</span>
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '0.35rem',
              letterSpacing: '-0.02em'
            }}>
              Welcome back, {user?.name || user?.username}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              You are assigned to <strong>{projects.length}</strong> project workspace{projects.length === 1 ? '' : 's'}. Review your sprint deliverables, timelines, and tasks below.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1rem',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#475569'
          }}>
            <Lock size={15} style={{ color: '#059669' }} />
            <span>Read-Only Contributor View</span>
          </div>
        </div>

        {/* Metric Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Card 1: Assigned Projects */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.4rem 1.5rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FolderKanban size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Projects
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {projects.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                Active project workspaces
              </div>
            </div>
          </div>

          {/* Card 2: Milestone Deadline */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.4rem 1.5rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Upcoming Milestone
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '2px' }}>
                {nextDeadline}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                Key delivery deadline
              </div>
            </div>
          </div>

          {/* Card 3: Tasks Completed */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.4rem 1.5rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckSquare size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Sprint Tasks
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {completedTasks} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>/ {totalTasks}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% complete` : 'All tasks up to date'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Active Projects Section ────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                My Assigned Workspaces
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '3px 0 0' }}>
                Deliverables, milestone timelines, and tasks assigned to your profile
              </p>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
              {projects.length} Workspace{projects.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#059669',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem'
              }} />
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                Loading your assigned workspaces...
              </p>
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1.25rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: 500 }}>{error}</span>
            </div>
          ) : projects.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '4rem 2rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
            }}>
              <FolderKanban size={48} style={{ color: '#cbd5e1', margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem' }}>
                No Projects Assigned
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto' }}>
                Your account is active. When a project lead assigns you to a workspace, it will appear here automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '2rem',
                    boxShadow: '0 4px 18px -2px rgba(15, 23, 42, 0.04)',
                    transition: 'box-shadow 0.2s ease'
                  }}
                >
                  {/* Top Bar: Code, Name, Category & Status Badges */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          color: '#2563eb',
                          border: '1px solid #e2e8f0',
                          fontFamily: 'monospace'
                        }}>
                          {proj.code}
                        </span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                          {proj.name}
                        </h3>
                        {proj.category && (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            color: '#64748b',
                            border: '1px solid #e2e8f0'
                          }}>
                            {proj.category}
                          </span>
                        )}
                      </div>

                      <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0, maxWidth: '700px', lineHeight: 1.5 }}>
                        {proj.description || 'Sprint workspace with deliverables and scheduled milestones.'}
                      </p>
                    </div>

                    {/* Status & Priority */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: proj.status === 'Completed' ? '#ecfdf5' : '#eff6ff',
                        color: proj.status === 'Completed' ? '#059669' : '#2563eb',
                        border: `1px solid ${proj.status === 'Completed' ? '#a7f3d0' : '#bfdbfe'}`
                      }}>
                        {proj.status || 'In Progress'}
                      </span>

                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: proj.priority === 'Urgent' ? '#fef2f2' : '#fffbeb',
                        color: proj.priority === 'Urgent' ? '#dc2626' : '#d97706',
                        border: `1px solid ${proj.priority === 'Urgent' ? '#fecaca' : '#fde68a'}`
                      }}>
                        {proj.priority || 'Medium'} Priority
                      </span>
                    </div>
                  </div>

                  {/* Milestone & Team Allocation Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.25rem',
                    backgroundColor: '#f8fafc',
                    padding: '1.2rem 1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    margin: '1.25rem 0'
                  }}>
                    {/* Team Members Count (strictly hides details/names) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Users size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Team Assignment
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                          You are assigned with {proj.assignedMembersCount || 1} team members
                        </div>
                      </div>
                    </div>

                    {/* Milestone Deadline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Milestone Deadline
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#dc2626' }}>
                          {proj.deadline ? proj.deadline : 'Continuous Sprint'}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        <span style={{ color: '#64748b' }}>Project Progress</span>
                        <span style={{ color: '#059669' }}>{proj.progress || 0}%</span>
                      </div>
                      <div style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${proj.progress || 0}%`,
                          backgroundColor: '#059669',
                          borderRadius: '999px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* My Assigned Tasks List */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.925rem', fontWeight: 700, color: '#0f172a' }}>
                        <CheckSquare size={16} style={{ color: '#059669' }} />
                        <span>My Assigned Tasks ({proj.myTasks?.length || 0})</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Read-Only View
                      </span>
                    </div>

                    {(!proj.myTasks || proj.myTasks.length === 0) ? (
                      <div style={{
                        padding: '1.25rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px dashed #e2e8f0',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}>
                        No specific individual tasks currently assigned to you in this workspace.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  backgroundColor: isDone ? '#ecfdf5' : isInProgress ? '#eff6ff' : '#f1f5f9',
                                  color: isDone ? '#059669' : isInProgress ? '#2563eb' : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isDone ? <CheckCircle2 size={15} /> : <CircleDot size={13} />}
                                </div>
                                <span style={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  opacity: isDone ? 0.75 : 1
                                }}>
                                  {task.title}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {task.due_date && (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Clock size={12} />
                                    <span>Due: {task.due_date}</span>
                                  </span>
                                )}

                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  textTransform: 'uppercase',
                                  backgroundColor: isDone ? '#ecfdf5' : isInProgress ? '#eff6ff' : '#f1f5f9',
                                  color: isDone ? '#059669' : isInProgress ? '#2563eb' : '#64748b',
                                  border: `1px solid ${isDone ? '#a7f3d0' : isInProgress ? '#bfdbfe' : '#e2e8f0'}`
                                }}>
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
      </main>
    </div>
  );
}
