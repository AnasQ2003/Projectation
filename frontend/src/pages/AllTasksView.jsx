import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Filter, 
  FolderKanban, 
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { getDeadlineInfo, formatDate } from '../utils/dateUtils';
import TaskDetailModal from '../components/TaskDetailModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function AllTasksView({ onSelectProject, refreshTrigger }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Add Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newStatus, setNewStatus] = useState('todo');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newAssignee, setNewAssignee] = useState('Unassigned');
  const [newDueDate, setNewDueDate] = useState(() => {
    return new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData, membersData] = await Promise.all([
        api.getAllTasks(),
        api.getProjects(),
        api.getAllMembers()
      ]);
      setTasks(tasksData || []);
      setProjects(projectsData || []);
      setMembers(membersData || []);
      if (projectsData && projectsData.length > 0 && !newProjectId) {
        setNewProjectId(projectsData[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, [refreshTrigger]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      fetchTasksData();
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  const handleDeleteTask = (taskId, taskTitle) => {
    setTaskToDelete({ id: taskId, title: taskTitle });
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await api.deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      fetchTasksData();
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!newTitle.trim() || !newProjectId) {
      setModalError('Title and Project are required');
      return;
    }

    setModalLoading(true);
    try {
      await api.createTask({
        project_id: parseInt(newProjectId),
        title: newTitle.trim(),
        description: newDesc.trim(),
        status: newStatus,
        priority: newPriority,
        assignee: newAssignee,
        due_date: newDueDate
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchTasksData();
    } catch (err) {
      setModalError(err.message || 'Error creating task');
    } finally {
      setModalLoading(false);
    }
  };

  const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

  const filteredTasks = tasks
    .filter((t) => {
      const matchesSearch = searchQuery
        ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.assignee && t.assignee.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (t.project_name && t.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (t.project_code && t.project_code.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesProject = projectFilter === 'ALL' || t.project_id.toString() === projectFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesProject && matchesPriority;
    })
    .sort((a, b) => {
      // Completed tasks always go to the bottom
      const aDone = a.status === 'done' ? 1 : 0;
      const bDone = b.status === 'done' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      // Sort by priority: Urgent → High → Medium → Low
      const aPri = PRIORITY_ORDER[a.priority] ?? 2;
      const bPri = PRIORITY_ORDER[b.priority] ?? 2;
      return aPri - bPri;
    });

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            All Sprints & Tasks
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Workspace backlog and sprint tasks across all active software repositories
          </p>
        </div>

        <button
          onClick={() => {
            if (projects.length > 0 && !newProjectId) {
              setNewProjectId(projects[0].id.toString());
            }
            setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>Create Task</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* To Do */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>To Do</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>{todoCount}</div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>Backlog items</span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Clock size={20} />
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>In Progress</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>{inProgressCount}</div>
            <span style={{ fontSize: '0.725rem', color: 'var(--accent-primary)', fontWeight: 500 }}>Currently active</span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <CheckSquare size={20} />
          </div>
        </div>

        {/* In Review */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>In Review</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-warning)', marginTop: '0.2rem' }}>{reviewCount}</div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>QA & Peer review</span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-warning)' }}>
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Done */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Completed</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.2rem' }}>{doneCount}</div>
            <span style={{ fontSize: '0.725rem', color: 'var(--accent-success)', fontWeight: 500 }}>Successfully deployed</span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '12px'
      }}>
        {/* Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Tasks' },
            { id: 'todo', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'review', label: 'In Review' },
            { id: 'done', label: 'Completed' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontWeight: statusFilter === st.id ? 600 : 500,
                backgroundColor: statusFilter === st.id ? 'var(--accent-primary)' : 'var(--bg-muted)',
                color: statusFilter === st.id ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search & Project Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.1rem', height: '34px', fontSize: '0.8rem', backgroundColor: 'var(--bg-app)' }}
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{
              padding: '0.35rem 0.65rem',
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
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
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
          <p style={{ fontSize: '0.85rem' }}>Loading workspace tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px dashed var(--border-strong)'
        }}>
          <CheckSquare size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            No tasks found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {searchQuery || statusFilter !== 'ALL' || projectFilter !== 'ALL'
              ? 'Try resetting your task filters.'
              : 'Add sprint tasks to keep your software releases on schedule.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ display: 'inline-flex' }}
          >
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTasks.map((t) => {
            const taskDeadline = getDeadlineInfo(t.due_date);

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="task-row-interactive"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.transform = 'none';
                }}
                title="Click to view and edit task details"
              >
                {/* Left: Task Info & Project Code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 350px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: t.status === 'done' ? 'var(--accent-success-light)' : 'var(--accent-primary-light)',
                    color: t.status === 'done' ? 'var(--accent-success)' : 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {t.status === 'done' ? <CheckCircle2 size={16} /> : <CheckSquare size={16} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectProject) onSelectProject(t.project_id);
                        }}
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          backgroundColor: 'var(--bg-muted)',
                          color: 'var(--text-muted)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)'
                        }}
                        title="Open project workspace"
                      >
                        {t.project_code || 'PRJ'}
                      </button>

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
                    </div>

                    <h4 style={{
                      fontSize: '0.925rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      textDecoration: t.status === 'done' ? 'line-through' : 'none'
                    }}>
                      {t.title}
                    </h4>
                  </div>
                </div>

                {/* Right: Due Date, Assignee, Status selector, Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Due Date */}
                  {t.due_date && (
                    <div className={taskDeadline.colorClass} style={{
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Clock size={12} />
                      <span>{formatDate(t.due_date)}</span>
                    </div>
                  )}

                  {/* Assignee */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 700
                    }}>
                      {t.assignee ? t.assignee.slice(0, 2).toUpperCase() : 'UN'}
                    </div>
                    <span style={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.assignee || 'Unassigned'}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={t.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Completed</option>
                  </select>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(t.id, t.title);
                    }}
                    style={{ padding: '0.3rem', color: 'var(--text-dim)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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
                  <Plus size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Create Task</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Add sprint item to any project</p>
                </div>
              </div>

              <button onClick={() => setShowAddModal(false)} style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ padding: '1.6rem' }}>
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

              {/* Project selector */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Select Project *
                </label>
                <select
                  className="form-input"
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Implement MSSQL schema migrations"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              {/* Status and Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Status
                  </label>
                  <select className="form-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Completed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Priority
                  </label>
                  <select className="form-input" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Assignee
                  </label>
                  <select
                    className="form-input"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                  >
                    <option value="Unassigned">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Description / Notes
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Task specifications..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={modalLoading}>
                  <Sparkles size={15} />
                  <span>{modalLoading ? 'Creating...' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Task Detail / Quick Edit Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={members}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            fetchTasksData();
            setSelectedTask(null);
          }}
          onTaskDeleted={() => {
            fetchTasksData();
            setSelectedTask(null);
          }}
        />
      )}
      {/* Premium Task Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        itemName={taskToDelete?.title}
        itemType="task"
        confirmText="Delete Task"
        isDeleting={isDeletingTask}
        onConfirm={handleConfirmDeleteTask}
        onClose={() => !isDeletingTask && setTaskToDelete(null)}
      />
    </div>
  );
}
