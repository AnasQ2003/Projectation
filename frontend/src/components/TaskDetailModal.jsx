import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CheckSquare, 
  Clock, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  Calendar,
  FolderKanban,
  User,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function TaskDetailModal({
  task,
  members = [],
  projects = [],
  onClose,
  onTaskUpdated,
  onTaskDeleted
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [assignee, setAssignee] = useState(task?.assignee || 'Unassigned');
  
  // Format due date for date picker
  const initialDueDate = task?.due_date 
    ? (task.due_date.includes('T') ? task.due_date.split('T')[0] : task.due_date)
    : '';
  const [dueDate, setDueDate] = useState(initialDueDate);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!task) return null;

  const currentProject = projects.find(p => p.id === task.project_id) || {
    name: task.project_name || 'Project Workspace',
    code: task.project_code || 'PRJ'
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    try {
      await api.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee,
        due_date: dueDate || null
      });
      setSuccessMsg('Task updated successfully!');
      if (onTaskUpdated) {
        onTaskUpdated();
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Error updating task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await api.deleteTask(task.id);
      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete task');
      setShowConfirmDelete(false);
      setLoading(false);
    }
  };

  const statusOptions = [
    { id: 'todo', label: 'To Do', color: '#64748b' },
    { id: 'in_progress', label: 'In Progress', color: '#2563eb' },
    { id: 'review', label: 'In Review', color: '#d97706' },
    { id: 'done', label: 'Completed', color: '#16a34a' }
  ];

  const priorityOptions = ['Urgent', 'High', 'Medium', 'Low'];

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
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
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <CheckSquare size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{
                  fontSize: '0.725rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-muted)',
                  color: 'var(--text-muted)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {currentProject.code}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                  {currentProject.name}
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                Task Details & Quick Edit
              </h3>
            </div>
          </div>

          <button onClick={onClose} style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ padding: '1.6rem' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(22, 163, 74, 0.12)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              color: 'var(--accent-success)',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Task Title *
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build REST API authentication endpoints"
              required
            />
          </div>

          {/* Status Pills */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Sprint Column / Status
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {statusOptions.map((opt) => {
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatus(opt.id)}
                    style={{
                      padding: '0.5rem 0.35rem',
                      borderRadius: '8px',
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--bg-subtle)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--text-main)' : 'var(--text-dim)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: opt.color,
                      marginRight: '0.35rem'
                    }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid-2" style={{ display: 'grid', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Priority Level
              </label>
              <select
                className="form-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Task Due Date
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Assignee (ONLY MEMBER NAME DISPLAYED, NEVER POSITION) */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Assignee
            </label>
            <select
              className="form-input"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="Unassigned">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.6rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Description & Acceptance Criteria
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Technical scope, API contract, or unit test checklist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem' }}>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              disabled={loading}
            >
              <Trash2 size={14} />
              <span>Delete Task</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                <Sparkles size={15} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        title="Delete Task"
        itemName={task.title}
        itemType="task"
        confirmText="Delete Task"
        isDeleting={loading}
        onConfirm={handleConfirmDelete}
        onClose={() => !loading && setShowConfirmDelete(false)}
      />
    </div>,
    document.body
  );
}
