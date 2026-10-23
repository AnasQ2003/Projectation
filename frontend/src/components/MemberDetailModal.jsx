import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Mail, 
  FolderKanban, 
  CheckSquare, 
  Plus, 
  Edit3, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Briefcase,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const PRESET_ROLES = [
  'Full Stack Developer',
  'Senior Frontend Engineer',
  'Backend Lead',
  'UI/UX Designer',
  'QA Automation Engineer',
  'DevOps Specialist',
  'Project Manager'
];

const AVATAR_COLORS = ['#2563eb', '#0891b2', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#4f46e5'];

export default function MemberDetailModal({
  member,
  projects = [],
  onClose,
  onMemberUpdated,
  onTaskAssigned
}) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'edit' | 'assign'
  
  // Edit state
  const [editName, setEditName] = useState(member?.name || '');
  const [editRole, setEditRole] = useState(member?.role || '');
  const [editEmail, setEditEmail] = useState(member?.email || '');
  const [editProjectId, setEditProjectId] = useState(member?.project_id ? member.project_id.toString() : '');
  const [editColor, setEditColor] = useState(member?.avatar_color || '#2563eb');
  
  // Assign task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskProjectId, setTaskProjectId] = useState(
    member?.project_id ? member.project_id.toString() : (projects[0]?.id ? projects[0].id.toString() : '')
  );
  const defaultDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [taskDueDate, setTaskDueDate] = useState(defaultDueDate);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!member) return null;

  const completionRate = member.completion_rate || 0;
  const tasksList = member.tasks || [];

  // Handle Edit Member Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!editName.trim() || !editEmail.trim() || !editRole.trim()) {
      setError('Name, email, and role are required');
      return;
    }

    setLoading(true);
    try {
      await api.updateMember(member.id, {
        name: editName.trim(),
        role: editRole.trim(),
        email: editEmail.trim(),
        project_id: editProjectId ? parseInt(editProjectId) : member.project_id,
        avatar_color: editColor
      });
      setSuccessMsg('Member profile successfully updated!');
      if (onMemberUpdated) {
        onMemberUpdated();
      }
      setTimeout(() => {
        setActiveTab('info');
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  // Handle Assign Task Submit
  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!taskTitle.trim() || !taskProjectId) {
      setError('Task title and target project are required');
      return;
    }

    setLoading(true);
    try {
      await api.addTask(taskProjectId, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        status: 'todo',
        priority: taskPriority,
        assignee: member.name,
        due_date: taskDueDate
      });
      setSuccessMsg(`Task successfully assigned to ${member.name}!`);
      setTaskTitle('');
      setTaskDesc('');
      if (onTaskAssigned) {
        onTaskAssigned();
      }
      setTimeout(() => {
        setActiveTab('info');
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '580px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          overflow: 'hidden'
        }}
      >
        {/* Header Profile Banner */}
        <div style={{
          padding: '1.4rem 1.6rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: member.avatar_color || '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.3rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}>
              {member.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {member.name}
                </h3>
                <span style={{
                  fontSize: '0.725rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-primary-light)',
                  color: 'var(--accent-primary)',
                  fontWeight: 700
                }}>
                  {member.role}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.25rem', fontSize: '0.775rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={13} />
                  <span>{member.email}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FolderKanban size={13} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {member.project_code ? `${member.project_code} • ${member.project_name}` : (member.project_name || 'Assigned Project')}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          padding: '0 1rem',
          flexShrink: 0
        }}>
          <button
            onClick={() => { setActiveTab('info'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: activeTab === 'info' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'info' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            <UserCheck size={15} />
            <span>Working Profile</span>
          </button>

          <button
            onClick={() => { setActiveTab('edit'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: activeTab === 'edit' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'edit' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            <Edit3 size={15} />
            <span>Edit Member</span>
          </button>

          <button
            onClick={() => { setActiveTab('assign'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: activeTab === 'assign' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'assign' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            <span>Assign Task</span>
          </button>
        </div>

        {/* Modal Body (Smooth Single Scrollable) */}
        <div style={{ padding: '1.4rem 1.6rem', flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(22, 163, 74, 0.12)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              color: 'var(--accent-success)',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: WORKING PROFILE */}
          {activeTab === 'info' && (
            <div>
              {/* Working Info Metric Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Assigned
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {member.tasks_assigned || 0}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Sprint tasks</span>
                </div>

                <div style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Completed
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.15rem' }}>
                    {member.tasks_completed || 0}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-success)', fontWeight: 600 }}>Finished</span>
                </div>

                <div style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Velocity
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.15rem' }}>
                    {completionRate}%
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Completion rate</span>
                </div>
              </div>

              {/* Project Assignment Card */}
              <div style={{
                padding: '0.9rem 1.1rem',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Assigned Repository
                  </span>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {member.project_code || 'PRJ'} &bull; {member.project_name || 'Active Workspace'}
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  backgroundColor: 'var(--accent-primary-light)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px'
                }}>
                  Role: {member.role}
                </span>
              </div>

              {/* Assigned Tasks List */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Assigned Tasks ({tasksList.length})
                  </h4>
                  <button
                    onClick={() => setActiveTab('assign')}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Plus size={13} />
                    <span>Assign Task</span>
                  </button>
                </div>

                {tasksList.length === 0 ? (
                  <div style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-subtle)',
                    color: 'var(--text-dim)',
                    fontSize: '0.825rem'
                  }}>
                    No tasks currently assigned to {member.name}. Click "Assign Task" to create one.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {tasksList.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.6rem 0.85rem',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: t.status === 'done' ? 'var(--accent-success)' : 'var(--accent-primary)',
                            flexShrink: 0
                          }} />
                          <span style={{
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            textDecoration: t.status === 'done' ? 'line-through' : 'none'
                          }}>
                            {t.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {t.due_date && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              Due {formatDate(t.due_date)}
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            backgroundColor: t.status === 'done' ? 'var(--accent-success-light)' : 'var(--bg-muted)',
                            color: t.status === 'done' ? 'var(--accent-success)' : 'var(--text-muted)'
                          }}>
                            {t.status === 'done' ? 'Completed' : (t.status === 'in_progress' ? 'In Progress' : (t.status === 'review' ? 'Review' : 'To Do'))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Edit3 size={15} />
                  <span>Edit Profile & Role</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('assign')}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Plus size={15} />
                  <span>Assign New Task</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT MEMBER DETAILS (ADMIN) */}
          {activeTab === 'edit' && (
            <form onSubmit={handleEditSubmit}>
              {/* Card 1: Identity & Contact */}
              <div style={{
                padding: '1.1rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <Briefcase size={15} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Identity & Contact
                  </span>
                </div>

                <div style={{ marginBottom: '0.9rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Ahmed (must be distinct)"
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                    Names cannot be exact same across members.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. ahmed@softwarehouse.dev"
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                    Emails cannot be exact same across members.
                  </span>
                </div>
              </div>

              {/* Card 2: Role & Designation */}
              <div style={{
                padding: '1.1rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <UserCheck size={15} color="#0891b2" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Role & Position
                  </span>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Professional Role / Title *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    placeholder="e.g. Full Stack Developer, Tech Lead..."
                    required
                  />
                </div>

                {/* Preset Role Suggestions */}
                <div>
                  <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Quick Select Role Preset:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {PRESET_ROLES.map((r) => {
                      const isSelected = editRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setEditRole(r)}
                          style={{
                            fontSize: '0.725rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '7px',
                            border: isSelected ? '1px solid var(--accent-primary-border)' : '1px solid var(--border-subtle)',
                            backgroundColor: isSelected ? 'var(--accent-primary-light)' : '#ffffff',
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 3: Project Workspace & Theme */}
              <div style={{
                padding: '1.1rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <FolderKanban size={15} color="#16a34a" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Workspace & Visual Avatar
                  </span>
                </div>

                {/* Assigned Project */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Assigned Project Workspace
                  </label>
                  <select
                    className="form-input"
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id.toString()}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Avatar Color Picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                    Avatar Color
                  </label>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {AVATAR_COLORS.map((c) => {
                      const isSelected = editColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '9px',
                            backgroundColor: c,
                            border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                            outline: isSelected ? `2px solid ${c}` : '1px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            transition: 'transform 0.15s ease'
                          }}
                          title={`Select ${c}`}
                        >
                          {isSelected && <Check size={16} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  <Sparkles size={15} />
                  <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ASSIGN NEW TASK */}
          {activeTab === 'assign' && (
            <form onSubmit={handleAssignTaskSubmit}>
              <div style={{
                padding: '0.75rem 0.9rem',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-primary-light)',
                color: 'var(--accent-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <CheckSquare size={16} />
                <span>Assigning directly to: {member.name} ({member.role})</span>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Project Workspace *
                </label>
                <select
                  className="form-input"
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Build GraphQL endpoint & schema migrations"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Priority
                  </label>
                  <select
                    className="form-input"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Technical Scope / Notes
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Acceptance criteria or implementation details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  <CheckSquare size={15} />
                  <span>{loading ? 'Assigning...' : 'Assign Task'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
