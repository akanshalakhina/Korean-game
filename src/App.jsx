import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import { ToastContainer, XPPopups } from './components/Toast';
import Dashboard from './pages/Dashboard';
import WritingPractice from './pages/WritingPractice';
import HangulPage from './pages/HangulPage';
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
    window.scrollTo(0, 0);
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
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

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

      <ToastContainer toasts={toasts} />
      <XPPopups popups={popups} />
    </>
  );
}
