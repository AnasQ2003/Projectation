import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Target, 
  TrendingUp, 
  PieChart, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckSquare
} from 'lucide-react';

const STATUS_CONFIG = {
  done: { 
    fill: '#059669', 
    label: 'Done', 
    light: 'rgba(5, 150, 105, 0.1)', 
    border: 'rgba(5, 150, 105, 0.25)',
    textColor: '#047857'
  },
  in_progress: { 
    fill: '#2563eb', 
    label: 'In Progress', 
    light: 'rgba(37, 99, 235, 0.1)', 
    border: 'rgba(37, 99, 235, 0.25)',
    textColor: '#1d4ed8'
  },
  review: { 
    fill: '#d97706', 
    label: 'In Review', 
    light: 'rgba(217, 119, 6, 0.1)', 
    border: 'rgba(217, 119, 6, 0.25)',
    textColor: '#b45309'
  },
  todo: { 
    fill: '#64748b', 
    label: 'To Do', 
    light: 'rgba(100, 116, 139, 0.1)', 
    border: 'rgba(100, 116, 139, 0.25)',
    textColor: '#475569'
  },
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.25)' },
  high: { label: 'High', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', border: 'rgba(234, 88, 12, 0.25)' },
  medium: { label: 'Medium', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.25)' },
  low: { label: 'Low', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.25)' }
};

function normalizeStatus(raw) {
  if (!raw) return 'todo';
  const s = String(raw).toLowerCase().trim().replace(/[-\s]+/g, '_');
  if (s === 'done' || s === 'completed' || s === 'complete') return 'done';
  if (s === 'in_progress' || s === 'inprogress' || s === 'active' || s === 'doing') return 'in_progress';
  if (s === 'review' || s === 'in_review') return 'review';
  return 'todo';
}

/**
 * High-res SVG Radial Donut Chart
 */
