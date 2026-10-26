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

// ── Speak Korean Audio (Reliable Dual-Engine) ──────────────
let activeAudio = null;

export function speakKorean(text, rate = 0.85) {
  if (typeof window === 'undefined' || !text) return;
  const clean = text.trim();
  if (!clean) return;

  // Stop previous audio if playing
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  // 1. Primary Engine: High-quality Native Korean Audio Stream
  // Works across 100% of browsers without needing local OS Korean voice packs installed
  try {
    const encoded = encodeURIComponent(clean);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${encoded}`;
    const audio = new Audio(audioUrl);
    audio.playbackRate = Math.max(0.6, Math.min(1.4, rate));
    activeAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Fallback to Web Speech API if audio element is blocked
        console.warn('Native audio stream fallback to SpeechSynthesis:', err);
        speakViaSpeechSynthesis(clean, rate);
      });
      return;
    }
  } catch {
    speakViaSpeechSynthesis(clean, rate);
  }
}

function speakViaSpeechSynthesis(text, rate = 0.85) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = Math.max(0.6, Math.min(1.3, rate));

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




