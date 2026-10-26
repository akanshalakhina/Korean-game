import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import { ToastContainer, XPPopups } from './components/Toast';
import Dashboard from './pages/Dashboard';
import WritingPractice from './pages/WritingPractice';
import HangulPage from './pages/HangulPage';
import AlphabetAZPage from './pages/AlphabetAZPage';
import SentencePractice from './pages/SentencePractice';
import QuizGame from './pages/QuizGame';
import MemoryMatch from './pages/MemoryMatch';
import AchievementsPage from './pages/AchievementsPage';
import { loadProgress, updateStreak } from './store/progressStore';
import { useToasts, useXPPopup } from './hooks/useUtils';
import './index.css';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [progress, setProgress] = useState(loadProgress());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { toasts, addToast } = useToasts();
  const { popups, showXP } = useXPPopup();

  // Update streak on load
  useEffect(() => {
    const updated = updateStreak();
    setProgress(updated);
    if (updated.streak > 1) {
      addToast(`🔥 ${updated.streak}-day streak! Keep it going!`, 'achievement');
    }
  }, []);

  const handleProgressUpdate = useCallback((newProgress) => {
    setProgress(newProgress);
  }, []);

  const handleNavigate = useCallback((view, categoryId) => {
    setActiveView(view);
    setSelectedCategory(categoryId || null);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderView = () => {
    const sharedProps = {
      progress,
      onProgressUpdate: handleProgressUpdate,
      addToast,
      showXP,
    };

    switch (activeView) {
      case 'dashboard':
        return <Dashboard {...sharedProps} onNavigate={handleNavigate} />;
      case 'az':
        return <AlphabetAZPage {...sharedProps} />;
      case 'learn':
        return <WritingPractice {...sharedProps} selectedCategory={selectedCategory} />;
      case 'hangul':
        return <HangulPage {...sharedProps} />;
      case 'sentences':
        return <SentencePractice {...sharedProps} />;
      case 'quiz':
        return <QuizGame {...sharedProps} />;
      case 'match':
        return <MemoryMatch {...sharedProps} />;
      case 'achievements':
        return <AchievementsPage {...sharedProps} />;
      default:
        return <Dashboard {...sharedProps} onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      <div className="app-bg" />

      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className="mobile-header-title">
          <span className="mobile-flag">🇰🇷</span>
          <span>Korean Quest</span>
        </div>
        <div className="mobile-streak-chip">
          🔥 {progress.streak}d
        </div>
      </header>

      <div className="app-layout">
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          progress={progress}
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
        <main className="main-content">
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Thumb Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigate('dashboard')}
        >
          <span className="mobile-nav-icon">🏠</span>
          <span className="mobile-nav-label">Home</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeView === 'az' ? 'active' : ''}`}
          onClick={() => handleNavigate('az')}
        >
          <span className="mobile-nav-icon">🔤</span>
          <span className="mobile-nav-label">A-Z Basics</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeView === 'learn' ? 'active' : ''}`}
          onClick={() => handleNavigate('learn')}
        >
          <span className="mobile-nav-icon">✍️</span>
          <span className="mobile-nav-label">Words (10x)</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeView === 'sentences' ? 'active' : ''}`}
          onClick={() => handleNavigate('sentences')}
        >
          <span className="mobile-nav-icon">📝</span>
          <span className="mobile-nav-label">Sentences</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeView === 'hangul' ? 'active' : ''}`}
          onClick={() => handleNavigate('hangul')}
        >
          <span className="mobile-nav-icon">🇰🇷</span>
          <span className="mobile-nav-label">Hangul</span>
        </button>
      </nav>

      <ToastContainer toasts={toasts} />
      <XPPopups popups={popups} />
    </>
  );
}
