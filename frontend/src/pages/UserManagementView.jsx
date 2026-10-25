import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Mail, 
  Key, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  AlertCircle, 
  Lock, 
  Sparkles, 
  User, 
  X,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function UserManagementView({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Register Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('User');
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // Delete User Modal State
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const loadUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.getUsers();
        if (!cancelled) {
          setUsers(data || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          // Auto-retry once with a short delay on first mount failure
          setTimeout(async () => {
            if (cancelled) return;
            try {
              const retryData = await api.getUsers();
              if (!cancelled) {
                setUsers(retryData || []);
                setError('');
              }
            } catch (retryErr) {
              if (!cancelled) setError(retryErr.message || 'Failed to load users');
            } finally {
              if (!cancelled) setLoading(false);
            }
          }, 800);
        }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanName = newName.trim();
    const cleanEmail = newEmail.trim() || `${cleanUsername}@softwarehouse.dev`;

    // Client-side uniqueness validation
    const duplicateName = users.find(u => u.name && u.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (duplicateName) {
      setError(`A user with the name "${cleanName}" already exists. Each user must have a distinct name.`);
      return;
    }

    const duplicateEmail = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail.toLowerCase());
    if (duplicateEmail) {
      setError(`A user with the email "${cleanEmail}" already exists. Each user must have a unique email address.`);
      return;
    }

    const duplicateUsername = users.find(u => u.username && u.username.trim().toLowerCase() === cleanUsername);
    if (duplicateUsername) {
      setError(`Username "${cleanUsername}" is already taken. Please pick a different username.`);
      return;
    }

    setCreating(true);
    try {
      await api.createUser({
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        role: 'User',
        password: newPassword
      });
      setSuccessMsg(`User account "${cleanName}" registered successfully!`);
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

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'User');
    setEditPassword('');
    setEditModalError('');
    setError('');
    setSuccessMsg('');
  };

  // Save Edit User
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditModalError('');

    const cleanName = editName.trim();
    const cleanEmail = editEmail.trim();

    // Check duplicate name
    const duplicateName = users.find(
      u => u.id !== editingUser.id && u.name && u.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicateName) {
      setEditModalError(`A user with the name "${cleanName}" already exists. Please choose a distinct name.`);
      return;
    }

    // Check duplicate email
    if (cleanEmail) {
      const duplicateEmail = users.find(
        u => u.id !== editingUser.id && u.email && u.email.trim().toLowerCase() === cleanEmail.toLowerCase()
      );
      if (duplicateEmail) {
        setEditModalError(`A user with the email "${cleanEmail}" already exists. Please provide a unique email address.`);
        return;
      }
    }

    setSavingEdit(true);
    try {
      const payload = {
        id: editingUser.id,
        name: cleanName,
        role: 'User',
        email: cleanEmail
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      await api.updateUser(payload);
      setSuccessMsg(`User "${cleanName}" profile updated successfully.`);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setEditModalError(err.message || 'Failed to update user profile');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete User
  const handleDeleteUser = (u) => {
    const isPrimaryAdmin = u.role === 'Admin' || u.username === 'admin';
    if (isPrimaryAdmin) {
      alert('The primary Administrator account cannot be removed.');
      return;
    }
    setUserToDelete(u);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await api.deleteUser(userToDelete.id);
      setSuccessMsg(`User "${userToDelete.name}" was removed successfully.`);
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Filter Users (Admin is completely excluded per user requirements)
  const filteredUsers = users.filter((u) => {
    const isAdmin = u.role === 'Admin' || (u.role && u.role.includes('Admin')) || u.username === 'admin';
    if (isAdmin) return false;

    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));

    return matchesSearch;
  });

  const teamMemberCount = users.filter(u => u.role !== 'Admin' && (!u.role || !u.role.includes('Admin')) && u.username !== 'admin').length;

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 2rem 6rem 2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Registered User Management
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              backgroundColor: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)'
            }}>
              Admin Control
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage authorized credentials, system roles, and portal access permissions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => setShowCreateForm(prev => !prev)}
            className="btn-primary"
            style={{ padding: '0.5rem 0.95rem', fontSize: '0.825rem' }}
          >
            <UserPlus size={16} />
            <span>{showCreateForm ? 'Cancel Registration' : 'Register New User'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div style={{
          backgroundColor: 'var(--accent-danger-light)',
          border: '1px solid var(--accent-danger-border)',
          color: 'var(--accent-danger)',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#059669',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, textTransform: 'uppercase' }}>Registered Team Members</span>
            <Users size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
            {teamMemberCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Active database records</span>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, textTransform: 'uppercase' }}>Portal Access Level</span>
            <ShieldCheck size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', marginTop: '0.65rem' }}>
            Standard User
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Authorized for User Portal</span>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, textTransform: 'uppercase' }}>Assigned System Role</span>
            <User size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.65rem' }}>
            Team Member (User)
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Strict User permission scope</span>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, textTransform: 'uppercase' }}>Identity Policy</span>
            <Sparkles size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.65rem' }}>
            Unique Identity
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Distinct names & emails enforced</span>
        </div>
      </div>

      {/* Collapsible Register New User Form */}
      {showCreateForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem', border: '1px solid var(--accent-primary-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Register New User Account
              </h3>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: 0 }}>
                Ensure each user has a unique username, distinct display name, and unique email
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Username *
                </label>
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
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Michael Ross (must be unique)"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. michael@softwarehouse.dev"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Assigned Role
                </label>
                <div style={{
                  height: '38px',
                  padding: '0 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <User size={15} />
                  <span>Team Member (User)</span>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Password *
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password (e.g. user123)"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={creating}
              >
                <Sparkles size={15} />
                <span>{creating ? 'Registering...' : 'Complete User Registration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ position: 'relative', width: '360px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem', height: '38px', borderRadius: '8px' }}
            placeholder="Search by name, username, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            backgroundColor: 'var(--bg-card)',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'Team Member' : 'Team Members'}
          </span>
        </div>
      </div>

      {/* User Accounts Card List */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem auto' }} />
          <div>Loading registered users...</div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--text-dim)' }} />
          <div style={{ fontWeight: 600 }}>No user accounts found</div>
          <div style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>Try adjusting your search query or role filter.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredUsers.map((u) => {
            const isAdmin = u.role === 'Admin' || (u.role && u.role.includes('Admin'));
            const initialLetters = u.name ? u.name.slice(0, 2).toUpperCase() : 'US';

            return (
              <div
                key={u.id}
                className="card"
                style={{
                  padding: '1.1rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* User Identity Column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: isAdmin ? '#2563eb' : '#0891b2',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    flexShrink: 0
                  }}>
                    {initialLetters}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.975rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {u.name}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        backgroundColor: isAdmin ? 'var(--accent-primary-light)' : 'rgba(16, 185, 129, 0.12)',
                        color: isAdmin ? 'var(--accent-primary)' : '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {isAdmin ? <Shield size={11} /> : <User size={11} />}
                        <span>{u.role || 'User'}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem', fontSize: '0.785rem', color: 'var(--text-dim)' }}>
                      <span>@{u.username}</span>
                      <span>&bull;</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Mail size={12} />
                        <span>{u.email || `${u.username}@softwarehouse.dev`}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={isAdmin}
                    className="btn-icon"
                    style={{
                      padding: '0.45rem',
                      color: isAdmin ? 'var(--text-dim)' : 'var(--accent-danger)',
                      cursor: isAdmin ? 'not-allowed' : 'pointer',
                      opacity: isAdmin ? 0.4 : 1
                    }}
                    title={isAdmin ? "Primary Administrator cannot be deleted" : `Delete account "${u.name}"`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit User Modal Dialog (Card Styled) */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '88vh',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem'
                }}>
                  {editingUser.name ? editingUser.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Edit User Profile: {editingUser.name}
                  </h3>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-dim)', margin: 0 }}>
                    Username: @{editingUser.username}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Single Scrollable Container with Cards) */}
            <div style={{
              padding: '1.25rem 1.5rem',
              flex: 1,
              overflowY: 'auto',
              overscrollBehavior: 'contain'
            }}>
              {editModalError && (
                <div style={{
                  backgroundColor: 'var(--accent-danger-light)',
                  border: '1px solid var(--accent-danger-border)',
                  color: 'var(--accent-danger)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={15} />
                  <span>{editModalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit}>
                {/* Card 1: Identity Information */}
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1rem'
                }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.65rem' }}>
                    Identity Details
                  </span>

                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                      Must be distinct from all other users.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                      Must be unique across all registered users.
                    </span>
                  </div>
                </div>

                {/* Card 2: Role & Security */}
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem'
                }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.65rem' }}>
                    Access & Credentials
                  </span>

                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      System Role
                    </label>
                    <div style={{
                      height: '38px',
                      padding: '0 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-muted)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}>
                      <User size={15} />
                      <span>Team Member (User)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Change Password (optional)
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep existing password"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingEdit}
                  >
                    <Check size={15} />
                    <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Premium Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        title="Delete User Account"
        itemName={userToDelete?.name}
        itemType="user"
        confirmText="Delete User"
        isDeleting={isDeletingUser}
        onConfirm={handleConfirmDeleteUser}
        onClose={() => !isDeletingUser && setUserToDelete(null)}
      />
    </div>
  );
}
