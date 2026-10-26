import React from 'react';
import { getLevelFromXP, categories } from '../data/koreanData';
import { formatNumber } from '../hooks/useUtils';

export default function Dashboard({ progress, onNavigate }) {
  const levelInfo = getLevelFromXP(progress.xp);
  const uniqueWords = progress.wordsLearned.length;
  const totalPractice = Object.values(progress.writingHistory).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h2 className="text-gradient">Welcome Back! 환영합니다!</h2>
        <p>Continue your Korean learning journey 🚀</p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.15)' }}>⚡</div>
          <div className="stat-info">
            <h4>{formatNumber(progress.xp)}</h4>
            <span>Total XP</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(29, 209, 161, 0.15)' }}>📚</div>
          <div className="stat-info">
            <h4>{uniqueWords}</h4>
            <span>Words Learned</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 159, 243, 0.15)' }}>✍️</div>
          <div className="stat-info">
            <h4>{totalPractice}</h4>
            <span>Total Writes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(254, 202, 87, 0.15)' }}>🔥</div>
          <div className="stat-info">
            <h4>{progress.streak}</h4>
            <span>Day Streak</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(72, 219, 251, 0.15)' }}>🎯</div>
          <div className="stat-info">
            <h4>{progress.quizScores.length}</h4>
            <span>Quizzes Done</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 107, 129, 0.15)' }}>🏆</div>
          <div className="stat-info">
            <h4>{progress.achievements.length}</h4>
            <span>Achievements</span>
          </div>
        </div>
      </div>

      {/* Game Modes */}
      <h3 style={{ fontSize: '22px', marginBottom: 'var(--space-lg)' }}>🎮 Choose Your Game</h3>
      <div className="game-modes" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div
          className="game-mode-card featured-game-card"
          style={{ '--mode-gradient': 'linear-gradient(135deg, rgba(254, 202, 87, 0.25), rgba(108, 92, 231, 0.2))' }}
          onClick={() => onNavigate('az')}
        >
          <span className="game-mode-icon">🔤</span>
          <div className="game-mode-name">A-Z Korean Alphabet Basics</div>
          <div className="game-mode-desc">Learn Korean from English A-Z! Audio pronunciation & 10x screen writing with AI check.</div>
        </div>
        <div
          className="game-mode-card"
          style={{ '--mode-gradient': 'linear-gradient(135deg, rgba(108, 92, 231, 0.15), transparent)' }}
          onClick={() => onNavigate('learn')}
        >
          <span className="game-mode-icon">✍️</span>
          <div className="game-mode-name">Word Writing Practice</div>
          <div className="game-mode-desc">Write each Korean word 10 times to build muscle memory with AI checking!</div>
        </div>
        <div
          className="game-mode-card"
          style={{ '--mode-gradient': 'linear-gradient(135deg, rgba(255, 107, 129, 0.15), transparent)' }}
          onClick={() => onNavigate('hangul')}
        >
          <span className="game-mode-icon">🇰🇷</span>
          <div className="game-mode-name">Hangul Alphabet</div>
          <div className="game-mode-desc">Master the Korean alphabet – consonants & vowels!</div>
        </div>
        <div
          className="game-mode-card"
          style={{ '--mode-gradient': 'linear-gradient(135deg, rgba(0, 210, 211, 0.15), transparent)' }}
          onClick={() => onNavigate('sentences')}
        >
          <span className="game-mode-icon">📝</span>
          <div className="game-mode-name">Sentence Builder</div>
          <div className="game-mode-desc">Learn Korean sentences word-by-word with writing practice!</div>
        </div>
        <div
          className="game-mode-card"
          style={{ '--mode-gradient': 'linear-gradient(135deg, rgba(254, 202, 87, 0.15), transparent)' }}
          onClick={() => onNavigate('quiz')}
        >
          <span className="game-mode-icon">🎯</span>
          <div className="game-mode-name">Quiz Challenge</div>
          <div className="game-mode-desc">Test your knowledge with fun multiple-choice quizzes!</div>
        </div>
        <div
          className="game-mode-card"
          style={{ '--mode-gradient': 'linear-gradient(135deg, rgba(29, 209, 161, 0.15), transparent)' }}
          onClick={() => onNavigate('match')}
        >
          <span className="game-mode-icon">🧩</span>
          <div className="game-mode-name">Memory Match</div>
          <div className="game-mode-desc">Flip cards and match English words with Korean translations!</div>
        </div>
        <div
          className="game-mode-card"
          style={{ '--mode-gradient': 'linear-gradient(135deg, rgba(255, 159, 243, 0.15), transparent)' }}
          onClick={() => onNavigate('achievements')}
        >
          <span className="game-mode-icon">🏆</span>
          <div className="game-mode-name">Achievements</div>
          <div className="game-mode-desc">Track your milestones and unlock rewards!</div>
        </div>
      </div>

      {/* Quick Category Access */}
      <h3 style={{ fontSize: '22px', marginBottom: 'var(--space-lg)' }}>📂 Word Categories</h3>
      <div className="category-grid">
        {categories.map((cat) => {
          const learned = progress.wordsLearned.filter(w => w.categoryId === cat.id).length;
          const pct = (learned / cat.words.length) * 100;
          return (
            <div
              key={cat.id}
              className="category-card"
              style={{ '--card-color': cat.color }}
              onClick={() => onNavigate('learn', cat.id)}
            >
              <span className="category-card-emoji">{cat.emoji}</span>
              <div className="category-card-name">{cat.name}</div>
              <div className="category-card-count">{cat.words.length} words</div>
              <div className="category-card-level">⭐ Level {cat.level}</div>
              <div className="category-card-progress">
                <div className="category-card-progress-fill" style={{ width: `${pct}%`, background: cat.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
