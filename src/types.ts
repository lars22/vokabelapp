export type WordType = 'Verb' | 'Substantiv' | 'Adjektiv' | 'Adverb' | 'Pronomen' | 'Präposition' | 'Konjunktion' | 'Ausruf' | 'Phrasen';

export interface VocabExample {
  es: string;
  de: string;
}

export interface VocabItem {
  id: number;
  word: string;
  translation: string;
  type: WordType;
  category: string;
  grammarNotes?: string;
  importance?: number; // 1 (Essentiell/Basis) bis 5 (Spezialisiert)
  parked?: boolean; // Geparkte / verwirrende Karten
  examples: VocabExample[];
}

export type LearningDirection = 'es-de' | 'de-es';

export interface ProgressState {
  interval: number; // in days
  ease: number;
  dueDate: number; // timestamp in ms
  repetitions: number;
  state: 'new' | 'learning' | 'learned';
  lastReviewed?: number;
}

// Progress keyed by `${wordId}_${direction}`
export type ProgressMap = Record<string, ProgressState>;

export interface LevelStats {
  level1: number; // Neu / Tag 0-1 (Rot)
  level2: number; // Einsteiger / Tag 2-3 (Orange)
  level3: number; // Fortgeschritten / Tag 4-6 (Blau)
  level4: number; // Vertieft / Tag 7-14 (Lila)
  level5: number; // Meister / Tag 15+ (Grün)
}

export interface SessionStep {
  type: 'flashcard' | 'quiz';
  vocab: VocabItem;
  direction: LearningDirection;
}
