import React, { useState, useRef, useEffect } from 'react';
import { categories, XP_REWARDS } from '../data/koreanData';
import { recordWordPractice, addXP, unlockAchievement } from '../store/progressStore';
import { speakKorean } from '../hooks/useUtils';
import confetti from 'canvas-confetti';
import HandwritingCanvas from '../components/HandwritingCanvas';

const REQUIRED_WRITES = 10;

// On-screen Korean keyboard characters for easy clicking without Korean keyboard installed
const KOREAN_KEYS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

export default function WritingPractice({ progress, onProgressUpdate, addToast, showXP, selectedCategory }) {
  const [currentCategory, setCurrentCategory] = useState(selectedCategory || null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Practice Modes: 'screen_draw' | 'type_input'
  const [practiceMode, setPracticeMode] = useState('screen_draw');

  // Screen Drawing State
  const [canvasThumbnails, setCanvasThumbnails] = useState([]);
  const [screenAttemptCount, setScreenAttemptCount] = useState(0);

  // Typing Practice State
  const [attempts, setAttempts] = useState(Array(REQUIRED_WRITES).fill(''));
  const [statuses, setStatuses] = useState(Array(REQUIRED_WRITES).fill(null));
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Overall Completion
  const [wordCompleted, setWordCompleted] = useState(false);
  const inputRef = useRef(null);

  const category = categories.find((c) => c.id === currentCategory);
  const currentWord = category?.words[currentWordIndex];

  useEffect(() => {
    if (practiceMode === 'type_input' && inputRef.current && currentAttempt < REQUIRED_WRITES) {
      inputRef.current.focus();
    }
  }, [currentAttempt, currentCategory, currentWordIndex, practiceMode]);

  // Reset when category or word changes
  useEffect(() => {
    setCanvasThumbnails([]);
    setScreenAttemptCount(0);
    setAttempts(Array(REQUIRED_WRITES).fill(''));
    setStatuses(Array(REQUIRED_WRITES).fill(null));
    setCurrentAttempt(0);
    setInputValue('');
    setWordCompleted(false);
    setShowHint(false);
  }, [currentCategory, currentWordIndex]);

  // Handle a screen drawing completion
  function handleSaveCanvasAttempt(thumbnailUrl) {
    if (!currentWord || wordCompleted) return;

    const newThumbnails = [...canvasThumbnails, thumbnailUrl];
    setCanvasThumbnails(newThumbnails);
    const newCount = screenAttemptCount + 1;
    setScreenAttemptCount(newCount);

    addToast(`Attempt ${newCount}/${REQUIRED_WRITES} saved! Keep writing! ✍️`, 'info', 1800);

    if (newCount >= REQUIRED_WRITES) {
      handleWordComplete();
    }
  }

  // Handle typing submission
  function handleSubmitAttempt(e) {
    e?.preventDefault();
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

      if (nextAttempt >= REQUIRED_WRITES) {
        handleWordComplete();
      }
    } else {
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

    // Confetti celebration
    confetti({
      particleCount: 90,
      spread: 75,
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
          <h2 className="text-gradient">✍️ Screen Writing Practice</h2>
          <p>
            Choose a category to practice writing Korean words directly on your screen with your finger or mouse 10 times!
          </p>
        </div>
        <div className="category-grid">
          {categories.map((cat) => {
            const learned = progress.wordsLearned.filter((w) => w.categoryId === cat.id).length;
            const pct = (learned / cat.words.length) * 100;
            return (
              <div
                key={cat.id}
                className="category-card"
                style={{ '--card-color': cat.color }}
                onClick={() => {
                  setCurrentCategory(cat.id);
                  setCurrentWordIndex(0);
                }}
              >
                <span className="category-card-emoji">{cat.emoji}</span>
                <div className="category-card-name">{cat.name}</div>
                <div className="category-card-count">
                  {learned}/{cat.words.length} mastered
                </div>
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

  const wordProgress = `${currentWordIndex + 1} / ${category.words.length}`;
  const activeCount = practiceMode === 'screen_draw' ? screenAttemptCount : currentAttempt;
  const completePct = (activeCount / REQUIRED_WRITES) * 100;

  return (
    <div className="writing-practice animate-slide-up">
      <div className="writing-top-nav">
        <button className="back-btn" onClick={() => setCurrentCategory(null)}>
          ← Back to Categories
        </button>

        <div className="category-title-badge">
          <span>{category.emoji} {category.name}</span>
          <span className="word-step-count">Word {wordProgress}</span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="writing-mode-switcher">
        <button
          className={`mode-switch-btn ${practiceMode === 'screen_draw' ? 'active' : ''}`}
          onClick={() => setPracticeMode('screen_draw')}
        >
          🖌️ Screen Handwriting & Tracing Canvas (Draw on Screen)
        </button>
        <button
          className={`mode-switch-btn ${practiceMode === 'type_input' ? 'active' : ''}`}
          onClick={() => setPracticeMode('type_input')}
        >
          ⌨️ Typing Practice (Keyboard / On-Screen Keys)
        </button>
      </div>

      {/* SCREEN DRAWING MODE (Requested: Screen par likhein) */}
      {practiceMode === 'screen_draw' ? (
        <div className="screen-draw-section">
          <HandwritingCanvas
            targetWord={currentWord.korean}
            romanization={currentWord.romanization}
            english={currentWord.english}
            currentAttempt={screenAttemptCount}
            targetAttempts={REQUIRED_WRITES}
            onSaveAttempt={handleSaveCanvasAttempt}
            thumbnails={canvasThumbnails}
          />
        </div>
      ) : (
        /* TYPING PRACTICE MODE */
        <div className="typing-practice-section">
          {/* Word Display */}
          <div className="writing-word-display">
            <div className="writing-word-english">{currentWord.english}</div>
            <div className="writing-word-korean-row">
              <span className="writing-word-korean">{currentWord.korean}</span>
              <button
                className="speak-btn-pill"
                onClick={() => speakKorean(currentWord.korean)}
                title="Listen to pronunciation"
              >
                🔊 Listen
              </button>
            </div>
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
            <div className="writing-hint-banner">
              💡 Hint: Type exactly <strong style={{ fontFamily: 'var(--font-korean)', fontSize: '18px' }}>{currentWord.korean}</strong>
            </div>
          )}

          {/* Virtual Hangul Clicker Bar (For quick clicking if no Korean keyboard is available) */}
          <div className="virtual-hangul-bar">
            <div className="virtual-hangul-label">
              ⌨️ Tap on-screen Korean keys (Korean keyboard bina bhi type karein):
            </div>
            <div className="virtual-hangul-grid">
              {KOREAN_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="v-key-btn"
                  onClick={() => setInputValue((prev) => prev + key)}
                >
                  {key}
                </button>
              ))}
              <button
                type="button"
                className="v-key-btn v-key-special"
                onClick={() => setInputValue((prev) => prev.slice(0, -1))}
                title="Backspace"
              >
                ⌫
              </button>
              <button
                type="button"
                className="v-key-btn v-key-special"
                onClick={() => setInputValue((prev) => prev + ' ')}
                title="Space"
              >
                Space
              </button>
            </div>
          </div>

          {/* Writing Attempts List */}
          <div className="writing-attempts" style={{ marginTop: 'var(--space-xl)' }}>
            {Array.from({ length: REQUIRED_WRITES }).map((_, i) => (
              <div
                key={i}
                className="writing-attempt-row"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div
                  className={`attempt-number ${
                    statuses[i] === 'correct'
                      ? 'completed'
                      : i === currentAttempt && !wordCompleted
                      ? 'current'
                      : ''
                  }`}
                >
                  {statuses[i] === 'correct' ? '✓' : i + 1}
                </div>
                {i === currentAttempt && !wordCompleted ? (
                  <form
                    onSubmit={handleSubmitAttempt}
                    className="attempt-input"
                    style={{ display: 'flex', gap: 'var(--space-sm)', flex: 1 }}
                  >
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
                      border: `2px solid ${
                        statuses[i] === 'correct' ? 'var(--color-accent-mint)' : 'var(--border-color)'
                      }`,
                      color: statuses[i] === 'correct' ? 'var(--color-accent-mint)' : 'var(--text-muted)',
                      minHeight: '52px',
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                    }}
                  >
                    {attempts[i]}
                  </div>
                )}
                <div className="attempt-status">
                  {statuses[i] === 'correct' ? '✅' : statuses[i] === 'incorrect' ? '❌' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Modal / Banner */}
      {wordCompleted && (
        <div className="word-completed-banner animate-bounce-in">
          <div style={{ fontSize: '56px', marginBottom: 'var(--space-sm)' }}>🎉</div>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>
            Shabash! You wrote <span style={{ color: 'var(--color-accent-mint)' }}>"{currentWord.korean}"</span> 10 times!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', fontSize: '16px' }}>
            Aapne <strong>"{currentWord.english}"</strong> ({currentWord.romanization}) ko 10 baar screen par likhkar master kar liya! 🇰🇷
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={handleNextWord}>
              Next Word ({currentWordIndex + 2}/{category.words.length}) →
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => {
                setWordCompleted(false);
                setScreenAttemptCount(0);
                setCanvasThumbnails([]);
                setAttempts(Array(REQUIRED_WRITES).fill(''));
                setStatuses(Array(REQUIRED_WRITES).fill(null));
                setCurrentAttempt(0);
              }}
            >
              🔄 Practice Again
            </button>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      {!wordCompleted && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-xl)' }}>
          <button className="btn btn-ghost" onClick={handlePrevWord} disabled={currentWordIndex === 0}>
            ← Previous Word
          </button>
          <button className="btn btn-ghost" onClick={handleNextWord}>
            Skip to Next Word →
          </button>
        </div>
      )}
    </div>
  );
}
