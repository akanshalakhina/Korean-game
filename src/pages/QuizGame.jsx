import React, { useState, useEffect, useCallback } from 'react';
import { categories, XP_REWARDS } from '../data/koreanData';
import { addXP, recordQuizScore, unlockAchievement } from '../store/progressStore';
import { shuffleArray, getRandomItems } from '../hooks/useUtils';
import confetti from 'canvas-confetti';

export default function QuizGame({ progress, onProgressUpdate, addToast, showXP }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizDirection, setQuizDirection] = useState('kr-to-en'); // 'kr-to-en' | 'en-to-kr'

  const generateQuiz = useCallback((catId) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const allWords = cat.words;
    const quizQuestions = allWords.map((word) => {
      // Get 3 wrong answers
      const otherWords = allWords.filter(w => w.korean !== word.korean);
      const wrongAnswers = getRandomItems(otherWords, 3);

      if (quizDirection === 'kr-to-en') {
        const options = shuffleArray([
          { text: word.english, correct: true },
          ...wrongAnswers.map(w => ({ text: w.english, correct: false })),
        ]);
        return { question: word.korean, hint: word.romanization, options, word };
      } else {
        const options = shuffleArray([
          { text: word.korean, correct: true },
          ...wrongAnswers.map(w => ({ text: w.korean, correct: false })),
        ]);
        return { question: word.english, hint: '', options, word };
      }
    });

    setQuestions(shuffleArray(quizQuestions));
    setCurrentQ(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuizComplete(false);
  }, [quizDirection]);

  function startQuiz(catId) {
    setSelectedCategory(catId);
    generateQuiz(catId);
  }

  function handleAnswer(optionIdx) {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(optionIdx);
    const correct = questions[currentQ].options[optionIdx].correct;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      const updated = addXP(XP_REWARDS.QUIZ_CORRECT);
      onProgressUpdate(updated);
      showXP(XP_REWARDS.QUIZ_CORRECT, '50%', '50%');
    } else {
      addXP(XP_REWARDS.QUIZ_WRONG);
    }

    // Auto-advance after delay
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((q) => q + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        finishQuiz(correct ? score + 1 : score);
      }
    }, 1500);
  }

  function finishQuiz(finalScore) {
    setQuizComplete(true);
    const total = questions.length;
    recordQuizScore(finalScore, total, selectedCategory);

    const updated = addXP(finalScore === total ? XP_REWARDS.PERFECT_QUIZ : 0);
    onProgressUpdate(updated);

    // Achievements
    unlockAchievement('first_quiz');
    if (progress.quizScores.length + 1 >= 10) unlockAchievement('ten_quizzes');
    if (finalScore === total) {
      unlockAchievement('perfect_score');
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
      addToast('🎯 PERFECT SCORE! Amazing! 💯', 'achievement');
    } else if (finalScore >= total * 0.8) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      addToast(`Great job! ${finalScore}/${total} correct! 🎉`, 'success');
    } else {
      addToast(`You got ${finalScore}/${total}. Keep practicing! 💪`, 'info');
    }
  }

  // Category selection
  if (!selectedCategory || quizComplete) {
    const scorePct = quizComplete ? Math.round((score / questions.length) * 100) : 0;

    return (
      <div className="animate-slide-up">
        <div className="page-header">
          <h2 className="text-gradient">🎯 Quiz Challenge</h2>
          <p>Test your Korean vocabulary knowledge!</p>
        </div>

        {/* Score display if quiz just completed */}
        {quizComplete && (
          <div className="score-display" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div className="score-circle" style={{ '--score-pct': `${scorePct}%`, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
              <span className="score-value" style={{ color: scorePct >= 80 ? 'var(--color-accent-mint)' : scorePct >= 50 ? 'var(--color-accent-gold)' : 'var(--color-secondary)' }}>
                {scorePct}%
              </span>
              <span className="score-label">{score}/{questions.length}</span>
            </div>
            <h3>{scorePct === 100 ? '🏆 Perfect!' : scorePct >= 80 ? '🌟 Great Job!' : scorePct >= 50 ? '👍 Good Try!' : '💪 Keep Going!'}</h3>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-primary" onClick={() => startQuiz(selectedCategory)}>
                Retry Quiz
              </button>
              <button className="btn btn-secondary" onClick={() => { setSelectedCategory(null); setQuizComplete(false); }}>
                Choose Category
              </button>
            </div>
          </div>
        )}

        {/* Direction toggle */}
        <div className="tabs" style={{ maxWidth: '500px', marginBottom: 'var(--space-xl)' }}>
          <button className={`tab ${quizDirection === 'kr-to-en' ? 'active' : ''}`} onClick={() => setQuizDirection('kr-to-en')}>
            Korean → English
          </button>
          <button className={`tab ${quizDirection === 'en-to-kr' ? 'active' : ''}`} onClick={() => setQuizDirection('en-to-kr')}>
            English → Korean
          </button>
        </div>

        <div className="category-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="category-card"
              style={{ '--card-color': cat.color }}
              onClick={() => startQuiz(cat.id)}
            >
              <span className="category-card-emoji">{cat.emoji}</span>
              <div className="category-card-name">{cat.name}</div>
              <div className="category-card-count">{cat.words.length} questions</div>
              <div className="category-card-level">⭐ Level {cat.level}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quiz in progress
  const question = questions[currentQ];
  if (!question) return null;
  const progressPct = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="quiz-container animate-slide-up">
      <button className="back-btn" onClick={() => { setSelectedCategory(null); setQuizComplete(false); }}>
        ← Back to Categories
      </button>

      <div className="progress-info">
        <span>Question {currentQ + 1} / {questions.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="quiz-question">
        <div className="quiz-question-label">
          {quizDirection === 'kr-to-en' ? 'What does this mean?' : 'Translate to Korean:'}
        </div>
        <div className={`quiz-question-text ${quizDirection === 'kr-to-en' ? 'korean-text' : ''}`}>
          {question.question}
        </div>
        {question.hint && (
          <div className="quiz-question-hint">({question.hint})</div>
        )}
      </div>

      <div className="quiz-options">
        {question.options.map((opt, idx) => {
          let className = 'quiz-option';
          if (selectedAnswer !== null) {
            if (opt.correct) className += ' correct';
            else if (idx === selectedAnswer && !opt.correct) className += ' incorrect';
            className += ' disabled';
          }
          return (
            <button
              key={idx}
              className={className}
              onClick={() => handleAnswer(idx)}
              style={quizDirection === 'en-to-kr' ? { fontFamily: 'var(--font-korean)', fontSize: '22px' } : {}}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {selectedAnswer !== null && (
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--space-lg)',
          padding: 'var(--space-md)',
          background: isCorrect ? 'var(--bg-success)' : 'var(--bg-error)',
          borderRadius: 'var(--radius-md)',
          fontSize: '16px',
        }}>
          {isCorrect
            ? '✅ Correct! Well done!'
            : `❌ The answer is: "${question.options.find(o => o.correct).text}"`
          }
        </div>
      )}
    </div>
  );
}
