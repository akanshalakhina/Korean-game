import React, { useState, useRef, useEffect } from 'react';
import { speakKorean } from '../hooks/useUtils';
import { comparePronunciation } from '../utils/aiSpeechChecker';
import confetti from 'canvas-confetti';

export default function VoicePronunciationChecker({
  targetKorean,
  targetRomanization = '',
  english = '',
  onCorrect,
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSpeakingCorrect, setIsSpeakingCorrect] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg(
        'Aapke browser mein Speech Recognition support nahi hai. Chrome ya Edge use karein.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR'; // Korean speech model

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
        setTranscript('');
      };

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);

        // Run AI comparison against target Korean word
        const result = comparePronunciation(spoken, targetKorean, targetRomanization);
        setEvaluation(result);

        if (result.isMatch) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#00D2D3', '#1DD1A1', '#FECA57'],
          });
          if (onCorrect) onCorrect(result);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone permission blocked hai! Browser mein mic allow karein.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('Koi aawaz nahi aayi. Mic ke paas aakar saaf aawaz mein dobara bolein!');
        } else {
          setErrorMsg(`Mic error (${event.error}). Dobara koshish karein.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Speech recognition setup error:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [targetKorean, targetRomanization, onCorrect]);

  const handleStartListening = () => {
    setEvaluation(null);
    setErrorMsg('');

    if (!recognitionRef.current) {
      // Fallback: prompt simulated voice test if API not available
      alert(
        'Speech Recognition Chrome/Edge/Android par best chalti hai. Make sure microphone is enabled.'
      );
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Recognition start exception, retrying:', err);
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      } catch (e) {
        setErrorMsg('Microphone start nahi ho saka. Refresh karein.');
      }
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const handleHearCorrect = () => {
    setIsSpeakingCorrect(true);
    speakKorean(targetKorean, 0.8);
    setTimeout(() => setIsSpeakingCorrect(false), 1600);
  };

  return (
    <div className="voice-checker-card">
      <div className="voice-checker-header">
        <div className="voice-checker-title">
          <span className="voice-icon-glow">🎙️</span>
          <span>AI Pronunciation & Voice Trainer</span>
        </div>
        <span className="voice-target-chip">
          Target: <strong>{targetKorean}</strong> ({targetRomanization})
        </span>
      </div>

      <div className="voice-mic-center">
        {!isListening ? (
          <button
            type="button"
            className="voice-mic-btn"
            onClick={handleStartListening}
            title="Click to speak into microphone"
          >
            <span className="mic-emoji">🎤</span>
            <span className="mic-btn-label">Tap to Speak & Test Pronunciation</span>
            <span className="mic-btn-sub">Mic par bolkar AI se pronunciation check karwayein</span>
          </button>
        ) : (
          <button
            type="button"
            className="voice-mic-btn listening-active"
            onClick={handleStopListening}
            title="Listening... tap to stop"
          >
            <span className="mic-ripple" />
            <span className="mic-emoji recording-pulse">🔴</span>
            <span className="mic-btn-label">Listening... Abhi Bolein!</span>
            <span className="mic-btn-sub">"{targetKorean}" boliye, AI sun raha hai...</span>
          </button>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="voice-error-banner">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* AI Evaluation & Correction Result */}
      {evaluation && (
        <div
          className={`voice-result-box animate-slide-up ${
            evaluation.isMatch ? 'match-success' : 'match-retry'
          }`}
        >
          <div className="voice-result-top">
            <div className="voice-stars">
              {'⭐'.repeat(evaluation.stars)}
              <span className="voice-score-badge">{evaluation.accuracy}% Match</span>
            </div>
            <div className="voice-verdict-text">{evaluation.verdict}</div>
          </div>

          <div className="voice-compare-grid">
            <div className="compare-item spoken-item">
              <span className="compare-label">Aapne bola (You said):</span>
              <span className="compare-val">
                {evaluation.spoken ? `"${evaluation.spoken}"` : '(Kuch saaf nahi suna)'}
              </span>
            </div>
            <div className="compare-item target-item">
              <span className="compare-label">Sahi Korean (Target):</span>
              <span className="compare-val">"{targetKorean}"</span>
            </div>
          </div>

          <div className="voice-feedback-message">
            {evaluation.feedback}
          </div>

          {/* Correct Pronunciation Audio & Action Buttons */}
          <div className="voice-action-row">
            <button
              className={`speak-btn btn-primary ${isSpeakingCorrect ? 'speaking-active' : ''}`}
              onClick={handleHearCorrect}
            >
              🔊 Sahi Awaz Sunein (Listen & Correct)
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleStartListening}
            >
              🔄 Dobara Bol Kar Dekhein (Try Again)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
