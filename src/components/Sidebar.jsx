import React from 'react';
import { getLevelFromXP } from '../data/koreanData';

export default function Sidebar({ activeView, onNavigate, progress, sidebarOpen, onCloseSidebar }) {
  const levelInfo = getLevelFromXP(progress.xp);
  const xpPct = Math.min((levelInfo.currentXP / levelInfo.nextLevelXP) * 100, 100);

  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'az', icon: '🔤', label: 'A-Z Korean Basics' },
    { id: 'learn', icon: '✍️', label: 'Word Writing (10x)' },
    { id: 'hangul', icon: '🇰🇷', label: 'Hangul Alphabet' },
    { id: 'sentences', icon: '📝', label: 'Sentences' },
    { id: 'quiz', icon: '🎯', label: 'Quiz Game' },
    { id: 'match', icon: '🧩', label: 'Memory Match' },
    { id: 'achievements', icon: '🏆', label: 'Achievements' },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={onCloseSidebar} />
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🇰🇷</div>
          <div>
            <h1>한글 학습</h1>
            <span>Korean Learning</span>
          </div>
        </div>

        <div className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                onCloseSidebar();
              }}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Streak Display */}
        {progress.streak > 0 && (
          <div className="streak-display" style={{ marginBottom: 'var(--space-md)' }}>
            🔥 {progress.streak} Day Streak!
          </div>
        )}

        {/* XP Bar */}
        <div className="xp-bar-container">
          <div className="xp-level">
            <div className="xp-level-badge">{levelInfo.level}</div>
            <span className="xp-level-text">Level {levelInfo.level}</span>
          </div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="xp-text">
            {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP
          </div>
        </div>
      </nav>
    </>
  );
}
