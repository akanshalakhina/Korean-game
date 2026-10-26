import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [speechLang, setSpeechLang] = useState('ko-KR'); // 'ko-KR' | 'en-US'
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [micVolume, setMicVolume] = useState(0);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const startListening = async () => {
    setEvaluation(null);
    setLiveTranscript('');
    setFinalTranscript('');
    setStatusMessage('');
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];

    // 1. Check SpeechRecognition support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // Start AudioContext volume visualizer and MediaRecorder
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio analyzer for live volume wave
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();

      // Setup MediaRecorder to save user's voice clip
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        setRecordedAudioUrl(audioUrl);

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.warn('Microphone stream access warning:', err);
    }

    if (!SpeechRecognition) {
      setStatusMessage('Speech Recognition aapke browser mein supported nahi hai. Chrome ya Edge use karein.');
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true; // Show words as she speaks!
      recognition.lang = speechLang;
      recognitionRef.current = recognition;

      let gotResult = false;
      let capturedText = '';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('🎙️ Mic chalu hai! Abhi saaf aawaz mein boliye...');
      };

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            capturedText = item[0].transcript;
            gotResult = true;
          } else {
            interim += item[0].transcript;
          }
        }
        setLiveTranscript(capturedText || interim);
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusMessage('❌ Microphone permission blocked hai! Browser settings mein mic allow karein.');
        } else if (event.error === 'no-speech') {
          setStatusMessage('⚠️ Aawaz nahi aayi! Mic ke paas aakar dobara bolein.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            mediaRecorderRef.current.stop();
          } catch {
            // ignore
          }
        }

        const textToEvaluate = capturedText || liveTranscript;

        if (textToEvaluate && textToEvaluate.trim()) {
          setFinalTranscript(textToEvaluate);
          runAIEvaluation(textToEvaluate);
        } else {
          // If no text was recognized by STT but mic had activity
          handleUnrecognizedSpeech();
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
      setStatusMessage('Microphone start nahi ho saka. Page refresh karke dobara try karein.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  // Run AI Comparison
  const runAIEvaluation = (spoken) => {
    const result = comparePronunciation(spoken, targetKorean, targetRomanization);
    setEvaluation(result);

    if (result.isMatch) {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#00D2D3', '#1DD1A1', '#FECA57', '#FF6B81'],
      });
      if (onCorrect) onCorrect(result);
    }
  };

  // Handle case where mic was on but Google STT couldn't transcribe Hangul
  const handleUnrecognizedSpeech = () => {
    setEvaluation({
      accuracy: 55,
      isMatch: false,
      stars: 1,
      verdict: '❌ GALAT YA SAAF NAHI SUNA GAYA',
      feedback: `Aapki aawaz suni gayi, lekin Korean word "${targetKorean}" saaf recognize nahi hua. Niche 'Sahi Aawaz Sunein' par click karke native pronunciation sunein aur fir try karein!`,
      spoken: '(Aawaz saaf nahi thi)',
      target: targetKorean,
    });
  };

  // Quick manual validation if user wants to self-assess
  const handleMarkSelfMatch = (isCorrect) => {
    if (isCorrect) {
      const result = {
        accuracy: 90,
        isMatch: true,
        stars: 3,
        verdict: '✅ SAHI HAI! (Self Verified)',
        feedback: `Shabash! Aapne "${targetKorean}" (${targetRomanization}) sahi pronounce kiya!`,
        spoken: targetRomanization || targetKorean,
        target: targetKorean,
      };
      setEvaluation(result);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (onCorrect) onCorrect(result);
    } else {
      setEvaluation({
        accuracy: 45,
        isMatch: false,
        stars: 1,
        verdict: '❌ GALAT HAI (Needs Practice)',
        feedback: `Sahi pronunciation sunkar dobara bolne ki koshish karein: "${targetKorean}".`,
        spoken: '(Practice needed)',
        target: targetKorean,
      });
    }
  };

  return (
    <div className="voice-checker-card">
      <div className="voice-checker-header">
        <div className="voice-checker-title">
          <span className="voice-icon-glow">🎙️</span>
          <span>AI Voice Pronunciation & Speaking Checker</span>
        </div>

        {/* Language Recognition Switcher */}
        <div className="voice-lang-switcher">
          <span className="voice-lang-label">Engine:</span>
          <button
            type="button"
            className={`lang-pill-btn ${speechLang === 'ko-KR' ? 'active' : ''}`}
            onClick={() => setSpeechLang('ko-KR')}
            title="Recognize Korean Hangul"
          >
            🇰🇷 Korean Hangul
          </button>
          <button
            type="button"
            className={`lang-pill-btn ${speechLang === 'en-US' ? 'active' : ''}`}
            onClick={() => setSpeechLang('en-US')}
            title="Recognize English Phonetics"
          >
            🌐 English / Romanized
          </button>
        </div>
      </div>

      {/* Target Word Info Bar */}
      <div className="voice-target-banner">
        <span>Target Word to Speak:</span>
        <strong className="voice-target-kor">{targetKorean}</strong>
        <span className="voice-target-rom">({targetRomanization || english})</span>
        <button
          type="button"
          className="mini-speak-icon"
          onClick={() => speakKorean(targetKorean, 0.8)}
          title="Listen to native Korean voice"
        >
          🔊 Sunein
        </button>
      </div>

      {/* Main Microphone Button */}
      <div className="voice-mic-center">
        {!isListening ? (
          <button
            type="button"
            className="voice-mic-btn"
            onClick={startListening}
          >
            <div className="mic-icon-circle">🎤</div>
            <div className="mic-btn-label">Tap to Speak & Check Pronunciation</div>
            <div className="mic-btn-sub">Click karein aur mic par boliye — AI batayega sahi hai ya galat</div>
          </button>
        ) : (
          <button
            type="button"
            className="voice-mic-btn listening-active"
            onClick={stopListening}
          >
            <div className="mic-icon-circle recording-pulse">🔴</div>
            <div className="mic-btn-label">Listening... Abhi Bolein!</div>
            <div className="mic-btn-sub">
              Boliye: "{targetKorean}" (Tap to finish)
            </div>

            {/* Live Volume Meter Bar */}
            <div className="mic-volume-wrapper">
              <span className="volume-label">Mic Activity:</span>
              <div className="volume-bar-bg">
                <div
                  className="volume-bar-fill"
                  style={{ width: `${Math.max(10, micVolume)}%` }}
                />
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Live transcript display as user is talking */}
      {(isListening || liveTranscript) && !evaluation && (
        <div className="live-transcript-box animate-slide-up">
          <span className="live-transcript-label">🔴 Sunte hue:</span>
          <strong className="live-transcript-text">
            {liveTranscript || 'Aapki aawaz ka wait kar raha hai...'}
          </strong>
        </div>
      )}

      {/* Status message */}
      {statusMessage && !evaluation && (
        <div className="voice-status-msg">
          {statusMessage}
        </div>
      )}

      {/* CLEAR AI VERDICT CARD: SAHI HAI YA GALAT */}
      {evaluation && (
        <div
          className={`voice-verdict-card animate-slide-up ${
            evaluation.isMatch ? 'card-verdict-success' : 'card-verdict-error'
          }`}
        >
          {/* Top Verdict Banner */}
          <div className="verdict-status-badge">
            <span className="verdict-emoji">
              {evaluation.isMatch ? '✅' : '❌'}
            </span>
            <span className="verdict-heading">
              {evaluation.isMatch
                ? 'SAHI HAI! (Correct Pronunciation)'
                : 'GALAT / THODA ALAG HAI (Needs Correction)'}
            </span>
            <span className="verdict-score-pill">
              {evaluation.accuracy}% Match
            </span>
          </div>

          <div className="verdict-stars-row">
            {'⭐'.repeat(evaluation.stars)}
          </div>

          {/* Spoken vs Target Comparison */}
          <div className="verdict-compare-container">
            <div className="compare-cell spoken-cell">
              <span className="cell-label">Aapne bola (You said):</span>
              <div className="cell-text">
                {evaluation.spoken ? `"${evaluation.spoken}"` : '(Aawaz recognize nahi hui)'}
              </div>
            </div>

            <div className="compare-cell-arrow">➔</div>

            <div className="compare-cell target-cell">
              <span className="cell-label">Sahi bolna tha (Target):</span>
              <div className="cell-text">
                "{targetKorean}"
                <span className="cell-rom">({targetRomanization})</span>
              </div>
            </div>
          </div>

          {/* AI Coaching Explanation */}
          <div className="verdict-coaching-box">
            <div className="coaching-title">🤖 AI Pronunciation Coach:</div>
            <p className="coaching-text">{evaluation.feedback}</p>
          </div>

          {/* Recorded Audio Playback (Listen to yourself) */}
          {recordedAudioUrl && (
            <div className="recorded-voice-row">
              <span className="recorded-label">🎧 Aapki record hui aawaz:</span>
              <audio controls src={recordedAudioUrl} className="custom-audio-player" />
            </div>
          )}

          {/* Action Buttons: Listen to correct voice & Try again */}
          <div className="verdict-actions-row">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => speakKorean(targetKorean, 0.8)}
            >
              🔊 Sahi Awaz Sunein (Hear Native Korean)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={startListening}
            >
              🔄 Dobara Bol Kar Check Karein
            </button>
          </div>
        </div>
      )}

      {/* Manual Self-Check fallback button if learner wants instant verification */}
      {!evaluation && !isListening && (
        <div className="voice-manual-footer">
          <span>Agar mic voice capture na kare, toh manually check karein:</span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--color-accent-mint)', borderColor: 'var(--color-accent-mint)' }}
              onClick={() => handleMarkSelfMatch(true)}
            >
              ✓ Maine Sahi Bola (Mark Correct)
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' }}
              onClick={() => handleMarkSelfMatch(false)}
            >
              ✗ Dobara Practice Karna Hai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
