import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Activity, 
  CheckCheck, 
  FolderKanban, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

/**
 * NotificationDropdown — Premium Glassmorphic Notification Bell & Popover
 * Used across both Admin Navbar and User Portal Topbar.
 */
export default function NotificationDropdown({ user, onSelectProject, refreshTrigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === 'Admin' || (user?.role && user.role.includes('Admin'));
  const userRole = isAdmin ? 'Admin' : 'User';
  const userName = user?.name || user?.username || '';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications(userRole, userName);
      if (res && Array.isArray(res.items)) {
        setNotifications(res.items);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 20 seconds for fresh updates in the background
    const timer = setInterval(fetchNotifications, 20000);
    return () => clearInterval(timer);
  }, [userRole, userName, refreshTrigger]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationRead(null, true, userRole, userName);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleItemClick = async (notif) => {
    // Immediately unhighlight in UI state
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (notif.dbId) {
        try {
          await api.markNotificationRead(notif.dbId, false, userRole, userName);
        } catch (err) {
          console.error('Failed to mark read:', err);
        }
      }
    }
    if (notif.linkId && onSelectProject) {
      onSelectProject(notif.linkId);
      setIsOpen(false);
    }
  };

  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Recent';
    const now = new Date();
    const date = new Date(isoString);
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title="View live notifications"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          backgroundColor: isOpen ? 'var(--accent-primary-light)' : 'rgba(255, 255, 255, 0.85)',
          color: isOpen ? 'var(--accent-primary)' : 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.15s ease',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary-border)';
          e.currentTarget.style.backgroundColor = 'var(--accent-primary-light)';
          e.currentTarget.style.color = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
            e.currentTarget.style.color = 'var(--text-main)';
          }
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '999px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.45)',
              border: '2px solid #ffffff',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: '90vw',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.04)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(248, 250, 252, 0.85)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--accent-primary-light)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bell size={15} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                  Notifications
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    color: 'var(--accent-primary)',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer'
                  }}
                  title="Mark all notifications as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* List Area */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem'
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  No notifications
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  You are completely up to date with workspace activity.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((notif) => {
                  const isTaskDone = notif.type === 'task_completed';
                  const isDeadline = notif.type === 'deadline';
                  const isUpdate = notif.type === 'task_status';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderBottom: '1px solid rgba(241, 245, 249, 0.9)',
                        backgroundColor: notif.isRead ? 'transparent' : 'rgba(240, 249, 255, 0.55)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        transition: 'background-color 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(241, 245, 249, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notif.isRead ? 'transparent' : 'rgba(240, 249, 255, 0.55)';
                      }}
                    >
                      {/* Unread indicator */}
                      {!notif.isRead && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '4px',
                            height: '24px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--accent-primary)'
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: isTaskDone 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : isDeadline 
                            ? 'rgba(239, 68, 68, 0.12)' 
                            : isUpdate 
                            ? 'rgba(37, 99, 235, 0.12)' 
                            : 'rgba(241, 245, 249, 0.9)',
                          color: isTaskDone 
                            ? '#059669' 
                            : isDeadline 
                            ? '#dc2626' 
                            : isUpdate 
                            ? '#2563eb' 
                            : 'var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {isTaskDone ? (
                          <CheckCircle2 size={16} />
                        ) : isDeadline ? (
                          <Clock size={16} />
                        ) : isUpdate ? (
                          <Activity size={16} />
                        ) : (
                          <FolderKanban size={16} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: notif.isRead ? 600 : 750,
                              color: 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {notif.title}
                          </span>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)', flexShrink: 0 }}>
                            {formatTimeAgo(notif.timestamp)}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.775rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.45,
                            wordBreak: 'break-word'
                          }}
                        >
                          {notif.message}
                        </p>

                        {/* Priority / tag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                          {notif.priority && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                backgroundColor: notif.priority === 'High' || notif.priority === 'Urgent'
                                  ? 'rgba(239, 68, 68, 0.1)'
                                  : 'rgba(241, 245, 249, 0.8)',
                                color: notif.priority === 'High' || notif.priority === 'Urgent'
                                  ? '#dc2626'
                                  : 'var(--text-dim)'
                              }}
                            >
                              {notif.priority}
                            </span>
                          )}
                          {notif.linkId && (
                            <span style={{ fontSize: '0.675rem', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>View</span>
                              <ChevronRight size={10} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
