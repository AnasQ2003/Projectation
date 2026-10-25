import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * ConfirmDeleteModal — Premium, accessible confirmation modal for destructive actions.
 * Replaces ugly browser native window.confirm popups with a modern, elegant SaaS experience.
 */
export default function ConfirmDeleteModal({
  isOpen,
  title = 'Confirm Deletion',
  itemName = '',
  itemType = 'item', // 'project' | 'task' | 'member' | 'item'
  message,
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  isDeleting = false,
  onConfirm,
  onClose
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const defaultMessage = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={!isDeleting ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
        animation: 'fadeIn 0.15s ease-out forwards'
      }}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '1.75rem',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        {!isDeleting && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.15rem',
              right: '1.15rem',
              color: 'var(--text-dim)',
              padding: '0.35rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
              e.currentTarget.style.color = 'var(--text-main)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-dim)';
            }}
            title="Cancel and close"
          >
            <X size={18} />
          </button>
        )}

        {/* Warning Icon Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.25 }}>
              {title}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Irreversible Action
            </span>
          </div>
        </div>

        {/* Description Body */}
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          marginBottom: '1.5rem',
          marginRight: '0.5rem'
        }}>
          {message || defaultMessage}
        </p>

        {/* Item Highlight Box if provided */}
        {itemName && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.825rem',
              color: 'var(--text-main)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <Trash2 size={14} color="#dc2626" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {itemName}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary"
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            <Trash2 size={15} />
            <span>{isDeleting ? 'Deleting...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
