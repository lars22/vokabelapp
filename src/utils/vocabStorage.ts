import { VocabItem, ProgressMap } from '../types';
import { generate3000VocabDatabase } from '../data/vocabData';

const VOCAB_STORAGE_KEY = 'vocab_database_v9_clean_examples';
const PROGRESS_STORAGE_KEY = 'vocab_progress_v2';
const STREAK_STORAGE_KEY = 'vocab_streak';

export function loadVocabDatabase(): VocabItem[] {
  try {
    const saved = localStorage.getItem(VOCAB_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any legacy synthetic variations
        const cleaned = parsed.filter(
          (v: VocabItem) => !v.word.includes('(Var.') && !v.translation.includes('(Var.')
        );
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load vocabulary from localStorage:', err);
  }

  // Fallback to generated clean database
  const defaultList = generate3000VocabDatabase();
  saveVocabDatabase(defaultList);
  return defaultList;
}

export function saveVocabDatabase(vocabList: VocabItem[]): void {
  try {
    localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(vocabList));
  } catch (err) {
    console.error('Failed to save vocabulary to localStorage:', err);
  }
}

export function loadUserProgress(): ProgressMap {
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load user progress:', err);
  }
  return {};
}

export function saveUserProgress(progress: ProgressMap): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save progress:', err);
  }
}

export function getStreakDays(): number {
  return parseInt(localStorage.getItem(STREAK_STORAGE_KEY) || '1', 10);
}

export function importVocabFromJSON(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) {
      return { success: false, count: 0, error: 'Das JSON muss ein Array von Vokabel-Objekten sein.' };
    }

    const validItems: VocabItem[] = [];
    data.forEach((item, index) => {
      if (item && typeof item.word === 'string' && typeof item.translation === 'string') {
        validItems.push({
          id: item.id || index + 1,
          word: item.word.trim(),
          translation: item.translation.trim(),
          type: item.type || 'Substantiv',
          category: item.category || 'Grundwörter',
          examples: Array.isArray(item.examples) && item.examples.length > 0 ? item.examples : [item.word],
        });
      }
    });

    if (validItems.length === 0) {
      return { success: false, count: 0, error: 'Keine gültigen Vokabel-Einträge im JSON gefunden.' };
    }

    saveVocabDatabase(validItems);
    return { success: true, count: validItems.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Ungültiges JSON Format.' };
  }
}

export function importVocabFromAnkiText(text: string): { success: boolean; count: number; error?: string } {
  try {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0 && !line.startsWith('#'));
    const items: VocabItem[] = [];

    lines.forEach((line, index) => {
      // Strip common HTML tags from Anki export
      const cleanLine = line.replace(/<[^>]*>/g, '').trim();
      
      // Split by tab, semicolon, or pipe
      let parts = cleanLine.split('\t');
      if (parts.length < 2) {
        parts = cleanLine.split(';');
      }
      if (parts.length < 2) {
        parts = cleanLine.split('|');
      }

      if (parts.length >= 2) {
        const word = parts[0].trim();
        const translation = parts[1].trim();
        const example = parts[2] ? parts[2].trim() : '';
        const category = parts[3] ? parts[3].trim() : 'Anki Import';

        if (word && translation) {
          let type: VocabItem['type'] = 'Substantiv';
          if (word.startsWith('el ') || word.startsWith('la ') || word.startsWith('los ') || word.startsWith('las ')) {
            type = 'Substantiv';
          } else if (word.endsWith('ar') || word.endsWith('er') || word.endsWith('ir')) {
            type = 'Verb';
          }

          items.push({
            id: index + 1,
            word,
            translation,
            type,
            category,
            examples: example ? [{ es: example, de: '' }] : [],
          });
        }
      }
    });

    if (items.length === 0) {
      return { success: false, count: 0, error: 'Keine gültigen Zeilen (Wort [TAB] Übersetzung) im Text/Anki-Format gefunden.' };
    }

    saveVocabDatabase(items);
    return { success: true, count: items.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Fehler beim Anki-Import.' };
  }
}

export function exportVocabToJSON(vocabList: VocabItem[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vocabList, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `spanish_vocab_3000.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function resetVocabToDefault(): VocabItem[] {
  const defaultList = generate3000VocabDatabase();
  saveVocabDatabase(defaultList);
  return defaultList;
}
