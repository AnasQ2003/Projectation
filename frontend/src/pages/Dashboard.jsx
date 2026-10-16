import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import NewProjectModal from '../components/NewProjectModal';
import { getDeadlineInfo } from '../utils/dateUtils';

export default function Dashboard({ 
  onSelectProject, 
  searchQuery, 
  showNewProjectModal, 
  setShowNewProjectModal 
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
      setProjects(projectsData);
      setStats(statsData);
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

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Projects Overview
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Welcome Anas &bull; Monitor your software sprints, team velocity, and client deadlines
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

        {/* 4 Clean Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem'
        }}>
          {/* Total Projects */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Projects
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {projects.length}
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--accent-success)', fontWeight: 500 }}>
                Active repositories
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
              <FolderKanban size={20} />
            </div>
          </div>

          {/* Active Sprints */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Sprint Tasks
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                {stats?.active_tasks || 0}
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                {stats?.completed_tasks || 0} completed
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
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* Team Members */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Team Members
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {stats?.total_members || 0}
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                Assigned engineers
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
              color: 'var(--text-muted)'
            }}>
              <Users size={20} />
            </div>
          </div>

          {/* Deadline Alerts */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: urgentCount > 0 ? '1px solid var(--accent-danger-border)' : '1px solid var(--border-subtle)',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Deadline Alerts
              </span>
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
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: urgentCount > 0 ? 'var(--accent-danger-light)' : 'var(--accent-success-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: urgentCount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)'
            }}>
              <Clock size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)'
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

        {/* Urgency Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          <p style={{ fontSize: '0.85rem' }}>Loading projects...</p>
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            No matching projects found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No results for "${searchQuery}".` : 'Get started by creating your first project.'}
          </p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="btn-primary"
            style={{ display: 'inline-flex' }}
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.25rem'
        }}>
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
          onProjectCreated={fetchDashboardData}
        />
      )}
    </div>
  );
}
