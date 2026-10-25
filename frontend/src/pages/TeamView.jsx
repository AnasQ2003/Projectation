import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  FolderKanban, 
  Search, 
  Trash2, 
  Filter, 
  CheckSquare, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Sparkles,
  TrendingUp,
  AlertCircle,
  X,
  Edit3
} from 'lucide-react';

import { api } from '../services/api';
import { getProjectTheme } from '../utils/colorUtils';
import MemberDetailModal from '../components/MemberDetailModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function TeamView({ 
  onSelectProject, 
  refreshTrigger,
  searchQuery: externalSearch,
  setSearchQuery: setExternalSearch
}) {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = externalSearch !== undefined ? externalSearch : internalSearch;
  const setSearchQuery = setExternalSearch || setInternalSearch;
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Full Stack Developer');
  const [newMemberProjectId, setNewMemberProjectId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete Member Confirm Modal State
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, projectsData, usersData] = await Promise.all([
        api.getAllMembers(),
        api.getProjects(),
        api.getUsers()
      ]);
      setMembers(membersData || []);
      setProjects(projectsData || []);
      const regular = (usersData || []).filter(u => (u.role || '').toLowerCase() !== 'admin');
      setRegisteredUsers(regular);
      if (projectsData && projectsData.length > 0 && !newMemberProjectId) {
        setNewMemberProjectId(projectsData[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleDeleteMember = (memberId, memberName) => {
    setMemberToDelete({ id: memberId, name: memberName || 'this team member' });
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeletingMember(true);
    try {
      await api.deleteMember(memberToDelete.id);
      await fetchData();
      setMemberToDelete(null);
    } catch (err) {
      console.error('Error removing member:', err);
    } finally {
      setIsDeletingMember(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  const handleSelectUser = (e) => {
    const uId = e.target.value;
    setSelectedUserId(uId);
    setModalError('');
    if (!uId) return;

    const found = registeredUsers.find(u => u.id.toString() === uId.toString());
    if (found) {
      setNewMemberName(found.name || found.username);
      setNewMemberEmail(found.email || '');
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!selectedUserId) {
      setModalError('Please choose a registered user from the dropdown.');
      return;
    }

    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberProjectId) {
      setModalError('Please select a registered user and choose a project');
      return;
    }

    // Validate that the user is actually registered
    const matchedUser = registeredUsers.find(
      u => (u.email && u.email.toLowerCase() === newMemberEmail.trim().toLowerCase()) ||
           (u.name && u.name.toLowerCase() === newMemberName.trim().toLowerCase()) ||
           (u.username && u.username.toLowerCase() === newMemberName.trim().toLowerCase())
    );

    if (!matchedUser) {
      setModalError(`"${newMemberName.trim()}" is not a registered user. Please register the user in User Management first before assigning them to a project.`);
      return;
    }

    setModalLoading(true);
    try {
      const targetProjId = parseInt(newMemberProjectId);
      const targetTheme = getProjectTheme(targetProjId);
      await api.createMember({
        project_id: targetProjId,
        name: matchedUser.name || matchedUser.username,
        email: matchedUser.email,
        role: newMemberRole,
        avatar_color: targetTheme.bg
      });
      setShowAddModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setSelectedUserId('');
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Failed to add member');
    } finally {
      setModalLoading(false);
    }
  };

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesSearch = searchQuery
      ? m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.project_name && m.project_name.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesProject = selectedProjectFilter === 'ALL' || m.project_id.toString() === selectedProjectFilter;

    return matchesSearch && matchesProject;
  });

  // Calculate team metrics
  const uniqueEngineersCount = registeredUsers.length > 0
    ? registeredUsers.length
    : new Set(members.map(m => (m.email || m.name || '').toLowerCase())).size;
  const totalAssignedTasks = members.reduce((acc, m) => acc + (m.tasks_assigned || 0), 0);
  const totalCompletedTasks = members.reduce((acc, m) => acc + (m.tasks_completed || 0), 0);
  const overallTeamRate = totalAssignedTasks > 0 ? Math.round((totalCompletedTasks / totalAssignedTasks) * 100) : 0;

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Team & Workforce
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track assigned personnel, tasks completion rate, and workload performance
          </p>
        </div>

        <button
          onClick={() => {
            if (projects.length > 0 && !newMemberProjectId) {
              setNewMemberProjectId(projects[0].id.toString());
            }
            setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <UserPlus size={16} />
          <span>Add Member</span>
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* Card 1: Total Team */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Engineers
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {uniqueEngineersCount}
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
              Registered in User Management
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Users size={20} />
          </div>
        </div>

        {/* Card 2: Completed Work */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Work Completed
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.2rem' }}>
              {totalCompletedTasks}
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--accent-success)', fontWeight: 500 }}>
              Tasks finished
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-success-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-success)'
          }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Card 3: Pending Work */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Tasks
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
              {totalAssignedTasks - totalCompletedTasks}
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
              In progress / pending
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Clock size={20} />
          </div>
        </div>

        {/* Card 4: Overall Velocity */}
        <div className="glass-card" style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Team Velocity
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
              {overallTeamRate}%
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
              Overall completion rate
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)'
          }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '12px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.825rem', backgroundColor: 'var(--bg-app)' }}
            placeholder="Search member by name, role, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter by Project */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>Filter by Project:</span>
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.775rem',
              fontWeight: 500,
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Projects ({members.length} members)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Grid */}
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
          <p style={{ fontSize: '0.85rem' }}>Loading team members and task analytics...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px dashed var(--border-strong)'
        }}>
          <Users size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            No members found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No results for "${searchQuery}".` : 'Add engineers to your projects to start tracking workloads.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ display: 'inline-flex' }}
          >
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      ) : (
        <div className="grid-auto member-grid">
          {filteredMembers.map((m) => {
            const isExpanded = expandedMemberId === m.id;
            const completionRate = m.completion_rate || 0;
            const tasksList = m.tasks || [];
            const projectTheme = getProjectTheme(m.project_id, m.project_name);

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="member-card-interactive"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `4px solid ${projectTheme.bg}`,
                  padding: '1.35rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = projectTheme.border;
                  e.currentTarget.style.boxShadow = `0 6px 18px ${projectTheme.light}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div>
                  {/* Top: Avatar, Name, Role + compact action icons */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem', gap: '0.5rem', minWidth: 0 }}>
                    {/* Left: avatar + info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '11px',
                        backgroundColor: projectTheme.bg,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0,
                        boxShadow: `0 2px 8px ${projectTheme.border}`
                      }}>
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.name}
                        </h3>
                        <div style={{
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          color: projectTheme.text,
                          marginBottom: '0.15rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {m.role}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 }}>
                          <Mail size={11} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: compact icon-only action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMember(m);
                        }}
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '6px',
                          backgroundColor: projectTheme.light,
                          color: projectTheme.text,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Assign task / edit member"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMember(m.id, m.name);
                        }}
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-dim)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-danger-light)'; e.currentTarget.style.color = 'var(--accent-danger)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; }}
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Project Tag */}
                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => onSelectProject && onSelectProject(m.project_id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: projectTheme.light,
                        border: `1px solid ${projectTheme.border}`,
                        fontSize: '0.75rem',
                        color: projectTheme.text,
                        fontWeight: 700
                      }}
                      title="Click to view project workspace"
                    >
                      <FolderKanban size={13} color={projectTheme.bg} />
                      <span>{m.project_code || 'PRJ'}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>&bull; {m.project_name}</span>
                    </button>
                  </div>

                  {/* WORK DONE SECTION (Highlighted Feature) */}
                  <div style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Work Done & Velocity
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: completionRate === 100 ? 'var(--accent-success)' : 'var(--accent-primary)'
                      }}>
                        {m.tasks_completed} of {m.tasks_assigned} tasks done ({completionRate}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      height: '7px',
                      backgroundColor: 'var(--bg-muted)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      marginBottom: '0.6rem'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${completionRate}%`,
                        backgroundColor: completionRate === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    {/* Summary row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>
                        {m.tasks_pending} active {m.tasks_pending === 1 ? 'task' : 'tasks'} remaining
                      </span>
                      <span style={{
                        fontWeight: 600,
                        color: completionRate === 100 ? 'var(--accent-success)' : (m.tasks_assigned > 0 ? 'var(--accent-primary)' : 'var(--text-dim)')
                      }}>
                        {completionRate === 100 ? 'All Done! ✓' : (m.tasks_assigned > 0 ? 'Active Contributor' : 'No tasks assigned')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable Assigned Tasks Details */}
                <div>
                  {tasksList.length > 0 && (
                    <button
                      onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckSquare size={13} />
                        <span>{isExpanded ? 'Hide Assigned Tasks' : `View Assigned Tasks (${tasksList.length})`}</span>
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}

                  {isExpanded && tasksList.length > 0 && (
                    <div style={{
                      marginTop: '0.65rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      paddingRight: '0.2rem'
                    }}>
                      {tasksList.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            padding: '0.45rem 0.65rem',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: t.status === 'done' ? 'var(--accent-success)' : 'var(--accent-primary)',
                              flexShrink: 0
                            }} />
                            <span style={{
                              color: 'var(--text-main)',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '180px',
                              textDecoration: t.status === 'done' ? 'line-through' : 'none'
                            }}>
                              {t.title}
                            </span>
                          </div>

                          <select
                            value={t.status}
                            onChange={(e) => handleTaskStatusChange(t.id, e.target.value)}
                            style={{
                              fontSize: '0.675rem',
                              padding: '0.15rem 0.35rem',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-muted)',
                              color: 'var(--text-main)',
                              border: '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assign a new engineer to a project</p>
                </div>
              </div>

              <button onClick={() => setShowAddModal(false)} style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} style={{ padding: '1.6rem' }}>
              {modalError && (
                <div style={{
                  backgroundColor: 'var(--accent-danger-light)',
                  border: '1px solid var(--accent-danger-border)',
                  color: 'var(--accent-danger)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Select Project */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Assign to Project *
                </label>
                <select
                  className="form-input"
                  value={newMemberProjectId}
                  onChange={(e) => setNewMemberProjectId(e.target.value)}
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Registered User */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <span>Select Registered Contributor *</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {registeredUsers.length} available
                  </span>
                </label>
                <select
                  className="form-input"
                  value={selectedUserId}
                  onChange={handleSelectUser}
                  required
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    borderColor: selectedUserId ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    fontWeight: 600
                  }}
                >
                  <option value="">-- Choose a registered contributor --</option>
                  {registeredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.username} ({u.email || `@${u.username}`})
                    </option>
                  ))}
                </select>
                {registeredUsers.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.35rem' }}>
                    No non-admin registered users found. First register them in User Management.
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Full Name (Linked)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Select contributor above..."
                  value={newMemberName}
                  readOnly
                  style={{ backgroundColor: 'var(--bg-muted)', opacity: 0.85, cursor: 'not-allowed' }}
                  required
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Company Email (Linked)
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Select contributor above..."
                  value={newMemberEmail}
                  readOnly
                  style={{ backgroundColor: 'var(--bg-muted)', opacity: 0.85, cursor: 'not-allowed' }}
                  required
                />
              </div>

              {/* Role */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Engineering Role
                </label>
                <select className="form-input" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
                  <option value="Lead Software Architect">Lead Software Architect</option>
                  <option value="Senior Frontend Engineer">Senior Frontend Engineer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Backend / DB Engineer">Backend / DB Engineer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="QA & Security Specialist">QA & Security Specialist</option>
                  <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                </select>
              </div>

              {/* Unified Project Theme Indicator */}
              {(() => {
                const modalTheme = getProjectTheme(parseInt(newMemberProjectId) || 0);
                return (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: modalTheme.light,
                    border: `1px solid ${modalTheme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: modalTheme.bg,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                      flexShrink: 0
                    }} />
                    <div style={{ fontSize: '0.785rem', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 700, color: modalTheme.text }}>
                        Unified Team Theme: {modalTheme.name}
                      </span>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '1px' }}>
                        All members in this project automatically share this color highlight.
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={modalLoading}>
                  <Sparkles size={15} />
                  <span>{modalLoading ? 'Adding...' : 'Add Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Member Details / Working Info & Edit Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          projects={projects}
          onClose={() => setSelectedMember(null)}
          onMemberUpdated={() => {
            fetchData();
            setSelectedMember(null);
          }}
          onTaskAssigned={() => {
            fetchData();
            setSelectedMember(null);
          }}
        />
      )}

      {/* Premium Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!memberToDelete}
        title="Remove Team Member"
        itemName={memberToDelete?.name}
        itemType="member"
        confirmText="Remove Member"
        isDeleting={isDeletingMember}
        onConfirm={handleConfirmDeleteMember}
        onClose={() => !isDeletingMember && setMemberToDelete(null)}
      />
    </div>
  );
}
