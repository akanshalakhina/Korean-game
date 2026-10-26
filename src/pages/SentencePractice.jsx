import React, { useState, useRef, useEffect } from 'react';
import { sentences, XP_REWARDS } from '../data/koreanData';
import { addXP, unlockAchievement } from '../store/progressStore';
import confetti from 'canvas-confetti';

const REQUIRED_WRITES = 10;

export default function SentencePractice({ progress, onProgressUpdate, addToast, showXP }) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState(null);
  const [wordAttempts, setWordAttempts] = useState([]);
  const [wordStatuses, setWordStatuses] = useState([]);
  const [wordCurrentAttempt, setWordCurrentAttempt] = useState(0);
  const [wordInput, setWordInput] = useState('');
  const [wordCompleted, setWordCompleted] = useState(false);
  const [showWordHint, setShowWordHint] = useState(false);
  const [sentenceInput, setSentenceInput] = useState('');
  const [sentenceStatus, setSentenceStatus] = useState(null);
  const [sentenceWriteCount, setSentenceWriteCount] = useState(0);
  const [sentenceAttempts, setSentenceAttempts] = useState([]);
  const [sentenceMode, setSentenceMode] = useState('words'); // 'words' | 'full'
  const inputRef = useRef(null);

  const sentence = sentences[currentSentenceIndex];

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [activeWordIndex, wordCurrentAttempt, sentenceMode]);

  function startWordPractice(wordIdx) {
    setActiveWordIndex(wordIdx);
    setWordAttempts(Array(REQUIRED_WRITES).fill(''));
    setWordStatuses(Array(REQUIRED_WRITES).fill(null));
    setWordCurrentAttempt(0);
    setWordInput('');
    setWordCompleted(false);
    setShowWordHint(false);
  }

  function handleWordSubmit(e) {
    e.preventDefault();
    if (activeWordIndex === null || wordCurrentAttempt >= REQUIRED_WRITES) return;

    const targetWord = sentence.wordByWord[activeWordIndex].korean;
    const trimmed = wordInput.trim();
    if (!trimmed) return;

    const isCorrect = trimmed === targetWord;

    const newAttempts = [...wordAttempts];
    newAttempts[wordCurrentAttempt] = trimmed;
    setWordAttempts(newAttempts);

    const newStatuses = [...wordStatuses];
    newStatuses[wordCurrentAttempt] = isCorrect ? 'correct' : 'incorrect';
    setWordStatuses(newStatuses);

    if (isCorrect) {
      const next = wordCurrentAttempt + 1;
      setWordCurrentAttempt(next);
      setWordInput('');

      if (next >= REQUIRED_WRITES) {
        setWordCompleted(true);
        const updated = addXP(XP_REWARDS.WRITE_PRACTICE_COMPLETE);
        onProgressUpdate(updated);
        addToast(`Word mastered! +${XP_REWARDS.WRITE_PRACTICE_COMPLETE} XP`, 'xp');
        showXP(XP_REWARDS.WRITE_PRACTICE_COMPLETE, '50%', '30%');
      }
    } else {
      setShowWordHint(true);
      setTimeout(() => setShowWordHint(false), 2000);
      setWordInput('');
    }
  }

  function handleSentenceSubmit(e) {
    e.preventDefault();
    const trimmed = sentenceInput.trim();
    if (!trimmed) return;

    // Remove punctuation for comparison
    const cleanTarget = sentence.korean.replace(/[.,!?]/g, '').trim();
    const cleanInput = trimmed.replace(/[.,!?]/g, '').trim();
    const isCorrect = cleanInput === cleanTarget;

    const newAttempts = [...sentenceAttempts, { text: trimmed, correct: isCorrect }];
    setSentenceAttempts(newAttempts);

    if (isCorrect) {
      const next = sentenceWriteCount + 1;
      setSentenceWriteCount(next);
      setSentenceStatus('correct');
      setSentenceInput('');

      if (next >= REQUIRED_WRITES) {
        const updated = addXP(XP_REWARDS.SENTENCE_PRACTICE);
        onProgressUpdate(updated);
        addToast(`Sentence mastered! +${XP_REWARDS.SENTENCE_PRACTICE} XP 🎊`, 'xp');
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      }
    } else {
      setSentenceStatus('incorrect');
      setSentenceInput('');
    }

    setTimeout(() => setSentenceStatus(null), 1000);
  }

  function handleNextSentence() {
    setCurrentSentenceIndex((prev) => (prev + 1) % sentences.length);
    setActiveWordIndex(null);
    setWordAttempts([]);
    setWordStatuses([]);
    setWordCurrentAttempt(0);
    setWordInput('');
    setWordCompleted(false);
    setSentenceInput('');
    setSentenceAttempts([]);
    setSentenceWriteCount(0);
    setSentenceMode('words');
  }

  function handlePrevSentence() {
    setCurrentSentenceIndex((prev) => (prev - 1 + sentences.length) % sentences.length);
    setActiveWordIndex(null);
    setSentenceAttempts([]);
    setSentenceWriteCount(0);
    setSentenceMode('words');
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <h2 className="text-gradient">📝 Sentence Practice</h2>
        <p>Learn Korean sentences word-by-word, then practice the whole sentence!</p>
      </div>

      {/* Sentence Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <button className="btn btn-ghost" onClick={handlePrevSentence}>← Previous</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Sentence {currentSentenceIndex + 1} / {sentences.length} · Level {sentence.level}
        </span>
        <button className="btn btn-ghost" onClick={handleNextSentence}>Next →</button>
      </div>

      {/* Sentence Card */}
      <div className="sentence-card">
        <div className="sentence-english">{sentence.english}</div>
        <div className="sentence-korean korean-text">{sentence.korean}</div>
        <div className="sentence-romanization">{sentence.romanization}</div>

        {/* Word by Word breakdown */}
        <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>Word-by-Word Breakdown:</h4>
        <div className="word-by-word">
          {sentence.wordByWord.map((pair, idx) => (
            <div
              key={idx}
              className="word-pair"
              onClick={() => startWordPractice(idx)}
              style={{
                borderColor: activeWordIndex === idx ? 'var(--color-primary)' : undefined,
                boxShadow: activeWordIndex === idx ? 'var(--shadow-glow-primary)' : undefined,
              }}
            >
              <div className="word-pair-english">{pair.english}</div>
              <div className="word-pair-korean korean-text">{pair.korean}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                Click to practice ✍️
              </div>
            </div>
          ))}
        </div>

        {/* Mode Tabs */}
        <div className="tabs" style={{ marginTop: 'var(--space-lg)' }}>
          <button className={`tab ${sentenceMode === 'words' ? 'active' : ''}`} onClick={() => setSentenceMode('words')}>
            ✍️ Practice Words
          </button>
          <button className={`tab ${sentenceMode === 'full' ? 'active' : ''}`} onClick={() => setSentenceMode('full')}>
            📝 Full Sentence
          </button>
        </div>
      </div>

      {/* Word Practice Section */}
      {sentenceMode === 'words' && activeWordIndex !== null && (
        <div className="sentence-word-practice">
          <div className="sentence-word-header">
            <h4>Practice: "{sentence.wordByWord[activeWordIndex].english}"</h4>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveWordIndex(null)}>✕ Close</button>
          </div>

          <div className="sentence-word-target">
            <div className="sentence-word-target-english">{sentence.wordByWord[activeWordIndex].english}</div>
            <div className="sentence-word-target-korean korean-text">{sentence.wordByWord[activeWordIndex].korean}</div>
          </div>

          <div className="progress-info">
            <span>Written {wordCurrentAttempt}/{REQUIRED_WRITES}</span>
            <span>{Math.round((wordCurrentAttempt / REQUIRED_WRITES) * 100)}%</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="progress-bar-fill" style={{ width: `${(wordCurrentAttempt / REQUIRED_WRITES) * 100}%` }} />
          </div>

          {showWordHint && (
            <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'rgba(254,202,87,0.1)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)', color: 'var(--color-accent-gold)', fontSize: '13px' }}>
              💡 Type: <strong className="korean-text" style={{ fontSize: '16px' }}>{sentence.wordByWord[activeWordIndex].korean}</strong>
            </div>
          )}

          {/* Attempt rows */}
          <div className="writing-attempts">
            {Array.from({ length: REQUIRED_WRITES }).map((_, i) => (
              <div key={i} className="writing-attempt-row" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className={`attempt-number ${wordStatuses[i] === 'correct' ? 'completed' : i === wordCurrentAttempt && !wordCompleted ? 'current' : ''}`}>
                  {wordStatuses[i] === 'correct' ? '✓' : i + 1}
                </div>
                {i === wordCurrentAttempt && !wordCompleted ? (
                  <form onSubmit={handleWordSubmit} className="attempt-input" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <input
                      ref={inputRef}
                      type="text"
                      className={`input-field ${wordStatuses[i] === 'incorrect' ? 'incorrect' : ''}`}
                      value={wordInput}
                      onChange={(e) => setWordInput(e.target.value)}
                      placeholder={`Type "${sentence.wordByWord[activeWordIndex].korean}"...`}
                      autoComplete="off"
                    />
                    <button type="submit" className="btn btn-primary">✓</button>
                  </form>
                ) : (
                  <div className="attempt-input" style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    background: wordStatuses[i] === 'correct' ? 'var(--bg-success)' : 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-korean)',
                    fontSize: '16px',
                    border: `2px solid ${wordStatuses[i] === 'correct' ? 'var(--color-accent-mint)' : 'var(--border-color)'}`,
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    color: wordStatuses[i] === 'correct' ? 'var(--color-accent-mint)' : 'var(--text-muted)',
                  }}>
                    {wordAttempts[i]}
                  </div>
                )}
                <div className="attempt-status">{wordStatuses[i] === 'correct' ? '✅' : ''}</div>
              </div>
            ))}
          </div>

          {wordCompleted && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
              <div style={{ fontSize: '36px' }}>🎉</div>
              <p>Word mastered! Try the next word or practice the full sentence.</p>
            </div>
          )}
        </div>
      )}

      {/* Full Sentence Practice */}
      {sentenceMode === 'full' && (
        <div className="sentence-word-practice">
          <h4 style={{ marginBottom: 'var(--space-lg)' }}>Write the full sentence 10 times:</h4>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)', padding: 'var(--space-lg)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>{sentence.english}</div>
            <div className="korean-text" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary-light)' }}>{sentence.korean}</div>
          </div>

          <div className="progress-info">
            <span>Written {sentenceWriteCount}/{REQUIRED_WRITES}</span>
            <span>{Math.round((sentenceWriteCount / REQUIRED_WRITES) * 100)}%</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="progress-bar-fill" style={{ width: `${(sentenceWriteCount / REQUIRED_WRITES) * 100}%` }} />
          </div>

          {sentenceWriteCount < REQUIRED_WRITES ? (
            <form onSubmit={handleSentenceSubmit} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                ref={inputRef}
                type="text"
                className={`input-field ${sentenceStatus || ''}`}
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                placeholder="Type the full Korean sentence..."
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary">Check</button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🎊</div>
              <h3>Sentence Mastered!</h3>
              <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-lg)' }} onClick={handleNextSentence}>
                Next Sentence →
              </button>
            </div>
          )}

          {/* Recent attempts */}
          <div style={{ marginTop: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {sentenceAttempts.slice(-5).map((a, i) => (
              <div key={i} style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: a.correct ? 'var(--bg-success)' : 'var(--bg-error)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontFamily: 'var(--font-korean)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>{a.text}</span>
                <span>{a.correct ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
