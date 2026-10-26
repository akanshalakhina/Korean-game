import { useState, useCallback, useRef } from 'react';

// ── Toast Hook ─────────────────────────────────────────────
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return { toasts, addToast };
}

// ── XP Popup Hook ──────────────────────────────────────────
export function useXPPopup() {
  const [popups, setPopups] = useState([]);
  const idRef = useRef(0);

  const showXP = useCallback((amount, x, y) => {
    const id = ++idRef.current;
    setPopups((prev) => [...prev, { id, amount, x, y }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1500);
  }, []);

  return { popups, showXP };
}

// ── Shuffle Array ──────────────────────────────────────────
export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ── Get Random Items ───────────────────────────────────────
export function getRandomItems(arr, count) {
  const shuffled = shuffleArray(arr);
  return shuffled.slice(0, count);
}

// ── Format number ──────────────────────────────────────────
export function formatNumber(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ── Speak Korean Audio ─────────────────────────────────────
export function speakKorean(text, rate = 0.85) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = Math.max(0.5, Math.min(1.5, rate));

    // Try selecting native Korean voice if available
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find(
      (v) => v.lang === 'ko-KR' || v.lang.startsWith('ko') || v.name.toLowerCase().includes('korean')
    );
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('TTS speech error:', err);
  }
}



