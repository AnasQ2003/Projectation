import React, { useState } from 'react';
import { X, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6'  // Blue
];

export default function NewMemberModal({ projectId, onClose, onMemberAdded }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Full Stack Developer');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required');
      return;
    }

    setLoading(true);
    try {
      await api.addMember(projectId, {
        name: name.trim(),
        email: email.trim(),
        role,
        avatar_color: selectedColor
      });
      onMemberAdded();
      onClose();
    } catch (err) {
      setError(err.message || 'Error adding member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
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
              <UserPlus size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Add Team Member</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assign a member to this project</p>
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
              Full Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Jordan Hayes"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!email) {
                  const slug = e.target.value.toLowerCase().replace(/\s+/g, '.');
                  if (slug) setEmail(`${slug}@softwarehouse.dev`);
                }
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Company Email *
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="jordan.h@softwarehouse.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Project Role
            </label>
            <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Lead Software Architect">Lead Software Architect</option>
              <option value="Senior Frontend Engineer">Senior Frontend Engineer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Backend / DB Engineer">Backend / DB Engineer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="QA & Security Specialist">QA & Security Specialist</option>
              <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
              <option value="Scrum Master / PM">Scrum Master / PM</option>
            </select>
          </div>

          {/* Avatar Color Picker */}
          <div style={{ marginBottom: '1.6rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
              Member Avatar Color
            </label>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {AVATAR_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: col,
                    border: selectedColor === col ? '3px solid #fff' : '2px solid transparent',
                    boxShadow: selectedColor === col ? `0 0 10px ${col}` : 'none',
                    transform: selectedColor === col ? 'scale(1.15)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Sparkles size={16} />
              <span>{loading ? 'Adding Member...' : 'Add to Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
