import React from 'react';

export function ToastContainer({ toasts }) {
  if (toasts.length === 0) return null;

  const icons = {
    success: '✅',
    error: '❌',
    achievement: '🏆',
    xp: '⚡',
    info: 'ℹ️',
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span className="toast-icon">{icons[toast.type] || '📢'}</span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export function XPPopups({ popups }) {
  return (
    <>
      {popups.map((p) => (
        <div
          key={p.id}
          className="xp-popup"
          style={{ left: p.x || '50%', top: p.y || '50%' }}
        >
          +{p.amount} XP ⚡
        </div>
      ))}
    </>
  );
}
