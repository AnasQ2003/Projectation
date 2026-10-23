import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  CheckSquare, 
  AlertCircle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  UserPlus, 
  Activity,
  Edit2,
  Edit3,
  Check,
  X
} from 'lucide-react';

import { api } from '../services/api';
import { getDeadlineInfo, formatDate } from '../utils/dateUtils';
import NewTaskModal from './NewTaskModal';
import NewMemberModal from './NewMemberModal';
import MemberDetailModal from './MemberDetailModal';
import TaskDetailModal from './TaskDetailModal';

export default function ProjectDetail({ projectId, onBack, onProjectDeleted }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'members' | 'timeline' | 'activity'

  // Consolidated Project Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBudget, setEditBudget] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Selected Items for Detail Modals
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalDefaultStatus, setTaskModalDefaultStatus] = useState('todo');
  const [showMemberModal, setShowMemberModal] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getProject(projectId);
      setProject(data);
    } catch (err) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  // Handle task status update (moving across Jira columns)
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      fetchProjectDetails();
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      fetchProjectDetails();
    } catch (err) {
      alert('Error deleting task: ' + err.message);
    }
  };

  // Handle member removal
  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Remove this team member?')) return;
    try {
      await api.deleteMember(memberId);
      fetchProjectDetails();
    } catch (err) {
      alert('Error removing member: ' + err.message);
    }
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!window.confirm(`Permanently delete "${project.name}" and all associated tasks?`)) return;
    try {
      await api.deleteProject(projectId);
      onProjectDeleted();
    } catch (err) {
      alert('Error deleting project: ' + err.message);
    }
  };

  // Open consolidated edit modal — pre-fill all fields from current project data
  const handleOpenEditModal = () => {
    setEditBudget(project.budget !== undefined ? project.budget.toString() : '');
    setEditPriority(project.priority || 'Medium');
    setEditStartDate(project.start_date || '');
    setEditDeadline(project.deadline || '');
    setEditStatus(project.status || 'In Progress');
    setShowEditModal(true);
  };

  // Save all editable project fields in one call
  const handleSaveProjectEdit = async (e) => {
    e.preventDefault();
    if (!editDeadline) {
      alert('Deadline date is required');
      return;
    }
    const num = parseFloat(editBudget);
    if (editBudget && (isNaN(num) || num < 0)) {
      alert('Please enter a valid budget amount');
      return;
    }
    setEditSaving(true);
    try {
      const payload = {
        status: editStatus,
        priority: editPriority,
        start_date: editStartDate || null,
        deadline: editDeadline,
        budget: editBudget ? num : project.budget
      };
      await api.updateProject(projectId, payload);
      setProject(prev => ({ ...prev, ...payload }));
      setShowEditModal(false);
      await fetchProjectDetails();
    } catch (err) {
      alert('Error saving project settings: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
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
        <p style={{ fontSize: '0.85rem' }}>Loading project workspace...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ padding: '2rem' }}>
        <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '1.25rem' }}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--accent-danger-light)', color: 'var(--accent-danger)', borderRadius: '8px' }}>
          {error || 'Project not found.'}
        </div>
      </div>
    );
  }

  const deadlineInfo = getDeadlineInfo(project.deadline);
  const tasks = project.tasks || [];
  const members = project.members || [];
  const activityLogs = project.activity_logs || [];

  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : (project.progress || 0);

  // Kanban Columns definition
  const columns = [
    { id: 'todo', title: 'To Do', color: '#64748b' },
    { id: 'in_progress', title: 'In Progress', color: '#2563eb' },
    { id: 'review', title: 'In Review', color: '#d97706' },
    { id: 'done', title: 'Done', color: '#16a34a' }
  ];

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
          <ArrowLeft size={15} />
          <span>Back to Projects</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => {
              setTaskModalDefaultStatus('todo');
              setShowTaskModal(true);
            }}
            className="btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <Plus size={15} />
            <span>Add Task</span>
          </button>

          <button
            onClick={() => setShowMemberModal(true)}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <UserPlus size={15} />
            <span>Add Member</span>
          </button>

          <button
            onClick={handleDeleteProject}
            className="btn-danger"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
            title="Delete this project"
          >
            <Trash2 size={15} />
            <span>Delete Project</span>
          </button>
        </div>
      </div>

      {/* Main Project Overview Card */}
      <div className="glass-card" style={{
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Top: Title/meta + Deadline badge */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.25rem', alignItems: 'flex-start' }}>
          {/* Left Title & Info */}
          <div style={{ flex: '1 1 400px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-muted)',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}>
                {project.code}
              </span>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-main)',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px'
              }}>
                {project.category}
              </span>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.15rem 0.55rem',
                borderRadius: '6px',
                backgroundColor: project.status === 'Completed' ? 'var(--accent-success-light)' : 'var(--accent-primary-light)',
                color: project.status === 'Completed' ? 'var(--accent-success)' : 'var(--accent-primary)',
                border: `1px solid ${project.status === 'Completed' ? 'var(--accent-success-border)' : 'var(--accent-primary-border)'}`
              }}>
                {project.status}
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
              {project.name}
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, maxWidth: '600px' }}>
              {project.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Right: Deadline card */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: `1px solid ${deadlineInfo.borderColor}`,
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            minWidth: '220px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Deadline Status
              </span>
              <div className={deadlineInfo.colorClass} style={{
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.725rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {deadlineInfo.status === 'overdue' ? <AlertCircle size={12} /> : <Clock size={12} />}
                <span>{deadlineInfo.label}</span>
              </div>
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
              {formatDate(project.deadline)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} />
              <span>Kickoff: {formatDate(project.start_date)}</span>
            </div>
          </div>
        </div>

        {/* Project Key Metrics Row — read-only, single Edit Settings button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0',
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Sprint Completion */}
          <div style={{ flex: '1 1 140px', padding: '0 1rem 0 0', borderRight: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.15rem' }}>Sprint Completion</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{progressPercent}%</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({completedTasksCount}/{tasks.length} tasks)</span>
            </div>
          </div>

          {/* Allocated Budget */}
          <div style={{ flex: '1 1 160px', padding: '0 1rem', borderRight: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.15rem' }}>Allocated Budget</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              PKR {project.budget ? Number(project.budget).toLocaleString() : '—'}
            </span>
          </div>

          {/* Team Size */}
          <div style={{ flex: '1 1 140px', padding: '0 1rem', borderRight: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.15rem' }}>Team Size</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={15} color="var(--accent-primary)" />
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{members.length} Members</span>
            </div>
          </div>

          {/* Priority Level */}
          <div style={{ flex: '1 1 140px', padding: '0 1rem' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.15rem' }}>Priority Level</span>
            <span style={{
              fontSize: '0.825rem',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: '6px',
              backgroundColor: project.priority === 'Urgent' ? 'var(--accent-danger-light)' : project.priority === 'High' ? 'rgba(251,191,36,0.15)' : 'var(--accent-primary-light)',
              color: project.priority === 'Urgent' ? 'var(--accent-danger)' : project.priority === 'High' ? '#d97706' : 'var(--accent-primary)',
              display: 'inline-block'
            }}>
              {project.priority} Priority
            </span>
          </div>

          {/* Single Edit Settings Button */}
          <div style={{ flexShrink: 0, marginLeft: 'auto', paddingLeft: '1rem' }}>
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
            >
              <Edit3 size={14} />
              <span>Edit Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tab-bar" style={{
        display: 'flex',
        gap: '0.35rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.25rem'
      }}>
        <button
          onClick={() => setActiveTab('board')}
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: activeTab === 'board' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'board' ? '2px solid var(--accent-primary)' : '2px solid transparent'
          }}
        >
          <CheckSquare size={16} />
          <span>Sprint Board</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '0.05rem 0.4rem',
            borderRadius: '999px',
            backgroundColor: 'var(--bg-muted)',
            color: 'var(--text-main)'
          }}>
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: activeTab === 'members' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'members' ? '2px solid var(--accent-primary)' : '2px solid transparent'
          }}
        >
          <Users size={16} />
          <span>Team Members</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '0.05rem 0.4rem',
            borderRadius: '999px',
            backgroundColor: 'var(--bg-muted)',
            color: 'var(--text-main)'
          }}>
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: activeTab === 'timeline' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'timeline' ? '2px solid var(--accent-primary)' : '2px solid transparent'
          }}
        >
          <Clock size={16} />
          <span>Timeline & Milestones</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: activeTab === 'activity' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'activity' ? '2px solid var(--accent-primary)' : '2px solid transparent'
          }}
        >
          <Activity size={16} />
          <span>Activity Log</span>
        </button>
      </div>

      {/* TAB 1: SPRINT BOARD */}
      {activeTab === 'board' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          {columns.map((col) => {
            const columnTasks = tasks.filter(t => t.status === col.id);

            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.85rem',
                  minHeight: '440px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Column Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.85rem',
                  paddingBottom: '0.65rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{col.title}</h3>
                    <span style={{
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-muted)',
                      padding: '0.05rem 0.4rem',
                      borderRadius: '999px',
                      color: 'var(--text-dim)'
                    }}>
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setTaskModalDefaultStatus(col.id);
                      setShowTaskModal(true);
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}
                    title={`Add Task to ${col.title}`}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Column Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                  {columnTasks.length === 0 ? (
                    <div style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      color: 'var(--text-dim)',
                      fontSize: '0.8rem',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: '8px'
                    }}>
                      No tasks in this lane
                    </div>
                  ) : (
                    columnTasks.map((t) => {
                      const taskDeadline = getDeadlineInfo(t.due_date);

                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-subtle)',
                            padding: '0.85rem',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                          }}
                          title="Click to view and edit task"
                        >
                          {/* Priority & Delete */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{
                              fontSize: '0.675rem',
                              fontWeight: 600,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: t.priority === 'Urgent' ? 'var(--accent-danger-light)' : 'var(--bg-muted)',
                              color: t.priority === 'Urgent' ? 'var(--accent-danger)' : 'var(--text-muted)'
                            }}>
                              {t.priority}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(t.id);
                              }}
                              style={{ color: 'var(--text-dim)', padding: '0.15rem' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                              title="Delete Task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Title & Description */}
                          <div>
                            <div style={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              lineHeight: 1.35,
                              marginBottom: '0.2rem'
                            }}>
                              {t.title}
                            </div>
                            {t.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {t.description}
                              </div>
                            )}
                          </div>

                          {/* Task Deadline Badge */}
                          {t.due_date && (
                            <div className={taskDeadline.colorClass} style={{
                              alignSelf: 'flex-start',
                              fontSize: '0.675rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <Clock size={11} />
                              <span>Due {formatDate(t.due_date)}</span>
                            </div>
                          )}

                          {/* Assignee & Move column dropdown */}
                          <div style={{
                            paddingTop: '0.45rem',
                            borderTop: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent-primary)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.625rem',
                                fontWeight: 700
                              }}>
                                {t.assignee ? t.assignee.slice(0, 2).toUpperCase() : 'UN'}
                              </div>
                              <span style={{ maxWidth: '90px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.assignee || 'Unassigned'}
                              </span>
                            </div>

                            <select
                              value={t.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleTaskStatusChange(t.id, e.target.value)}
                              style={{
                                fontSize: '0.7rem',
                                backgroundColor: 'var(--bg-muted)',
                                color: 'var(--text-main)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                padding: '0.15rem 0.3rem',
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
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TEAM MEMBERS */}
      {activeTab === 'members' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Engineering Personnel</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Team members assigned to this repository</p>
            </div>
            <button onClick={() => setShowMemberModal(true)} className="btn-primary" style={{ fontSize: '0.825rem' }}>
              <UserPlus size={15} />
              <span>Add Member</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem'
          }}>
            {members.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMember({
                  ...m,
                  project_name: project.name,
                  project_code: project.code,
                  tasks: tasks.filter(t => t.assignee === m.name)
                })}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  padding: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                title="Click to view working info and edit member profile"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: m.avatar_color || '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.1rem' }}>
                      {m.name}
                    </h4>
                    <div style={{
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                      marginBottom: '0.15rem'
                    }}>
                      {m.role}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                      {m.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember({
                        ...m,
                        project_name: project.name,
                        project_code: project.code,
                        tasks: tasks.filter(t => t.assignee === m.name)
                      });
                    }}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      backgroundColor: 'var(--accent-primary-light)',
                      color: 'var(--accent-primary)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="View & Edit"
                  >
                    Details
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMember(m.id);
                    }}
                    style={{
                      padding: '0.35rem',
                      borderRadius: '6px',
                      color: 'var(--text-dim)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                    title="Remove member"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE & MILESTONES */}
      {activeTab === 'timeline' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Milestones & Release Runway
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Linear schedule from initial kickoff to client delivery.
          </p>

          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '10px',
            padding: '1.5rem',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div
                onClick={handleOpenEditModal}
                style={{ cursor: 'pointer' }}
                title="Click to edit kickoff date"
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block' }}>KICKOFF</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {formatDate(project.start_date)}
                  <Edit2 size={12} color="var(--text-dim)" />
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block' }}>RUNWAY</span>
                <span className={deadlineInfo.colorClass} style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '0.775rem'
                }}>
                  {deadlineInfo.fullText}
                </span>
              </div>

              <div
                onClick={handleOpenEditModal}
                style={{ textAlign: 'right', cursor: 'pointer' }}
                title="Click to edit final deadline"
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block' }}>FINAL DEADLINE</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                  {formatDate(project.deadline)}
                  <Edit2 size={12} color="var(--text-dim)" />
                </span>
              </div>
            </div>

            <div style={{
              height: '8px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '0.65rem'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--accent-primary)',
                borderRadius: '999px',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>Sprint Backlog</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{progressPercent}% Complete</span>
              <span>Production Release</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
              Milestone Checklist
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 0.9rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={16} color="var(--accent-success)" />
                <span style={{ fontWeight: 600 }}>Architecture Review & Schema Specification</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-success)', fontWeight: 600 }}>Signed Off</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 0.9rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={16} color={progressPercent >= 50 ? 'var(--accent-success)' : 'var(--text-dim)'} />
                <span style={{ fontWeight: 600 }}>Core API Development & Client Integration</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {progressPercent >= 50 ? 'Completed' : 'Active Sprint'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 0.9rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={16} color={progressPercent === 100 ? 'var(--accent-success)' : 'var(--text-dim)'} />
                <span style={{ fontWeight: 600 }}>QA Validation & Production Cutover</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Pending Final Sprint
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT ACTIVITY LOGS */}
      {activeTab === 'activity' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Audit Log (Admin Activity)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activityLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>No recent activity records.</p>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--accent-primary-light)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Activity size={14} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'flex', gap: '0.45rem' }}>
                      <span>By <strong>{log.user.includes('Alex') ? 'Anas (Admin)' : log.user}</strong></span>
                      <span>&bull;</span>
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <NewTaskModal
          projectId={projectId}
          members={members}
          defaultStatus={taskModalDefaultStatus}
          onClose={() => setShowTaskModal(false)}
          onTaskCreated={fetchProjectDetails}
        />
      )}

      {showMemberModal && (
        <NewMemberModal
          projectId={projectId}
          onClose={() => setShowMemberModal(false)}
          onMemberAdded={fetchProjectDetails}
        />
      )}

      {/* Member Working Info & Admin Edit Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          projects={[project]}
          onClose={() => setSelectedMember(null)}
          onMemberUpdated={() => {
            fetchProjectDetails();
            setSelectedMember(null);
          }}
          onTaskAssigned={() => {
            fetchProjectDetails();
            setSelectedMember(null);
          }}
        />
      )}

      {/* Task Detail / Edit Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={members}
          projects={[project]}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            fetchProjectDetails();
            setSelectedTask(null);
          }}
          onTaskDeleted={() => {
            fetchProjectDetails();
            setSelectedTask(null);
          }}
        />
      )}

      {/* ── Edit Project Settings Modal ─────────────────── */}
      {showEditModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.6rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '8px',
                  backgroundColor: 'var(--accent-primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Edit Project Settings</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{project.code} · {project.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProjectEdit} style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Project Status
                </label>
                <select
                  className="form-input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Code Review">Code Review</option>
                  <option value="QA Testing">QA Testing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Priority Level
                </label>
                <select
                  className="form-input"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>

              {/* Budget */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Allocated Budget (PKR)
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 45000"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  min="0"
                />
              </div>

              {/* Timeline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Kickoff Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Final Deadline *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" disabled={editSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  <Check size={15} />
                  <span>{editSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
