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

  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('projectation_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Light Theme is DEFAULT (switches to dark only when toggled by Admin)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('projectation_theme') || 'light';
  });

  // Drawer / Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  // Navigation State
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('projectation_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Left Drawer / Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedProjectId(null);
        }}
        user={user}
        projectCount={totalProjectsCount}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Navbar */}
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNewProject={() => setShowNewProjectModal(true)}
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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showNewProjectModal={showNewProjectModal}
              setShowNewProjectModal={setShowNewProjectModal}
              onProjectsLoaded={(count) => setTotalProjectsCount(count)}
            />
          )}
        </main>

        {/* Global Create Project Modal when inside project details or other views */}
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
