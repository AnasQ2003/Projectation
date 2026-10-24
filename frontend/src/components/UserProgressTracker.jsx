import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Activity, 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar,
  CheckSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { getDeadlineInfo } from '../utils/dateUtils';

/**
 * UserProgressTracker — Admin Dashboard Team & User Progress Monitor
 * Displays live progress of registered users, active sprint deliverables,
 * and completion dates vs deadlines.
 */
export default function UserProgressTracker({ onSelectProject, refreshTrigger }) {
  const [usersProgress, setUsersProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL' | 'DONE' | 'IN_PROGRESS'

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getUsersProgress();
      setUsersProgress(data || []);
    } catch (err) {
      console.error('Failed to load user progress:', err);
      setError(err.message || 'Failed to load team progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [refreshTrigger]);

  // Aggregate stats across all users
  const totalUsers = usersProgress.length;
  const totalTasksAssigned = usersProgress.reduce((acc, u) => acc + (u.total_tasks || 0), 0);
  const totalCompleted = usersProgress.reduce((acc, u) => acc + (u.completed_count || 0), 0);
  const totalInProgress = usersProgress.reduce((acc, u) => acc + (u.in_progress_count || 0), 0);
  const teamVelocity = totalTasksAssigned > 0 ? Math.round((totalCompleted / totalTasksAssigned) * 100) : 0;

  // Flatten tasks across all users with user attribution
  const allUserTasks = usersProgress.flatMap(u => {
    const list = u.tasks || [];
    return list.map(t => {
      const isDone = (t.status || '').toLowerCase() === 'done';
      return {
        ...t,
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        userRole: u.role,
        isDone
      };
    });
  });

  // Filter tasks based on search, selectedUserFilter, and statusTab
  const filteredTasks = allUserTasks.filter(task => {
    // User filter
    if (selectedUserFilter !== 'ALL' && String(task.userId) !== String(selectedUserFilter)) {
      return false;
    }

    // Status filter
    if (statusTab === 'DONE' && !task.isDone) return false;
    if (statusTab === 'IN_PROGRESS' && task.isDone) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchProject = (task.project_name || '').toLowerCase().includes(q) || (task.project_code || '').toLowerCase().includes(q);
      const matchAssignee = (task.userName || '').toLowerCase().includes(q);
      const matchNote = (task.progress_note || '').toLowerCase().includes(q);
      return matchTitle || matchProject || matchAssignee || matchNote;
    }

    return true;
  });

  // Calculate timing info for completed tasks
  const getCompletionTimingBadge = (completedAt, dueDate) => {
    if (!completedAt || !dueDate) {
      return {
        label: completedAt ? `Completed: ${completedAt}` : 'Completed',
        isEarly: true,
        bgColor: 'rgba(16, 185, 129, 0.12)',
        color: '#059669',
        border: 'rgba(16, 185, 129, 0.28)'
      };
    }

    const c = new Date(completedAt.split('T')[0]);
    const d = new Date(dueDate.split('T')[0]);
    if (isNaN(c.getTime()) || isNaN(d.getTime())) {
      return {
        label: `Completed: ${completedAt}`,
        isEarly: true,
        bgColor: 'rgba(16, 185, 129, 0.12)',
        color: '#059669',
        border: 'rgba(16, 185, 129, 0.28)'
      };
    }

    const diffDays = Math.round((c.getTime() - d.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        label: `Completed ${absDays} day${absDays === 1 ? '' : 's'} early`,
        isEarly: true,
        bgColor: 'rgba(16, 185, 129, 0.15)',
        color: '#059669',
        border: 'rgba(16, 185, 129, 0.35)'
      };
    } else if (diffDays === 0) {
      return {
        label: 'Completed on deadline day',
        isEarly: true,
        bgColor: 'rgba(16, 185, 129, 0.12)',
        color: '#059669',
        border: 'rgba(16, 185, 129, 0.28)'
      };
    } else {
      return {
        label: `Completed ${diffDays} day${diffDays === 1 ? '' : 's'} late`,
        isEarly: false,
        bgColor: 'rgba(239, 68, 68, 0.12)',
        color: '#dc2626',
        border: 'rgba(239, 68, 68, 0.3)'
      };
    }
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {/* 4 Summary Cards */}
      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        {/* Card 1: Active Contributors */}
        <div className="glass-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Contributors
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {totalUsers}
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              Registered team members
            </span>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '11px',
            backgroundColor: 'var(--accent-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
          }}>
            <Users size={20} />
          </div>
        </div>

        {/* Card 2: Tasks Completed */}
        <div className="glass-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tasks Completed
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
              {totalCompleted} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-dim)' }}>/ {totalTasksAssigned}</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 600 }}>
              With verified completion dates
            </span>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '11px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
          }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Card 3: Active Working Tasks */}
        <div className="glass-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Progress Deliverables
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
              {totalInProgress}
            </div>
            <span style={{ fontSize: '0.725rem', color: '#2563eb', fontWeight: 600 }}>
              Users actively working now
            </span>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '11px',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
          }}>
            <Activity size={20} />
          </div>
        </div>

        {/* Card 4: Team Sprint Velocity */}
        <div className="glass-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sprint Velocity
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {teamVelocity}%
            </div>
            <span style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 600 }}>
              Overall completion rate
            </span>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '11px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
          }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Section 1: Registered Users Progress Grid */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
              Registered Team Members & Velocity
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Select any contributor below to filter their assigned sprint tasks and deadline delivery
            </p>
          </div>

          {selectedUserFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedUserFilter('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                background: 'var(--accent-primary-light)',
                border: '1px solid var(--accent-primary-border)',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={12} />
              <span>Show All Contributors</span>
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {usersProgress.map(u => {
            const isSelected = String(selectedUserFilter) === String(u.id);

            return (
              <div
                key={u.id}
                onClick={() => setSelectedUserFilter(prev => String(prev) === String(u.id) ? 'ALL' : String(u.id))}
                className="glass-card stat-card-clickable"
                style={{
                  padding: '1.25rem',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(239, 246, 255, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                  boxShadow: isSelected ? '0 8px 24px rgba(37, 99, 235, 0.15)' : '0 2px 8px rgba(15, 23, 42, 0.03)',
                  transition: 'all 0.18s ease'
                }}
              >
                {/* User Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 800,
                        boxShadow: '0 3px 8px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {u.email || `@${u.username}`}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--accent-primary-border)'
                    }}
                  >
                    {u.role || 'Contributor'}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Completion Velocity</span>
                    <span style={{ color: u.completion_rate >= 75 ? '#059669' : u.completion_rate >= 40 ? '#2563eb' : '#d97706' }}>
                      {u.completion_rate}%
                    </span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: 'rgba(226, 232, 240, 0.8)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${u.completion_rate}%`,
                        background: u.completion_rate >= 75 
                          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                          : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Metrics Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#059669',
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {u.completed_count || 0} Done
                  </span>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563eb',
                      border: '1px solid rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {u.in_progress_count || 0} In Progress
                  </span>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(241, 245, 249, 0.8)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {u.todo_count || 0} Todo
                  </span>

                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto', fontWeight: 600 }}>
                    {u.total_tasks} task{u.total_tasks === 1 ? '' : 's'} total
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Tasks & Deadline Delivery Audit */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        {/* Controls Toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
              Deliverables & Deadline Completion Audit
            </h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Track what tasks users completed, the exact completion date vs deadline, and live work in progress
            </p>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Status Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-muted)', padding: '3px', borderRadius: '8px' }}>
              <button
                onClick={() => setStatusTab('ALL')}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: statusTab === 'ALL' ? 700 : 500,
                  backgroundColor: statusTab === 'ALL' ? '#ffffff' : 'transparent',
                  color: statusTab === 'ALL' ? 'var(--text-main)' : 'var(--text-muted)',
                  border: 'none',
                  boxShadow: statusTab === 'ALL' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                All Tasks
              </button>
              <button
                onClick={() => setStatusTab('DONE')}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: statusTab === 'DONE' ? 700 : 500,
                  backgroundColor: statusTab === 'DONE' ? '#ffffff' : 'transparent',
                  color: statusTab === 'DONE' ? '#059669' : 'var(--text-muted)',
                  border: 'none',
                  boxShadow: statusTab === 'DONE' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Completed & Deadlines
              </button>
              <button
                onClick={() => setStatusTab('IN_PROGRESS')}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: statusTab === 'IN_PROGRESS' ? 700 : 500,
                  backgroundColor: statusTab === 'IN_PROGRESS' ? '#ffffff' : 'transparent',
                  color: statusTab === 'IN_PROGRESS' ? '#2563eb' : 'var(--text-muted)',
                  border: 'none',
                  boxShadow: statusTab === 'IN_PROGRESS' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Live Working On
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search tasks, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '32px',
                  paddingLeft: '2rem',
                  paddingRight: '0.65rem',
                  fontSize: '0.775rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* Task Cards / Table List */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading deliverables & completion audit data...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <CheckSquare size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              No tasks match the active filters
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Try clearing your search query or selecting a different user/status filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTasks.map((t) => {
              const isDone = t.isDone;
              const timingBadge = isDone ? getCompletionTimingBadge(t.completed_at, t.due_date) : null;
              const deadlineInfo = !isDone ? getDeadlineInfo(t.due_date) : null;

              return (
                <div
                  key={`${t.id}-${t.userId}`}
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: isDone ? 'rgba(240, 253, 244, 0.45)' : '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary-border)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.02)';
                  }}
                >
                  {/* Top Row: Task & Project info + User attribution */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                          color: isDone ? '#059669' : '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {isDone ? <CheckCircle2 size={16} /> : <Activity size={16} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(241, 245, 249, 0.9)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            {t.project_code || 'PROJ'}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                            {t.project_name || 'Project Workspace'}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', fontWeight: 750, color: 'var(--text-main)', margin: '0 0 0.25rem 0', letterSpacing: '-0.01em' }}>
                          {t.title}
                        </h4>

                        {t.description && (
                          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0, maxWidth: '650px', lineHeight: 1.4 }}>
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contributor Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: 'rgba(241, 245, 249, 0.85)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-primary)',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {t.userName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {t.userName}
                        </span>
                      </div>

                      {t.project_id && onSelectProject && (
                        <button
                          onClick={() => onSelectProject(t.project_id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '0.725rem',
                            color: 'var(--accent-primary)',
                            background: 'none',
                            border: 'none',
                            padding: '4px 6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="View project workspace"
                        >
                          <span>Project</span>
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Status, Progress Slider/Bar, Note, and Deadline Verification */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid rgba(241, 245, 249, 0.9)'
                    }}
                  >
                    {/* Status badge & Progress note */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 750,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          backgroundColor: isDone 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : t.status === 'in_progress' 
                            ? 'rgba(37, 99, 235, 0.12)' 
                            : 'rgba(241, 245, 249, 0.85)',
                          color: isDone 
                            ? '#059669' 
                            : t.status === 'in_progress' 
                            ? '#2563eb' 
                            : 'var(--text-dim)',
                          border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.28)' : t.status === 'in_progress' ? 'rgba(37, 99, 235, 0.28)' : 'var(--border-subtle)'}`
                        }}
                      >
                        {t.status ? t.status.replace('_', ' ') : 'todo'}
                      </span>

                      {/* Progress Bar & percentage */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: '140px' }}>
                        <div style={{ width: '80px', height: '6px', backgroundColor: 'rgba(226, 232, 240, 0.8)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${isDone ? 100 : t.progress_percent || 0}%`,
                              height: '100%',
                              backgroundColor: isDone ? '#059669' : '#2563eb',
                              borderRadius: '999px'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, color: isDone ? '#059669' : 'var(--text-muted)' }}>
                          {isDone ? 100 : t.progress_percent || 0}%
                        </span>
                      </div>

                      {/* User's Progress Note */}
                      {t.progress_note && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                            backgroundColor: 'rgba(248, 250, 252, 0.8)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          "{t.progress_note}"
                        </div>
                      )}
                    </div>

                    {/* Deadline & Completion Date Audit Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      {/* Scheduled Target Deadline */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={13} style={{ color: 'var(--text-dim)' }} />
                        <span>Deadline: <strong>{t.due_date || 'N/A'}</strong></span>
                      </div>

                      {/* Verification Badge */}
                      {isDone ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '3px 10px',
                            borderRadius: '8px',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            backgroundColor: timingBadge?.bgColor,
                            color: timingBadge?.color,
                            border: `1px solid ${timingBadge?.border}`
                          }}
                        >
                          <Award size={13} />
                          <span>{timingBadge?.label}</span>
                          {t.completed_at && (
                            <span style={{ opacity: 0.85, fontWeight: 600 }}>({t.completed_at})</span>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: deadlineInfo?.status === 'overdue' 
                              ? 'rgba(239, 68, 68, 0.12)' 
                              : deadlineInfo?.status === 'urgent' 
                              ? 'rgba(217, 119, 6, 0.12)' 
                              : 'rgba(241, 245, 249, 0.8)',
                            color: deadlineInfo?.status === 'overdue' 
                              ? '#dc2626' 
                              : deadlineInfo?.status === 'urgent' 
                              ? '#d97706' 
                              : 'var(--text-muted)',
                            border: `1px solid ${deadlineInfo?.status === 'overdue' ? 'rgba(239, 68, 68, 0.28)' : 'var(--border-subtle)'}`
                          }}
                        >
                          <Calendar size={12} />
                          <span>{deadlineInfo?.label || 'In Sprint Cycle'}</span>
                        </div>
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
  );
}
