import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  FolderKanban, 
  Search, 
  Trash2, 
  Filter, 
  CheckSquare, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Sparkles,
  TrendingUp,
  AlertCircle,
  X,
  Edit3
} from 'lucide-react';

import { api } from '../services/api';
import MemberDetailModal from '../components/MemberDetailModal';

export default function TeamView({ onSelectProject }) {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Full Stack Developer');
  const [newMemberProjectId, setNewMemberProjectId] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#2563eb');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const avatarColors = ['#2563eb', '#0891b2', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#4f46e5'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, projectsData] = await Promise.all([
        api.getAllMembers(),
        api.getProjects()
      ]);
      setMembers(membersData || []);
      setProjects(projectsData || []);
      if (projectsData && projectsData.length > 0 && !newMemberProjectId) {
        setNewMemberProjectId(projectsData[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName}?`)) return;
    try {
      await api.deleteMember(memberId);
      fetchData();
    } catch (err) {
      alert('Error removing member: ' + err.message);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberProjectId) {
      setModalError('Please fill in name, email, and choose a project');
      return;
    }

    setModalLoading(true);
    try {
      await api.createMember({
        project_id: parseInt(newMemberProjectId),
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        role: newMemberRole,
        avatar_color: newMemberColor
      });
      setShowAddModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Failed to add member');
    } finally {
      setModalLoading(false);
    }
  };

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesSearch = searchQuery
      ? m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.project_name && m.project_name.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesProject = selectedProjectFilter === 'ALL' || m.project_id.toString() === selectedProjectFilter;

    return matchesSearch && matchesProject;
  });

  // Calculate team metrics
  const totalAssignedTasks = members.reduce((acc, m) => acc + (m.tasks_assigned || 0), 0);
  const totalCompletedTasks = members.reduce((acc, m) => acc + (m.tasks_completed || 0), 0);
  const overallTeamRate = totalAssignedTasks > 0 ? Math.round((totalCompletedTasks / totalAssignedTasks) * 100) : 0;

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Team & Workforce
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track assigned personnel, tasks completion rate, and workload performance
          </p>
        </div>

        <button
          onClick={() => {
            if (projects.length > 0 && !newMemberProjectId) {
              setNewMemberProjectId(projects[0].id.toString());
            }
            setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <UserPlus size={16} />
          <span>Add Member</span>
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* Card 1: Total Team */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Engineers
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {members.length}
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
              Across {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Users size={20} />
          </div>
        </div>

        {/* Card 2: Completed Work */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Work Completed
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.2rem' }}>
              {totalCompletedTasks}
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--accent-success)', fontWeight: 500 }}>
              Tasks finished
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-success-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-success)'
          }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Card 3: Pending Work */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Tasks
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
              {totalAssignedTasks - totalCompletedTasks}
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
              In progress / pending
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Clock size={20} />
          </div>
        </div>

        {/* Card 4: Overall Velocity */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Team Velocity
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
              {overallTeamRate}%
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
              Overall completion rate
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)'
          }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '12px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.825rem', backgroundColor: 'var(--bg-app)' }}
            placeholder="Search member by name, role, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter by Project */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>Filter by Project:</span>
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.775rem',
              fontWeight: 500,
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Projects ({members.length} members)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid var(--border-subtle)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 0.75rem'
          }} />
          <p style={{ fontSize: '0.85rem' }}>Loading team members and task analytics...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px dashed var(--border-strong)'
        }}>
          <Users size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            No members found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No results for "${searchQuery}".` : 'Add engineers to your projects to start tracking workloads.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ display: 'inline-flex' }}
          >
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      ) : (
        <div className="grid-auto member-grid">
          {filteredMembers.map((m) => {
            const isExpanded = expandedMemberId === m.id;
            const completionRate = m.completion_rate || 0;
            const tasksList = m.tasks || [];

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="member-card-interactive"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  padding: '1.35rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div>
                  {/* Top: Avatar, Name, Role + compact action icons */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem', gap: '0.5rem', minWidth: 0 }}>
                    {/* Left: avatar + info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '11px',
                        backgroundColor: m.avatar_color || '#2563eb',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.name}
                        </h3>
                        <div style={{
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          marginBottom: '0.15rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {m.role}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 }}>
                          <Mail size={11} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: compact icon-only action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMember(m);
                        }}
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--accent-primary-light)',
                          color: 'var(--accent-primary)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Assign task / edit member"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMember(m.id, m.name);
                        }}
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-dim)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-danger-light)'; e.currentTarget.style.color = 'var(--accent-danger)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; }}
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Project Tag */}
                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => onSelectProject && onSelectProject(m.project_id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-muted)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                        color: 'var(--text-main)',
                        fontWeight: 600
                      }}
                      title="Click to view project workspace"
                    >
                      <FolderKanban size={13} color="var(--accent-primary)" />
                      <span>{m.project_code || 'PRJ'}</span>
                      <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>&bull; {m.project_name}</span>
                    </button>
                  </div>

                  {/* WORK DONE SECTION (Highlighted Feature) */}
                  <div style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Work Done & Velocity
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: completionRate === 100 ? 'var(--accent-success)' : 'var(--accent-primary)'
                      }}>
                        {m.tasks_completed} of {m.tasks_assigned} tasks done ({completionRate}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      height: '7px',
                      backgroundColor: 'var(--bg-muted)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      marginBottom: '0.6rem'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${completionRate}%`,
                        backgroundColor: completionRate === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    {/* Summary row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>
                        {m.tasks_pending} active {m.tasks_pending === 1 ? 'task' : 'tasks'} remaining
                      </span>
                      <span style={{
                        fontWeight: 600,
                        color: completionRate === 100 ? 'var(--accent-success)' : (m.tasks_assigned > 0 ? 'var(--accent-primary)' : 'var(--text-dim)')
                      }}>
                        {completionRate === 100 ? 'All Done! ✓' : (m.tasks_assigned > 0 ? 'Active Contributor' : 'No tasks assigned')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable Assigned Tasks Details */}
                <div>
                  {tasksList.length > 0 && (
                    <button
                      onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckSquare size={13} />
                        <span>{isExpanded ? 'Hide Assigned Tasks' : `View Assigned Tasks (${tasksList.length})`}</span>
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}

                  {isExpanded && tasksList.length > 0 && (
                    <div style={{
                      marginTop: '0.65rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      paddingRight: '0.2rem'
                    }}>
                      {tasksList.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            padding: '0.45rem 0.65rem',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: t.status === 'done' ? 'var(--accent-success)' : 'var(--accent-primary)',
                              flexShrink: 0
                            }} />
                            <span style={{
                              color: 'var(--text-main)',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '180px',
                              textDecoration: t.status === 'done' ? 'line-through' : 'none'
                            }}>
                              {t.title}
                            </span>
                          </div>

                          <select
                            value={t.status}
                            onChange={(e) => handleTaskStatusChange(t.id, e.target.value)}
                            style={{
                              fontSize: '0.675rem',
                              padding: '0.15rem 0.35rem',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-muted)',
                              color: 'var(--text-main)',
                              border: '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{
              padding: '1.25rem 1.6rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Add Team Member</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assign a new engineer to a project</p>
                </div>
              </div>

              <button onClick={() => setShowAddModal(false)} style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} style={{ padding: '1.6rem' }}>
              {modalError && (
                <div style={{
                  backgroundColor: 'var(--accent-danger-light)',
                  border: '1px solid var(--accent-danger-border)',
                  color: 'var(--accent-danger)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Select Project */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Assign to Project *
                </label>
                <select
                  className="form-input"
                  value={newMemberProjectId}
                  onChange={(e) => setNewMemberProjectId(e.target.value)}
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jordan Hayes"
                  value={newMemberName}
                  onChange={(e) => {
                    setNewMemberName(e.target.value);
                    if (!newMemberEmail) {
                      const slug = e.target.value.toLowerCase().replace(/\s+/g, '.');
                      if (slug) setNewMemberEmail(`${slug}@softwarehouse.dev`);
                    }
                  }}
                  required
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Company Email *
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="jordan.h@softwarehouse.dev"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                />
              </div>

              {/* Role */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Engineering Role
                </label>
                <select className="form-input" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
                  <option value="Lead Software Architect">Lead Software Architect</option>
                  <option value="Senior Frontend Engineer">Senior Frontend Engineer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Backend / DB Engineer">Backend / DB Engineer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="QA & Security Specialist">QA & Security Specialist</option>
                  <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                </select>
              </div>

              {/* Avatar Color */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                  Avatar Color
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {avatarColors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewMemberColor(col)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: col,
                        border: newMemberColor === col ? '3px solid #ffffff' : '2px solid transparent',
                        boxShadow: newMemberColor === col ? `0 0 6px ${col}` : 'none',
                        transform: newMemberColor === col ? 'scale(1.15)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={modalLoading}>
                  <Sparkles size={15} />
                  <span>{modalLoading ? 'Adding...' : 'Add Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Member Details / Working Info & Edit Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          projects={projects}
          onClose={() => setSelectedMember(null)}
          onMemberUpdated={() => {
            fetchData();
            setSelectedMember(null);
          }}
          onTaskAssigned={() => {
            fetchData();
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
}
