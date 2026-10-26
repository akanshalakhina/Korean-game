// ============================================================
// Progress Store – localStorage persistence for user progress
// ============================================================

const STORAGE_KEY = 'korean_learning_progress';

const defaultProgress = {
  xp: 0,
  wordsLearned: [],         // array of { categoryId, english, korean, practiceCount }
  sentencesPracticed: [],     // array of sentence indices
  quizScores: [],             // array of { date, score, total, category }
  matchGamesCompleted: 0,
  hangulLearned: [],          // array of hangul characters practiced
  achievements: [],           // array of achievement ids
  streak: 0,
  lastLoginDate: null,
  totalPracticeMinutes: 0,
  writingHistory: {},         // { "korean_word": count }
};

export function loadProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...defaultProgress, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return { ...defaultProgress };
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function updateProgress(updater) {
  const current = loadProgress();
  const updated = updater(current);
  saveProgress(updated);
  return updated;
}

export function recordWordPractice(korean, english, categoryId) {
  return updateProgress((p) => {
    const history = { ...p.writingHistory };
    history[korean] = (history[korean] || 0) + 1;

    const existingIdx = p.wordsLearned.findIndex(w => w.korean === korean);
    const wordsLearned = [...p.wordsLearned];
    if (existingIdx >= 0) {
      wordsLearned[existingIdx] = {
        ...wordsLearned[existingIdx],
        practiceCount: wordsLearned[existingIdx].practiceCount + 1,
      };
    } else {
      wordsLearned.push({ categoryId, english, korean, practiceCount: 1 });
    }

    return { ...p, writingHistory: history, wordsLearned };
  });
}

export function addXP(amount) {
  return updateProgress((p) => ({ ...p, xp: p.xp + amount }));
}

export function unlockAchievement(achievementId) {
  return updateProgress((p) => {
    if (p.achievements.includes(achievementId)) return p;
    return { ...p, achievements: [...p.achievements, achievementId] };
  });
}

export function recordQuizScore(score, total, category) {
  return updateProgress((p) => ({
    ...p,
    quizScores: [...p.quizScores, { date: new Date().toISOString(), score, total, category }],
  }));
}

export function updateStreak() {
  return updateProgress((p) => {
    const today = new Date().toDateString();
    const lastLogin = p.lastLoginDate;
    
    if (lastLogin === today) return p;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let streak = p.streak;
    if (lastLogin === yesterday.toDateString()) {
      streak += 1;
    } else if (lastLogin !== today) {
      streak = 1;
    }
    
    return { ...p, streak, lastLoginDate: today };
  });
}

export function resetProgress() {
  saveProgress(defaultProgress);
  return { ...defaultProgress };
}
