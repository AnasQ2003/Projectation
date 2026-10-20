import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Filter,
  RotateCcw,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import NewProjectModal from '../components/NewProjectModal';
import { getDeadlineInfo } from '../utils/dateUtils';

export default function Dashboard({ 
  onSelectProject, 
  onNavigate,
  searchQuery, 
  setSearchQuery,
  showNewProjectModal, 
  setShowNewProjectModal,
  onProjectsLoaded
}) {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsData, statsData] = await Promise.all([
        api.getProjects(),
        api.getStats()
      ]);
      setProjects(projectsData || []);
      setStats(statsData);
      if (onProjectsLoaded) {
        onProjectsLoaded(projectsData ? projectsData.length : 0);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(projectId);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete project: ' + err.message);
    }
  };

  const handleProjectCreated = () => {
    // Reset filters so the newly created project is immediately visible!
    setSelectedCategory('ALL');
    setSelectedUrgency('ALL');
    if (setSearchQuery) setSearchQuery('');
    fetchDashboardData();
  };

  const clearAllFilters = () => {
    setSelectedCategory('ALL');
    setSelectedUrgency('ALL');
    if (setSearchQuery) setSearchQuery('');
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    const deadlineInfo = getDeadlineInfo(p.deadline);
    let matchesUrgency = true;
    if (selectedUrgency === 'OVERDUE') matchesUrgency = deadlineInfo.status === 'overdue' || deadlineInfo.status === 'today';
    if (selectedUrgency === 'URGENT') matchesUrgency = deadlineInfo.status === 'urgent';
    if (selectedUrgency === 'SAFE') matchesUrgency = deadlineInfo.status === 'safe';

    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const urgentCount = projects.filter(p => {
    const d = getDeadlineInfo(p.deadline);
    return d.status === 'urgent' || d.status === 'overdue' || d.status === 'today';
  }).length;

  const hasActiveFilter = selectedCategory !== 'ALL' || selectedUrgency !== 'ALL' || (searchQuery && searchQuery.trim().length > 0);

  return (
    <div className="animate-fade-in page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Projects Overview
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Monitor your software sprints, team velocity, and client deadlines
            </p>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        </div>

        {/* 4 Clickable Glassmorphism Metric Cards */}
        <div className="stats-row">
          {/* Card 1: Total Projects */}
          <div 
            className="glass-card stat-card-clickable"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedUrgency('ALL');
              if (setSearchQuery) setSearchQuery('');
              document.getElementById('projects-grid-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Click to view all projects"
            style={{
              padding: '1.15rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Projects
                </span>
                <ArrowUpRight size={13} className="click-indicator" color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {projects.length}
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                Active repositories
              </span>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '11px',
              backgroundColor: 'var(--accent-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
            }}>
              <FolderKanban size={20} />
            </div>
          </div>

          {/* Card 2: Sprint Tasks */}
          <div 
            className="glass-card stat-card-clickable"
            onClick={() => {
              if (onNavigate) onNavigate('tasks');
            }}
            title="Click to manage all sprint tasks"
            style={{
              padding: '1.15rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sprint Tasks
                </span>
                <ArrowUpRight size={13} className="click-indicator" color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                {stats?.active_tasks || 0}
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                {stats?.completed_tasks || 0} completed
              </span>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '11px',
              backgroundColor: 'var(--accent-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
            }}>
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* Card 3: Team Members */}
          <div 
            className="glass-card stat-card-clickable"
            onClick={() => {
              if (onNavigate) onNavigate('team');
            }}
            title="Click to view team members"
            style={{
              padding: '1.15rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Team Members
                </span>
                <ArrowUpRight size={13} className="click-indicator" color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {stats?.total_members || 0}
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Assigned engineers
              </span>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '11px',
              backgroundColor: 'var(--bg-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}>
              <Users size={20} />
            </div>
          </div>

          {/* Card 4: Deadline Alerts */}
          <div 
            className="glass-card stat-card-clickable"
            onClick={() => {
              setSelectedUrgency(prev => prev === 'URGENT' ? 'ALL' : 'URGENT');
              document.getElementById('projects-grid-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            title={urgentCount > 0 ? "Click to filter projects due soon or overdue" : "Click to view all healthy deadlines"}
            style={{
              padding: '1.15rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderColor: urgentCount > 0 ? 'var(--accent-danger-border)' : undefined
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Deadline Alerts
                </span>
                <ArrowUpRight size={13} className="click-indicator" color={urgentCount > 0 ? "var(--accent-danger)" : "var(--accent-success)"} />
              </div>
              <div style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: urgentCount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)',
                marginTop: '0.2rem'
              }}>
                {urgentCount}
              </div>
              <span style={{
                fontSize: '0.725rem',
                color: urgentCount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)',
                fontWeight: 600
              }}>
                {urgentCount > 0 ? 'Due soon / Overdue' : 'All deadlines healthy'}
              </span>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '11px',
              backgroundColor: urgentCount > 0 ? 'var(--accent-danger-light)' : 'var(--accent-success-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: urgentCount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)',
              boxShadow: urgentCount > 0 ? '0 2px 8px rgba(220, 38, 38, 0.15)' : '0 2px 8px rgba(22, 163, 74, 0.15)'
            }}>
              <Clock size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Frosted Glass Panel) */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '12px'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <Filter size={14} />
            <span>Category:</span>
          </div>

          {['ALL', 'Full Stack SaaS', 'Fintech Mobile', 'Artificial Intelligence', 'Healthcare Cloud'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontWeight: selectedCategory === cat ? 600 : 500,
                backgroundColor: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--bg-muted)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Urgency Filter and Clear Filters button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>Deadline status:</span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              style={{
                padding: '0.3rem 0.65rem',
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
              <option value="ALL">All Deadlines</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="URGENT">Urgent (&lt; 3 Days)</option>
              <option value="SAFE">On Track / Safe</option>
            </select>
          </div>

          {hasActiveFilter && (
            <button
              onClick={clearAllFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-primary-light)',
                border: '1px solid var(--accent-primary-border)',
                fontWeight: 600
              }}
              title="Clear all filters to show every project"
            >
              <RotateCcw size={12} />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
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
          <p style={{ fontSize: '0.85rem' }}>Loading projects from SQL Server...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px dashed var(--border-strong)'
        }}>
          <FolderKanban size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
          
          {projects.length > 0 ? (
            <>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                No projects match the current filter
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                You have {projects.length} {projects.length === 1 ? 'project' : 'projects'} in your database, but {projects.length === 1 ? 'it is' : 'they are'} hidden by the active filter ({selectedUrgency !== 'ALL' ? `Deadline: ${selectedUrgency}` : ''} {selectedCategory !== 'ALL' ? `Category: ${selectedCategory}` : ''} {searchQuery ? `Search: "${searchQuery}"` : ''}).
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button
                  onClick={clearAllFilters}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', padding: '0.5rem 1rem' }}
                >
                  <RotateCcw size={15} />
                  <span>Show All Projects ({projects.length})</span>
                </button>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="btn-primary"
                  style={{ display: 'inline-flex', padding: '0.5rem 1rem' }}
                >
                  <Plus size={16} />
                  <span>Create New Project</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                No projects yet
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Get started by creating your first software house project.
              </p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="btn-primary"
                style={{ display: 'inline-flex' }}
              >
                <Plus size={16} />
                <span>Create Project</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div id="projects-grid-section" className="grid-auto">
          {filteredProjects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onSelect={onSelectProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}
