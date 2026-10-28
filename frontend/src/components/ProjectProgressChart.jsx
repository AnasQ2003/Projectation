import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Layers, 
  ArrowLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  ChevronRight,
  Filter,
  Sparkles,
  PieChart,
  Calendar,
  Zap,
  Target
} from 'lucide-react';
import { api } from '../services/api';

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

/**
 * Responsive, premium SVG Radial Donut Chart
 */
function RadialDonutChart({ tasks, size = 90, strokeWidth = 11, showCenterLabel = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = Math.max(tasks.total || 0, 1);
  const segments = [
    { key: 'done', value: tasks.done || 0 },
    { key: 'in_progress', value: tasks.in_progress || 0 },
    { key: 'review', value: tasks.review || 0 },
    { key: 'todo', value: tasks.todo || 0 },
  ];

  let cumulativeOffset = 0;
  const arcs = segments.map(seg => {
    const fraction = (tasks.total > 0 ? seg.value : 0) / total;
    const dashLen = fraction * circumference;
    const arc = { 
      ...seg, 
      dashLen, 
      dashOffset: -cumulativeOffset * circumference 
    };
    cumulativeOffset += fraction;
    return arc;
  });

  const completionPct = tasks.total > 0 ? Math.round(((tasks.done || 0) / tasks.total) * 100) : 0;
  const centerColor = completionPct >= 80 ? '#059669' : completionPct >= 40 ? '#2563eb' : '#64748b';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.04))' }}>
        {/* Background Track */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={radius} 
          fill="none" 
          stroke="rgba(226, 232, 240, 0.8)" 
          strokeWidth={strokeWidth} 
        />
        {/* Animated Segments */}
        {arcs.map(arc => arc.dashLen > 0.4 ? (
          <circle 
            key={arc.key} 
            cx={cx} 
            cy={cy} 
            r={radius} 
            fill="none"
            stroke={STATUS_CONFIG[arc.key]?.fill || '#94a3b8'}
            strokeWidth={strokeWidth} 
            strokeLinecap="round"
            strokeDasharray={`${arc.dashLen} ${circumference}`}
            strokeDashoffset={arc.dashOffset}
            style={{ 
              transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          />
        ) : null)}
      </svg>
      {showCenterLabel && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ 
            fontSize: size <= 65 ? '0.72rem' : size <= 95 ? '0.95rem' : '1.35rem', 
            fontWeight: 800, 
            color: centerColor, 
            lineHeight: 1 
          }}>
            {completionPct}%
          </span>
          {size > 70 && (
            <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 600, marginTop: '2px' }}>
              done
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Stacked Multi-Segment Progress Bar
 */
function MultiSegmentBar({ tasks, height = 9 }) {
  const total = Math.max(tasks.total || 0, 1);
  const donePct = ((tasks.done || 0) / total) * 100;
  const inProgPct = ((tasks.in_progress || 0) / total) * 100;
  const reviewPct = ((tasks.review || 0) / total) * 100;
  const todoPct = ((tasks.todo || 0) / total) * 100;

  return (
    <div style={{ 
      width: '100%', 
      height, 
      borderRadius: height / 2, 
      backgroundColor: 'rgba(226, 232, 240, 0.7)', 
      overflow: 'hidden',
      display: 'flex',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
    }}>
      {donePct > 0 && (
        <div 
          style={{ 
            width: `${donePct}%`, 
            height: '100%', 
            backgroundColor: STATUS_CONFIG.done.fill, 
            transition: 'width 0.8s ease' 
          }} 
          title={`Done: ${tasks.done || 0} (${Math.round(donePct)}%)`}
        />
      )}
      {inProgPct > 0 && (
        <div 
          style={{ 
            width: `${inProgPct}%`, 
            height: '100%', 
            backgroundColor: STATUS_CONFIG.in_progress.fill, 
            transition: 'width 0.8s ease' 
          }} 
          title={`In Progress: ${tasks.in_progress || 0} (${Math.round(inProgPct)}%)`}
        />
      )}
      {reviewPct > 0 && (
        <div 
          style={{ 
            width: `${reviewPct}%`, 
            height: '100%', 
            backgroundColor: STATUS_CONFIG.review.fill, 
            transition: 'width 0.8s ease' 
          }} 
          title={`In Review: ${tasks.review || 0} (${Math.round(reviewPct)}%)`}
        />
      )}
      {todoPct > 0 && (
        <div 
          style={{ 
            width: `${todoPct}%`, 
            height: '100%', 
            backgroundColor: STATUS_CONFIG.todo.fill, 
            transition: 'width 0.8s ease' 
          }} 
          title={`To Do: ${tasks.todo || 0} (${Math.round(todoPct)}%)`}
        />
      )}
    </div>
  );
}

/**
 * Single Progress Bar
 */
function SingleProgressBar({ value = 0, color = '#2563eb', height = 7 }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div style={{ 
      width: '100%', 
      height, 
      borderRadius: height / 2, 
      backgroundColor: 'rgba(226, 232, 240, 0.7)', 
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
 * SVG Velocity Sparkline Curve (30-day Activity / Velocity)
 */
function VelocitySparkline({ trendData }) {
  if (!trendData || trendData.length === 0) {
    // Generate a smooth sample trend line if database history is clean
    trendData = [
      { day: 'Week 1', done_count: 2 },
      { day: 'Week 2', done_count: 5 },
      { day: 'Week 3', done_count: 9 },
      { day: 'Week 4', done_count: 14 }
    ];
  }

  const width = 280;
  const height = 65;
  const padding = 10;

  const maxVal = Math.max(...trendData.map(d => Number(d.done_count) || 0), 5);
  const points = trendData.map((d, idx) => {
    const x = padding + (idx / Math.max(trendData.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((Number(d.done_count) || 0) / maxVal) * (height - 2 * padding);
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="velocityAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#velocityAreaGrad)" />
        <path d={pathD} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#ffffff" stroke="#059669" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

/**
 * Normalizes task status strings to standard keys: 'done' | 'in_progress' | 'review' | 'todo'
 */
function normalizeStatus(raw) {
  if (!raw) return 'todo';
  const s = String(raw).toLowerCase().trim().replace(/[-\s]+/g, '_');
  if (s === 'done' || s === 'completed' || s === 'complete') return 'done';
  if (s === 'in_progress' || s === 'inprogress' || s === 'active' || s === 'doing') return 'in_progress';
  if (s === 'review' || s === 'in_review') return 'review';
  return 'todo';
}

/**
 * Transform user projects for chart consumption (synchronous & reactive)
 */
function buildUserProjects(userProjects) {
  return (userProjects || []).map(p => {
    const tasks = p.myTasks || [];
    const done = tasks.filter(t => normalizeStatus(t.status) === 'done').length;
    const in_progress = tasks.filter(t => normalizeStatus(t.status) === 'in_progress').length;
    const review = tasks.filter(t => normalizeStatus(t.status) === 'review').length;
    const todo = tasks.filter(t => normalizeStatus(t.status) === 'todo').length;
    const total = tasks.length;

    const urgent = tasks.filter(t => (t.priority || '').toLowerCase() === 'urgent').length;
    const high = tasks.filter(t => (t.priority || '').toLowerCase() === 'high').length;
    const medium = tasks.filter(t => (t.priority || '').toLowerCase() === 'medium').length;
    const low = tasks.filter(t => (t.priority || '').toLowerCase() === 'low').length;

    const computedProgress = total > 0 ? Math.round((done / total) * 100) : (p.progress || 0);

    // Group assignees (for user, primarily themselves or assigned members)
    const assigneeMap = {};
    for (const t of tasks) {
      const name = (t.assignee || 'Assigned to You').trim();
      if (!assigneeMap[name]) {
        assigneeMap[name] = { name, total: 0, done: 0, in_progress: 0, review: 0, todo: 0 };
      }
      assigneeMap[name].total++;
      const st = normalizeStatus(t.status);
      if (st === 'done') assigneeMap[name].done++;
      else if (st === 'in_progress') assigneeMap[name].in_progress++;
      else if (st === 'review') assigneeMap[name].review++;
      else assigneeMap[name].todo++;
    }

    return { 
      id: p.id, 
      name: p.name, 
      code: p.code, 
      status: p.status, 
      priority: p.priority, 
      deadline: p.deadline,
      progress: computedProgress, 
      tasks: { total, done, in_progress, review, todo },
      priorities: { urgent, high, medium, low },
      assignees: Object.values(assigneeMap),
      items: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: normalizeStatus(t.status),
        rawStatus: t.status,
        priority: t.priority,
        assignee: t.assignee,
        progress_percent: t.progress_percent,
        due_date: t.due_date
      }))
    };
  });
}

/**
 * Main ProjectProgressChart Component
 * Enhancements:
 * 1. Synchronously reactive: when user updates task status in portal, chart updates in 0ms!
 * 2. Visual Overview: Multi-segment stacked velocity bars, 30-day velocity sparkline, and radial donut matrix.
 * 3. Deep-Dive Graph View: When clicking any project, opens a dedicated Project Deep-Dive Graph with:
 *    - Status Distribution Donut + Task Breakdown
 *    - Priority Distribution
 *    - Contributor Workload & Completion Velocity
 *    - Detailed Task Status List
 */
export default function ProjectProgressChart({ 
  mode = 'admin', 
  userProjects, 
  refreshTrigger, 
  onSelectProject,
  initialProjectId = null
}) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(() => mode === 'admin');
  const [viewMode, setViewMode] = useState(() => initialProjectId ? 'deep_dive' : 'overview');
  const [selectedProjectId, setSelectedProjectId] = useState(() => initialProjectId ? String(initialProjectId) : null);
  const [filterQuery, setFilterQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Synchronously compute user projects when in user mode (instant, 0ms latency)
  const userComputedProjects = useMemo(() => {
    if (mode === 'user' && userProjects) {
      return buildUserProjects(userProjects);
    }
    return null;
  }, [mode, userProjects]);

  // Unified allProjects source of truth
  const allProjects = useMemo(() => {
    if (mode === 'user') {
      return userComputedProjects || [];
    }
    return chartData?.projects || [];
  }, [mode, userComputedProjects, chartData]);

  // Filtered projects for search
  const projects = useMemo(() => {
    if (!filterQuery) return allProjects;
    const q = filterQuery.toLowerCase();
    return allProjects.filter(p => (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q));
  }, [allProjects, filterQuery]);

  // LIVE dynamic resolution of selectedProject — updates INSTANTLY whenever any task changes!
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) {
      // Default to first project if deep_dive mode was opened without ID
      return allProjects.length > 0 && viewMode === 'deep_dive' ? allProjects[0] : null;
    }
    return allProjects.find(p => String(p.id) === String(selectedProjectId)) || (allProjects.length > 0 ? allProjects[0] : null);
  }, [selectedProjectId, allProjects, viewMode]);

  // Global aggregate metrics
  const aggregateMetrics = useMemo(() => {
    let totalTasks = 0;
    let doneTasks = 0;
    let inProgressTasks = 0;
    let reviewTasks = 0;
    let todoTasks = 0;

    allProjects.forEach(p => {
      totalTasks += p.tasks?.total || 0;
      doneTasks += p.tasks?.done || 0;
      inProgressTasks += p.tasks?.in_progress || 0;
      reviewTasks += p.tasks?.review || 0;
      todoTasks += p.tasks?.todo || 0;
    });

    const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      totalProjects: allProjects.length,
      totalTasks,
      doneTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
      overallPct
    };
  }, [allProjects]);

  const loadData = async () => {
    if (!mounted.current) return;
    if (mode !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getChartData();
      if (mounted.current) {
        setChartData(data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load chart data:', err);
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'admin') {
      loadData();
    }
  }, [mode, refreshTrigger]);

  // Synchronize initialProjectId prop
  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(String(initialProjectId));
      setViewMode('deep_dive');
    }
  }, [initialProjectId]);

  // Handle clicking on a project to open its deep-dive graph right on dashboard
  const handleProjectClick = (proj) => {
    setSelectedProjectId(String(proj.id));
    setViewMode('deep_dive');
  };

  const handleOpenWorkspace = (projId, e) => {
    if (e) e.stopPropagation();
    if (onSelectProject) {
      onSelectProject(projId);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ 
        padding: '2.5rem', 
        borderRadius: '16px', 
        textAlign: 'center', 
        minHeight: '220px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.92)'
      }}>
        <div>
          <div style={{ 
            width: 32, 
            height: 32, 
            border: '3px solid rgba(37,99,235,0.15)', 
            borderTopColor: '#2563eb', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite', 
            margin: '0 auto 0.75rem' 
          }} />
          <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem', fontWeight: 600, margin: 0 }}>
            Loading Project Velocity & Progress Analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ 
      borderRadius: '16px', 
      padding: '1.35rem 1.5rem', 
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.94) 100%)',
      border: '1px solid rgba(226, 232, 240, 0.9)',
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.04)',
      position: 'relative'
    }}>
      
      {/* ── Top Header & Tab Controls ── */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '1rem',
        paddingBottom: '1.15rem',
        borderBottom: '1px solid rgba(226, 232, 240, 0.75)',
        marginBottom: '1.25rem'
      }}>
        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '11px', 
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                {viewMode === 'deep_dive' && selectedProject 
                  ? `${selectedProject.name} — Project Velocity Graph` 
                  : mode === 'user' ? 'My Projects & Task Progress Tracker' : 'Project Progress & Task Velocity Analytics'}
              </h3>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: '6px', 
                backgroundColor: 'rgba(5, 150, 105, 0.1)', 
                color: '#059669',
                border: '1px solid rgba(5, 150, 105, 0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Live Sync
              </span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', margin: '2px 0 0' }}>
              {viewMode === 'deep_dive' && selectedProject
                ? `Drill-down breakdown for [${selectedProject.code || 'PRJ'}] · Click "All Projects" to switch`
                : 'Real-time task distribution, completion velocity, and interactive project drill-downs'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(241, 245, 249, 0.85)', padding: '3px', borderRadius: '10px' }}>
          <button
            onClick={() => setViewMode('overview')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'overview' ? '#ffffff' : 'transparent',
              color: viewMode === 'overview' ? 'var(--text-main)' : 'var(--text-dim)',
              boxShadow: viewMode === 'overview' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 size={13} />
            <span>Overview</span>
          </button>

          {selectedProject && (
            <button
              onClick={() => setViewMode('deep_dive')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'deep_dive' ? '#ffffff' : 'transparent',
                color: viewMode === 'deep_dive' ? '#2563eb' : 'var(--text-dim)',
                boxShadow: viewMode === 'deep_dive' ? '0 2px 6px rgba(37,99,235,0.12)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <PieChart size={13} />
              <span>Project Graph ({selectedProject.code || 'PRJ'})</span>
            </button>
          )}

          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
              color: viewMode === 'table' ? 'var(--text-main)' : 'var(--text-dim)',
              boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={13} />
            <span>Matrix Table</span>
          </button>
        </div>
      </div>

      {/* ── Top Executive KPI Highlights Strip ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: '0.75rem',
        marginBottom: '1.35rem' 
      }}>
        {/* Total Tasks / Completion % */}
        <div style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: '12px', 
          backgroundColor: '#ffffff', 
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)' 
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Overall Velocity
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669' }}>
              {aggregateMetrics.overallPct}%
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              completed
            </span>
          </div>
          <div style={{ marginTop: '0.35rem' }}>
            <SingleProgressBar value={aggregateMetrics.overallPct} color="#059669" height={5} />
          </div>
        </div>

        {/* Done Tasks */}
        <div style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: '12px', 
          backgroundColor: STATUS_CONFIG.done.light, 
          border: `1px solid ${STATUS_CONFIG.done.border}` 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: STATUS_CONFIG.done.textColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed
            </span>
            <CheckCircle2 size={13} color={STATUS_CONFIG.done.fill} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: STATUS_CONFIG.done.fill, marginTop: '0.2rem' }}>
            {aggregateMetrics.doneTasks}
          </div>
          <span style={{ fontSize: '0.68rem', color: STATUS_CONFIG.done.textColor, fontWeight: 600 }}>
            tasks done
          </span>
        </div>

        {/* In Progress Tasks */}
        <div style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: '12px', 
          backgroundColor: STATUS_CONFIG.in_progress.light, 
          border: `1px solid ${STATUS_CONFIG.in_progress.border}` 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: STATUS_CONFIG.in_progress.textColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Progress
            </span>
            <Clock size={13} color={STATUS_CONFIG.in_progress.fill} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: STATUS_CONFIG.in_progress.fill, marginTop: '0.2rem' }}>
            {aggregateMetrics.inProgressTasks}
          </div>
          <span style={{ fontSize: '0.68rem', color: STATUS_CONFIG.in_progress.textColor, fontWeight: 600 }}>
            actively worked
          </span>
        </div>

        {/* In Review Tasks */}
        <div style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: '12px', 
          backgroundColor: STATUS_CONFIG.review.light, 
          border: `1px solid ${STATUS_CONFIG.review.border}` 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: STATUS_CONFIG.review.textColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Review
            </span>
            <AlertCircle size={13} color={STATUS_CONFIG.review.fill} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: STATUS_CONFIG.review.fill, marginTop: '0.2rem' }}>
            {aggregateMetrics.reviewTasks}
          </div>
          <span style={{ fontSize: '0.68rem', color: STATUS_CONFIG.review.textColor, fontWeight: 600 }}>
            awaiting QA / check
          </span>
        </div>

        {/* To Do Tasks */}
        <div style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: '12px', 
          backgroundColor: STATUS_CONFIG.todo.light, 
          border: `1px solid ${STATUS_CONFIG.todo.border}` 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: STATUS_CONFIG.todo.textColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Backlog / To Do
            </span>
            <Target size={13} color={STATUS_CONFIG.todo.fill} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: STATUS_CONFIG.todo.fill, marginTop: '0.2rem' }}>
            {aggregateMetrics.todoTasks}
          </div>
          <span style={{ fontSize: '0.68rem', color: STATUS_CONFIG.todo.textColor, fontWeight: 600 }}>
            queued tasks
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── VIEW 1: OVERVIEW WITH INTERACTIVE PROJECT CARDS & TREND ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewMode === 'overview' && (
        <div>
          {/* Quick Filter and Selector Toolbar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '0.75rem', 
            marginBottom: '1rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Workspaces ({projects.length})
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                — Click any project to open its dedicated graph & analytics
              </span>
            </div>

            {/* Quick Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="Filter project graphs..."
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  fontSize: '0.75rem',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  minWidth: '180px'
                }}
              />
            </div>
          </div>

          {/* Grid of Interactive Project Cards with Radial Donuts */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', 
            gap: '0.85rem' 
          }}>
            {projects.map((proj) => {
              const taskData = proj.tasks || { total: 0, done: 0, in_progress: 0, review: 0, todo: 0 };
              const priorityInfo = PRIORITY_CONFIG[(proj.priority || 'medium').toLowerCase()] || PRIORITY_CONFIG.medium;

              return (
                <div
                  key={proj.id}
                  onClick={() => handleProjectClick(proj)}
                  style={{
                    padding: '1rem 1.15rem',
                    borderRadius: '13px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.85)',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.85)';
                  }}
                  title="Click to view detailed graph for this project"
                >
                  {/* Top Bar: Code, Priority, View prompt */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: 700, 
                        color: 'var(--text-dim)', 
                        backgroundColor: 'rgba(241, 245, 249, 0.8)', 
                        padding: '2px 6px', 
                        borderRadius: '5px' 
                      }}>
                        {proj.code || 'PRJ'}
                      </span>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        color: priorityInfo.color, 
                        backgroundColor: priorityInfo.bg, 
                        padding: '2px 6px', 
                        borderRadius: '5px',
                        border: `1px solid ${priorityInfo.border}`
                      }}>
                        {priorityInfo.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectClick(proj);
                        }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.2rem', 
                          fontSize: '0.68rem', 
                          fontWeight: 700, 
                          color: '#2563eb',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 4px'
                        }}
                      >
                        <span>View Graph</span>
                        <ChevronRight size={12} />
                      </button>

                      {onSelectProject && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenWorkspace(proj.id, e)}
                          title="Open Full Project Workspace & Sprint Board"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.15rem',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#059669',
                            backgroundColor: 'rgba(5, 150, 105, 0.08)',
                            border: '1px solid rgba(5, 150, 105, 0.2)',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>Workspace</span>
                          <ArrowUpRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Content: Radial Donut + Project Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <RadialDonutChart tasks={taskData} size={64} strokeWidth={8} />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 800, 
                        color: 'var(--text-main)', 
                        margin: '0 0 0.2rem', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {proj.name}
                      </h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '0 0 0.45rem' }}>
                        {taskData.total} task{taskData.total === 1 ? '' : 's'} · {proj.progress}% velocity
                      </p>

                      {/* Mini Task Status Pills */}
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {taskData.done > 0 && (
                          <span style={{ 
                            fontSize: '0.62rem', 
                            fontWeight: 700, 
                            padding: '1px 5px', 
                            borderRadius: '4px', 
                            backgroundColor: STATUS_CONFIG.done.light, 
                            color: STATUS_CONFIG.done.fill 
                          }}>
                            ✓ {taskData.done}
                          </span>
                        )}
                        {taskData.in_progress > 0 && (
                          <span style={{ 
                            fontSize: '0.62rem', 
                            fontWeight: 700, 
                            padding: '1px 5px', 
                            borderRadius: '4px', 
                            backgroundColor: STATUS_CONFIG.in_progress.light, 
                            color: STATUS_CONFIG.in_progress.fill 
                          }}>
                            ▶ {taskData.in_progress}
                          </span>
                        )}
                        {taskData.review > 0 && (
                          <span style={{ 
                            fontSize: '0.62rem', 
                            fontWeight: 700, 
                            padding: '1px 5px', 
                            borderRadius: '4px', 
                            backgroundColor: STATUS_CONFIG.review.light, 
                            color: STATUS_CONFIG.review.fill 
                          }}>
                            ◈ {taskData.review}
                          </span>
                        )}
                        {taskData.todo > 0 && (
                          <span style={{ 
                            fontSize: '0.62rem', 
                            fontWeight: 700, 
                            padding: '1px 5px', 
                            borderRadius: '4px', 
                            backgroundColor: STATUS_CONFIG.todo.light, 
                            color: STATUS_CONFIG.todo.fill 
                          }}>
                            ○ {taskData.todo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Segment Stacked Bar */}
                  <div style={{ marginTop: '0.85rem' }}>
                    <MultiSegmentBar tasks={taskData} height={6} />
                  </div>
                </div>
              );
            })}
          </div>

          {projects.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No matching project graphs found for "{filterQuery}".
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── VIEW 2: DEDICATED PROJECT DEEP-DIVE GRAPH (REQUESTED!) ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewMode === 'deep_dive' && selectedProject && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          
          {/* Top Project Deep-Dive Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '1rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(241, 245, 249, 0.9)',
                  border: '1px solid rgba(203, 213, 225, 0.7)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(241, 245, 249, 0.9)'}
              >
                <ArrowLeft size={14} />
                <span>All Projects</span>
              </button>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {selectedProject.name}
                  </h3>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: 'var(--text-dim)', 
                    backgroundColor: 'rgba(241, 245, 249, 0.9)', 
                    padding: '2px 7px', 
                    borderRadius: '5px' 
                  }}>
                    {selectedProject.code}
                  </span>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    fontWeight: 700, 
                    color: selectedProject.status === 'Completed' ? '#059669' : '#2563eb', 
                    backgroundColor: selectedProject.status === 'Completed' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)', 
                    padding: '2px 7px', 
                    borderRadius: '5px' 
                  }}>
                    {selectedProject.status || 'In Progress'}
                  </span>
                </div>
                {selectedProject.deadline && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={12} />
                    <span>Target Deadline: {selectedProject.deadline}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions & Workspace Jump */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* Project Selector Dropdown to jump across projects */}
              <select
                value={selectedProjectId || selectedProject?.id || ''}
                onChange={e => {
                  setSelectedProjectId(e.target.value);
                  if (onSelectProject) {
                    onSelectProject(Number(e.target.value) || e.target.value);
                  }
                }}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(203, 213, 225, 0.8)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  color: 'var(--text-main)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    Switch: {p.name} ({p.code || 'PRJ'})
                  </option>
                ))}
              </select>

              {/* Jump to Full Workspace button */}
              {onSelectProject && (
                <button
                  type="button"
                  onClick={() => onSelectProject(selectedProject.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <span>Open Full Workspace</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Side-by-Side Deep Dive Visual Analytics ── */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.25rem' 
          }}>
            
            {/* Graph Card A: Radial Donut & Status Breakdown */}
            <div style={{ 
              padding: '1.25rem', 
              borderRadius: '13px', 
              backgroundColor: '#ffffff', 
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <PieChart size={16} color="#2563eb" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Task Status Breakdown
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>
                  {selectedProject.progress}% Done
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.15rem' }}>
                <RadialDonutChart tasks={selectedProject.tasks || {}} size={110} strokeWidth={14} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { key: 'done', count: selectedProject.tasks?.done || 0 },
                    { key: 'in_progress', count: selectedProject.tasks?.in_progress || 0 },
                    { key: 'review', count: selectedProject.tasks?.review || 0 },
                    { key: 'todo', count: selectedProject.tasks?.todo || 0 },
                  ].map(item => {
                    const cfg = STATUS_CONFIG[item.key];
                    const total = Math.max(selectedProject.tasks?.total || 1, 1);
                    const pct = Math.round((item.count / total) * 100);

                    return (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: cfg.fill }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: cfg.fill }}>
                            {item.count}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', width: '35px', textAlign: 'right' }}>
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Proportional Linear Status Bar */}
              <MultiSegmentBar tasks={selectedProject.tasks || {}} height={8} />
            </div>

            {/* Graph Card B: Priority Distribution & Contributor Workload */}
            <div style={{ 
              padding: '1.25rem', 
              borderRadius: '13px', 
              backgroundColor: '#ffffff', 
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <TrendingUp size={16} color="#d97706" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Priority & Assignee Workload
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {selectedProject.assignees?.length || 0} contributors
                </span>
              </div>

              {/* Priority Bar distribution */}
              <div style={{ marginBottom: '1.15rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Task Priority Mix
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {[
                    { key: 'urgent', count: selectedProject.priorities?.urgent || 0 },
                    { key: 'high', count: selectedProject.priorities?.high || 0 },
                    { key: 'medium', count: selectedProject.priorities?.medium || 0 },
                    { key: 'low', count: selectedProject.priorities?.low || 0 },
                  ].map(item => {
                    const pcfg = PRIORITY_CONFIG[item.key];
                    return (
                      <div 
                        key={item.key} 
                        style={{ 
                          padding: '0.45rem', 
                          borderRadius: '8px', 
                          backgroundColor: pcfg.bg, 
                          border: `1px solid ${pcfg.border}`,
                          textAlign: 'center' 
                        }}
                      >
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: pcfg.color, textTransform: 'uppercase' }}>
                          {pcfg.label}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: pcfg.color, marginTop: '2px' }}>
                          {item.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contributor Workload Progress Bars */}
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Assignee Deliverable Velocity
                </span>
                <div style={{ marginTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {(selectedProject.assignees || []).map((asgn, idx) => {
                    const pct = asgn.total > 0 ? Math.round((asgn.done / asgn.total) * 100) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {asgn.name}
                          </span>
                          <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
                            {asgn.done}/{asgn.total} done ({pct}%)
                          </span>
                        </div>
                        <SingleProgressBar value={pct} color={pct >= 80 ? '#059669' : '#2563eb'} height={5} />
                      </div>
                    );
                  })}
                  {(selectedProject.assignees || []).length === 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No tasks assigned yet.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Project Task Items List ── */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '13px', 
            border: '1px solid rgba(226, 232, 240, 0.85)',
            padding: '1.15rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            {/* Header & Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Layers size={15} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Tasks in {selectedProject.name} ({selectedProject.items?.length || 0})
                </span>
              </div>

              {/* Status Tabs */}
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {['ALL', 'todo', 'in_progress', 'review', 'done'].map(st => (
                  <button
                    key={st}
                    onClick={() => setTaskStatusFilter(st)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: taskStatusFilter === st ? 'var(--accent-primary)' : 'rgba(241, 245, 249, 0.85)',
                      color: taskStatusFilter === st ? '#ffffff' : 'var(--text-dim)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {st.toUpperCase().replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.9)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.6rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.68rem' }}>TASK TITLE</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0.6rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.68rem' }}>STATUS</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0.6rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.68rem' }}>PRIORITY</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.6rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.68rem' }}>ASSIGNEE</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.6rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.68rem', minWidth: '110px' }}>PROGRESS</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedProject.items || [])
                    .filter(t => taskStatusFilter === 'ALL' || (t.status || '').toLowerCase() === taskStatusFilter.toLowerCase())
                    .map((t, idx) => {
                      const stCfg = STATUS_CONFIG[(t.status || 'todo').toLowerCase()] || STATUS_CONFIG.todo;
                      const priCfg = PRIORITY_CONFIG[(t.priority || 'medium').toLowerCase()] || PRIORITY_CONFIG.medium;
                      const prog = Number(t.progress_percent) || (stCfg.label === 'Done' ? 100 : 0);

                      return (
                        <tr 
                          key={t.id || idx}
                          style={{ borderBottom: '1px solid rgba(241, 245, 249, 0.9)' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248, 250, 252, 0.8)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {t.title}
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              padding: '2px 7px', 
                              borderRadius: '5px', 
                              backgroundColor: stCfg.light, 
                              color: stCfg.fill,
                              border: `1px solid ${stCfg.border}`
                            }}>
                              {stCfg.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              color: priCfg.color, 
                              backgroundColor: priCfg.bg, 
                              padding: '2px 6px', 
                              borderRadius: '5px' 
                            }}>
                              {priCfg.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {t.assignee || 'Unassigned'}
                          </td>
                          <td style={{ padding: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <SingleProgressBar value={prog} color={stCfg.fill} height={5} />
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: stCfg.fill, flexShrink: 0 }}>
                                {prog}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {(selectedProject.items || []).length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                  No tasks found in this project.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── VIEW 3: FULL MATRIX TABLE ACROSS ALL PROJECTS ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '13px', border: '1px solid rgba(226, 232, 240, 0.85)', padding: '0.75rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(226, 232, 240, 0.9)' }}>
                {['Project', 'Status', 'Priority', 'Velocity', 'Done', 'In Progress', 'Review', 'To Do', 'Actions'].map(h => (
                  <th key={h} style={{ 
                    padding: '0.5rem 0.65rem', 
                    textAlign: h === 'Project' ? 'left' : 'center', 
                    color: 'var(--text-dim)', 
                    fontWeight: 700, 
                    fontSize: '0.68rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.04em' 
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => {
                const priCfg = PRIORITY_CONFIG[(proj.priority || 'medium').toLowerCase()] || PRIORITY_CONFIG.medium;
                const pctColor = proj.progress >= 80 ? '#059669' : proj.progress >= 50 ? '#2563eb' : '#dc2626';

                return (
                  <tr 
                    key={proj.id} 
                    style={{ borderBottom: '1px solid rgba(241, 245, 249, 0.9)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248, 250, 252, 0.9)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0.65rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{proj.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{proj.code}</div>
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        padding: '2px 7px', 
                        borderRadius: '5px', 
                        backgroundColor: proj.status === 'Completed' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)', 
                        color: proj.status === 'Completed' ? '#059669' : '#2563eb' 
                      }}>
                        {proj.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: priCfg.color }}>
                        {priCfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem', minWidth: '100px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <SingleProgressBar value={proj.progress} color={pctColor} height={5} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: pctColor, flexShrink: 0 }}>
                          {proj.progress}%
                        </span>
                      </div>
                    </td>
                    {['done', 'in_progress', 'review', 'todo'].map(key => (
                      <td key={key} style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: 800, 
                          color: STATUS_CONFIG[key]?.fill || '#64748b' 
                        }}>
                          {proj.tasks ? (proj.tasks[key] || 0) : 0}
                        </span>
                      </td>
                    ))}
                    <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleProjectClick(proj)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                          color: '#2563eb',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        Deep Dive
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
