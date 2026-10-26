import React, { useState, useEffect, useCallback } from 'react';
import { categories, XP_REWARDS } from '../data/koreanData';
import { addXP, unlockAchievement } from '../store/progressStore';
import { shuffleArray, getRandomItems } from '../hooks/useUtils';
import confetti from 'canvas-confetti';

export default function MemoryMatch({ progress, onProgressUpdate, addToast, showXP }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const startGame = useCallback((catId) => {
    setSelectedCategory(catId);
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    // Pick 6 random words for a 4x3 grid (12 cards)
    const words = getRandomItems(cat.words, 6);
    const cardPairs = [];

    words.forEach((word, idx) => {
      cardPairs.push({ id: idx * 2, pairId: idx, text: word.english, type: 'english' });
      cardPairs.push({ id: idx * 2 + 1, pairId: idx, text: word.korean, type: 'korean' });
    });

    setCards(shuffleArray(cardPairs));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameComplete(false);
  }, []);

  function handleCardClick(cardId) {
    if (isChecking) return;
    if (flipped.includes(cardId)) return;
    if (matched.includes(cardId)) return;
    if (flipped.length >= 2) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsChecking(true);

      const card1 = cards.find(c => c.id === newFlipped[0]);
      const card2 = cards.find(c => c.id === newFlipped[1]);

      if (card1.pairId === card2.pairId && card1.type !== card2.type) {
        // Match!
        setTimeout(() => {
          const newMatched = [...matched, newFlipped[0], newFlipped[1]];
          setMatched(newMatched);
          setFlipped([]);
          setIsChecking(false);

          // Check if game is complete
          if (newMatched.length === cards.length) {
            handleGameComplete();
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setFlipped([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }

  function handleGameComplete() {
    setGameComplete(true);
    const updated = addXP(XP_REWARDS.MATCH_COMPLETE);
    onProgressUpdate(updated);
    unlockAchievement('first_match');
    addToast(`Memory Match Complete! +${XP_REWARDS.MATCH_COMPLETE} XP 🧩`, 'achievement');
    showXP(XP_REWARDS.MATCH_COMPLETE, '50%', '40%');

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#6C5CE7', '#FF6B81', '#1DD1A1', '#FECA57', '#48DBFB'],
    });
  }

  // Category selection
  if (!selectedCategory) {
    return (
      <div className="animate-slide-up">
        <div className="page-header">
          <h2 className="text-gradient">🧩 Memory Match</h2>
          <p>Match English words with their Korean translations!</p>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="category-card"
              style={{ '--card-color': cat.color }}
              onClick={() => startGame(cat.id)}
            >
              <span className="category-card-emoji">{cat.emoji}</span>
              <div className="category-card-name">{cat.name}</div>
              <div className="category-card-count">{cat.words.length} words</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cat = categories.find(c => c.id === selectedCategory);

  return (
    <div className="animate-slide-up">
      <button className="back-btn" onClick={() => setSelectedCategory(null)}>
        ← Back to Categories
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <h3>{cat.emoji} {cat.name} Memory Match</h3>
        <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Moves: <strong>{moves}</strong>
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Pairs: <strong>{matched.length / 2}/{cards.length / 2}</strong>
          </span>
        </div>
      </div>

      <div className="memory-grid">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);

          return (
            <div
              key={card.id}
              className={`memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">🇰🇷</div>
                <div className="memory-card-back" style={card.type === 'korean' ? { fontFamily: 'var(--font-korean)' } : {}}>
                  {card.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {gameComplete && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '56px', marginBottom: 'var(--space-md)' }}>🎊</div>
          <h3>Congratulations!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            You matched all pairs in {moves} moves!
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => startGame(selectedCategory)}>
              Play Again
            </button>
            <button className="btn btn-secondary" onClick={() => setSelectedCategory(null)}>
              Choose Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
