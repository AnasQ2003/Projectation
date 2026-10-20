import React, { useState, useEffect } from 'react';
import SplashLogo from './components/SplashLogo';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AllTasksView from './pages/AllTasksView';
import TeamView from './pages/TeamView';
import RoadmapView from './pages/RoadmapView';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';
import { api } from './services/api';

export default function App() {
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Authentication State — Starts as null so user ALWAYS sees Login Screen after loading screen
  const [user, setUser] = useState(null);

  // Drawer / Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  // Navigation State
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);

  // Theme: strictly white/light only
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('projectation_theme', 'light');
  }, []);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('projectation_token');
    localStorage.removeItem('projectation_user');
    setUser(null);
    setSelectedProjectId(null);
    setShowSplash(true);
  };

  // If initial splash is active, show the splash loading screen
  if (showSplash) {
    return <SplashLogo onFinish={() => setShowSplash(false)} />;
  }

  // If user is not logged in, show the login portal
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      {/* Mobile sidebar backdrop */}
      <div
        className={`sidebar-backdrop${sidebarMobileOpen ? ' open' : ''}`}
        onClick={() => setSidebarMobileOpen(false)}
      />

      {/* Left Drawer / Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        setMobileOpen={setSidebarMobileOpen}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedProjectId(null);
          setSidebarMobileOpen(false);
        }}
        user={user}
        projectCount={totalProjectsCount}
      />

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Navbar */}
        <Navbar
          onLogout={handleLogout}
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNewProject={() => setShowNewProjectModal(true)}
          onToggleSidebar={() => setSidebarMobileOpen(prev => !prev)}
        />

        {/* View Router for all 4 sidebar options & Project Detail */}
        <main style={{ flex: 1 }}>
          {selectedProjectId ? (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => setSelectedProjectId(null)}
              onProjectDeleted={() => setSelectedProjectId(null)}
            />
          ) : activeTab === 'tasks' ? (
            <AllTasksView
              onSelectProject={(id) => setSelectedProjectId(id)}
            />
          ) : activeTab === 'team' ? (
            <TeamView
              onSelectProject={(id) => setSelectedProjectId(id)}
            />
          ) : activeTab === 'timeline' ? (
            <RoadmapView
              onSelectProject={(id) => setSelectedProjectId(id)}
            />
          ) : (
            <Dashboard
              onSelectProject={(id) => setSelectedProjectId(id)}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setSelectedProjectId(null);
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showNewProjectModal={showNewProjectModal}
              setShowNewProjectModal={setShowNewProjectModal}
              onProjectsLoaded={(count) => setTotalProjectsCount(count)}
            />
          )}
        </main>

        {/* Global Create Project Modal */}
        {showNewProjectModal && (
          <NewProjectModal
            onClose={() => setShowNewProjectModal(false)}
            onProjectCreated={() => {
              setSelectedProjectId(null);
              setActiveTab('projects');
              setShowNewProjectModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
