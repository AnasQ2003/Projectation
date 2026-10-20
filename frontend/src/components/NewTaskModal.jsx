import React, { useState } from 'react';
import { X, CheckSquare, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function NewTaskModal({ projectId, members = [], defaultStatus = 'todo', onClose, onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState(members[0]?.name || 'Unassigned');
  
  // Default due date 5 days ahead
  const defaultDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(defaultDueDate);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    try {
      await api.addTask(projectId, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee,
        due_date: dueDate
      });
      onTaskCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Error adding task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
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
              <CheckSquare size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Add Task</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Create a working item for the sprint board</p>
            </div>
          </div>

          <button onClick={onClose} style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.6rem' }}>
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

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Task Title *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Implement JWT refresh tokens & unit tests"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid-2" style={{ display: 'grid', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Column / Status
              </label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review / QA</option>
                <option value="done">Completed / Done</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Priority Level
              </label>
              <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ display: 'grid', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Assignee
              </label>
              <select className="form-input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="Unassigned">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Acceptance Criteria / Description
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Brief checklist or technical context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Sparkles size={16} />
              <span>{loading ? 'Adding Task...' : 'Add Task to Board'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
