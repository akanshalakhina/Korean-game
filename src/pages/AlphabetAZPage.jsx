import React, { useState } from 'react';
import { alphabetAZ, XP_REWARDS } from '../data/koreanData';
import { addXP, unlockAchievement } from '../store/progressStore';
import { speakKorean } from '../hooks/useUtils';
import HandwritingCanvas from '../components/HandwritingCanvas';
import VoicePronunciationChecker from '../components/VoicePronunciationChecker';
import confetti from 'canvas-confetti';

export default function AlphabetAZPage({ progress, onProgressUpdate, addToast, showXP }) {
  const [selectedLetter, setSelectedLetter] = useState(alphabetAZ[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [practiceCount, setPracticeCount] = useState(0);
  const [canvasThumbnails, setCanvasThumbnails] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completedLetters, setCompletedLetters] = useState({});

  const TARGET_WRITES = 10;

  // Filter letters
  const filteredLetters = alphabetAZ.filter(
    (item) =>
      item.letter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hangul.includes(searchTerm) ||
      item.syllable.includes(searchTerm) ||
      item.sound.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.exampleWord.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleSelectLetter(item) {
    setSelectedLetter(item);
    setPracticeCount(0);
    setCanvasThumbnails([]);
  }

  function handleSpeak(text) {
    setIsSpeaking(true);
    speakKorean(text);
    setTimeout(() => setIsSpeaking(false), 1400);
  }

  function handleSaveAttempt(thumbnailUrl, aiEvaluation) {
    const newThumbs = [...canvasThumbnails, thumbnailUrl];
    setCanvasThumbnails(newThumbs);
    const nextCount = practiceCount + 1;
    setPracticeCount(nextCount);

    const matchMsg = aiEvaluation?.isMatch
      ? `AI Match: ${aiEvaluation.accuracy}% ⭐`
      : 'Saved! Keep writing!';
    addToast(`Letter ${selectedLetter.letter} — Attempt ${nextCount}/${TARGET_WRITES} (${matchMsg})`, 'info', 1600);

    if (nextCount >= TARGET_WRITES) {
      setCompletedLetters((prev) => ({ ...prev, [selectedLetter.letter]: true }));

      const updated = addXP(XP_REWARDS.HANGUL_PRACTICE);
      onProgressUpdate(updated);

      addToast(
        `🎉 Mastered letter ${selectedLetter.letter} (${selectedLetter.hangul} / ${selectedLetter.syllable})! +${XP_REWARDS.HANGUL_PRACTICE} XP`,
        'xp'
      );
      showXP(XP_REWARDS.HANGUL_PRACTICE, '50%', '40%');

      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#6C5CE7', '#00D2D3', '#FECA57', '#1DD1A1', '#FF6B81'],
      });

      unlockAchievement('first_word');
    }
  }

  function handleNextLetter() {
    const currentIndex = alphabetAZ.findIndex((l) => l.letter === selectedLetter.letter);
    if (currentIndex < alphabetAZ.length - 1) {
      handleSelectLetter(alphabetAZ[currentIndex + 1]);
    } else {
      handleSelectLetter(alphabetAZ[0]);
    }
  }

  function handlePrevLetter() {
    const currentIndex = alphabetAZ.findIndex((l) => l.letter === selectedLetter.letter);
    if (currentIndex > 0) {
      handleSelectLetter(alphabetAZ[currentIndex - 1]);
    }
  }

  return (
    <div className="az-page animate-slide-up">
      <div className="page-header">
        <h2 className="text-gradient">🔤 English A-Z to Korean Alphabet Foundation</h2>
        <p>
          Learn Korean from English A-Z! Har English letter ka Korean equivalent, sound, pronunciation aur screen writing practice (10x with AI Check).
        </p>
      </div>

      {/* A-Z Quick Horizontal Selector Strip */}
      <div className="az-strip-wrapper">
        <div className="az-strip">
          {alphabetAZ.map((item) => {
            const isSelected = selectedLetter.letter === item.letter;
            const isDone = completedLetters[item.letter];
            return (
              <button
                key={item.letter}
                className={`az-strip-btn ${isSelected ? 'active' : ''} ${isDone ? 'done' : ''}`}
                onClick={() => handleSelectLetter(item)}
              >
                <span className="strip-eng">{item.letter}</span>
                <span className="strip-kor">{item.hangul}</span>
                {isDone && <span className="strip-check">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Selected Letter Focus & Practice Card */}
      <div className="az-focus-card">
        <div className="az-focus-header">
          <div className="az-letter-badges">
            <div className="badge-eng-big">{selectedLetter.letter}</div>
            <div className="badge-kor-arrow">➔</div>
            <div className="badge-kor-big">{selectedLetter.hangul}</div>
            <div className="badge-syllable-tag">Syllable: {selectedLetter.syllable}</div>
          </div>

          <div className="az-audio-actions">
            <button
              className={`speak-btn btn-lg ${isSpeaking ? 'speaking-active' : ''}`}
              onClick={() => handleSpeak(selectedLetter.syllable || selectedLetter.hangul)}
            >
              <span className="speak-icon">🔊</span>
              <span>Listen to "{selectedLetter.letter}" in Korean</span>
            </button>
          </div>
        </div>

        {/* Pronunciation & Hinglish Explanation Box */}
        <div className="az-detail-box">
          <div className="az-detail-item">
            <span className="az-detail-label">Sound & Phonetics:</span>
            <span className="az-detail-val">{selectedLetter.sound}</span>
          </div>
          <div className="az-detail-item">
            <span className="az-detail-label">Hindi / Hinglish Hint:</span>
            <span className="az-detail-val az-hint-highlight">💡 {selectedLetter.hinglishHint}</span>
          </div>
          <div className="az-detail-item">
            <span className="az-detail-label">Example Word:</span>
            <span className="az-detail-val">
              <strong>{selectedLetter.exampleWord}</strong>
              <button
                className="mini-speak-icon"
                onClick={() => handleSpeak(selectedLetter.exampleWord.split(' ')[0])}
                title="Pronounce example word"
              >
                🔊
              </button>
            </span>
          </div>
          <div className="az-detail-item">
            <span className="az-detail-label">Writing Stroke Guide:</span>
            <span className="az-detail-val">✍️ {selectedLetter.strokeHint}</span>
          </div>
        </div>

        {/* AI Voice Pronunciation & Speaking Practice */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <VoicePronunciationChecker
            targetKorean={selectedLetter.syllable || selectedLetter.hangul}
            targetRomanization={selectedLetter.romanization}
            english={`Letter ${selectedLetter.letter}`}
          />
        </div>

        {/* 10-Times Screen Writing Canvas with AI Verification */}
        <div className="az-canvas-section">
          <div className="az-canvas-section-title">
            ✍️ Practice Drawing <strong>"{selectedLetter.hangul}"</strong> on Screen 10 Times (with AI Checker)
          </div>

          <HandwritingCanvas
            targetWord={selectedLetter.hangul}
            romanization={`${selectedLetter.letter} = ${selectedLetter.romanization}`}
            english={`English ${selectedLetter.letter} in Korean`}
            currentAttempt={practiceCount}
            targetAttempts={TARGET_WRITES}
            onSaveAttempt={handleSaveAttempt}
            thumbnails={canvasThumbnails}
          />

          <div className="az-nav-row">
            <button
              className="btn btn-secondary"
              onClick={handlePrevLetter}
              disabled={selectedLetter.letter === 'A'}
            >
              ← Previous Letter
            </button>
            <button className="btn btn-primary" onClick={handleNextLetter}>
              Next Letter ({alphabetAZ.findIndex((l) => l.letter === selectedLetter.letter) + 2}/26) →
            </button>
          </div>
        </div>
      </div>

      {/* Full A-Z Reference Library Grid */}
      <div className="az-library-section">
        <div className="az-library-header">
          <h3>📚 Complete A to Z Korean Reference Chart</h3>
          <div className="az-search-box">
            <input
              type="text"
              placeholder="Search letter or word (e.g. A, B, Apple, 사랑)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="az-search-input"
            />
          </div>
        </div>

        <div className="az-grid">
          {filteredLetters.map((item) => {
            const isSelected = selectedLetter.letter === item.letter;
            return (
              <div
                key={item.letter}
                className={`az-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  handleSelectLetter(item);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              >
                <div className="az-card-top">
                  <span className="az-card-eng">{item.letter}</span>
                  <button
                    className="az-card-speak"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(item.syllable || item.hangul);
                    }}
                    title="Pronounce"
                  >
                    🔊
                  </button>
                </div>
                <div className="az-card-kor">{item.hangul}</div>
                <div className="az-card-syllable">{item.syllable} ({item.romanization})</div>
                <div className="az-card-sound">{item.sound}</div>
                <div className="az-card-practice-btn">✍️ Write & Practice</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
