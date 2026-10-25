import React from 'react';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  ArrowUpRight 
} from 'lucide-react';
import { getDeadlineInfo } from '../utils/dateUtils';

export default function ProjectCard({ project, onSelect, onDelete }) {
  const deadlineInfo = getDeadlineInfo(project.deadline);
  const progressPercent = project.calculated_progress !== undefined ? project.calculated_progress : (project.progress || 0);

  const getPriorityAccent = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return { accent: '#dc2626', bg: 'rgba(254, 242, 242, 0.9)', text: '#dc2626', border: 'rgba(254, 202, 202, 0.9)' };
      case 'high':
        return { accent: '#f59e0b', bg: 'rgba(255, 251, 235, 0.9)', text: '#b45309', border: 'rgba(253, 230, 138, 0.9)' };
      case 'medium':
        return { accent: '#2563eb', bg: 'rgba(239, 246, 255, 0.9)', text: '#1d4ed8', border: 'rgba(191, 219, 254, 0.9)' };
      case 'low':
        return { accent: '#10b981', bg: 'rgba(240, 253, 244, 0.9)', text: '#047857', border: 'rgba(187, 247, 208, 0.9)' };
      default:
        return { accent: '#64748b', bg: 'rgba(248, 250, 252, 0.9)', text: '#475569', border: 'rgba(226, 232, 240, 0.9)' };
    }
  };

  const priorityStyle = getPriorityAccent(project.priority);

  return (
    <div
      onClick={() => onSelect(project.id)}
      className="glass-card"
      style={{
        padding: '1.25rem',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        borderTop: `3px solid ${priorityStyle.accent}`,
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)'
      }}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'rgba(241, 245, 249, 0.9)',
              color: 'var(--text-muted)',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              border: '1px solid rgba(203, 213, 225, 0.7)'
            }}>
              {project.code || 'PRJ'}
            </span>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 600,
              backgroundColor: 'rgba(241, 245, 249, 0.85)',
              color: 'var(--text-main)',
              border: '1px solid rgba(226, 232, 240, 0.85)',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px'
            }}>
              {project.category || 'Software'}
            </span>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              backgroundColor: priorityStyle.bg,
              color: priorityStyle.text,
              border: `1px solid ${priorityStyle.border}`,
              padding: '0.2rem 0.55rem',
              borderRadius: '6px'
            }}>
              {project.priority || 'Normal'}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
            style={{
              padding: '0.35rem',
              borderRadius: '7px',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-dim)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Delete Project"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '0.35rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          lineHeight: 1.3
        }}>
          <span>{project.name}</span>
          <ArrowUpRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '0.825rem',
          color: 'var(--text-muted)',
          lineHeight: 1.45,
          marginBottom: '1.1rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {project.description || 'Project repository and milestone workspace.'}
        </p>
      </div>

      <div>
        {/* Progress Bar */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
            <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Progress</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{progressPercent}%</span>
          </div>
          <div style={{
            height: '6px',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Card Footer */}
        <div style={{
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Deadline Badge */}
          <div
            className={deadlineInfo.colorClass}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.725rem',
              fontWeight: 600
            }}
          >
            {deadlineInfo.status === 'overdue' ? (
              <AlertCircle size={13} />
            ) : deadlineInfo.status === 'urgent' ? (
              <Clock size={13} />
            ) : (
              <Calendar size={13} />
            )}
            <span>{deadlineInfo.label}</span>
          </div>

          {/* Counts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Users size={13} />
              {project.member_count || 0}
            </span>
            <span>&bull;</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <CheckCircle2 size={13} />
              {project.done_tasks || 0}/{project.total_tasks || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
