// ============================================================
// AI Voice & Speech Pronunciation Recognition Engine
// Compares learner's spoken input against target Korean word
// ============================================================

// Levenshtein distance algorithm
function getLevenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateStringSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const distance = getLevenshteinDistance(longer, shorter);
  return (longerLength - distance) / parseFloat(longerLength);
}

export function comparePronunciation(spokenText, targetKorean, targetRomanization = '') {
  if (!spokenText || !spokenText.trim()) {
    return {
      accuracy: 0,
      isMatch: false,
      stars: 0,
      verdict: 'Kuch suna nahi diya',
      feedback: 'Microphone mein saaf aawaz mein bole!',
      spoken: '',
      target: targetKorean,
    };
  }

  const cleanSpoken = spokenText.trim().replace(/[.,!?~]/g, '');
  const cleanTargetKor = targetKorean.trim().replace(/[.,!?~]/g, '');
  const cleanTargetRom = targetRomanization.trim().toLowerCase().replace(/[.,!?~]/g, '');

  // 1. Direct Korean Hangul comparison
  const koreanSim = calculateStringSimilarity(cleanSpoken, cleanTargetKor);

  // 2. English/Romanized transcription comparison (if STT transcribed English letters)
  const spokenLower = cleanSpoken.toLowerCase();
  const romanSim = calculateStringSimilarity(spokenLower, cleanTargetRom);

  // 3. Substring inclusion bonus
  const includesTarget =
    cleanSpoken.includes(cleanTargetKor) ||
    cleanTargetKor.includes(cleanSpoken) ||
    (cleanTargetRom && spokenLower.includes(cleanTargetRom)) ||
    (cleanTargetRom && cleanTargetRom.includes(spokenLower));

  let rawScore = Math.max(koreanSim, romanSim);
  if (includesTarget && rawScore < 0.75) {
    rawScore = Math.max(rawScore, 0.75);
  }

  // Exact match
  if (cleanSpoken === cleanTargetKor || (cleanTargetRom && spokenLower === cleanTargetRom)) {
    rawScore = 1.0;
  }

  // Convert to learner-friendly 50-98 range
  let accuracy = Math.round(rawScore * 100);
  if (accuracy > 98) accuracy = 98;
  if (accuracy === 0) accuracy = 40;

  const isMatch = accuracy >= 65;
  let stars = 1;
  let verdict = '';
  let feedback = '';

  if (accuracy >= 85) {
    stars = 3;
    verdict = '🌟 Perfect Pronunciation! (Ekdam Native Accent)';
    feedback = `Shabash! Aapne bilkul sahi pronounce kiya: "${cleanSpoken}". Accent aur clarity bohot achhi hai!`;
  } else if (accuracy >= 68) {
    stars = 2;
    verdict = '✨ Good Pronunciation! (Sahi Bola)';
    feedback = `Kafi accha bole! Suna gaya: "${cleanSpoken}". AI Tip: Thoda aur confident aur smooth bolne ki koshish karein.`;
  } else {
    stars = 1;
    verdict = '⚠️ Thoda Alag Suna Gaya (Try Again)';
    feedback = `Suna gaya: "${cleanSpoken}" jabki sahi word hai "${cleanTargetKor}" (${cleanTargetRom}). Neeche 'Listen & Correct' par tap karke dobara sunein aur bole!`;
  }

  return {
    accuracy,
    isMatch,
    stars,
    verdict,
    feedback,
    spoken: cleanSpoken,
    target: cleanTargetKor,
    romanization: cleanTargetRom,
  };
}
