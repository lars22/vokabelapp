import { ProgressMap } from '../types';
import { supabase } from './supabaseClient';

const SYNC_QUEUE_KEY = 'vocab_sync_queue';

function getSyncQueue(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setSyncQueue(queue: string[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function getPendingSyncCount(): number {
  return getSyncQueue().length;
}

// Nach jeder Bewertung aufrufen: merkt die Änderung lokal vor (localStorage
// ist bereits geschrieben, siehe saveUserProgress) und synchronisiert sofort,
// falls online + eingeloggt. Offline bleibt die Änderung einfach in der
// Warteschlange, bis wieder Netz da ist.
export function queueSync(wordId: number, direction: string): void {
  if (!supabase) return; // Supabase nicht konfiguriert -> rein lokal, wie bisher
  const key = `${wordId}_${direction}`;
  const queue = getSyncQueue();
  if (!queue.includes(key)) {
    queue.push(key);
    setSyncQueue(queue);
  }
}

export async function flushSyncQueue(userId: string, progress: ProgressMap): Promise<void> {
  if (!supabase || !navigator.onLine) return;
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  const rows = queue
    .filter((key) => progress[key]) // falls zwischenzeitlich zurückgesetzt wurde
    .map((key) => {
      const lastUnderscore = key.lastIndexOf('_');
      const wordId = parseInt(key.slice(0, lastUnderscore), 10);
      const direction = key.slice(lastUnderscore + 1);
      const p = progress[key];
      return {
        user_id: userId,
        word_id: wordId,
        direction,
        interval: p.interval,
        ease: p.ease,
        due_date: p.dueDate,
        repetitions: p.repetitions,
        state: p.state,
        updated_at: new Date(p.lastReviewed || Date.now()).toISOString(),
      };
    });

  if (rows.length === 0) {
    setSyncQueue([]);
    return;
  }

  const { error } = await supabase
    .from('vocab_progress')
    .upsert(rows, { onConflict: 'user_id,word_id,direction' });

  if (!error) {
    setSyncQueue([]);
  } else {
    console.error('Sync fehlgeschlagen, versuche es später erneut:', error);
  }
}

// Lädt den Server-Stand und merged ihn mit dem lokalen Stand: "neuer
// gewinnt" pro Karte, anhand von lastReviewed / updated_at. Immer erst
// flushSyncQueue() aufrufen, damit lokale Änderungen nicht überschrieben
// werden, bevor sie hochgeladen wurden.
export async function loadAndMergeFromSupabase(
  userId: string,
  localProgress: ProgressMap
): Promise<ProgressMap> {
  if (!supabase) return localProgress;

  const { data, error } = await supabase.from('vocab_progress').select('*').eq('user_id', userId);
  if (error || !data) return localProgress;

  const merged: ProgressMap = { ...localProgress };
  data.forEach((row) => {
    const key = `${row.word_id}_${row.direction}`;
    const remoteUpdatedAt = new Date(row.updated_at).getTime();
    const local = merged[key];
    if (!local || !local.lastReviewed || remoteUpdatedAt > local.lastReviewed) {
      merged[key] = {
        interval: row.interval,
        ease: row.ease,
        dueDate: row.due_date,
        repetitions: row.repetitions,
        state: row.state,
        lastReviewed: remoteUpdatedAt,
      };
    }
  });

  return merged;
}

export async function deleteAllProgressFromSupabase(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('vocab_progress').delete().eq('user_id', userId);
}
