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
import UserPortalView from './components/UserPortalView';
import UserManagementView from './pages/UserManagementView';
import { api } from './services/api';
import { encryptClientData, decryptClientData } from './utils/crypto';

export default function App() {
  // Splash Screen State — Only show splash on initial cold startup without existing login session
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem('projectation_token');
  });

  // Authentication State — Synchronously restore from encrypted localStorage so reload/DevTools NEVER kicks user to login
  const [user, setUser] = useState(() => {
    try {
      const rawUser = localStorage.getItem('projectation_user');
      const rawToken = localStorage.getItem('projectation_token');
      if (rawUser && rawToken) {
        const decrypted = decryptClientData(rawUser);
        return typeof decrypted === 'object' ? decrypted : JSON.parse(decrypted);
      }
    } catch {
      // Fallback
    }
    return null;
  });

  // Live Data Refresh Counter (forces components to re-fetch freshest SQL Server data on changes)
  const [refreshCount, setRefreshCount] = useState(0);
  const triggerRefresh = () => setRefreshCount(prev => prev + 1);

  // Drawer / Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  // Navigation State
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);

  // ── Handlers defined BEFORE effects so they are available in closures ──
  const handleLogout = () => {
    localStorage.removeItem('projectation_token');
    localStorage.removeItem('projectation_user');
    setUser(null);
    setSelectedProjectId(null);
    setShowSplash(false);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowSplash(false);
    triggerRefresh();
    const isAdmin = userData.role === 'Admin' || (userData.role && userData.role.includes('Admin'));
    api.syncWorkspaceStream(isAdmin, userData).catch(() => {});
  };

  // Theme: strictly white/light only
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('projectation_theme', 'light');

    // Background session verification — if token valid, refresh stream
    const storedToken = localStorage.getItem('projectation_token');
    if (storedToken) {
      api.verifyToken()
        .then((res) => {
          if (res && res.valid && res.user) {
            setUser(res.user);
            localStorage.setItem('projectation_user', encryptClientData(JSON.stringify(res.user)));
            const isAdmin = res.user.role === 'Admin' || (res.user.role && res.user.role.includes('Admin'));
            api.syncWorkspaceStream(isAdmin, res.user).catch(() => {});
          }
        })
        .catch(() => {
          // Retain existing session on transient network errors
        });
    } else {
      // Fast lightweight startup handshake
      api.ping().catch(() => {});
    }
  }, []);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If initial splash is active, show the splash loading screen
  if (showSplash) {
    return <SplashLogo onFinish={() => setShowSplash(false)} />;
  }

  // If user is not logged in, show the login portal
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // If user is a regular Team Member, show the dedicated User Portal View
  const isAdmin = user.role === 'Admin' || (user.role && user.role.includes('Admin'));
  if (!isAdmin) {
    return <UserPortalView user={user} onLogout={handleLogout} />;
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

        {/* View Router for sidebar options & Project Detail */}
        <main style={{ flex: 1 }}>
          {selectedProjectId ? (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => {
                setSelectedProjectId(null);
                triggerRefresh();
              }}
              onProjectDeleted={() => {
                setSelectedProjectId(null);
                triggerRefresh();
              }}
            />
          ) : activeTab === 'tasks' ? (
            <AllTasksView
              onSelectProject={(id) => setSelectedProjectId(id)}
              refreshTrigger={refreshCount}
            />
          ) : activeTab === 'team' ? (
            <TeamView
              onSelectProject={(id) => setSelectedProjectId(id)}
              refreshTrigger={refreshCount}
            />
          ) : activeTab === 'timeline' ? (
            <RoadmapView
              onSelectProject={(id) => setSelectedProjectId(id)}
              refreshTrigger={refreshCount}
            />
          ) : activeTab === 'users' ? (
            <UserManagementView
              refreshTrigger={refreshCount}
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
              refreshTrigger={refreshCount}
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
              triggerRefresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
