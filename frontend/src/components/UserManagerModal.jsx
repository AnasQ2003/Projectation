import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Edit2, 
  Check, 
  Trash2, 
  Shield, 
  User, 
  Lock, 
  Mail, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function UserManagerModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('User');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Creating new user state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStartEdit = (u) => {
    setEditingUserId(u.id);
    setEditName(u.name);
    setEditRole(u.role || 'User');
    setEditEmail(u.email || '');
    setEditPassword('');
    setError('');
    setSuccessMsg('');
  };

  const handleSaveEdit = async (id) => {
    setSavingEdit(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        id,
        name: editName,
        role: editRole,
        email: editEmail
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      await api.updateUser(payload);
      setSuccessMsg('User updated successfully!');
      setEditingUserId(null);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.createUser({
        username: newUsername,
        name: newName,
        email: newEmail,
        role: newRole,
        password: newPassword
      });
      setSuccessMsg('New registered user created successfully!');
      setShowCreateForm(false);
      setNewUsername('');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id, role, name) => {
    if (role === 'Admin') {
      alert('Primary Administrator cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user account "${name}"?`)) return;
    try {
      await api.deleteUser(id);
      setSuccessMsg('User removed successfully.');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 999 }}>
      <div 
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '92%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Registered User Management
              </h3>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage user credentials, roles, and permissions (Admin Only)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div style={{
              backgroundColor: 'var(--accent-danger-light)',
              border: '1px solid var(--accent-danger-border)',
              color: 'var(--accent-danger)',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#059669',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Toggle Create User */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Registered Accounts ({users.length})
            </span>
            <button
              onClick={() => setShowCreateForm(prev => !prev)}
              className="btn-primary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
            >
              <UserPlus size={15} />
              <span>{showCreateForm ? 'Cancel New User' : 'Register New User'}</span>
            </button>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateUser} style={{
              backgroundColor: 'var(--bg-app)',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                Register New User
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. michael"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Michael Ross"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="User">Team Member (User)</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Set password"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. michael@softwarehouse.dev"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {creating ? 'Registering...' : 'Complete User Registration'}
              </button>
            </form>
          )}

          {/* User List */}
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading users...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {users.map((u) => {
                const isEditing = editingUserId === u.id;
                const isAdmin = u.role === 'Admin' || (u.role && u.role.includes('Admin'));

                return (
                  <div
                    key={u.id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '1rem',
                      backgroundColor: isEditing ? 'rgba(37, 99, 235, 0.02)' : '#ffffff'
                    }}
                  >
                    {isEditing ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label className="form-label">Full Name</label>
                            <input
                              type="text"
                              className="form-input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="form-label">Role</label>
                            <select
                              className="form-select"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                            >
                              <option value="User">Team Member (User)</option>
                              <option value="Admin">Administrator</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div>
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-input"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="form-label">New Password (leave blank to keep)</label>
                            <input
                              type="password"
                              className="form-input"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="Leave blank to keep current"
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(u.id)}
                            disabled={savingEdit}
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: isAdmin ? 'var(--accent-primary)' : '#059669',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {u.name}
                              </span>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '12px',
                                backgroundColor: isAdmin ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: isAdmin ? '#2563eb' : '#059669',
                                border: `1px solid ${isAdmin ? 'rgba(37, 99, 235, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                              }}>
                                {isAdmin ? 'ADMIN' : 'USER'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              @{u.username} • {u.email || `${u.username}@softwarehouse.dev`}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.785rem', gap: '0.35rem' }}
                            title="Edit user details and password"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          {!isAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.role, u.name)}
                              className="btn-icon"
                              style={{ color: 'var(--accent-danger)' }}
                              title="Delete user account"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
