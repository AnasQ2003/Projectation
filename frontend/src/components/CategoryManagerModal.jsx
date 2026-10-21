import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Filter, Plus, Edit2, Trash2, Check, RotateCcw, AlertCircle } from 'lucide-react';

export const DEFAULT_CATEGORIES = [
  'Full Stack SaaS',
  'Fintech Mobile',
  'Artificial Intelligence',
  'Healthcare Cloud',
  'E-Commerce Ecosystem',
  'DevOps & Infrastructure'
];

export const STORAGE_KEY_CATEGORIES = 'projectation_category_filters';

export function getStoredCategories(projects = []) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    let list = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(list) || list.length === 0) {
      list = [...DEFAULT_CATEGORIES];
    }
    // Also include any unique categories already in existing projects
    if (Array.isArray(projects)) {
      projects.forEach(p => {
        if (p.category && !list.includes(p.category)) {
          list.push(p.category);
        }
      });
    }
    return list;
  } catch (e) {
    return [...DEFAULT_CATEGORIES];
  }
}

export function saveStoredCategories(categories) {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories to localStorage', e);
  }
}

export default function CategoryManagerModal({
  categories,
  onUpdateCategories,
  projects = [],
  onClose
}) {
  const [list, setList] = useState([...categories]);
  const [newCatName, setNewCatName] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    setError('');
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setError('Category name cannot be empty');
      return;
    }
    if (list.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setError('This category already exists');
      return;
    }
    const updated = [...list, trimmed];
    setList(updated);
    setNewCatName('');
    saveStoredCategories(updated);
    onUpdateCategories(updated);
  };

  const startEdit = (index, currentVal) => {
    setEditingIndex(index);
    setEditingValue(currentVal);
    setError('');
  };

  const saveEdit = (index) => {
    setError('');
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setError('Category name cannot be empty');
      return;
    }
    if (list.some((c, i) => i !== index && c.toLowerCase() === trimmed.toLowerCase())) {
      setError('Another category with this name already exists');
      return;
    }
    const updated = [...list];
    updated[index] = trimmed;
    setList(updated);
    setEditingIndex(null);
    saveStoredCategories(updated);
    onUpdateCategories(updated);
  };

  const handleDelete = (index) => {
    const toDelete = list[index];
    const inUseCount = projects.filter(p => p.category === toDelete).length;
    if (inUseCount > 0) {
      if (!window.confirm(`"${toDelete}" is currently assigned to ${inUseCount} project(s). Are you sure you want to remove this filter?`)) {
        return;
      }
    }
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
    saveStoredCategories(updated);
    onUpdateCategories(updated);
  };

  const handleReset = () => {
    if (window.confirm('Reset category filters back to default settings?')) {
      const resetList = [...DEFAULT_CATEGORIES];
      setList(resetList);
      saveStoredCategories(resetList);
      onUpdateCategories(resetList);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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
              <Filter size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Manage Category Filters
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Add, edit, or customize project category filters for your workspace
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cybersecurity, Web3, IoT Systems..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ flexShrink: 0, padding: '0.5rem 0.9rem' }}>
              <Plus size={16} />
              <span>Add Filter</span>
            </button>
          </form>

          {/* Current Category Filters List */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Active Filters ({list.length})
              </span>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Reset to default category filters"
              >
                <RotateCcw size={12} />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              paddingRight: '0.2rem'
            }}>
              {list.map((cat, idx) => {
                const count = projects.filter(p => p.category === cat).length;
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      gap: '0.5rem'
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                        <input
                          type="text"
                          className="form-input"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          autoFocus
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEdit(idx);
                            } else if (e.key === 'Escape') {
                              setEditingIndex(null);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(idx)}
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.55rem' }}
                          title="Save change"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.55rem' }}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {cat}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '999px',
                            backgroundColor: count > 0 ? 'var(--accent-primary-light)' : 'var(--bg-muted)',
                            color: count > 0 ? 'var(--accent-primary)' : 'var(--text-dim)',
                            fontWeight: 600
                          }}>
                            {count} {count === 1 ? 'project' : 'projects'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => startEdit(idx, cat)}
                            style={{
                              padding: '0.35rem',
                              color: 'var(--text-dim)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                            title="Rename filter"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(idx)}
                            style={{
                              padding: '0.35rem',
                              color: 'var(--text-dim)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                            title="Delete filter"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
