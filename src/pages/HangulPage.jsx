import React, { useState } from 'react';
import { hangulConsonants, hangulVowels, XP_REWARDS } from '../data/koreanData';
import { addXP, unlockAchievement } from '../store/progressStore';

export default function HangulPage({ progress, onProgressUpdate, addToast, showXP }) {
  const [activeTab, setActiveTab] = useState('consonants');
  const [selectedChar, setSelectedChar] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceCount, setPracticeCount] = useState(0);
  const [practiceStatuses, setPracticeStatuses] = useState([]);

  const chars = activeTab === 'consonants' ? hangulConsonants : hangulVowels;
  const PRACTICE_TARGET = 10;

  function handleCharClick(char) {
    setSelectedChar(char);
    setPracticeMode(false);
    setPracticeInput('');
    setPracticeCount(0);
    setPracticeStatuses([]);
  }

  function handlePractice() {
    setPracticeMode(true);
    setPracticeCount(0);
    setPracticeStatuses([]);
    setPracticeInput('');
  }

  function handlePracticeSubmit(e) {
    e.preventDefault();
    if (!selectedChar || !practiceInput.trim()) return;

    const isCorrect = practiceInput.trim() === selectedChar.korean;
    const newStatuses = [...practiceStatuses, { input: practiceInput.trim(), correct: isCorrect }];
    setPracticeStatuses(newStatuses);
    setPracticeInput('');

    if (isCorrect) {
      const nextCount = practiceCount + 1;
      setPracticeCount(nextCount);

      if (nextCount >= PRACTICE_TARGET) {
        const updated = addXP(XP_REWARDS.HANGUL_PRACTICE);
        onProgressUpdate(updated);
        addToast(`Mastered "${selectedChar.korean}" (${selectedChar.romanization})! +${XP_REWARDS.HANGUL_PRACTICE} XP`, 'xp');
        showXP(XP_REWARDS.HANGUL_PRACTICE, '50%', '40%');
      }
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h2 className="text-gradient">🇰🇷 Hangul Alphabet</h2>
        <p>Learn the Korean writing system – the foundation of Korean!</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'consonants' ? 'active' : ''}`} onClick={() => setActiveTab('consonants')}>
          Consonants (자음)
        </button>
        <button className={`tab ${activeTab === 'vowels' ? 'active' : ''}`} onClick={() => setActiveTab('vowels')}>
          Vowels (모음)
        </button>
      </div>

      {/* Hangul Grid */}
      <div className="hangul-grid">
        {chars.map((char) => (
          <div key={char.korean} className="hangul-card" onClick={() => handleCharClick(char)}>
            <span className="hangul-card-char">{char.korean}</span>
            <span className="hangul-card-roman">{char.romanization}</span>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedChar && (
        <div className="hangul-detail-modal" onClick={(e) => { if (e.target === e.currentTarget) setSelectedChar(null); }}>
          <div className="hangul-detail-content">
            <div className="hangul-detail-char">{selectedChar.korean}</div>
            <div className="hangul-detail-roman">{selectedChar.romanization}</div>
            <div className="hangul-detail-sound">🔊 {selectedChar.sound}</div>
            <div className="hangul-detail-example">Example: {selectedChar.example}</div>

            {!practiceMode ? (
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handlePractice}>
                  ✍️ Practice Writing
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedChar(null)}>
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div className="progress-info" style={{ marginBottom: 'var(--space-sm)' }}>
                  <span>Written {practiceCount}/{PRACTICE_TARGET}</span>
                  <span>{Math.round((practiceCount / PRACTICE_TARGET) * 100)}%</span>
                </div>
                <div className="progress-bar" style={{ marginBottom: 'var(--space-md)' }}>
                  <div className="progress-bar-fill" style={{ width: `${(practiceCount / PRACTICE_TARGET) * 100}%` }} />
                </div>

                {practiceCount < PRACTICE_TARGET ? (
                  <form onSubmit={handlePracticeSubmit} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <input
                      type="text"
                      className="input-field"
                      value={practiceInput}
                      onChange={(e) => setPracticeInput(e.target.value)}
                      placeholder={`Type "${selectedChar.korean}"...`}
                      autoFocus
                      autoComplete="off"
                      style={{ fontSize: '24px', textAlign: 'center' }}
                    />
                    <button type="submit" className="btn btn-primary">✓</button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: 'var(--space-sm)' }}>🎉</div>
                    <p style={{ marginBottom: 'var(--space-md)' }}>You mastered <strong>{selectedChar.korean}</strong>!</p>
                    <button className="btn btn-secondary" onClick={() => setSelectedChar(null)}>
                      Continue Learning
                    </button>
                  </div>
                )}

                {/* Show recent attempts */}
                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-md)', justifyContent: 'center' }}>
                  {practiceStatuses.slice(-10).map((s, i) => (
                    <span
                      key={i}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        background: s.correct ? 'var(--bg-success)' : 'var(--bg-error)',
                        border: `1px solid ${s.correct ? 'var(--color-accent-mint)' : 'var(--color-secondary)'}`,
                      }}
                    >
                      {s.correct ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
