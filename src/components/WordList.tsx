import React, { useState } from 'react';
import { VocabItem, ProgressMap } from '../types';
import { getWordLevelNumber, getLevelColor } from '../utils/srsAlgorithm';
import { getCategoryIconName, getTypeColor } from '../utils/categoryIcons';
import { speakText } from '../utils/audio';

interface WordListProps {
  vocabList: VocabItem[];
  progress: ProgressMap;
  onSelectWord: (word: VocabItem) => void;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function matchesExact(target: string, query: string): boolean {
  if (!target || !query) return false;
  const qNorm = normalize(query);
  const tNorm = normalize(target);
  if (!qNorm) return false;

  // 1. Direct segment match (split by / or ; or , or parentheses)
  const segments = tNorm
    .split(/[\/;,\(\)\[\]]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.some((s) => s === qNorm)) {
    return true;
  }

  // 2. Exact word token boundary match
  const words = tNorm.split(/[^a-z0-9äöüß]+/).filter(Boolean);
  if (words.some((w) => w === qNorm)) {
    return true;
  }

  // 3. Exact multi-word phrase match
  if (qNorm.includes(' ')) {
    const escaped = qNorm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9äöüß])${escaped}($|[^a-z0-9äöüß])`);
    return regex.test(tNorm);
  }

  return false;
}

export const WordList: React.FC<WordListProps> = ({ vocabList, progress, onSelectWord }) => {
  const [query, setQuery] = useState('');

  const cleanQuery = query.trim();

  // Exact word search on Spanish word and German translation (excludes substrings like 'messen' for 'essen')
  // Exclude parked items completely from search results
  const matching = cleanQuery === ''
    ? []
    : vocabList.filter((v) =>
        !v.parked && (
          matchesExact(v.word, cleanQuery) ||
          matchesExact(v.translation, cleanQuery)
        )
      );

  // Sorting: Prioritize exact whole-word match, then importance, then sequential ID
  const filtered = [...matching].sort((a, b) => {
    const aImp = a.importance || 3;
    const bImp = b.importance || 3;
    if (aImp !== bImp) return aImp - bImp;

    return a.id - b.id;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nach Vokabeln suchen..."
          className="w-full p-[14px] pl-11 pr-10 bg-[#1E293B] border border-white/5 rounded-xl text-white text-[15px] outline-none focus:border-[#6366F1] placeholder-[#64748B] transition-colors"
        />
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] text-sm"></i>
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white text-xs p-1 cursor-pointer"
            aria-label="Suche zurücksetzen"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* Word List Container */}
      <div className="flex flex-col gap-2 mt-1">
        {cleanQuery !== '' && filtered.length === 0 && (
          <div className="text-center text-[#64748B] py-8 px-3 text-[14px] bg-[#1E293B]/30 rounded-2xl border border-white/5">
            Keine Vokabeln für "{query}" gefunden.
          </div>
        )}

        {filtered.slice(0, 100).map((v) => {
          const levelNum = getWordLevelNumber(v.id, progress);
          const levelColor = getLevelColor(levelNum);
          const iconName = getCategoryIconName(v.category, v.type);
          const typeColor = getTypeColor(v.type);

          return (
            <div
              key={v.id}
              onClick={() => onSelectWord(v)}
              className="flex items-center gap-3 bg-[#1E293B] rounded-xl p-3.5 border border-white/5 cursor-pointer hover:bg-white/[0.03] transition-all transform active:scale-[0.99]"
            >
              {/* Category Icon Dot */}
              <div
                className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
              >
                <i className={`fa-solid ${iconName}`}></i>
              </div>

              {/* Word Details */}
              <div className="flex-grow min-w-0">
                <div className="text-[15px] font-bold text-white truncate">
                  {v.word}{' '}
                  <span className="font-normal text-[#94A3B8] text-[13px]">
                    ({v.translation})
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] font-semibold mt-0.5 flex items-center gap-2">
                  <span>{v.category}</span>
                  <span className="w-1 h-1 rounded-full bg-[#64748B]/40"></span>
                  <span>{v.type}</span>
                </div>
              </div>

              {/* Microphone Audio Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(v.word, 'es-ES');
                }}
                title="Spanisches Wort vorlesen"
                className="h-7 w-7 rounded-lg bg-[#6366F1]/20 hover:bg-[#6366F1]/40 active:scale-95 text-[#818CF8] hover:text-white border border-white/5 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <i className="fa-solid fa-microphone text-xs"></i>
              </button>

              {/* IIIII Bar Level Indicator (5 segments) */}
              <div
                className="flex items-center gap-[3px] px-2 h-7 bg-white/5 rounded-lg border border-white/5 shrink-0"
                title={`Level ${levelNum} von 5`}
              >
                {[1, 2, 3, 4, 5].map((bar) => (
                  <span
                    key={bar}
                    className={`w-[3.5px] h-3.5 rounded-sm transition-colors ${
                      bar <= levelNum ? 'bg-[#6366F1]' : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length > 100 && (
          <div className="text-center text-[#64748B] text-xs py-2">
            Zeige die ersten 100 von {filtered.length} Vokabeln. Verfeinere deine Suche für mehr Ergebnisse.
          </div>
        )}
      </div>
    </div>
  );
};
