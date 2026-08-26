import { useState, useEffect } from 'react';
import { VocabItem, ProgressMap, SessionStep } from './types';
import { Header } from './components/Header';
import { StatsRow } from './components/StatsRow';
import { WordList } from './components/WordList';
import { SingleWordModal } from './components/SingleWordModal';
import { SessionModal } from './components/SessionModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import {
  loadVocabDatabase,
  loadUserProgress,
  saveUserProgress,
  getStreakDays,
  saveVocabDatabase,
} from './utils/vocabStorage';
import {
  calculateGeneralStats,
  calculateLevelStats,
  updateCardInterval,
  getTodayTimestamp,
  applyInactivityDecay,
} from './utils/srsAlgorithm';
import { isValidSpanishSentence } from './utils/textUtils';
import { supabase, isSupabaseConfigured } from './utils/supabaseClient';
import { queueSync, flushSyncQueue, loadAndMergeFromSupabase, deleteAllProgressFromSupabase } from './utils/syncQueue';

export default function App() {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [streakDays, setStreakDays] = useState<number>(1);

  // Modals
  const [selectedWord, setSelectedWord] = useState<VocabItem | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [sessionQueue, setSessionQueue] = useState<SessionStep[]>([]);

  // Auth / Cloud-Sync
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(!isSupabaseConfigured);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const vocabs = loadVocabDatabase();
    let prog = loadUserProgress();
    const streak = getStreakDays();

    // Automatische Inaktivitäts-Degradierung bei längerer Lernpause
    const decayedProg = applyInactivityDecay(prog);
    if (decayedProg !== prog) {
      prog = decayedProg;
      saveUserProgress(prog);
    }

    setVocabList(vocabs);
    setProgress(prog);
    setStreakDays(streak);

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          setUserId(session.user.id);
          await flushSyncQueue(session.user.id, prog); // erst ausstehende lokale Änderungen hochladen
          const merged = await loadAndMergeFromSupabase(session.user.id, prog);
          setProgress(merged);
          saveUserProgress(merged);
        }
        setAuthChecked(true);
      });
    }
  }, []);

  // Online/Offline-Status verfolgen + bei Wiederverbindung synchronisieren
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (userId) flushSyncQueue(userId, progress);
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [userId, progress]);

  const generalStats = calculateGeneralStats(vocabList, progress);
  const levelStats = calculateLevelStats(vocabList, progress);

  const handleRateWord = (wordId: number, direction: string, rating: number) => {
    const updated = updateCardInterval(wordId, direction, rating, progress);
    setProgress(updated);
    saveUserProgress(updated);
    queueSync(wordId, direction);
    if (userId && isOnline) flushSyncQueue(userId, updated);
  };

  const prepareQueue = () => {
    const today = getTodayTimestamp();
    const activeVocabs = vocabList.filter((v) => !v.parked);

    // 1. Due candidates (overdue cards)
    const dueCandidates: Array<{ vocab: VocabItem; direction: 'es-de' | 'de-es'; priority: number }> = [];
    const newCandidates: Array<{ vocab: VocabItem; direction: 'es-de' | 'de-es'; priority: number }> = [];

    activeVocabs.forEach((v) => {
      (['es-de', 'de-es'] as const).forEach((dir) => {
        const p = progress[`${v.id}_${dir}`];
        if (p && p.dueDate <= today) {
          dueCandidates.push({ vocab: v, direction: dir, priority: p.dueDate });
        } else if (!p) {
          newCandidates.push({ vocab: v, direction: dir, priority: (v.importance || 3) * 10000 + v.id });
        }
      });
    });

    dueCandidates.sort((a, b) => a.priority - b.priority);
    newCandidates.sort((a, b) => a.priority - b.priority);

    const selected: Array<{ vocab: VocabItem; direction: 'es-de' | 'de-es' }> = [];
    const usedIds = new Set<number>();

    // 1. Add due cards (up to 10)
    for (const item of dueCandidates) {
      if (selected.length >= 10) break;
      if (!usedIds.has(item.vocab.id)) {
        selected.push(item);
        usedIds.add(item.vocab.id);
      }
    }

    // 2. Fill with new cards with 80% ES->DE and 20% DE->ES direction distribution
    let deEsCount = selected.filter((s) => s.direction === 'de-es').length;

    for (const item of newCandidates) {
      if (selected.length >= 10) break;
      if (usedIds.has(item.vocab.id)) continue;

      // Allow DE->ES only up to 2 items per 10-card session (~20%)
      if (item.direction === 'de-es' && deEsCount >= 2) {
        continue;
      }

      if (item.direction === 'de-es') {
        deEsCount++;
      }

      selected.push(item);
      usedIds.add(item.vocab.id);
    }

    if (selected.length === 0 && vocabList.length > 0) {
      selected.push({ vocab: vocabList[0], direction: 'es-de' });
    }

    const queue: SessionStep[] = selected.map((item) => {
      const hasSentence =
        item.vocab.examples &&
        item.vocab.examples.length > 0 &&
        item.vocab.examples[0].es &&
        isValidSpanishSentence(item.vocab.examples[0].es);

      const p = progress[`${item.vocab.id}_${item.direction}`];
      const isWordLearnedEnough = p && p.repetitions >= 2;
      const isQuiz = item.direction === 'es-de' && hasSentence && isWordLearnedEnough && Math.random() < 0.35;

      return {
        type: isQuiz ? 'quiz' : 'flashcard',
        vocab: item.vocab,
        direction: item.direction,
      };
    });

    return queue;
  };

  const handleStartStandardSession = () => {
    const queue = prepareQueue();
    setSessionQueue(queue);
    setIsSessionOpen(true);
  };

  const handleResetProgress = () => {
    localStorage.removeItem('vocab_progress_v2');
    localStorage.removeItem('vocab_sync_queue');
    setProgress({});
    setIsSettingsOpen(false);
    if (userId) deleteAllProgressFromSupabase(userId);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUserId(null);
  };

  const handleVocabUpdated = (newList: VocabItem[]) => {
    setVocabList(newList);
    saveVocabDatabase(newList);
  };

  // Solange Supabase konfiguriert ist, aber die Session-Prüfung noch läuft: kurz nichts zeigen
  if (!authChecked) {
    return (
      <div className="bg-[#0F172A] text-white min-h-dvh flex justify-center w-full overflow-x-hidden">
        <div className="w-full max-w-[480px] flex items-center justify-center">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-[#6366F1]"></i>
        </div>
      </div>
    );
  }

  // Login/Registrierung nur relevant, wenn Supabase konfiguriert ist UND kein Nutzer eingeloggt ist.
  // Ohne Konfiguration oder nach "Ohne Konto weiter" läuft die App wie gehabt rein lokal.
  if (isSupabaseConfigured && !userId) {
    return (
      <div className="bg-[#0F172A] text-white min-h-dvh flex justify-center w-full overflow-x-hidden px-4">
        <AuthScreen
          onAuthenticated={async (id) => {
            setUserId(id);
            await flushSyncQueue(id, progress);
            const merged = await loadAndMergeFromSupabase(id, progress);
            setProgress(merged);
            saveUserProgress(merged);
          }}
          onSkip={() => setAuthChecked(true)}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] text-white min-h-dvh flex justify-center w-full overflow-x-hidden selection:bg-[#6366F1] selection:text-white">
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full z-[500] bg-amber-500/95 text-[#1E1300] text-center text-[12.5px] font-bold py-2 px-3">
          Offline – Fortschritt wird lokal gespeichert und später synchronisiert.
        </div>
      )}
      <div className="w-full max-w-[480px] flex flex-col relative px-4 pt-2 pb-[60px] overflow-x-hidden">
        {/* Header */}
        <Header
          learnedCount={generalStats.learnedCount}
          totalCount={generalStats.totalCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Stats Row & 5-Level Bar Chart */}
        <StatsRow
          dueCount={generalStats.dueCount}
          learnedCount={generalStats.learnedCount}
          streakDays={streakDays}
          levelStats={levelStats}
          totalCount={generalStats.totalCount}
        />

        {/* Lernen Button (Full Width primary CTA) */}
        <button
          type="button"
          onClick={handleStartStandardSession}
          className="w-full py-4 rounded-2xl border-none text-white text-base font-bold cursor-pointer mb-6 flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98] bg-[#6366F1] hover:bg-[#4F46E5] shadow-[#6366F1]/20"
        >
          <i className="fa-solid fa-play"></i>
          <span>Lernen ({generalStats.dueCount > 0 ? `${generalStats.dueCount} fällig` : '10 Vokabeln'})</span>
        </button>

        {/* Word Search & Interactive List */}
        <WordList
          vocabList={vocabList}
          progress={progress}
          onSelectWord={(word) => setSelectedWord(word)}
        />

        {/* Single Word Flashcard Modal */}
        <SingleWordModal
          word={selectedWord}
          progress={progress}
          onClose={() => setSelectedWord(null)}
          onRateWord={handleRateWord}
        />

        {/* Quick Flashcard Session Modal */}
        <SessionModal
          isOpen={isSessionOpen}
          vocabList={vocabList}
          sessionQueue={sessionQueue}
          onClose={() => setIsSessionOpen(false)}
          onRateWord={handleRateWord}
        />

        {/* Settings & Import/Export Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          vocabList={vocabList}
          onClose={() => setIsSettingsOpen(false)}
          onResetProgress={handleResetProgress}
          onVocabUpdated={handleVocabUpdated}
          isLoggedIn={!!userId}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}
