import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  FolderKanban, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  CheckSquare 
} from 'lucide-react';
import { api } from '../services/api';
import { getDeadlineInfo, formatDate } from '../utils/dateUtils';

export default function RoadmapView({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await api.getProjects();
        setProjects(data || []);
      } catch (err) {
        console.error('Failed to load roadmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const d = getDeadlineInfo(p.deadline);
    if (urgencyFilter === 'OVERDUE') return d.status === 'overdue' || d.status === 'today';
    if (urgencyFilter === 'URGENT') return d.status === 'urgent';
    if (urgencyFilter === 'SAFE') return d.status === 'safe';
    return true;
  });

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Roadmap & Deadlines
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            High-level release runway, milestone completion velocity, and timeline risk assessment
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Projects' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'URGENT', label: 'Urgent (< 3 Days)' },
            { id: 'SAFE', label: 'On Track / Safe' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setUrgencyFilter(f.id)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontWeight: urgencyFilter === f.id ? 600 : 500,
                backgroundColor: urgencyFilter === f.id ? 'var(--accent-primary)' : 'var(--bg-muted)',
                color: urgencyFilter === f.id ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Timeline List */}
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
          <p style={{ fontSize: '0.85rem' }}>Loading project roadmaps...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px dashed var(--border-strong)'
        }}>
          <Clock size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            No matching roadmaps
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Try adjusting your deadline urgency filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredProjects.map((p) => {
            const deadline = getDeadlineInfo(p.deadline);
            const progress = p.calculated_progress !== undefined ? p.calculated_progress : (p.progress || 0);

            return (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Header row: Project Code, Name, Priority, Deadline Badge, Open Workspace */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-muted)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {p.code}
                    </span>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {p.name}
                    </h3>

                    <span style={{
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-dim)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {p.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={deadline.colorClass} style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      {deadline.status === 'overdue' ? <AlertCircle size={13} /> : <Clock size={13} />}
                      <span>{deadline.fullText}</span>
                    </div>

                    <button
                      onClick={() => onSelectProject && onSelectProject(p.id)}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Visual Runway Timeline Track */}
                <div style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  padding: '1.15rem 1.25rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', fontSize: '0.775rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>KICKOFF</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatDate(p.start_date)}</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>COMPLETION</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{progress}% Complete</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>TARGET RELEASE</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatDate(p.deadline)}</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div style={{
                    height: '8px',
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: progress === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Footer Metrics: Members, Tasks, Budget */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={14} color="var(--accent-primary)" />
                      <span>{p.member_count || 0} Engineers</span>
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckSquare size={14} color="var(--accent-success)" />
                      <span>{p.done_tasks || 0} / {p.total_tasks || 0} Tasks Done</span>
                    </span>
                  </div>

                  <div>
                    <span>Budget: </span>
                    <strong style={{ color: 'var(--text-main)' }}>PKR {p.budget ? Number(p.budget).toLocaleString() : '0'}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
