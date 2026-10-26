import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Activity, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

const STATUS_COLORS = {
  done: { fill: '#059669', label: 'Done', light: 'rgba(5,150,105,0.12)' },
  in_progress: { fill: '#2563eb', label: 'In Progress', light: 'rgba(37,99,235,0.12)' },
  review: { fill: '#d97706', label: 'In Review', light: 'rgba(217,119,6,0.12)' },
  todo: { fill: '#94a3b8', label: 'To Do', light: 'rgba(148,163,184,0.12)' },
};

const PRIORITY_COLORS = { Urgent: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#059669' };

function DonutChart({ tasks, size, strokeWidth }) {
  size = size || 80; strokeWidth = strokeWidth || 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2, cy = size / 2;
  const total = tasks.total || 1;
  const segs = [
    { key: 'done', value: tasks.done || 0 },
    { key: 'in_progress', value: tasks.in_progress || 0 },
    { key: 'review', value: tasks.review || 0 },
    { key: 'todo', value: tasks.todo || 0 },
  ];
  let offset = 0;
  const arcs = segs.map(seg => {
    const pct = seg.value / total;
    const arc = { ...seg, dashLen: pct * circumference, dashOffset: -offset * circumference };
    offset += pct;
    return arc;
  });
  const pct = Math.round(((tasks.done || 0) / total) * 100);
  const pctColor = pct >= 80 ? '#059669' : pct >= 50 ? '#2563eb' : '#94a3b8';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
        {arcs.map(arc => arc.dashLen > 0.5 ? (
          <circle key={arc.key} cx={cx} cy={cy} r={radius} fill="none"
            stroke={STATUS_COLORS[arc.key] ? STATUS_COLORS[arc.key].fill : '#e2e8f0'}
            strokeWidth={strokeWidth} strokeLinecap="butt"
            strokeDasharray={arc.dashLen + ' ' + circumference}
            strokeDashoffset={arc.dashOffset}
            style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)' }}
          />
        ) : null)}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size <= 60 ? '0.6rem' : '0.8rem', fontWeight: 800, color: pctColor, lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  );
}

function HBar({ value, max, color, height }) {
  height = height || 8;
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', borderRadius: height / 2, backgroundColor: color, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)', minWidth: pct > 0 ? '4px' : '0' }} />
    </div>
  );
}

function PBar({ value, color, height }) {
  height = height || 6;
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, backgroundColor: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <div style={{ width: Math.min(100, value || 0) + '%', height: '100%', borderRadius: height / 2, background: 'linear-gradient(90deg,' + (color || '#2563eb') + 'cc,' + (color || '#2563eb') + ')', transition: 'width 0.9s cubic-bezier(.4,0,.2,1)', minWidth: value > 0 ? '4px' : '0' }} />
    </div>
  );
}

function buildUserProjects(userProjects) {
  return (userProjects || []).map(p => {
    const tasks = p.myTasks || [];
    const done = tasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
    const in_progress = tasks.filter(t => (t.status || '').toLowerCase() === 'in_progress').length;
    const review = tasks.filter(t => (t.status || '').toLowerCase() === 'review').length;
    const todo = tasks.filter(t => ['todo', ''].includes((t.status || '').toLowerCase())).length;
    const total = tasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : (p.progress || 0);
    return { id: p.id, name: p.name, code: p.code, status: p.status, priority: p.priority, progress, tasks: { total, done, in_progress, review, todo } };
  });
}

