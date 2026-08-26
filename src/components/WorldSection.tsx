import React, { useState, useEffect } from 'react';
import { ThreeWorldCanvas } from './worlds/ThreeWorldCanvas';
import { WorldModal } from './worlds/WorldModal';
import { FOREST_TIERS, calculateForestVitality, loadForestCoins, loadPlantedForestHistory } from './worlds/forestData';

interface WorldSectionProps {
  learnedCount: number;
  streakDays: number;
  daysSinceLastStudy?: number;
  levelStats: { [level: number]: number };
  totalCount: number;
  onStartFocusSession?: () => void;
}

export const WorldSection: React.FC<WorldSectionProps> = ({
  learnedCount,
  streakDays,
  daysSinceLastStudy = 0,
  levelStats,
  totalCount,
  onStartFocusSession,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [coins, setCoins] = useState(120);
  const [plantedTrees, setPlantedTrees] = useState<any[]>([]);

  useEffect(() => {
    setCoins(loadForestCoins());
    setPlantedTrees(loadPlantedForestHistory());
  }, [learnedCount, isDetailModalOpen]);

  // Find active forest tier
  const currentTier =
    FOREST_TIERS.slice().reverse().find((t) => learnedCount >= t.minWords) || FOREST_TIERS[0];
  const nextTier = FOREST_TIERS.find((t) => learnedCount < t.minWords);
  const wordsToNext = nextTier ? nextTier.minWords - learnedCount : 0;
  const totalUnlockedTiers = FOREST_TIERS.filter((t) => learnedCount >= t.minWords).length;
  const progressPercent = Math.min(100, Math.round((learnedCount / totalCount) * 100));

  const vitality = calculateForestVitality(daysSinceLastStudy);

  return (
    <div className="mb-6">
      {/* Outer Card */}
      <div className="bg-[#1E293B] rounded-[24px] p-4 sm:p-5 border border-white/10 shadow-2xl relative overflow-hidden group">
        {/* Ambient Glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: currentTier.accentColor }}
        ></div>

        {/* Card Header */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-base shadow-md"
              style={{ backgroundColor: `${currentTier.accentColor}25`, color: currentTier.accentColor }}
            >
              <i className={`fa-solid ${currentTier.icon}`}></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-white tracking-tight block leading-none">
                  El Bosque de Vocabulario
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1"
                  style={{
                    backgroundColor: `${vitality.color}20`,
                    borderColor: `${vitality.color}40`,
                    color: vitality.color,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: vitality.color }}></span>
                  <span>{vitality.percentage}% Vital</span>
                </span>
              </div>
              <span className="text-[11.5px] text-[#94A3B8] font-medium leading-none mt-1 block">
                Stufe {currentTier.tierNumber}: <strong className="text-white">{currentTier.nameEs}</strong> ({currentTier.nameDe})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(true)}
              className="text-[12px] font-bold text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-white/10"
              title="Großen 3D-Wald öffnen"
            >
              <i className="fa-solid fa-tree text-[11px] text-emerald-400"></i>
              <span>Erkunden</span>
            </button>
          </div>
        </div>

        {/* Interactive 3D World Preview Window */}
        <div className="relative w-full h-[250px] sm:h-[280px] rounded-2xl overflow-hidden group border border-white/15 bg-[#090d16] shadow-2xl">
          <ThreeWorldCanvas
            learnedCount={learnedCount}
            streakDays={streakDays}
            daysSinceLastStudy={daysSinceLastStudy}
            isMini={true}
            plantedTrees={plantedTrees}
          />

          {/* Floating Click-to-Expand Button */}
          <button
            type="button"
            onClick={() => setIsDetailModalOpen(true)}
            className="absolute bottom-3 right-3 bg-black/85 hover:bg-black backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-white text-[12px] font-bold flex items-center gap-2 shadow-2xl transition-all active:scale-95 cursor-pointer z-20"
          >
            <i className="fa-solid fa-up-right-and-down-left-from-center text-[11px] text-emerald-400"></i>
            <span>3D-Wald & Shop öffnen</span>
          </button>

          {/* Floating Active Stage Badge */}
          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-white text-[11px] font-medium flex items-center gap-2 pointer-events-none z-20">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
              style={{ backgroundColor: currentTier.accentColor }}
            ></span>
            <span>
              {learnedCount} / {totalCount} Wörter • {totalUnlockedTiers}/{FOREST_TIERS.length} Stufen
            </span>
          </div>

          {/* Micro-Reward Teaser Pill */}
          {nextTier && (
            <div className="absolute bottom-3 left-3 bg-[#0F172A]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 text-white text-[11px] flex items-center gap-2 shadow-xl z-20 pointer-events-none hidden sm:flex">
              <i className="fa-solid fa-seedling text-emerald-400"></i>
              <span>
                Nächster Baum: <strong className="text-emerald-400">{nextTier.nameEs}</strong> (noch {wordsToNext} W.)
              </span>
            </div>
          )}
        </div>

        {/* Milestone Progress Bar & Immediate Motivation */}
        <div className="mt-3 bg-[#0F172A] rounded-xl p-3 border border-white/5 flex flex-col gap-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#CBD5E1]">
              <i className="fa-solid fa-leaf text-emerald-400 text-[11.5px]"></i>
              <span>
                {nextTier ? (
                  <>
                    Nächste Vegetationsstufe: <strong className="text-white">{nextTier.nameEs}</strong> (noch{' '}
                    <span className="text-emerald-400 font-bold">{wordsToNext}</span> Vokabeln)
                  </>
                ) : (
                  <span className="text-amber-300 font-bold">Goldener Lebensbaum in voller Blüte!</span>
                )}
              </span>
            </div>
            <span className="text-[#94A3B8] font-bold text-[11px]">
              {learnedCount} W.
            </span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-600 via-teal-400 to-amber-300"
              style={{ width: `${Math.max(3, progressPercent)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Fullscreen Interactive 3D World Modal */}
      <WorldModal
        isOpen={isDetailModalOpen}
        learnedCount={learnedCount}
        streakDays={streakDays}
        daysSinceLastStudy={daysSinceLastStudy}
        levelStats={levelStats}
        totalCount={totalCount}
        onClose={() => setIsDetailModalOpen(false)}
        onStartFocusSession={() => {
          setIsDetailModalOpen(false);
          if (onStartFocusSession) onStartFocusSession();
        }}
      />
    </div>
  );
};
