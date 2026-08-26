import React from 'react';
import { LevelStats } from '../types';
import { LEVEL_CONFIG } from '../utils/srsAlgorithm';

interface StatsRowProps {
  dueCount: number;
  learnedCount: number;
  streakDays: number;
  levelStats: LevelStats;
  totalCount: number;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  dueCount,
  learnedCount,
  streakDays,
  levelStats,
  totalCount,
}) => {
  const levels = [
    { ...LEVEL_CONFIG[0], count: levelStats.level1 },
    { ...LEVEL_CONFIG[1], count: levelStats.level2 },
    { ...LEVEL_CONFIG[2], count: levelStats.level3 },
    { ...LEVEL_CONFIG[3], count: levelStats.level4 },
    { ...LEVEL_CONFIG[4], count: levelStats.level5 },
  ];

  const maxCount = Math.max(...levels.map((l) => l.count), 1);

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Top Stat Boxes */}
      <div className="flex gap-2.5">
        <div className="flex-1 bg-[#1E293B] rounded-2xl p-3.5 flex flex-col items-center gap-1 text-center border border-white/5">
          <span className="text-[22px] font-bold text-white">{dueCount}</span>
          <span className="text-[11.5px] font-medium text-[#94A3B8]">Fällig</span>
        </div>
        <div className="flex-1 bg-[#1E293B] rounded-2xl p-3.5 flex flex-col items-center gap-1 text-center border border-white/5">
          <span className="text-[22px] font-bold text-white">{learnedCount}</span>
          <span className="text-[11.5px] font-medium text-[#94A3B8]">Gelernt</span>
        </div>
        <div className="flex-1 bg-[#1E293B] rounded-2xl p-3.5 flex flex-col items-center gap-1 text-center border border-white/5">
          <span className="text-[22px] font-bold text-white">{streakDays}</span>
          <span className="text-[11.5px] font-medium text-[#94A3B8]">Serie (Tage)</span>
        </div>
      </div>

      {/* Level Distribution Bar Chart in Cohesive Purple Theme */}
      <div className="bg-[#1E293B] rounded-2xl p-4 border border-white/5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[12.5px] font-bold text-[#94A3B8] tracking-wider uppercase">
            Level-Verteilung (5 Stufen)
          </span>
          <span className="text-[11px] text-[#64748B] font-semibold">{totalCount} Vokabeln</span>
        </div>

        <div className="grid grid-cols-5 gap-2 items-end h-[85px] pt-2 pb-1">
          {levels.map((lvl) => {
            const heightPct = Math.round((lvl.count / maxCount) * 100);
            return (
              <div key={lvl.level} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10.5px] font-bold text-white/90">{lvl.count}</span>
                <div className="w-full bg-white/5 rounded-t-md h-full flex items-end overflow-hidden">
                  <div
                    className="w-full rounded-t-md transition-all duration-500 ease-out bg-gradient-to-t from-[#6366F1] to-[#8B5CF6]"
                    style={{
                      height: `${Math.max(heightPct, 8)}%`,
                      opacity: 0.6 + (lvl.level * 0.08),
                      boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)',
                    }}
                  ></div>
                </div>
                <span className="text-[9.5px] font-semibold text-[#94A3B8] whitespace-nowrap">
                  Lvl {lvl.level}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
