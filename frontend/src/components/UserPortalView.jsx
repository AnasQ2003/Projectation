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
  Layers,
  Edit3,
  Sliders,
  X,
  Award,
  Check,
  RotateCcw,
  MessageSquare,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import NotificationDropdown from './NotificationDropdown';

/**
 * UserPortalView — Premium Glassmorphic Workspace for Registered Team Members
 * 
 * Architectural Highlights:
 * 1. Pixel-perfect alignment: Both top navbar and main content share the exact same
 *    1400px page-container grid with matching 1.5rem horizontal padding.
 * 2. Enterprise Glassmorphism: Inherits the application's native radial mesh gradient,
 *    frosted cards (.glass-card), and subtle translucent borders.
 * 3. Interactive Contributor Mode: Registered team members can update task status,
 *    adjust progress percentage, log deliverables notes, and broadcast live notifications to Admin.
 * 4. Interactive Polish: Built-in workspace search, status filters, and task progression.
 */

export default function UserPortalView({ user, onLogout, refreshTrigger, onRefresh }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Interactive Task Status & Progress Update State
  const [editingTask, setEditingTask] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('todo');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateNote, setUpdateNote] = useState('');
  const [updateExpectedDate, setUpdateExpectedDate] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);
  const [toastMessage, setToastMessage] = useState(null); // { text, type: 'success'|'error' }

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    let isMounted = true;
    const fetchMyData = async () => {
      try {
        if (projects.length === 0) {
          setLoading(true);
        }
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
  }, [user, refreshTrigger]);

  // Aggregate stats across all assigned projects & tasks
  const allAssignedTasks = useMemo(() => {
    return projects.flatMap(p => p.myTasks || []);
  }, [projects]);

  const totalTasks = allAssignedTasks.length;
  const completedTasks = allAssignedTasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
  const inProgressTasks = allAssignedTasks.filter(t => (t.status || '').toLowerCase() !== 'done').length;

  // Find nearest upcoming deadline
  const deadlines = projects
    .map(p => p.deadline)
    .filter(Boolean)
    .sort();
  const nextDeadline = deadlines[0] || 'Ongoing';

  // Filter projects & tasks by search, status, and priority
  // When a user completes tasks, they show under the Completed tab even if the whole project has other active tasks
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return projects.map(proj => {
      const projectMatchesQuery = !q || 
        (proj.name && proj.name.toLowerCase().includes(q)) ||
        (proj.code && proj.code.toLowerCase().includes(q)) ||
        (proj.category && proj.category.toLowerCase().includes(q));

      // Filter tasks in this project according to status, priority, and search
      const visibleTasks = (proj.myTasks || []).filter(task => {
        const isDone = (task.status || '').toLowerCase() === 'done';
        
        // Status filter: Completed vs In Progress
        if (statusFilter === 'COMPLETED' && !isDone) return false;
        if (statusFilter === 'IN_PROGRESS' && isDone) return false;

        // Priority filter
        if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

        // Search query filter: check task title, description, notes or project match
        if (!q) return true;
        if (projectMatchesQuery) return true;
        return (task.title && task.title.toLowerCase().includes(q)) ||
               (task.description && task.description.toLowerCase().includes(q)) ||
               (task.progress_note && task.progress_note.toLowerCase().includes(q));
      });

      const shouldShow = visibleTasks.length > 0 || (projectMatchesQuery && statusFilter === 'ALL' && (!proj.myTasks || proj.myTasks.length === 0));

      return {
        ...proj,
        visibleTasks,
        shouldShow
      };
    }).filter(proj => proj.shouldShow);
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Open modal to update task progress, status, and notes
  const handleOpenEditTask = (task, project) => {
    setEditingTask({
      ...task,
      projectId: project.id,
      projectName: project.name,
      projectCode: project.code
    });
    setUpdateStatus(task.status || 'todo');
    setUpdateProgress(task.progress_percent !== undefined ? task.progress_percent : ((task.status || '').toLowerCase() === 'done' ? 100 : 0));
    setUpdateNote(task.progress_note || '');
    setUpdateExpectedDate(task.completed_at || task.due_date || '');
  };

  // Instant toggle done / in_progress on task checkbox
  const handleQuickToggleDone = async (task, project) => {
    const isCurrentlyDone = (task.status || '').toLowerCase() === 'done';
    const newStatus = isCurrentlyDone ? 'in_progress' : 'done';
    const newProgress = isCurrentlyDone ? 50 : 100;
    const newCompletedAt = isCurrentlyDone ? null : new Date().toISOString().split('T')[0];

    // Optimistic local state update
    setProjects(prevProjects => {
      return prevProjects.map(p => {
        if (!p.myTasks) return p;
        const updatedTasks = p.myTasks.map(t => {
          if (t.id === task.id) {
            return {
              ...t,
              status: newStatus,
              progress_percent: newProgress,
              completed_at: newCompletedAt
            };
          }
          return t;
        });
        const doneCount = updatedTasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
        const newProjProgress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : p.progress;
        return {
          ...p,
          myTasks: updatedTasks,
          progress: newProjProgress
        };
      });
    });

    try {
      await api.updateTaskStatus(
        task.id,
        newStatus,
        newProgress,
        task.progress_note || '',
        user.name || user.username,
        newCompletedAt
      );
      setToastMessage({ text: newStatus === 'done' ? `✓ Completed "${task.title}". Admin notified.` : `✓ Set "${task.title}" to In Progress.`, type: 'success' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Quick toggle error:', err);
    }
  };

  // Save detailed task progress from modal
  const handleSaveTaskProgress = async (e) => {
    if (e) e.preventDefault();
    if (!editingTask) return;
    try {
      setSavingProgress(true);
      const statusVal = updateStatus.toLowerCase();
      const progressVal = statusVal === 'done' ? 100 : updateProgress;
      const noteVal = updateNote.trim();
      // Use user-entered date; fall back to today if marking done with no date set
      const completedAtVal = statusVal === 'done'
        ? (updateExpectedDate || new Date().toISOString().split('T')[0])
        : null;

      // Optimistic local state update
      setProjects(prevProjects => {
        return prevProjects.map(p => {
          if (!p.myTasks) return p;
          const updatedTasks = p.myTasks.map(t => {
            if (t.id === editingTask.id) {
              return {
                ...t,
                status: statusVal,
                progress_percent: progressVal,
                progress_note: noteVal,
                completed_at: completedAtVal
              };
            }
            return t;
          });
          const doneCount = updatedTasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
          const newProjProgress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : p.progress;
          return {
            ...p,
            myTasks: updatedTasks,
            progress: newProjProgress
          };
        });
      });

      // Send to backend
      await api.updateTaskStatus(
        editingTask.id,
        statusVal,
        progressVal,
        noteVal,
        user.name || user.username,
        completedAtVal
      );

      setToastMessage({ text: `✓ "${editingTask.title}" updated to ${statusVal.replace('_', ' ')} (${progressVal}%). Admin notified.`, type: 'success' });
      setEditingTask(null);
      setUpdateExpectedDate('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setToastMessage({ text: 'Failed to update task: ' + (err.message || 'Unknown error'), type: 'error' });
    } finally {
      setSavingProgress(false);
    }
  };

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
                paddingRight: searchQuery ? '2rem' : '0.85rem',
                height: '36px',
                fontSize: '0.825rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(241, 245, 249, 0.65)',
                border: '1px solid var(--border-subtle)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* User Identity, Live Notifications & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {/* Live Notification Bell & Dropdown */}
            <NotificationDropdown 
              user={user} 
              refreshTrigger={refreshTrigger} 
            />

            <div style={{ height: '22px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

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
                color: '#059669',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
              }}
            >
              <Activity size={14} style={{ color: '#059669' }} />
              <span>Interactive Contributor Mode</span>
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

            {/* Card 2: Upcoming Target Deadline */}
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
                  Target Deadline
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                  {nextDeadline}
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Upcoming project deadline
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

              {/* Filter & Search Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Status Filter Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
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
                    All Tasks ({totalTasks})
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
                    In Progress ({inProgressTasks})
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
                    Completed ({completedTasks})
                  </button>
                </div>

                {/* Priority Filter Dropdown */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{
                    height: '34px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                  title="Filter tasks by priority"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>

                {/* Reset Filters button if any filter is active */}
                {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setPriorityFilter('ALL');
                      setSearchQuery('');
                    }}
                    style={{
                      height: '34px',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      color: '#dc2626',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer'
                    }}
                    title="Reset all search & status filters"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                )}
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
                  {searchQuery 
                    ? 'No Matching Workspaces Found' 
                    : projects.length > 0 
                    ? (statusFilter === 'COMPLETED' ? 'No Completed Projects Yet' : 'No In-Progress Projects')
                    : 'No Projects Assigned'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
                  {searchQuery 
                    ? `No workspaces or tasks match "${searchQuery}". Clear your search query to view all assignments.`
                    : projects.length > 0 
                    ? (statusFilter === 'COMPLETED' 
                        ? 'All assigned workspaces are currently in progress. Completed projects will appear here once all deliverables are done.' 
                        : 'No active workspaces match the selected filter.')
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
                        {(() => {
                          const totalTasksCount = proj.myTasks ? proj.myTasks.length : 0;
                          const doneTasksCount = proj.myTasks ? proj.myTasks.filter(t => (t.status || '').toLowerCase() === 'done').length : 0;
                          const isDone = proj.progress === 100 || (totalTasksCount > 0 && doneTasksCount === totalTasksCount) || ((proj.status || '').toLowerCase() === 'completed' && doneTasksCount === totalTasksCount);
                          const displayStatus = isDone ? 'Completed' : 'In Progress';

                          return (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '4px 12px',
                                borderRadius: '20px',
                                backgroundColor: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.1)',
                                color: isDone ? '#059669' : '#2563eb',
                                border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.28)' : 'rgba(37, 99, 235, 0.25)'}`
                              }}
                            >
                              {displayStatus}
                            </span>
                          );
                        })()}

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
                            Target Deadline
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
                          <span>My Tasks ({proj.visibleTasks ? proj.visibleTasks.length : (proj.myTasks?.length || 0)}{proj.visibleTasks && proj.myTasks && proj.visibleTasks.length !== proj.myTasks.length ? ` of ${proj.myTasks.length}` : ''})</span>
                          {statusFilter !== 'ALL' && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                              • {statusFilter === 'COMPLETED' ? 'Completed Tasks' : 'In Progress Tasks'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} />
                          <span>Live Progress Sync</span>
                        </span>
                      </div>

                      {(!proj.visibleTasks || proj.visibleTasks.length === 0) ? (
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
                          {statusFilter === 'COMPLETED' 
                            ? 'No completed tasks in this workspace yet. Check off deliverables as you finish them!' 
                            : statusFilter === 'IN_PROGRESS' 
                            ? 'All tasks in this workspace are completed!' 
                            : 'No tasks currently assigned to you in this workspace.'}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {proj.visibleTasks.map((task) => {
                            const statusStr = (task.status || 'todo').toLowerCase();
                            const isDone = statusStr === 'done';
                            const isInProgress = statusStr === 'in_progress';
                            const isReview = statusStr === 'review';
                            const isTodo = statusStr === 'todo';

                            // Dynamic status border colors & backgrounds as requested
                            const statusBorderColor = isDone 
                              ? '#10b981' 
                              : isInProgress 
                              ? '#3b82f6' 
                              : isReview 
                              ? '#f59e0b' 
                              : '#94a3b8';

                            const statusBg = isDone 
                              ? 'rgba(240, 253, 244, 0.75)' 
                              : isInProgress 
                              ? 'rgba(239, 246, 255, 0.75)' 
                              : isReview 
                              ? 'rgba(254, 243, 199, 0.65)' 
                              : 'rgba(248, 250, 252, 0.85)';

                            const statusAccentBar = isDone 
                              ? '5px solid #059669' 
                              : isInProgress 
                              ? '5px solid #2563eb' 
                              : isReview 
                              ? '5px solid #d97706' 
                              : '5px solid #64748b';

                            const isOverdue = !isDone && task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));

                            return (
                              <div
                                key={task.id}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.65rem',
                                  padding: '0.95rem 1.25rem',
                                  backgroundColor: statusBg,
                                  border: `1.5px solid ${statusBorderColor}`,
                                  borderLeft: statusAccentBar,
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {/* Task Header Row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '220px' }}>
                                    {/* Quick Checkbox / Complete Toggle */}
                                    <button
                                      type="button"
                                      onClick={() => handleQuickToggleDone(task, proj)}
                                      title={isDone ? "Click to set back to in progress" : "Click to mark as done"}
                                      style={{
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        backgroundColor: isDone ? '#059669' : isInProgress ? 'rgba(37, 99, 235, 0.12)' : 'rgba(241, 245, 249, 0.9)',
                                        color: isDone ? '#ffffff' : isInProgress ? '#2563eb' : 'var(--text-dim)',
                                        border: `1px solid ${isDone ? '#059669' : 'var(--border-subtle)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {isDone ? <Check size={14} strokeWidth={3} /> : <CircleDot size={13} />}
                                    </button>

                                    <div style={{ flex: 1 }}>
                                      <span
                                        style={{
                                          fontSize: '0.9rem',
                                          fontWeight: 700,
                                          color: 'var(--text-main)',
                                          textDecoration: isDone ? 'line-through' : 'none',
                                          opacity: isDone ? 0.75 : 1
                                        }}
                                      >
                                        {task.title}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right Action: Update Progress Button */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTask(task, proj)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '4px 10px',
                                        borderRadius: '7px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        backgroundColor: 'var(--accent-primary-light)',
                                        color: 'var(--accent-primary)',
                                        border: '1px solid var(--accent-primary-border)',
                                        cursor: 'pointer',
                                        transition: 'all 0.12s ease'
                                      }}
                                      title="Update task status, progress % and progress notes"
                                    >
                                      <Sliders size={13} />
                                      <span>Update Status & Progress</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Task Detail & Progress Strip */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '0.65rem',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid rgba(241, 245, 249, 0.85)',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {/* Status & Progress % */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 750,
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        textTransform: 'uppercase',
                                        backgroundColor: isDone 
                                          ? 'rgba(16, 185, 129, 0.15)' 
                                          : isInProgress 
                                          ? 'rgba(37, 99, 235, 0.12)' 
                                          : isReview 
                                          ? 'rgba(217, 119, 6, 0.12)' 
                                          : 'rgba(241, 245, 249, 0.85)',
                                        color: isDone 
                                          ? '#059669' 
                                          : isInProgress 
                                          ? '#2563eb' 
                                          : isReview 
                                          ? '#d97706' 
                                          : 'var(--text-dim)',
                                        border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.28)' : isInProgress ? 'rgba(37, 99, 235, 0.28)' : 'var(--border-subtle)'}`
                                      }}
                                    >
                                      {task.status ? task.status.replace('_', ' ') : 'todo'}
                                    </span>

                                    {/* Progress numeric & miniature bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <div style={{ width: '60px', height: '5px', backgroundColor: 'rgba(226, 232, 240, 0.8)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div
                                          style={{
                                            width: `${isDone ? 100 : task.progress_percent || 0}%`,
                                            height: '100%',
                                            backgroundColor: isDone ? '#059669' : '#2563eb',
                                            borderRadius: '999px'
                                          }}
                                        />
                                      </div>
                                      <span style={{ fontSize: '0.725rem', fontWeight: 700, color: isDone ? '#059669' : 'var(--text-muted)' }}>
                                        {isDone ? 100 : task.progress_percent || 0}%
                                      </span>
                                    </div>

                                    {/* User progress note */}
                                    {task.progress_note && (
                                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                                        "{task.progress_note}"
                                      </span>
                                    )}
                                  </div>

                                  {/* Deadlines & Completion Verification */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    {task.due_date && (
                                      <span
                                        style={{
                                          color: isOverdue ? '#dc2626' : 'var(--text-muted)',
                                          fontWeight: isOverdue ? 700 : 500,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.3rem',
                                          backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                          padding: isOverdue ? '2px 7px' : '0',
                                          borderRadius: '6px'
                                        }}
                                      >
                                        <Clock size={12} style={{ color: isOverdue ? '#dc2626' : 'var(--text-dim)' }} />
                                        <span>Due: {task.due_date}{isOverdue ? ' (Overdue)' : ''}</span>
                                      </span>
                                    )}

                                    {isDone && (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          fontSize: '0.7rem',
                                          fontWeight: 700,
                                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                          color: '#059669',
                                          border: '1px solid rgba(16, 185, 129, 0.25)'
                                        }}
                                      >
                                        <Award size={12} />
                                        <span>Completed: {task.completed_at || 'Done'}</span>
                                      </span>
                                    )}
                                  </div>
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

      {/* ── Interactive Modal: Update Task Status & Progress ── */}
      {editingTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setEditingTask(null)}
        >
          <div
            className="glass-card animate-scale-in"
            style={{
              width: '520px',
              maxWidth: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(248, 250, 252, 0.85)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--accent-primary-light)',
                      color: 'var(--accent-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {editingTask.projectCode}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {editingTask.projectName}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Update Task Progress
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTaskProgress} style={{ padding: '1.5rem' }}>
              {/* Task Title banner */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(241, 245, 249, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Deliverable Title
                </div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {editingTask.title}
                </div>
                {editingTask.due_date && (
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} />
                    <span>Scheduled Deadline: {editingTask.due_date}</span>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Current Task Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'todo', label: 'To Do', color: '#64748b' },
                    { id: 'in_progress', label: 'In Progress', color: '#2563eb' },
                    { id: 'review', label: 'Review', color: '#d97706' },
                    { id: 'done', label: 'Completed', color: '#059669' }
                  ].map(st => {
                    const isSelected = updateStatus === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setUpdateStatus(st.id);
                          if (st.id === 'done') setUpdateProgress(100);
                          if (st.id === 'todo' && updateProgress === 100) setUpdateProgress(0);
                        }}
                        style={{
                          padding: '0.65rem 0.5rem',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${st.color}` : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? `${st.color}15` : 'var(--bg-app)',
                          color: isSelected ? st.color : 'var(--text-muted)',
                          fontSize: '0.775rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center'
                        }}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress Slider (0 - 100%) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Progress Percentage
                  </label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: updateStatus === 'done' || updateProgress === 100 ? '#059669' : '#2563eb' }}>
                    {updateStatus === 'done' ? 100 : updateProgress}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={updateStatus === 'done' ? 100 : updateProgress}
                  disabled={updateStatus === 'done'}
                  onChange={(e) => setUpdateProgress(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#2563eb',
                    cursor: updateStatus === 'done' ? 'not-allowed' : 'pointer'
                  }}
                />

                {/* Quick preset buttons */}
                {updateStatus !== 'done' && (
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {[0, 25, 50, 75, 100].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setUpdateProgress(pct);
                          if (pct === 100) setUpdateStatus('done');
                        }}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: updateProgress === pct ? 'var(--accent-primary-light)' : 'transparent',
                          color: updateProgress === pct ? 'var(--accent-primary)' : 'var(--text-dim)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Expected / Actual Completion Date */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  {updateStatus === 'done' ? 'Actual Completion Date' : 'Target / Scheduled Delivery Date'}
                </label>
                <input
                  type="date"
                  value={updateExpectedDate}
                  onChange={(e) => setUpdateExpectedDate(e.target.value)}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Progress Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Deliverable Notes / Status Comment (Optional)
                </label>
                <textarea
                  rows="3"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="e.g. Authentication endpoints wired up, written unit tests, waiting on PR review..."
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProgress}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                >
                  {savingProgress ? 'Syncing...' : 'Save & Notify Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Toast Notification ── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: toastMessage.type === 'error' ? '#ef4444' : '#0f172a',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <span>{typeof toastMessage === 'object' ? toastMessage.text : toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
