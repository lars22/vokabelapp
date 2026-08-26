import { ProgressMap, VocabItem, LevelStats } from '../types';

export const LEVEL_CONFIG = [
  { level: 1, label: 'Lvl 1 (Neu)', minInterval: 0, color: '#EF4444', bgAlpha: 'rgba(239, 68, 68, 0.15)' },
  { level: 2, label: 'Lvl 2 (Start)', minInterval: 2, color: '#F97316', bgAlpha: 'rgba(249, 115, 22, 0.15)' },
  { level: 3, label: 'Lvl 3 (Fortg.)', minInterval: 4, color: '#3B82F6', bgAlpha: 'rgba(59, 130, 246, 0.15)' },
  { level: 4, label: 'Lvl 4 (Vertieft)', minInterval: 7, color: '#8B5CF6', bgAlpha: 'rgba(139, 92, 246, 0.15)' },
  { level: 5, label: 'Lvl 5 (Meister)', minInterval: 15, color: '#22C55E', bgAlpha: 'rgba(34, 197, 94, 0.15)' },
];

export function getTodayTimestamp(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Überprüft, ob Karten aufgrund längerer Inaktivität um eine Stufe zurückgesetzt werden müssen.
 * Wenn eine Karte seit mehr als (Intervall + 7 Tage) überfällig ist, sinkt sie um 1 Level.
 */
export function applyInactivityDecay(currentProgress: ProgressMap): ProgressMap {
  const today = getTodayTimestamp();
  const msInDay = 24 * 60 * 60 * 1000;
  let hasChanges = false;
  const updatedProgress: ProgressMap = { ...currentProgress };

  for (const key in updatedProgress) {
    const card = updatedProgress[key];
    if (!card || card.repetitions === 0) continue;

    const overdueDays = (today - card.dueDate) / msInDay;
    const allowedGraceDays = Math.max(7, Math.round(card.interval * 0.5));

    if (overdueDays > allowedGraceDays) {
      hasChanges = true;
      // Stufe um 1 reduzieren
      const newRepetitions = Math.max(0, card.repetitions - 1);
      let newInterval = 1;
      if (newRepetitions === 1) newInterval = 3;
      else if (newRepetitions === 2) newInterval = 6;
      else if (newRepetitions === 3) newInterval = 14;
      else if (newRepetitions >= 4) newInterval = 30;

      updatedProgress[key] = {
        ...card,
        repetitions: newRepetitions,
        interval: newInterval,
        dueDate: today, // Sofort zur Wiederholung vorlegen
        state: newRepetitions >= 2 ? 'learned' : 'learning',
      };
    }
  }

  return hasChanges ? updatedProgress : currentProgress;
}

export function getWordLevelNumber(vocabId: number, progress: ProgressMap): number {
  const p1 = progress[`${vocabId}_es-de`];
  const p2 = progress[`${vocabId}_de-es`];

  // Bugfix: Die Level-Labels ("Lvl 5 (Meister)" etc.) und die Kommentare in
  // types.ts (LevelStats) versprechen eine Einteilung nach TATSÄCHLICHEM
  // Wiederholungs-Intervall in Tagen (LEVEL_CONFIG.minInterval: 0/2/4/7/15).
  // Bisher wurde hier aber die reine Wiederholungs-ANZAHL (repetitions)
  // ausgewertet, unabhängig vom Intervall. Durch den adaptiven Ease-Faktor
  // können zwei Karten bei gleicher repetitions-Zahl ein völlig
  // unterschiedliches Intervall haben (leichte Karte: schon 20+ Tage,
  // schwere Karte: erst 3 Tage) – beide erschienen bisher trotzdem als
  // "Meister". Jetzt wird stattdessen das größere der beiden Intervalle
  // gegen die in LEVEL_CONFIG definierten Tages-Schwellen geprüft.
  const interval1 = p1 ? p1.interval : 0;
  const interval2 = p2 ? p2.interval : 0;
  const maxInterval = Math.max(interval1, interval2);
  const hasAnyProgress = !!p1 || !!p2;

  if (!hasAnyProgress) return 1;

  let level = 1;
  for (const cfg of LEVEL_CONFIG) {
    if (maxInterval >= cfg.minInterval) level = cfg.level;
  }
  return level;
}

export function getLevelColor(levelNumber: number): string {
  const found = LEVEL_CONFIG.find((l) => l.level === levelNumber);
  return found ? found.color : '#EF4444';
}

export function calculateLevelStats(vocabList: VocabItem[], progress: ProgressMap): LevelStats {
  const stats: LevelStats = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
  };

  const activeVocabs = vocabList.filter((v) => !v.parked);

  activeVocabs.forEach((v) => {
    const lvl = getWordLevelNumber(v.id, progress);
    if (lvl === 1) stats.level1++;
    else if (lvl === 2) stats.level2++;
    else if (lvl === 3) stats.level3++;
    else if (lvl === 4) stats.level4++;
    else if (lvl === 5) stats.level5++;
  });

  return stats;
}

