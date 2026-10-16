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

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return { bg: 'var(--accent-danger-light)', text: 'var(--accent-danger)', border: 'var(--accent-danger-border)' };
      case 'high':
        return { bg: 'var(--accent-warning-light)', text: 'var(--accent-warning)', border: 'var(--accent-warning-border)' };
      case 'medium':
        return { bg: 'var(--accent-primary-light)', text: 'var(--accent-primary)', border: 'var(--accent-primary-border)' };
      default:
        return { bg: 'var(--bg-muted)', text: 'var(--text-muted)', border: 'var(--border-subtle)' };
    }
  };

  const priorityStyle = getPriorityBadge(project.priority);

  return (
    <div
      onClick={() => onSelect(project.id)}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-muted)',
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)'
            }}>
              {project.code || 'PRJ'}
            </span>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 600,
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-main)',
              padding: '0.15rem 0.5rem',
              borderRadius: '6px'
            }}>
              {project.category || 'Software'}
            </span>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 600,
              backgroundColor: priorityStyle.bg,
              color: priorityStyle.text,
              border: `1px solid ${priorityStyle.border}`,
              padding: '0.15rem 0.5rem',
              borderRadius: '6px'
            }}>
              {project.priority || 'Normal'}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
            style={{
              padding: '0.3rem',
              borderRadius: '6px',
              color: 'var(--text-dim)',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
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
