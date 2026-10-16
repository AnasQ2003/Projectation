import React, { useState, useEffect } from 'react';
import SplashLogo from './components/SplashLogo';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './components/ProjectDetail';
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
          // If clicked projects, go back to overview
          if (tab === 'projects') {
            setSelectedProjectId(null);
          }
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

        {/* View Router: Dashboard or Detailed Project Workspace */}
        <main style={{ flex: 1 }}>
          {selectedProjectId ? (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => setSelectedProjectId(null)}
              onProjectDeleted={() => setSelectedProjectId(null)}
            />
          ) : (
            <Dashboard
              onSelectProject={(id) => setSelectedProjectId(id)}
              searchQuery={searchQuery}
              showNewProjectModal={showNewProjectModal}
              setShowNewProjectModal={setShowNewProjectModal}
            />
          )}
        </main>
      </div>
    </div>
  );
}
