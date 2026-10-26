import React, { useRef, useState, useEffect, useCallback } from 'react';
import { speakKorean } from '../hooks/useUtils';
import { evaluateHandwriting } from '../utils/aiHandwritingChecker';

const BRUSH_COLORS = [
  { name: 'Korean Indigo', color: '#6C5CE7' },
  { name: 'Cyan Glow', color: '#00D2D3' },
  { name: 'Mint Green', color: '#1DD1A1' },
  { name: 'Golden Sun', color: '#FECA57' },
  { name: 'Sakura Pink', color: '#FF6B81' },
  { name: 'Pure White', color: '#FFFFFF' },
];

const BRUSH_SIZES = [
  { name: 'Fine', size: 4 },
  { name: 'Medium', size: 8 },
  { name: 'Calligraphy', size: 14 },
];

export default function HandwritingCanvas({
  targetWord,
  romanization,
  english,
  currentAttempt = 0,
  targetAttempts = 10,
  onSaveAttempt,
  thumbnails = [],
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[1].color);
  const [brushSize, setBrushSize] = useState(8);
  const [showGuide, setShowGuide] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [guideOpacity, setGuideOpacity] = useState(0.25);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.8); // 0.8 beginner friendly

  // AI Evaluation State
  const [aiResult, setAiResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Resize canvas to match display size with DPR scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    redraw(strokes);
  }, [strokes]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    window.addEventListener('orientationchange', setupCanvas);
    return () => {
      window.removeEventListener('resize', setupCanvas);
      window.removeEventListener('orientationchange', setupCanvas);
    };
  }, [setupCanvas]);

  // Redraw guide, grid, and strokes
  const redraw = useCallback(
    (strokeList = strokes) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // 1. Traditional Korean Practice Grid (원고지 격자)
      if (showGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);

        // Center crosshairs
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Diagonal quadrant guides
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();

        // Inner margin frame
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(108, 92, 231, 0.25)';
        ctx.strokeRect(16, 16, width - 32, height - 32);
        ctx.restore();
      }

      // 2. Faint Watermark Korean Character Guide
      if (showGuide && targetWord) {
        ctx.save();
        const fontSize = Math.min(
          height * 0.52,
          width / (targetWord.length > 2 ? targetWord.length * 0.72 : 2.1)
        );
        ctx.font = `bold ${fontSize}px 'Noto Sans KR', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 255, 255, ${guideOpacity})`;
        ctx.fillText(targetWord, width / 2, height / 2);

        // Subtle guide outline
        ctx.strokeStyle = `rgba(162, 155, 254, ${guideOpacity * 1.6})`;
        ctx.lineWidth = 1.5;
        ctx.strokeText(targetWord, width / 2, height / 2);
        ctx.restore();
      }

      // 3. User Strokes
      strokeList.forEach((stroke) => {
        if (!stroke.points || stroke.points.length < 1) return;
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.size > 8 ? 6 : 3;

        ctx.beginPath();
        if (stroke.points.length === 1) {
          const pt = stroke.points[0];
          ctx.arc(pt.x, pt.y, stroke.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = stroke.color;
          ctx.fill();
        } else {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            const p1 = stroke.points[i - 1];
            const p2 = stroke.points[i];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          }
          const last = stroke.points[stroke.points.length - 1];
          ctx.lineTo(last.x, last.y);
          ctx.stroke();
        }
        ctx.restore();
      });
    },
    [strokes, showGuide, showGrid, guideOpacity, targetWord]
  );

  useEffect(() => {
    redraw(strokes);
  }, [redraw, strokes, showGuide, showGrid, guideOpacity, targetWord]);

  // Pointer position helper with scroll support
  const getPointerPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const pos = getPointerPos(e);
    setIsDrawing(true);
    const newStroke = {
      color: brushColor,
      size: brushSize,
      points: [pos],
    };
    const updated = [...strokes, newStroke];
    setStrokes(updated);
    redraw(updated);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPointerPos(e);

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      const current = prev[lastIndex];
      const updatedStroke = {
        ...current,
        points: [...current.points, pos],
      };
      const next = [...prev.slice(0, lastIndex), updatedStroke];
      redraw(next);
      return next;
    });
  };

  const handlePointerUp = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    try {
      canvasRef.current.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Auto run quick AI check when user lifts finger/pen
    runAICheck();
  };

  const handleClear = () => {
    setStrokes([]);
    setAiResult(null);
    redraw([]);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const next = strokes.slice(0, -1);
    setStrokes(next);
    redraw(next);
    if (next.length > 0) {
      setTimeout(() => runAICheck(next), 50);
    } else {
      setAiResult(null);
    }
  };

  // Run AI Handwriting Verification
  const runAICheck = (currentStrokes = strokes) => {
    const canvas = canvasRef.current;
    if (!canvas || currentStrokes.length === 0) return;

    setIsEvaluating(true);
    setTimeout(() => {
      const evaluation = evaluateHandwriting(canvas, targetWord, currentStrokes);
      setAiResult(evaluation);
      setIsEvaluating(false);
    }, 120);
  };

  // Audio Pronunciation Trigger
  const handlePronounce = () => {
    setIsSpeaking(true);
    speakKorean(targetWord, speechRate);
    setTimeout(() => setIsSpeaking(false), 1600);
  };

  // Save attempt and advance
  const handleSaveAndNext = () => {
    if (strokes.length === 0) {
      alert('Pehle screen par likhein! (Draw on the screen first)');
      return;
    }

    const canvas = canvasRef.current;
    const thumbnail = canvas.toDataURL('image/png');

    // Run AI check if not done
    const evaluation = aiResult || evaluateHandwriting(canvas, targetWord, strokes);

    if (onSaveAttempt) {
      onSaveAttempt(thumbnail, evaluation);
    }

    // Reset for next stroke
    setStrokes([]);
    setAiResult(null);
    redraw([]);
  };

  return (
    <div className="handwriting-container" ref={containerRef}>
      {/* Top Bar with Word Info and Audio */}
      <div className="handwriting-header">
        <div className="handwriting-word-info">
          <span className="handwriting-english">{english}</span>
          <div className="handwriting-korean-row">
            <span className="handwriting-korean-guide">{targetWord}</span>
            <button
              className={`speak-btn ${isSpeaking ? 'speaking-active' : ''}`}
              onClick={handlePronounce}
              title="Click to hear Korean pronunciation"
            >
              <span className="speak-icon">🔊</span>
              <span>{isSpeaking ? 'Bol raha hai...' : 'Pronounce'}</span>
              {isSpeaking && <span className="audio-wave-dot" />}
            </button>
            <button
              className="speed-toggle-btn"
              onClick={() => setSpeechRate(speechRate === 0.8 ? 1.0 : 0.8)}
              title="Change speech speed"
            >
              {speechRate === 0.8 ? '🐢 Slow (0.8x)' : '⚡ Normal (1.0x)'}
            </button>
          </div>
          <span className="handwriting-romanization">
            Phonetic: <strong>{romanization}</strong>
          </span>
        </div>

        {/* Repetition Badge */}
        <div className="repetition-badge">
          <div className="rep-label">Screen Practice</div>
          <div className="rep-counter">
            <span className="rep-num">{currentAttempt}</span>
            <span className="rep-total">/ {targetAttempts}</span>
          </div>
          <div className="rep-subtitle">Times Written on Screen</div>
        </div>
      </div>

      {/* Screen Canvas Container (Mobile Touch & Pointer Friendly) */}
      <div className="canvas-wrapper">
        <div className="canvas-badge-tip">
          ✍️ Ungli (Finger), Touchscreen, Pen ya Mouse se screen par likhein
        </div>

        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* AI Stroke Feedback Card (Instant AI Evaluation) */}
      {aiResult && strokes.length > 0 && (
        <div className={`ai-feedback-banner ${aiResult.isMatch ? 'ai-match' : 'ai-improving'}`}>
          <div className="ai-feedback-header">
            <div className="ai-badge-chip">
              🤖 AI Stroke Evaluator
            </div>
            <div className="ai-stars">
              {'⭐'.repeat(aiResult.stars)}
              <span className="ai-score-pill">{aiResult.accuracy}% Accuracy</span>
            </div>
          </div>
          <div className="ai-verdict">{aiResult.verdict}</div>
          <div className="ai-message">{aiResult.feedback}</div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="canvas-controls-bar">
        {/* Color Palette */}
        <div className="control-group">
          <span className="control-label">Color:</span>
          <div className="color-palette">
            {BRUSH_COLORS.map((c) => (
              <button
                key={c.color}
                className={`color-swatch ${brushColor === c.color ? 'active' : ''}`}
                style={{ backgroundColor: c.color }}
                onClick={() => setBrushColor(c.color)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Brush Size */}
        <div className="control-group">
          <span className="control-label">Brush:</span>
          <div className="brush-sizes">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                className={`size-btn ${brushSize === b.size ? 'active' : ''}`}
                onClick={() => setBrushSize(b.size)}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Guide & Grid Toggles */}
        <div className="control-group toggles-group">
          <button
            className={`tool-toggle-btn ${showGuide ? 'active' : ''}`}
            onClick={() => setShowGuide(!showGuide)}
            title="Toggle faint Korean character watermark on/off"
          >
            {showGuide ? '👁️ Guide ON' : '👁️ Guide OFF'}
          </button>
          <button
            className={`tool-toggle-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle practice quadrant grid"
          >
            {showGrid ? '📐 Grid ON' : '📐 Grid OFF'}
          </button>
        </div>

        {/* Clear & Undo Actions */}
        <div className="control-group actions-group">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="Undo last stroke"
          >
            ↩️ Undo
          </button>
          <button
            className="btn btn-danger-subtle btn-sm"
            onClick={handleClear}
            disabled={strokes.length === 0}
            title="Clear drawing screen"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Primary Submit Button with AI check */}
      <div className="canvas-submit-row">
        <button
          className="btn btn-primary btn-lg submit-attempt-btn"
          onClick={handleSaveAndNext}
          disabled={strokes.length === 0}
        >
          {currentAttempt + 1 >= targetAttempts ? (
            <>🎉 Complete 10th Write & Claim XP!</>
          ) : (
            <>
              ✅ Done Writing! Save Attempt {currentAttempt + 1} of {targetAttempts} →
            </>
          )}
        </button>
      </div>

      {/* 10 Repetitions Visual Gallery Shelf */}
      <div className="attempts-gallery">
        <div className="gallery-header">
          <span>Your 10 Screen Repetitions Gallery ({thumbnails.length}/{targetAttempts})</span>
          {thumbnails.length === 0 && (
            <span className="gallery-hint">Each time you write on screen, your drawing will appear here!</span>
          )}
        </div>
        <div className="gallery-grid">
          {Array.from({ length: targetAttempts }).map((_, i) => {
            const thumb = thumbnails[i];
            const isCurrent = i === currentAttempt;
            return (
              <div
                key={i}
                className={`gallery-card ${thumb ? 'completed' : isCurrent ? 'active' : 'locked'}`}
              >
                <div className="card-number">#{i + 1}</div>
                {thumb ? (
                  <img src={thumb} alt={`Attempt ${i + 1}`} className="card-thumb-img" />
                ) : (
                  <div className="card-placeholder">
                    {isCurrent ? '✍️ Writing...' : '⏳'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
