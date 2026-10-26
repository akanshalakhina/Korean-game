import React from 'react';
import { achievements as allAchievements } from '../data/koreanData';

export default function AchievementsPage({ progress }) {
  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h2 className="text-gradient">🏆 Achievements</h2>
        <p>Track your milestones and unlock rewards!</p>
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-2xl)',
        flexWrap: 'wrap',
      }}>
        <div className="stat-card" style={{ flex: 1, minWidth: '200px' }}>
          <div className="stat-icon" style={{ background: 'rgba(254, 202, 87, 0.15)' }}>🏆</div>
          <div className="stat-info">
            <h4>{progress.achievements.length} / {allAchievements.length}</h4>
            <span>Unlocked</span>
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1, minWidth: '200px' }}>
          <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.15)' }}>⚡</div>
          <div className="stat-info">
            <h4>{progress.xp}</h4>
            <span>Total XP</span>
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1, minWidth: '200px' }}>
          <div className="stat-icon" style={{ background: 'rgba(255, 107, 129, 0.15)' }}>🔥</div>
          <div className="stat-info">
            <h4>{progress.streak}</h4>
            <span>Day Streak</span>
          </div>
        </div>
      </div>

      <div className="achievements-grid">
        {allAchievements.map((ach) => {
          const unlocked = progress.achievements.includes(ach.id);
          return (
            <div key={ach.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <span className="achievement-emoji">{ach.emoji}</span>
              <div className="achievement-name">{ach.name}</div>
              <div className="achievement-desc">{ach.description}</div>
              {unlocked && (
                <div style={{
                  marginTop: 'var(--space-md)',
                  padding: '4px 12px',
                  background: 'rgba(254, 202, 87, 0.15)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  color: 'var(--color-accent-gold)',
                  display: 'inline-block',
                }}>
                  ✓ Unlocked!
                </div>
              )}
              {!unlocked && (
                <div style={{
                  marginTop: 'var(--space-md)',
                  padding: '4px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'inline-block',
                }}>
                  🔒 Locked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