export function calculateGeneralStats(vocabList: VocabItem[], progress: ProgressMap) {
  let dueCount = 0;
  let masteredCount = 0;
  let inProgressCount = 0;
  let newCount = 0;
  const today = getTodayTimestamp();

  const activeVocabs = vocabList.filter((v) => !v.parked);

  activeVocabs.forEach((v) => {
    const p1 = progress[`${v.id}_es-de`];
    const p2 = progress[`${v.id}_de-es`];

    // Card is due if at least one direction was reviewed before and is due today
    const isDue1 = p1 !== undefined && p1.dueDate <= today;
    const isDue2 = p2 !== undefined && p2.dueDate <= today;
    if (isDue1 || isDue2) {
      dueCount++;
    }

    const reps1 = p1 ? p1.repetitions : 0;
    const reps2 = p2 ? p2.repetitions : 0;
    const maxReps = Math.max(reps1, reps2);

    const hasBeenReviewed = (p1 && p1.lastReviewed) || (p2 && p2.lastReviewed) || maxReps >= 1;

    // Konsistent mit getWordLevelNumber(): "gemeistert" = Level 5, also
    // tatsächliches Intervall >= 15 Tage in mind. einer Richtung.
    if (getWordLevelNumber(v.id, progress) === 5) {
      masteredCount++;
    }

    if (hasBeenReviewed) {
      inProgressCount++;
    } else {
      newCount++;
    }
  });

  return {
    dueCount,
    learnedCount: inProgressCount,
    masteredCount,
    newCount,
    totalCount: activeVocabs.length,
  };
}

export function updateCardInterval(
  wordId: number,
  direction: string,
  rating: number,
  currentProgress: ProgressMap
): ProgressMap {
  const key = `${wordId}_${direction}`;
  const existing = currentProgress[key] || {
    interval: 0,
    ease: 2.5,
    dueDate: getTodayTimestamp(),
    repetitions: 0,
    state: 'new',
  };

  const p = { ...existing };
  const today = getTodayTimestamp();
  const msInDay = 24 * 60 * 60 * 1000;

  if (rating === 0) { // Nochmal (Zurück auf Stufe 1)
    p.interval = 1;
    p.repetitions = 0;
    p.ease = Math.max(1.3, p.ease - 0.2);
    p.state = 'learning';
  } else if (rating === 1) { // Schwer / Bald
    p.interval = Math.max(1, Math.round((p.interval || 1) * 1.2));
    p.repetitions = Math.max(1, p.repetitions);
    p.ease = Math.max(1.3, p.ease - 0.1);
    p.state = 'learning';
  } else if (rating === 2) { // Gut (Nächstes Level)
    if (p.repetitions === 0) p.interval = 3;
    else if (p.repetitions === 1) p.interval = 6;
    else if (p.repetitions === 2) p.interval = 14;
    else p.interval = Math.round(p.interval * p.ease);
    
    p.repetitions += 1;
    p.state = p.repetitions >= 2 ? 'learned' : 'learning';
  } else if (rating === 3) { // Einfach (Schneller Aufstieg)
    if (p.repetitions === 0) p.interval = 4;
    else if (p.repetitions === 1) p.interval = 8;
    else if (p.repetitions === 2) p.interval = 18;
    else p.interval = Math.round(p.interval * p.ease * 1.3);

    p.repetitions += 1;
    p.ease = Math.min(3.0, p.ease + 0.15);
    p.state = p.repetitions >= 2 ? 'learned' : 'learning';
  }

  p.dueDate = today + p.interval * msInDay;
  p.lastReviewed = Date.now();

  return {
    ...currentProgress,
    [key]: p,
  };
}

