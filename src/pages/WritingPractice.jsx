import React, { useState, useRef, useEffect } from 'react';
import { categories, XP_REWARDS } from '../data/koreanData';
import { recordWordPractice, addXP, unlockAchievement } from '../store/progressStore';
import confetti from 'canvas-confetti';

const REQUIRED_WRITES = 10;

export default function WritingPractice({ progress, onProgressUpdate, addToast, showXP, selectedCategory }) {
  const [currentCategory, setCurrentCategory] = useState(selectedCategory || null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [attempts, setAttempts] = useState(Array(REQUIRED_WRITES).fill(''));
  const [statuses, setStatuses] = useState(Array(REQUIRED_WRITES).fill(null)); // null | 'correct' | 'incorrect'
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [wordCompleted, setWordCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef(null);

  const category = categories.find(c => c.id === currentCategory);
  const currentWord = category?.words[currentWordIndex];

  useEffect(() => {
    if (inputRef.current && currentAttempt < REQUIRED_WRITES) {
      inputRef.current.focus();
    }
  }, [currentAttempt, currentCategory, currentWordIndex]);

  // Reset when category or word changes
  useEffect(() => {
    setAttempts(Array(REQUIRED_WRITES).fill(''));
    setStatuses(Array(REQUIRED_WRITES).fill(null));
    setCurrentAttempt(0);
    setInputValue('');
    setWordCompleted(false);
    setShowHint(false);
  }, [currentCategory, currentWordIndex]);

  function handleSubmitAttempt(e) {
    e.preventDefault();
    if (!currentWord || currentAttempt >= REQUIRED_WRITES) return;

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const isCorrect = trimmed === currentWord.korean;

    const newAttempts = [...attempts];
    newAttempts[currentAttempt] = trimmed;
    setAttempts(newAttempts);

    const newStatuses = [...statuses];
    newStatuses[currentAttempt] = isCorrect ? 'correct' : 'incorrect';
    setStatuses(newStatuses);

    if (isCorrect) {
      const nextAttempt = currentAttempt + 1;
      setCurrentAttempt(nextAttempt);
      setInputValue('');

      // Check if all 10 are complete
      if (nextAttempt >= REQUIRED_WRITES) {
        handleWordComplete();
      }
    } else {
      // Show hint briefly
      setShowHint(true);
      setTimeout(() => setShowHint(false), 2000);
      setInputValue('');
    }
  }

  function handleWordComplete() {
    setWordCompleted(true);

    // Record progress
    recordWordPractice(currentWord.korean, currentWord.english, currentCategory);
    const updated = addXP(XP_REWARDS.WRITE_PRACTICE_COMPLETE);
    onProgressUpdate(updated);

    // Show celebration
    addToast(`+${XP_REWARDS.WRITE_PRACTICE_COMPLETE} XP! You mastered "${currentWord.english}"! 🎉`, 'xp');
    showXP(XP_REWARDS.WRITE_PRACTICE_COMPLETE, '50%', '40%');

    // Confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6C5CE7', '#A29BFE', '#FF6B81', '#FECA57', '#1DD1A1'],
    });

    // Check achievements
    const totalWords = updated.wordsLearned.length;
    if (totalWords === 1) unlockAchievement('first_word');
    if (totalWords >= 10) unlockAchievement('ten_words');
    if (totalWords >= 50) unlockAchievement('fifty_words');
    if (totalWords >= 100) unlockAchievement('hundred_words');
  }

  function handleNextWord() {
    if (!category) return;
    if (currentWordIndex < category.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      setCurrentWordIndex(0);
      addToast('🎊 Category complete! Starting over for more practice!', 'achievement');
    }
  }

  function handlePrevWord() {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  }

  // Category selection view
  if (!currentCategory) {
    return (
      <div className="animate-slide-up">
        <div className="page-header">
          <h2 className="text-gradient">✍️ Writing Practice</h2>
          <p>Choose a category to start writing Korean words 10 times each!</p>
        </div>
        <div className="category-grid">
          {categories.map((cat) => {
            const learned = progress.wordsLearned.filter(w => w.categoryId === cat.id).length;
            const pct = (learned / cat.words.length) * 100;
            return (
              <div
                key={cat.id}
                className="category-card"
                style={{ '--card-color': cat.color }}
                onClick={() => { setCurrentCategory(cat.id); setCurrentWordIndex(0); }}
              >
                <span className="category-card-emoji">{cat.emoji}</span>
                <div className="category-card-name">{cat.name}</div>
                <div className="category-card-count">{learned}/{cat.words.length} practiced</div>
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

  // Writing practice view
  const completePct = (currentAttempt / REQUIRED_WRITES) * 100;
  const wordProgress = `${currentWordIndex + 1} / ${category.words.length}`;

  return (
    <div className="writing-practice animate-slide-up">
      <button className="back-btn" onClick={() => setCurrentCategory(null)}>
        ← Back to Categories
      </button>

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3>{category.emoji} {category.name}</h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Word {wordProgress}</span>
      </div>

      {/* Word Display */}
      <div className="writing-word-display">
        <div className="writing-word-english">{currentWord.english}</div>
        <div className="writing-word-korean">{currentWord.korean}</div>
        <div className="writing-word-romanization">{currentWord.romanization}</div>
      </div>

      {/* Progress Bar */}
      <div className="progress-info">
        <span>Written {currentAttempt}/{REQUIRED_WRITES} times</span>
        <span>{Math.round(completePct)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${completePct}%` }} />
      </div>

      {/* Hint */}
      {showHint && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-md)',
            background: 'rgba(254, 202, 87, 0.1)',
            borderRadius: 'var(--radius-md)',
            margin: 'var(--space-md) 0',
            color: 'var(--color-accent-gold)',
            fontSize: '14px',
          }}
        >
          💡 Hint: Type exactly <strong style={{ fontFamily: 'var(--font-korean)', fontSize: '18px' }}>{currentWord.korean}</strong>
        </div>
      )}

      {/* Writing Attempts */}
      <div className="writing-attempts" style={{ marginTop: 'var(--space-xl)' }}>
        {Array.from({ length: REQUIRED_WRITES }).map((_, i) => (
          <div
            key={i}
            className="writing-attempt-row"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={`attempt-number ${statuses[i] === 'correct' ? 'completed' : i === currentAttempt && !wordCompleted ? 'current' : ''}`}>
              {statuses[i] === 'correct' ? '✓' : i + 1}
            </div>
            {i === currentAttempt && !wordCompleted ? (
              <form onSubmit={handleSubmitAttempt} className="attempt-input" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input
                  ref={inputRef}
                  type="text"
                  className={`input-field ${statuses[i] === 'incorrect' ? 'incorrect' : ''}`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Type "${currentWord.korean}" here...`}
                  autoComplete="off"
                  style={{ fontSize: '18px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  Check ✓
                </button>
              </form>
            ) : (
              <div
                className="attempt-input"
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  background: statuses[i] === 'correct' ? 'var(--bg-success)' : 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-korean)',
                  fontSize: '18px',
                  border: `2px solid ${statuses[i] === 'correct' ? 'var(--color-accent-mint)' : 'var(--border-color)'}`,
                  color: statuses[i] === 'correct' ? 'var(--color-accent-mint)' : 'var(--text-muted)',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {attempts[i] || (i < currentAttempt ? '' : '')}
              </div>
            )}
            <div className="attempt-status">
              {statuses[i] === 'correct' ? '✅' : statuses[i] === 'incorrect' ? '❌' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Completion Message & Navigation */}
      {wordCompleted && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🎉</div>
          <h3 style={{ marginBottom: 'var(--space-sm)' }}>
            Excellent! You wrote <span style={{ color: 'var(--color-accent-mint)' }}>"{currentWord.korean}"</span> 10 times!
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Now you can write "{currentWord.english}" in Korean! 🇰🇷
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={handleNextWord}>
              Next Word →
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => setCurrentCategory(null)}>
              Back to Categories
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {!wordCompleted && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-xl)' }}>
          <button className="btn btn-ghost" onClick={handlePrevWord} disabled={currentWordIndex === 0}>
            ← Previous
          </button>
          <button className="btn btn-ghost" onClick={handleNextWord}>
            Skip →
          </button>
        </div>
      )}
    </div>
  );
}
