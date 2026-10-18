import React, { useState } from 'react';
import { X, FolderPlus, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function NewProjectModal({ onClose, onProjectCreated }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Full Stack SaaS');
  const [priority, setPriority] = useState('High');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Default deadline 14 days ahead
  const defaultDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [budget, setBudget] = useState('45000');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!code || code.length <= 6) {
      const suggested = val.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
      if (suggested) {
        setCode(suggested + '-101');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a project name');
      return;
    }
    if (!deadline) {
      setError('Please specify a project deadline');
      return;
    }

    setLoading(true);
    try {
      await api.createProject({
        name: name.trim(),
        code: code.trim() || 'PRJ-' + Math.floor(100 + Math.random() * 900),
        category,
        priority,
        description: description.trim(),
        start_date: startDate,
        deadline,
        budget: parseFloat(budget) || 0
      });
      onProjectCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div style={{
          padding: '1.4rem 1.8rem',
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
              <FolderPlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Create Project</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Set up repository details and timeline</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.8rem' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '0.7rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Project Name *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. NextGen Microservices Platform"
                value={name}
                onChange={handleNameChange}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Jira Key / Code
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. NGM-101"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Category / Domain
              </label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Full Stack SaaS">Full Stack SaaS</option>
                <option value="Fintech Mobile">Fintech Mobile</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Healthcare Cloud">Healthcare Cloud</option>
                <option value="E-Commerce Ecosystem">E-Commerce Ecosystem</option>
                <option value="DevOps & Infrastructure">DevOps & Infrastructure</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Sprint Priority
              </label>
              <select
                className="form-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (P0 Critical)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Kickoff / Start Date
              </label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Project Deadline *
              </label>
              <input
                type="date"
                className="form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Project Budget (PKR)
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 1500000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '1.6rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Description & Objectives
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Define technical milestones, software scope, deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Sparkles size={16} />
              <span>{loading ? 'Creating Project...' : 'Launch Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