function SVGDonut({ done = 0, in_progress = 0, review = 0, todo = 0, size = 110, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  const total = Math.max(done + in_progress + review + todo, 1);

  const segments = [
    { key: 'done', count: done },
    { key: 'in_progress', count: in_progress },
    { key: 'review', count: review },
    { key: 'todo', count: todo },
  ];

  let offset = 0;
  const arcs = segments.map(seg => {
    const fraction = seg.count / total;
    const dashLen = fraction * circumference;
    const arc = { ...seg, dashLen, dashOffset: -offset * circumference };
    offset += fraction;
    return arc;
  });

  const pct = Math.round((done / total) * 100);
  const pctColor = pct >= 80 ? '#059669' : pct >= 40 ? '#2563eb' : '#64748b';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>
        <circle 
          cx={cx} 
          cy={cy} 
          r={radius} 
          fill="none" 
          stroke="rgba(226, 232, 240, 0.85)" 
          strokeWidth={strokeWidth} 
        />
        {arcs.map(arc => arc.dashLen > 0.4 ? (
          <circle 
            key={arc.key} 
            cx={cx} 
            cy={cy} 
            r={radius} 
            fill="none"
            stroke={STATUS_CONFIG[arc.key]?.fill || '#94a3b8'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dashLen} ${circumference}`}
            strokeDashoffset={arc.dashOffset}
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease' }}
          />
        ) : null)}
      </svg>
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        pointerEvents: 'none'
      }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: pctColor, lineHeight: 1 }}>
          {pct}%
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 700, marginTop: '2px' }}>
          Done
        </span>
      </div>
    </div>
  );
}

/**
 * Linear Progress Bar
 */
function LinearBar({ value = 0, color = '#2563eb', height = 7 }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div style={{ 
      width: '100%', 
      height, 
      borderRadius: height / 2, 
      backgroundColor: 'rgba(226, 232, 240, 0.8)', 
      overflow: 'hidden' 
    }}>
      <div style={{ 
        width: `${clamped}%`, 
        height: '100%', 
        borderRadius: height / 2, 
        background: `linear-gradient(90deg, ${color}dd, ${color})`,
        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
      }} />
    </div>
  );
}

/**
 * ProjectMemberAnalyticsGraph Component
 * Renders inside ProjectDetail.jsx to show:
 * 1. Project Velocity Donut & Status Breakdown
 * 2. Each Member's Progress, Deliverables, and Completion %
 * 3. Priority Breakdown
 */
export default function ProjectMemberAnalyticsGraph({ 
  project, 
  tasks = [], 
  members = [],
  onSelectMemberFilter
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState('ALL');

  // Compute status breakdown
  const statusStats = useMemo(() => {
    let done = 0;
    let in_progress = 0;
    let review = 0;
    let todo = 0;

    tasks.forEach(t => {
      const st = normalizeStatus(t.status);
      if (st === 'done') done++;
      else if (st === 'in_progress') in_progress++;
      else if (st === 'review') review++;
      else todo++;
    });

    const total = tasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    return { done, in_progress, review, todo, total, progress };
  }, [tasks]);

  // Compute priority breakdown
  const priorityStats = useMemo(() => {
    let urgent = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    tasks.forEach(t => {
      const p = (t.priority || 'medium').toLowerCase();
      if (p === 'urgent') urgent++;
      else if (p === 'high') high++;
      else if (p === 'low') low++;
      else medium++;
    });

    return { urgent, high, medium, low };
  }, [tasks]);

  // Compute each member's personal progress & deliverables
  const memberWorkload = useMemo(() => {
    const memberMap = new Map();

    // Initialize all assigned team members
    members.forEach(m => {
      const normalizedName = (m.name || '').trim();
      memberMap.set(normalizedName.toLowerCase(), {
        member: m,
        name: m.name,
        role: m.role || 'Contributor',
        email: m.email || '',
        tasks: [],
        done: 0,
        in_progress: 0,
        review: 0,
        todo: 0,
        total: 0
      });
    });

    // Bucket tasks to members
    const unassignedTasks = [];

    tasks.forEach(t => {
      const assigneeName = (t.assignee || '').trim();
      const key = assigneeName.toLowerCase();
      const memberEntry = memberMap.get(key);

      if (memberEntry) {
        memberEntry.tasks.push(t);
        memberEntry.total++;
        const st = normalizeStatus(t.status);
        if (st === 'done') memberEntry.done++;
        else if (st === 'in_progress') memberEntry.in_progress++;
        else if (st === 'review') memberEntry.review++;
        else memberEntry.todo++;
      } else {
        unassignedTasks.push(t);
      }
    });

    const list = Array.from(memberMap.values()).map(m => {
      const progress = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
      return {
        ...m,
        progress
      };
    });

    // Sort by task count descending
    list.sort((a, b) => b.total - a.total);

    return {
      membersList: list,
      unassignedTasks
    };
  }, [members, tasks]);

  if (!project) return null;

  return (
    <div className="glass-card" style={{ 
      borderRadius: '16px', 
      padding: '1.25rem 1.5rem', 
      marginBottom: '1.5rem',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
      border: '1px solid rgba(226, 232, 240, 0.95)',
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.04)'
    }}>
      
      {/* ── Header Row with Collapse Toggle ── */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '0.85rem',
        paddingBottom: collapsed ? '0' : '1rem',
        borderBottom: collapsed ? 'none' : '1px solid rgba(226, 232, 240, 0.85)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
          }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Project Velocity & Team Member Progress Graph
              </h3>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: '6px', 
                backgroundColor: 'rgba(5, 150, 105, 0.1)', 
                color: '#059669',
                border: '1px solid rgba(5, 150, 105, 0.2)',
                textTransform: 'uppercase'
              }}>
                Live Analytics
              </span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '2px 0 0' }}>
              Individual member deliverable velocity, completion rates, and task stage distribution
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', backgroundColor: 'rgba(5,150,105,0.08)', padding: '3px 10px', borderRadius: '20px' }}>
            {statusStats.progress}% Completed
          </span>

          <button
            type="button"
            onClick={() => setCollapsed(prev => !prev)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(241, 245, 249, 0.85)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              color: 'var(--text-main)',
              fontSize: '0.725rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <span>{collapsed ? 'Expand Graph' : 'Collapse'}</span>
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ marginTop: '1.25rem', animation: 'fadeIn 0.25s ease' }}>
          
          {/* ── Top Metrics Grid: Status Donut + Priority Mix ── */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.25rem' 
          }}>
            
            {/* Box 1: Radial Donut & Status Breakdown */}
            <div style={{ 
              padding: '1.15rem', 
              borderRadius: '13px', 
              backgroundColor: '#ffffff', 
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <PieChart size={15} color="#2563eb" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Task Stage Distribution
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {statusStats.total} total tasks
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <SVGDonut 
                  done={statusStats.done} 
                  in_progress={statusStats.in_progress} 
                  review={statusStats.review} 
                  todo={statusStats.todo} 
                  size={95} 
                  strokeWidth={12} 
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {[
                    { key: 'done', count: statusStats.done },
                    { key: 'in_progress', count: statusStats.in_progress },
                    { key: 'review', count: statusStats.review },
                    { key: 'todo', count: statusStats.todo },
                  ].map(item => {
                    const cfg = STATUS_CONFIG[item.key];
                    const pct = statusStats.total > 0 ? Math.round((item.count / statusStats.total) * 100) : 0;
                    return (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.fill }} />
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: cfg.fill }}>
                            {item.count}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', width: '30px', textAlign: 'right' }}>
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Box 2: Task Priority Matrix */}
            <div style={{ 
              padding: '1.15rem', 
              borderRadius: '13px', 
              backgroundColor: '#ffffff', 
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Award size={15} color="#d97706" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Task Priority Balance
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Workload Urgency
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
                {[
                  { key: 'urgent', count: priorityStats.urgent },
                  { key: 'high', count: priorityStats.high },
                  { key: 'medium', count: priorityStats.medium },
                  { key: 'low', count: priorityStats.low },
                ].map(item => {
                  const cfg = PRIORITY_CONFIG[item.key];
                  return (
                    <div 
                      key={item.key} 
                      style={{ 
                        padding: '0.55rem 0.4rem', 
                        borderRadius: '8px', 
                        backgroundColor: cfg.bg, 
                        border: `1px solid ${cfg.border}`,
                        textAlign: 'center' 
                      }}
                    >
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase' }}>
                        {cfg.label}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: cfg.color, marginTop: '2px' }}>
                        {item.count}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Toward Milestone */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Sprint Velocity</span>
                  <span style={{ fontWeight: 800, color: '#059669' }}>{statusStats.done} of {statusStats.total} Completed</span>
                </div>
                <LinearBar value={statusStats.progress} color="#059669" height={7} />
              </div>
            </div>
          </div>

          {/* ── Section: EACH MEMBER PROGRESS & WORKLOAD (Requested!) ── */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '13px', 
            border: '1px solid rgba(226, 232, 240, 0.85)',
            padding: '1.15rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} color="#2563eb" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Assigned Team Members Progress & Velocity ({memberWorkload.membersList.length})
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Track deliverables and task completion rate per engineer
              </span>
            </div>

            {/* Members Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {memberWorkload.membersList.map((m, idx) => {
                const isComplete = m.total > 0 && m.done === m.total;
                const progressColor = isComplete ? '#059669' : m.progress >= 50 ? '#2563eb' : '#d97706';

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.95rem 1.05rem',
                      borderRadius: '11px',
                      backgroundColor: 'rgba(248, 250, 252, 0.75)',
                      border: '1px solid rgba(226, 232, 240, 0.85)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(248, 250, 252, 0.75)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Member Info Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
                        }}>
                          {(m.name || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {m.role}
                          </div>
                        </div>
                      </div>

                      {/* Velocity Badge */}
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        padding: '2px 7px', 
                        borderRadius: '5px', 
                        backgroundColor: isComplete ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)', 
                        color: isComplete ? '#059669' : '#2563eb',
                        border: `1px solid ${isComplete ? 'rgba(5,150,105,0.2)' : 'rgba(37,99,235,0.2)'}`
                      }}>
                        {m.total === 0 ? 'No tasks' : isComplete ? '✓ 100% Done' : `${m.progress}% Velocity`}
                      </span>
                    </div>

                    {/* Member Progress Bar */}
                    <div style={{ marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Deliverable Progress</span>
                        <span style={{ fontWeight: 800, color: progressColor }}>
                          {m.done}/{m.total} completed
                        </span>
                      </div>
                      <LinearBar value={m.progress} color={progressColor} height={6} />
                    </div>

                    {/* Task Status Breakdown Chips */}
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: STATUS_CONFIG.done.light, color: STATUS_CONFIG.done.fill }}>
                        ✓ {m.done} Done
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: STATUS_CONFIG.in_progress.light, color: STATUS_CONFIG.in_progress.fill }}>
                        ▶ {m.in_progress} Active
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: STATUS_CONFIG.review.light, color: STATUS_CONFIG.review.fill }}>
                        ◈ {m.review} Review
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: STATUS_CONFIG.todo.light, color: STATUS_CONFIG.todo.fill }}>
                        ○ {m.todo} To Do
                      </span>
                    </div>
                  </div>
                );
              })}

              {memberWorkload.membersList.length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  No team members assigned to this project workspace yet.
                </div>
              )}
            </div>

            {/* Unassigned Tasks Alert (if any) */}
            {memberWorkload.unassignedTasks.length > 0 && (
              <div style={{ 
                marginTop: '0.85rem', 
                padding: '0.65rem 0.95rem', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(234, 88, 12, 0.08)', 
                border: '1px solid rgba(234, 88, 12, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#c2410c', fontWeight: 700 }}>
                  <AlertCircle size={14} />
                  <span>{memberWorkload.unassignedTasks.length} unassigned tasks pending delegation</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  Assign to an engineer from the Sprint Board below
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
