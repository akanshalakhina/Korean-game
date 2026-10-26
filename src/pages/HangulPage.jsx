import React, { useState } from 'react';
import { hangulConsonants, hangulVowels, XP_REWARDS } from '../data/koreanData';
import { addXP, unlockAchievement } from '../store/progressStore';
import { speakKorean } from '../hooks/useUtils';
import HandwritingCanvas from '../components/HandwritingCanvas';
import confetti from 'canvas-confetti';

export default function HangulPage({ progress, onProgressUpdate, addToast, showXP }) {
  const [activeTab, setActiveTab] = useState('consonants');
  const [selectedChar, setSelectedChar] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [canvasThumbnails, setCanvasThumbnails] = useState([]);
  const [practiceCount, setPracticeCount] = useState(0);

  const chars = activeTab === 'consonants' ? hangulConsonants : hangulVowels;
  const PRACTICE_TARGET = 10;

  function handleCharClick(char) {
    setSelectedChar(char);
    setPracticeMode(false);
    setPracticeCount(0);
    setCanvasThumbnails([]);
  }

  function handlePractice() {
    setPracticeMode(true);
    setPracticeCount(0);
    setCanvasThumbnails([]);
  }

  function handleSaveCanvasAttempt(thumbnailUrl) {
    if (!selectedChar) return;

    const newThumbnails = [...canvasThumbnails, thumbnailUrl];
    setCanvasThumbnails(newThumbnails);
    const nextCount = practiceCount + 1;
    setPracticeCount(nextCount);

    addToast(`Stroke ${nextCount}/${PRACTICE_TARGET} saved! ✍️`, 'info', 1500);

    if (nextCount >= PRACTICE_TARGET) {
      const updated = addXP(XP_REWARDS.HANGUL_PRACTICE);
      onProgressUpdate(updated);
      addToast(`🎉 Mastered Hangul letter "${selectedChar.korean}" (${selectedChar.romanization})! +${XP_REWARDS.HANGUL_PRACTICE} XP`, 'xp');
      showXP(XP_REWARDS.HANGUL_PRACTICE, '50%', '40%');

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h2 className="text-gradient">🇰🇷 Hangul Alphabet Master</h2>
        <p>Learn the Korean writing system from scratch. Tap any letter to hear it and practice drawing it on screen!</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'consonants' ? 'active' : ''}`}
          onClick={() => setActiveTab('consonants')}
        >
          Consonants (자음 - 19)
        </button>
        <button
          className={`tab ${activeTab === 'vowels' ? 'active' : ''}`}
          onClick={() => setActiveTab('vowels')}
        >
          Vowels (모음 - 21)
        </button>
      </div>

      {/* Hangul Grid */}
      <div className="hangul-grid">
        {chars.map((char) => (
          <div
            key={char.korean}
            className="hangul-card"
            onClick={() => handleCharClick(char)}
          >
            <span className="hangul-card-char">{char.korean}</span>
            <span className="hangul-card-roman">{char.romanization}</span>
            <button
              className="char-speak-mini"
              onClick={(e) => {
                e.stopPropagation();
                speakKorean(char.korean);
              }}
              title="Pronounce"
            >
              🔊
            </button>
          </div>
        ))}
      </div>

      {/* Detail / Practice Modal */}
      {selectedChar && (
        <div
          className="hangul-detail-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedChar(null);
          }}
        >
          <div
            className="hangul-detail-content"
            style={{ maxWidth: practiceMode ? '820px' : '460px', width: '95%' }}
          >
            {!practiceMode ? (
              <>
                <div className="hangul-detail-char">{selectedChar.korean}</div>
                <div className="hangul-detail-roman">{selectedChar.romanization}</div>
                <div
                  className="hangul-detail-sound"
                  style={{ cursor: 'pointer' }}
                  onClick={() => speakKorean(selectedChar.korean)}
                >
                  🔊 Sound: <strong>{selectedChar.sound}</strong> (Click to listen)
                </div>
                <div className="hangul-detail-example">Example word: {selectedChar.example}</div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-lg)' }}>
                  <button className="btn btn-primary" onClick={handlePractice}>
                    ✍️ Screen Drawing Practice (10x)
                  </button>
                  <button className="btn btn-secondary" onClick={() => setSelectedChar(null)}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <h3 style={{ margin: 0 }}>
                    ✍️ Practice Drawing <strong>{selectedChar.korean}</strong> ({selectedChar.romanization})
                  </h3>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setPracticeMode(false)}
                  >
                    ✕ Exit Practice
                  </button>
                </div>

                <HandwritingCanvas
                  targetWord={selectedChar.korean}
                  romanization={selectedChar.romanization}
                  english={`Letter Sound: ${selectedChar.sound}`}
                  currentAttempt={practiceCount}
                  targetAttempts={PRACTICE_TARGET}
                  onSaveAttempt={handleSaveCanvasAttempt}
                  thumbnails={canvasThumbnails}
                />

                {practiceCount >= PRACTICE_TARGET && (
                  <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '36px' }}>🎉</div>
                    <h4>Awesome! You mastered drawing "{selectedChar.korean}" 10 times!</h4>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 'var(--space-md)' }}
                      onClick={() => setSelectedChar(null)}
                    >
                      Done & Return to Alphabet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
