import React, { useState, useRef, useEffect } from 'react';
import { sentences, XP_REWARDS } from '../data/koreanData';
import { addXP, unlockAchievement } from '../store/progressStore';
import { speakKorean } from '../hooks/useUtils';
import HandwritingCanvas from '../components/HandwritingCanvas';
import confetti from 'canvas-confetti';

const REQUIRED_WRITES = 10;

export default function SentencePractice({ progress, onProgressUpdate, addToast, showXP }) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState(null);

  // Word practice mode: 'draw' | 'type'
  const [wordPracticeType, setWordPracticeType] = useState('draw');
  const [wordCanvasThumbs, setWordCanvasThumbs] = useState([]);
  const [wordDrawCount, setWordDrawCount] = useState(0);

  // Typing state
  const [wordAttempts, setWordAttempts] = useState([]);
  const [wordStatuses, setWordStatuses] = useState([]);
  const [wordCurrentAttempt, setWordCurrentAttempt] = useState(0);
  const [wordInput, setWordInput] = useState('');
  const [wordCompleted, setWordCompleted] = useState(false);
  const [showWordHint, setShowWordHint] = useState(false);

  // Full Sentence mode
  const [sentenceInput, setSentenceInput] = useState('');
  const [sentenceStatus, setSentenceStatus] = useState(null);
  const [sentenceWriteCount, setSentenceWriteCount] = useState(0);
  const [sentenceAttempts, setSentenceAttempts] = useState([]);
  const [sentenceMode, setSentenceMode] = useState('words'); // 'words' | 'full'
  const [isSpeakingFull, setIsSpeakingFull] = useState(false);
  const inputRef = useRef(null);

  const sentence = sentences[currentSentenceIndex];

  useEffect(() => {
    if (wordPracticeType === 'type' && inputRef.current) inputRef.current.focus();
  }, [activeWordIndex, wordCurrentAttempt, sentenceMode, wordPracticeType]);

  function startWordPractice(wordIdx) {
    setActiveWordIndex(wordIdx);
    setWordAttempts(Array(REQUIRED_WRITES).fill(''));
    setWordStatuses(Array(REQUIRED_WRITES).fill(null));
    setWordCurrentAttempt(0);
    setWordInput('');
    setWordCompleted(false);
    setShowWordHint(false);
    setWordCanvasThumbs([]);
    setWordDrawCount(0);
  }

  // Handle Canvas Drawing Save in Sentence Practice
  function handleSaveWordCanvas(thumbnailUrl, aiEvaluation) {
    if (activeWordIndex === null || !sentence.wordByWord[activeWordIndex]) return;

    const newThumbs = [...wordCanvasThumbs, thumbnailUrl];
    setWordCanvasThumbs(newThumbs);
    const nextCount = wordDrawCount + 1;
    setWordDrawCount(nextCount);

    const matchNotice = aiEvaluation?.isMatch
      ? `AI Match: ${aiEvaluation.accuracy}% ⭐`
      : 'Saved!';
    addToast(`Attempt ${nextCount}/${REQUIRED_WRITES} (${matchNotice})`, 'info', 1600);

    if (nextCount >= REQUIRED_WRITES) {
      setWordCompleted(true);
      const updated = addXP(XP_REWARDS.WRITE_PRACTICE_COMPLETE);
      onProgressUpdate(updated);
      addToast(`Word mastered on screen! +${XP_REWARDS.WRITE_PRACTICE_COMPLETE} XP 🎉`, 'xp');
      showXP(XP_REWARDS.WRITE_PRACTICE_COMPLETE, '50%', '30%');

      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
    }
  }

  // Handle typing submit
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
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
        unlockAchievement('sentence_builder');
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

  function speakFull() {
    setIsSpeakingFull(true);
    speakKorean(sentence.korean);
    setTimeout(() => setIsSpeakingFull(false), 2000);
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div className="page-header">
        <h2 className="text-gradient">📝 Sentence & Word Practice</h2>
        <p>Learn Korean sentences word-by-word with audio pronunciation and screen writing!</p>
      </div>

      {/* Sentence Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <button className="btn btn-ghost" onClick={handlePrevSentence}>
          ← Previous Sentence
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Sentence {currentSentenceIndex + 1} / {sentences.length} · Level {sentence.level}
        </span>
        <button className="btn btn-ghost" onClick={handleNextSentence}>
          Next Sentence →
        </button>
      </div>

      {/* Main Sentence Card */}
      <div className="sentence-card">
        <div className="sentence-english">{sentence.english}</div>
        <div className="sentence-korean-row">
          <div className="sentence-korean korean-text">{sentence.korean}</div>
          <button
            className={`speak-btn ${isSpeakingFull ? 'speaking-active' : ''}`}
            onClick={speakFull}
            title="Listen to full Korean sentence"
          >
            🔊 Listen to Full Sentence
          </button>
        </div>
        <div className="sentence-romanization">{sentence.romanization}</div>

        {/* Word by Word Breakdown */}
        <h4 style={{ margin: 'var(--space-lg) 0 var(--space-md)', color: 'var(--text-secondary)' }}>
          Word-by-Word Breakdown (Tap to Pronounce & Practice on Screen):
        </h4>
        <div className="word-by-word">
          {sentence.wordByWord.map((pair, idx) => (
            <div
              key={idx}
              className={`word-pair ${activeWordIndex === idx ? 'active' : ''}`}
              onClick={() => startWordPractice(idx)}
            >
              <div className="word-pair-english">{pair.english}</div>
              <div className="word-pair-korean korean-text">{pair.korean}</div>
              <div className="word-pair-actions">
                <button
                  className="mini-speak-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakKorean(pair.korean);
                  }}
                  title="Pronounce this word"
                >
                  🔊 Listen
                </button>
                <span className="word-pair-prompt">✍️ Draw 10x</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mode Tabs */}
        <div className="tabs" style={{ marginTop: 'var(--space-lg)' }}>
          <button
            className={`tab ${sentenceMode === 'words' ? 'active' : ''}`}
            onClick={() => setSentenceMode('words')}
          >
            ✍️ Practice Individual Words
          </button>
          <button
            className={`tab ${sentenceMode === 'full' ? 'active' : ''}`}
            onClick={() => setSentenceMode('full')}
          >
            📝 Practice Full Sentence Writing
          </button>
        </div>
      </div>

      {/* Individual Word Practice with Handwriting Canvas */}
      {sentenceMode === 'words' && activeWordIndex !== null && (
        <div className="sentence-word-practice">
          <div className="sentence-word-header">
            <h4>
              Practice Word: "{sentence.wordByWord[activeWordIndex].english}" ={' '}
              <span style={{ color: 'var(--color-primary-light)' }}>
                {sentence.wordByWord[activeWordIndex].korean}
              </span>
            </h4>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveWordIndex(null)}>
              ✕ Close
            </button>
          </div>

          {/* Toggle between Screen Draw and Type */}
          <div className="writing-mode-switcher" style={{ marginBottom: 'var(--space-md)' }}>
            <button
              className={`mode-switch-btn ${wordPracticeType === 'draw' ? 'active' : ''}`}
              onClick={() => setWordPracticeType('draw')}
            >
              🖌️ Screen Drawing Board (With AI Verification)
            </button>
            <button
              className={`mode-switch-btn ${wordPracticeType === 'type' ? 'active' : ''}`}
              onClick={() => setWordPracticeType('type')}
            >
              ⌨️ Typing Input
            </button>
          </div>

          {wordPracticeType === 'draw' ? (
            <HandwritingCanvas
              targetWord={sentence.wordByWord[activeWordIndex].korean}
              romanization={`Meaning: ${sentence.wordByWord[activeWordIndex].english}`}
              english={`Word from sentence #${currentSentenceIndex + 1}`}
              currentAttempt={wordDrawCount}
              targetAttempts={REQUIRED_WRITES}
              onSaveAttempt={handleSaveWordCanvas}
              thumbnails={wordCanvasThumbs}
            />
          ) : (
            <div>
              <div className="progress-info">
                <span>Written {wordCurrentAttempt}/{REQUIRED_WRITES}</span>
                <span>{Math.round((wordCurrentAttempt / REQUIRED_WRITES) * 100)}%</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 'var(--space-lg)' }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(wordCurrentAttempt / REQUIRED_WRITES) * 100}%` }}
                />
              </div>

              {showWordHint && (
                <div className="writing-hint-banner">
                  💡 Type: <strong>{sentence.wordByWord[activeWordIndex].korean}</strong>
                </div>
              )}

              <div className="writing-attempts">
                {Array.from({ length: REQUIRED_WRITES }).map((_, i) => (
                  <div key={i} className="writing-attempt-row" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div
                      className={`attempt-number ${
                        wordStatuses[i] === 'correct'
                          ? 'completed'
                          : i === wordCurrentAttempt && !wordCompleted
                          ? 'current'
                          : ''
                      }`}
                    >
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
                        <button type="submit" className="btn btn-primary">✓ Check</button>
                      </form>
                    ) : (
                      <div className="attempt-input" style={{ padding: '12px 16px', background: 'var(--bg-glass)' }}>
                        {wordAttempts[i]}
                      </div>
                    )}
                    <div className="attempt-status">{wordStatuses[i] === 'correct' ? '✅' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Sentence Practice Section */}
      {sentenceMode === 'full' && (
        <div className="sentence-word-practice">
          <div className="sentence-word-header">
            <h4>Practice Writing Full Sentence ({sentenceWriteCount}/{REQUIRED_WRITES})</h4>
            <button className="speak-btn btn-sm" onClick={speakFull}>
              🔊 Listen Again
            </button>
          </div>

          <form onSubmit={handleSentenceSubmit} style={{ display: 'flex', gap: 'var(--space-sm)', margin: 'var(--space-md) 0' }}>
            <input
              type="text"
              className={`input-field ${sentenceStatus === 'correct' ? 'correct' : sentenceStatus === 'incorrect' ? 'incorrect' : ''}`}
              value={sentenceInput}
              onChange={(e) => setSentenceInput(e.target.value)}
              placeholder={`Write: "${sentence.korean}"...`}
              style={{ fontSize: '18px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Check Sentence ✓
            </button>
          </form>

          {/* Attempts pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'var(--space-md)' }}>
            {Array.from({ length: REQUIRED_WRITES }).map((_, i) => (
              <span
                key={i}
                className={`attempt-number ${i < sentenceWriteCount ? 'completed' : ''}`}
                style={{ width: '32px', height: '32px' }}
              >
                {i < sentenceWriteCount ? '✓' : i + 1}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