export default function ProjectProgressChart({ mode, userProjects, refreshTrigger, onSelectProject }) {
  mode = mode || 'admin';
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');
  const [animatedIn, setAnimatedIn] = useState(false);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!mounted.current) return;
      setLoading(true);
      try {
        if (mode === 'user' && userProjects) {
          const projects = buildUserProjects(userProjects);
          if (mounted.current) { setChartData({ projects, taskTrend: [] }); setLoading(false); setTimeout(() => { if (mounted.current) setAnimatedIn(true); }, 60); }
        } else {
          const data = await api.getChartData();
          if (mounted.current) { setChartData(data); setLoading(false); setTimeout(() => { if (mounted.current) setAnimatedIn(true); }, 60); }
        }
      } catch (err) {
        console.error('Chart load error:', err);
        if (mounted.current) setLoading(false);
      }
    };
    loadData();
  }, [mode, refreshTrigger]);

  useEffect(() => {
    if (mode === 'user' && userProjects) {
      setChartData(prev => ({ ...(prev || {}), projects: buildUserProjects(userProjects) }));
    }
  }, [userProjects]);

  if (loading) return (
    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <div style={{ width: 28, height: 28, border: '2.5px solid rgba(37,99,235,0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.65rem' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', margin: 0 }}>Loading analytics...</p>
      </div>
    </div>
  );

  const projects = (chartData && chartData.projects) || [];
  if (projects.length === 0) return (
    <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
      <BarChart3 size={32} style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No project data yet</p>
    </div>
  );

  const totalDone = projects.reduce((s, p) => s + (p.tasks ? p.tasks.done : 0), 0);
  const totalIP = projects.reduce((s, p) => s + (p.tasks ? p.tasks.in_progress : 0), 0);
  const totalRev = projects.reduce((s, p) => s + (p.tasks ? p.tasks.review : 0), 0);
  const totalTodo = projects.reduce((s, p) => s + (p.tasks ? p.tasks.todo : 0), 0);
  const grandTotal = totalDone + totalIP + totalRev + totalTodo;
  const overallPct = grandTotal > 0 ? Math.round((totalDone / grandTotal) * 100) : 0;

  const tabs = [
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'status', label: 'Distribution', icon: Activity },
    { id: 'details', label: 'Details', icon: TrendingUp },
  ];

  return (
    <div className="glass-card" style={{ padding: '1.5rem', opacity: animatedIn ? 1 : 0, transform: animatedIn ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'linear-gradient(135deg,#2563eb,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={15} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
              {mode === 'admin' ? 'Project Analytics' : 'My Progress Analytics'}
            </h2>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: 0, marginLeft: '2.2rem' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} · {grandTotal} tasks · <strong style={{ color: '#059669' }}>{overallPct}%</strong> overall done
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.15rem', backgroundColor: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: active ? '#2563eb' : 'transparent', color: active ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s ease', border: 'none', cursor: 'pointer' }}>
                <Icon size={12} />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB: Progress */}
      {activeTab === 'progress' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: '0.6rem', marginBottom: '1.2rem' }}>
            {[
              { label: 'Done', value: totalDone, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
              { label: 'In Progress', value: totalIP, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
              { label: 'In Review', value: totalRev, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
              { label: 'To Do', value: totalTodo, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
            ].map(item => (
              <div key={item.label} style={{ padding: '0.65rem', borderRadius: '10px', backgroundColor: item.bg, border: '1px solid ' + item.color + '22', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, marginTop: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
            {projects.map((proj, idx) => {
              const pctColor = proj.progress >= 80 ? '#059669' : proj.progress >= 50 ? '#2563eb' : proj.progress >= 25 ? '#d97706' : '#dc2626';
              const priorityColor = PRIORITY_COLORS[proj.priority] || '#64748b';
              return (
                <div key={proj.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: priorityColor, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
                      <span style={{ fontSize: '0.63rem', color: 'var(--text-dim)', flexShrink: 0 }}>({proj.tasks ? proj.tasks.total : 0})</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: pctColor, flexShrink: 0 }}>{proj.progress}%</span>
                  </div>
                  <div style={{ height: 9, borderRadius: 5, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)', display: 'flex' }}>
                    {['done', 'in_progress', 'review', 'todo'].map(key => {
                      const val = proj.tasks ? (proj.tasks[key] || 0) : 0;
                      const segPct = proj.tasks && proj.tasks.total > 0 ? (val / proj.tasks.total) * 100 : 0;
                      return segPct > 0 ? (
                        <div key={key} style={{ width: segPct + '%', height: '100%', backgroundColor: STATUS_COLORS[key] ? STATUS_COLORS[key].fill : '#e2e8f0', transition: 'width 0.9s cubic-bezier(.4,0,.2,1)', minWidth: '2px' }} title={(STATUS_COLORS[key] ? STATUS_COLORS[key].label : key) + ': ' + val} />
                      ) : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '0.9rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(STATUS_COLORS).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.fill }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 500 }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Status Distribution */}
      {activeTab === 'status' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', marginBottom: '1.35rem', padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)', flexWrap: 'wrap' }}>
            <DonutChart tasks={{ total: grandTotal, done: totalDone, in_progress: totalIP, review: totalRev, todo: totalTodo }} size={110} strokeWidth={14} />
            <div style={{ flex: 1, minWidth: '160px' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>Overall Task Distribution</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {[
                  { key: 'done', count: totalDone },
                  { key: 'in_progress', count: totalIP },
                  { key: 'review', count: totalRev },
                  { key: 'todo', count: totalTodo },
                ].map(item => {
                  const cfg = STATUS_COLORS[item.key];
                  const pct = grandTotal > 0 ? Math.round((item.count / grandTotal) * 100) : 0;
                  return (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.fill, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '80px', fontWeight: 500 }}>{cfg.label}</span>
                      <div style={{ flex: 1 }}><HBar value={item.count} max={grandTotal} color={cfg.fill} height={5} /></div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.fill, width: '55px', textAlign: 'right' }}>{item.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto' }}>
            {projects.map((proj, idx) => (
              <div 
                key={proj.id || idx} 
                onClick={() => onSelectProject && onSelectProject(proj.id)}
                style={{ 
                  padding: '0.85rem', 
                  borderRadius: '11px', 
                  backgroundColor: 'var(--bg-muted)', 
                  border: '1px solid var(--border-subtle)', 
                  display: 'flex', 
                  gap: '0.75rem', 
                  alignItems: 'center',
                  cursor: onSelectProject ? 'pointer' : 'default',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (onSelectProject) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (onSelectProject) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <DonutChart tasks={proj.tasks || { total: 0, done: 0, in_progress: 0, review: 0, todo: 0 }} size={58} strokeWidth={8} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.18rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', margin: 0 }}>{proj.tasks ? proj.tasks.total : 0} tasks · {proj.progress}% done</p>
                  <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {proj.tasks && proj.tasks.done > 0 && <span style={{ fontSize: '0.58rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(5,150,105,0.12)', color: '#059669' }}>✓ {proj.tasks.done}</span>}
                    {proj.tasks && proj.tasks.in_progress > 0 && <span style={{ fontSize: '0.58rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>▶ {proj.tasks.in_progress}</span>}
                    {proj.tasks && proj.tasks.review > 0 && <span style={{ fontSize: '0.58rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(217,119,6,0.12)', color: '#d97706' }}>◈ {proj.tasks.review}</span>}
                    {proj.tasks && proj.tasks.todo > 0 && <span style={{ fontSize: '0.58rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(148,163,184,0.12)', color: '#64748b' }}>○ {proj.tasks.todo}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Details table */}
      {activeTab === 'details' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                {['Project', 'Status', 'Priority', 'Progress', 'Done', 'Active', 'Review', 'Todo'].map(h => (
                  <th key={h} style={{ padding: '0.45rem 0.6rem', textAlign: h === 'Project' ? 'left' : 'center', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((proj, idx) => {
                const pctColor = proj.progress >= 80 ? '#059669' : proj.progress >= 50 ? '#2563eb' : '#dc2626';
                return (
                  <tr 
                    key={proj.id || idx} 
                    onClick={() => onSelectProject && onSelectProject(proj.id)}
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: onSelectProject ? 'pointer' : 'default'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0.6rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>{proj.code}</div>
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '5px', backgroundColor: proj.status === 'Completed' ? 'rgba(5,150,105,0.12)' : 'rgba(37,99,235,0.1)', color: proj.status === 'Completed' ? '#059669' : '#2563eb' }}>{proj.status || 'Active'}</span>
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: PRIORITY_COLORS[proj.priority] || '#64748b' }}>{proj.priority || '–'}</span>
                    </td>
                    <td style={{ padding: '0.6rem', minWidth: '95px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <PBar value={proj.progress} color={pctColor} height={5} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: pctColor, flexShrink: 0 }}>{proj.progress}%</span>
                      </div>
                    </td>
                    {['done', 'in_progress', 'review', 'todo'].map(key => (
                      <td key={key} style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: STATUS_COLORS[key] ? STATUS_COLORS[key].fill : '#64748b' }}>{proj.tasks ? (proj.tasks[key] || 0) : 0}</span>
                      </td>
                    ))}
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

