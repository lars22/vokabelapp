import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThreeWorldCanvas } from './ThreeWorldCanvas';
import {
  FOREST_TIERS,
  calculateForestVitality,
  TREE_SPECIES_CATALOG,
  FOCUS_TAGS,
  PlantedTreeRecord,
  loadPlantedForestHistory,
  loadForestCoins,
  loadUnlockedSpecies,
  unlockSpecies,
  spendForestCoins,
  loadRealTreesDonated,
  donateToPlantRealTree,
  filterForestHistory,
} from './forestData';
import { InteractiveFlora } from './forest3DBuilder';
import { speakText } from '../../utils/audio';

interface WorldModalProps {
  isOpen: boolean;
  learnedCount: number;
  streakDays: number;
  daysSinceLastStudy?: number;
  levelStats: { [level: number]: number };
  totalCount: number;
  onClose: () => void;
  onStartFocusSession?: () => void;
}

export const WorldModal: React.FC<WorldModalProps> = ({
  isOpen,
  learnedCount,
  streakDays,
  daysSinceLastStudy = 0,
  levelStats,
  totalCount,
  onClose,
  onStartFocusSession,
}) => {
  const [activeTab, setActiveTab] = useState<'3d' | 'shop' | 'analytics' | 'stages'>('3d');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [selectedFlora, setSelectedFlora] = useState<InteractiveFlora | null>(null);
  const [vitalityOverride, setVitalityOverride] = useState<number | undefined>(undefined);
  const [isWateringAnimation, setIsWateringAnimation] = useState(false);

  // Forest App State
  const [plantedHistory, setPlantedHistory] = useState<PlantedTreeRecord[]>([]);
  const [coins, setCoins] = useState<number>(120);
  const [unlockedSpeciesList, setUnlockedSpeciesList] = useState<string[]>(['pine', 'apple']);
  const [realTreesDonated, setRealTreesDonated] = useState<number>(0);
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPlantedHistory(loadPlantedForestHistory());
      setCoins(loadForestCoins());
      setUnlockedSpeciesList(loadUnlockedSpecies());
      setRealTreesDonated(loadRealTreesDonated());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTier =
    FOREST_TIERS.slice().reverse().find((t) => learnedCount >= t.minWords) || FOREST_TIERS[0];
  const nextTier = FOREST_TIERS.find((t) => learnedCount < t.minWords);
  const wordsToNext = nextTier ? nextTier.minWords - learnedCount : 0;
  const progressPercent = Math.min(100, Math.round((learnedCount / totalCount) * 100));

  const effectiveDays = vitalityOverride !== undefined ? (100 - vitalityOverride) / 25 : daysSinceLastStudy;
  const vitality = calculateForestVitality(effectiveDays);

  const filteredHistory = filterForestHistory(plantedHistory, timeframe);
  const totalFocusMinutes = filteredHistory.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const healthyTreesCount = filteredHistory.filter((t) => t.status === 'healthy').length;
  const witheredTreesCount = filteredHistory.filter((t) => t.status === 'withered').length;

  const handleWaterForest = () => {
    setIsWateringAnimation(true);
    setVitalityOverride(100);
    setTimeout(() => {
      setIsWateringAnimation(false);
    }, 2500);
  };

  const handleUnlockSpecies = (speciesId: string, cost: number) => {
    if (coins < cost) {
      setPurchaseToast('Nicht genügend Sonnen-Taler! Lerne mehr Vokabeln.');
      setTimeout(() => setPurchaseToast(null), 2500);
      return;
    }
    const success = spendForestCoins(cost);
    if (success) {
      const updatedList = unlockSpecies(speciesId);
      setUnlockedSpeciesList(updatedList);
      setCoins(loadForestCoins());
      setPurchaseToast('🎉 Neue Baumart erfolgreich freigeschaltet!');
      setTimeout(() => setPurchaseToast(null), 2500);
    }
  };

  const handleDonateRealTree = () => {
    const res = donateToPlantRealTree();
    if (res.success) {
      setRealTreesDonated(res.totalRealTrees);
      setCoins(res.remainingCoins);
      setPurchaseToast('🌳 WUNDERBAR! Du hast einen echten Baum für die Erde gepflanzt!');
      setTimeout(() => setPurchaseToast(null), 3000);
    } else {
      setPurchaseToast('Du benötigst 2.500 Sonnen-Taler für einen echten Baum.');
      setTimeout(() => setPurchaseToast(null), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-fadeIn">
        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0F172A] border border-white/15 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Header Bar */}
          <div className="px-5 py-3.5 bg-[#1E293B]/90 border-b border-white/10 flex items-center justify-between shrink-0 relative z-20">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md"
                style={{ backgroundColor: `${currentTier.accentColor}25`, color: currentTier.accentColor }}
              >
                <i className={`fa-solid ${currentTier.icon}`}></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white leading-none">
                    El Bosque de Vocabulario
                  </h2>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1"
                    style={{
                      backgroundColor: `${vitality.color}20`,
                      borderColor: `${vitality.color}50`,
                      color: vitality.color,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: vitality.color }}></span>
                    <span>{vitality.percentage}% Vital</span>
                  </span>
                </div>
                <span className="text-xs text-[#94A3B8] font-medium leading-none mt-1 block">
                  Stufe {currentTier.tierNumber}: <strong className="text-white">{currentTier.nameEs}</strong>
                </span>
              </div>
            </div>

            {/* Currency Coins Badge & Tabs */}
            <div className="flex items-center gap-2">
              {/* Sunlight Droplet Coins Pill */}
              <div
                onClick={() => setActiveTab('shop')}
                className="bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-xl flex items-center gap-1.5 text-amber-300 font-bold text-xs cursor-pointer hover:bg-amber-400/25 transition-all shadow-sm"
                title="Sonnen-Taler (Klicke für Baum-Shop)"
              >
                <i className="fa-solid fa-sun text-amber-400 animate-spin-slow text-[11px]"></i>
                <span>{coins} ☀️</span>
              </div>

              {/* Desktop Navigation Tabs */}
              <div className="hidden sm:flex bg-[#0F172A] p-1 rounded-xl border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('3d')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === '3d' ? 'bg-emerald-600 text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-tree text-[11px]"></i>
                  <span>3D-Wald</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shop')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'shop' ? 'bg-[#6366F1] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-store text-[11px]"></i>
                  <span>Baum-Shop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'analytics' ? 'bg-[#6366F1] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-chart-pie text-[11px]"></i>
                  <span>Statistik</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('stages')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'stages' ? 'bg-[#6366F1] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-seedling text-[11px]"></i>
                  <span>Stufen</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Schließen"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="sm:hidden px-3 py-2 bg-[#1E293B]/60 border-b border-white/5 flex gap-1 justify-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('3d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeTab === '3d' ? 'bg-emerald-600 text-white' : 'text-[#94A3B8]'
              }`}
            >
              3D-Wald
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shop')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeTab === 'shop' ? 'bg-[#6366F1] text-white' : 'text-[#94A3B8]'
              }`}
            >
              Baum-Shop
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeTab === 'analytics' ? 'bg-[#6366F1] text-white' : 'text-[#94A3B8]'
              }`}
            >
              Statistik
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stages')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeTab === 'stages' ? 'bg-[#6366F1] text-white' : 'text-[#94A3B8]'
              }`}
            >
              Stufen
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 relative bg-[#090D16]">
            {/* Purchase / Toast Feedback */}
            {purchaseToast && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 inset-x-4 z-40 bg-emerald-500 text-white font-bold p-3 rounded-2xl shadow-2xl flex items-center justify-center gap-2 text-xs sm:text-sm border border-white/30"
              >
                <i className="fa-solid fa-circle-check text-base"></i>
                <span>{purchaseToast}</span>
              </motion.div>
            )}

            {/* Water Animation */}
            {isWateringAnimation && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 inset-x-4 z-40 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold p-3 rounded-2xl shadow-2xl flex items-center justify-center gap-2 text-xs sm:text-sm border border-white/30"
              >
                <i className="fa-solid fa-cloud-showers-heavy text-lg animate-bounce"></i>
                <span>💧 Vitalisierender Zauberregen gegossen! Dein Wald strotzt vor Lebenskraft!</span>
              </motion.div>
            )}

            {/* ============================================== */}
            {/* TAB 1: 3D FOREST DIORAMA WITH TIMEFRAME FILTER */}
            {/* ============================================== */}
            {activeTab === '3d' && (
              <div className="flex flex-col gap-3.5 h-full">
                {/* Forest Timeline Bar (Day, Week, Month, All) */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1E293B] p-2.5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#94A3B8] px-1 hidden sm:inline">Zeitraum:</span>
                    {(
                      [
                        { id: 'day', label: 'Hoy (Heute)' },
                        { id: 'week', label: 'Esta Semana' },
                        { id: 'month', label: 'Este Mes' },
                        { id: 'all', label: 'Todo (Alle)' },
                      ] as const
                    ).map((tf) => (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => setTimeframe(tf.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          timeframe === tf.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white/5 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>

                  {/* Summary for selected timeframe */}
                  <div className="flex items-center gap-3 text-xs font-semibold text-[#CBD5E1]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <i className="fa-solid fa-tree"></i>
                      <span>{healthyTreesCount} Bäume</span>
                    </span>
                    {witheredTreesCount > 0 && (
                      <span className="flex items-center gap-1 text-rose-400">
                        <i className="fa-solid fa-skull-crossbones text-[10px]"></i>
                        <span>{witheredTreesCount} Verdorrt</span>
                      </span>
                    )}
                    <span className="text-[#94A3B8]">⏱️ {totalFocusMinutes} Min.</span>
                  </div>
                </div>

                {/* 3D Canvas Box */}
                <div className="relative w-full h-[340px] sm:h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-[#090d16] shadow-inner">
                  <ThreeWorldCanvas
                    learnedCount={learnedCount}
                    streakDays={streakDays}
                    daysSinceLastStudy={daysSinceLastStudy}
                    vitalityOverride={vitalityOverride}
                    isMini={false}
                    onSelectFlora={(flora) => setSelectedFlora(flora)}
                    selectedFloraId={selectedFlora?.id}
                    plantedTrees={filteredHistory}
                    timeframe={timeframe}
                  />

                  {/* Top Stats Watermark */}
                  <div className="absolute top-3 right-14 bg-[#0F172A]/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center gap-2 shadow-xl z-20 pointer-events-none hidden sm:flex">
                    <i className="fa-solid fa-leaf text-emerald-400"></i>
                    <span>{learnedCount} Wörter gelernt • {progressPercent}% des Gesamtwaldes</span>
                  </div>
                </div>

                {/* Selected Plant / Planted Tree Detail Inspector */}
                {selectedFlora && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl border shrink-0 shadow-md"
                        style={{
                          backgroundColor:
                            selectedFlora.type === 'withered'
                              ? '#EF444420'
                              : `${selectedFlora.sessionMeta?.tagColor || '#10B981'}25`,
                          color: selectedFlora.type === 'withered' ? '#EF4444' : '#10B981',
                          borderColor: selectedFlora.type === 'withered' ? '#EF444450' : '#10B98150',
                        }}
                      >
                        <i
                          className={`fa-solid ${
                            selectedFlora.type === 'withered'
                              ? 'fa-skull-crossbones'
                              : selectedFlora.type === 'tree'
                              ? 'fa-tree'
                              : selectedFlora.type === 'flower'
                              ? 'fa-spa'
                              : selectedFlora.type === 'pond'
                              ? 'fa-water'
                              : 'fa-seedling'
                          }`}
                        ></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{selectedFlora.nameEs}</h3>
                          <button
                            type="button"
                            onClick={() => speakText(selectedFlora.nameEs)}
                            className="text-[#38BDF8] hover:text-[#7DD3FC] text-xs cursor-pointer"
                            title="Spanisch aussprechen"
                          >
                            <i className="fa-solid fa-volume-high"></i>
                          </button>
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          {selectedFlora.nameDe} • <span className="text-emerald-400">{selectedFlora.info}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedFlora(null)}
                      className="text-xs text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors self-end sm:self-auto cursor-pointer"
                    >
                      Schließen
                    </button>
                  </motion.div>
                )}

                {/* Health Bar & Quick Action Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#1E293B]/80 rounded-2xl p-3.5 border border-white/10">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <i className="fa-solid fa-heart-pulse text-rose-400"></i>
                        <span>Wald-Vitalität: {vitality.statusText}</span>
                      </span>
                      <span style={{ color: vitality.color }}>{vitality.percentage}% Gesundheit</span>
                    </div>

                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${vitality.percentage}%`, backgroundColor: vitality.color }}
                      ></div>
                    </div>

                    <span className="text-[11px] text-[#94A3B8]">
                      💡 <strong>Forest-Regel:</strong> Täglich lernen schützt deine Bäume vor dem Welken!
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleWaterForest}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <i className="fa-solid fa-droplet text-xs"></i>
                      <span>Gießen</span>
                    </button>

                    {onStartFocusSession && (
                      <button
                        type="button"
                        onClick={onStartFocusSession}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <i className="fa-solid fa-seedling text-xs"></i>
                        <span>Plantar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* TAB 2: TREE SPECIES SHOP & REAL TREE DONATION */}
            {/* ============================================== */}
            {activeTab === 'shop' && (
              <div className="flex flex-col gap-4">
                {/* Shop Banner & Coins Balance */}
                <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-indigo-500/20 p-4 rounded-2xl border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-2xl border border-amber-400/40 shrink-0">
                      <i className="fa-solid fa-sun animate-spin-slow"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Tienda de Árboles (Baum-Katalog)</h3>
                      <p className="text-xs text-[#CBD5E1]">
                        Verdiene Sonnen-Taler durch Vokabel-Fokus-Sessions und schalte seltene Baumarten frei.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0F172A] px-4 py-2 rounded-xl border border-amber-400/40 text-amber-300 font-bold text-sm flex items-center gap-2 self-stretch sm:self-auto justify-center">
                    <i className="fa-solid fa-coins"></i>
                    <span>{coins} Sonnen-Taler</span>
                  </div>
                </div>

                {/* Real-Tree Donation Initiative (Signature Forest Feature) */}
                <div className="bg-[#1E293B] p-4 rounded-2xl border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shrink-0 border border-emerald-500/40">
                      <i className="fa-solid fa-earth-americas"></i>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        Real-World Impact (Forest Initiative)
                      </span>
                      <h4 className="text-sm font-bold text-white">Echte Bäume für die Erde pflanzen</h4>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Tausche 2.500 Sonnen-Taler ein, um einen echten Baum pflanzen zu lassen! Bisher gepflanzt:{' '}
                        <strong className="text-emerald-400">{realTreesDonated} echte Bäume 🌍</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDonateRealTree}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    <i className="fa-solid fa-tree"></i>
                    <span>Echten Baum spenden (2.500 ☀️)</span>
                  </button>
                </div>

                {/* Tree Catalog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TREE_SPECIES_CATALOG.map((sp) => {
                    const isUnlocked = unlockedSpeciesList.includes(sp.id);
                    const canAfford = coins >= sp.costCoins;

                    return (
                      <div
                        key={sp.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isUnlocked
                            ? 'bg-[#1E293B] border-emerald-500/40 shadow-md'
                            : 'bg-[#1E293B]/70 border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                                style={{ backgroundColor: `${sp.accentColor}25`, color: sp.accentColor }}
                              >
                                <i className={`fa-solid ${sp.icon}`}></i>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white leading-none">{sp.nameEs}</h4>
                                <span className="text-xs text-[#94A3B8] mt-0.5 block">{sp.nameDe}</span>
                              </div>
                            </div>

                            {isUnlocked ? (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                <i className="fa-solid fa-check text-[9px]"></i>
                                <span>Freigeschaltet</span>
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-lg">
                                {sp.costCoins} ☀️
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#CBD5E1] leading-relaxed mb-2">{sp.description}</p>
                          <p className="text-[11px] text-emerald-400/90 italic mb-3">"{sp.quoteEs}"</p>
                        </div>

                        {!isUnlocked && (
                          <button
                            type="button"
                            onClick={() => handleUnlockSpecies(sp.id, sp.costCoins)}
                            disabled={!canAfford}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-98'
                                : 'bg-white/5 text-[#64748B] border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            <i className="fa-solid fa-lock-open text-xs"></i>
                            <span>
                              {canAfford ? `Freischalten für ${sp.costCoins} Sonnen-Taler` : `Benötigt ${sp.costCoins} ☀️`}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* TAB 3: FOREST ANALYTICS & TAGS BREAKDOWN       */}
            {/* ============================================== */}
            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-4">
                {/* Stats Overview 4 Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#1E293B] p-3.5 rounded-2xl border border-white/10 flex flex-col">
                    <span className="text-[11px] text-[#94A3B8] font-medium flex items-center gap-1.5">
                      <i className="fa-solid fa-tree text-emerald-400"></i>
                      <span>Gepflanzte Bäume</span>
                    </span>
                    <span className="text-xl font-bold text-white mt-1">{plantedHistory.length} Bäume</span>
                  </div>

                  <div className="bg-[#1E293B] p-3.5 rounded-2xl border border-white/10 flex flex-col">
                    <span className="text-[11px] text-[#94A3B8] font-medium flex items-center gap-1.5">
                      <i className="fa-solid fa-clock text-indigo-400"></i>
                      <span>Fokuszeit Gesamt</span>
                    </span>
                    <span className="text-xl font-bold text-white mt-1">
                      {plantedHistory.reduce((a, b) => a + (b.durationMinutes || 0), 0)} Min.
                    </span>
                  </div>

                  <div className="bg-[#1E293B] p-3.5 rounded-2xl border border-white/10 flex flex-col">
                    <span className="text-[11px] text-[#94A3B8] font-medium flex items-center gap-1.5">
                      <i className="fa-solid fa-fire text-amber-400"></i>
                      <span>Lernserie</span>
                    </span>
                    <span className="text-xl font-bold text-amber-400 mt-1">{streakDays} Tage</span>
                  </div>

                  <div className="bg-[#1E293B] p-3.5 rounded-2xl border border-white/10 flex flex-col">
                    <span className="text-[11px] text-[#94A3B8] font-medium flex items-center gap-1.5">
                      <i className="fa-solid fa-sun text-amber-300"></i>
                      <span>Sonnen-Taler</span>
                    </span>
                    <span className="text-xl font-bold text-amber-300 mt-1">{coins} ☀️</span>
                  </div>
                </div>

                {/* Healthy vs Withered Ratio Bar */}
                <div className="bg-[#1E293B] p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <i className="fa-solid fa-tree"></i>
                      <span>{healthyTreesCount} Gesunde Bäume</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <i className="fa-solid fa-skull-crossbones text-[10px]"></i>
                      <span>{witheredTreesCount} Verdorrte Bäume</span>
                    </span>
                  </div>

                  <div className="w-full h-3 bg-rose-500/40 rounded-full overflow-hidden flex border border-white/10">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${
                          plantedHistory.length > 0
                            ? (healthyTreesCount / Math.max(1, plantedHistory.length)) * 100
                            : 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Tags Breakdown */}
                <div className="bg-[#1E293B] p-4 rounded-2xl border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-tags text-indigo-400"></i>
                    <span>Verteilung nach Fokus-Tags</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {FOCUS_TAGS.map((tag) => {
                      const count = plantedHistory.filter((h) => h.tagId === tag.id).length;
                      const minutes = plantedHistory
                        .filter((h) => h.tagId === tag.id)
                        .reduce((a, b) => a + (b.durationMinutes || 0), 0);

                      return (
                        <div key={tag.id} className="bg-[#0F172A] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                              style={{ backgroundColor: `${tag.color}25`, color: tag.color }}
                            >
                              <i className={`fa-solid ${tag.icon}`}></i>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">{tag.nameEs}</span>
                              <span className="text-[11px] text-[#94A3B8]">{tag.nameDe}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-white block">{count} Bäume</span>
                            <span className="text-[10.5px] text-[#94A3B8]">{minutes} Min.</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* History Session Log */}
                <div className="bg-[#1E293B] p-4 rounded-2xl border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-emerald-400"></i>
                    <span>Vergangene Pflanz-Sessions</span>
                  </h3>

                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {plantedHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-[#0F172A] p-3 rounded-xl border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                            style={{
                              backgroundColor: rec.status === 'withered' ? '#EF444425' : '#10B98125',
                              color: rec.status === 'withered' ? '#EF4444' : '#10B981',
                            }}
                          >
                            <i className={`fa-solid ${rec.status === 'withered' ? 'fa-skull-crossbones' : 'fa-tree'}`}></i>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{rec.speciesNameEs}</span>
                            <span className="text-[10.5px] text-[#94A3B8]">
                              {new Date(rec.timestamp).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              • {rec.tagNameEs}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-bold ${
                              rec.status === 'withered' ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {rec.status === 'withered' ? 'Verdorrt' : 'Gepflanzt'}
                          </span>
                          <span className="text-[10.5px] text-[#94A3B8] block">{rec.durationMinutes} Min. Fokus</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* TAB 4: BOTANICAL VEGETATION STAGES ROADMAP     */}
            {/* ============================================== */}
            {activeTab === 'stages' && (
              <div className="flex flex-col gap-4">
                <div className="bg-[#1E293B]/60 p-4 rounded-2xl border border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <i className="fa-solid fa-tree text-emerald-400"></i>
                    <span>Die Vegetationsstufen deines Waldes</span>
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Mit jeder gelernten Vokabel wachsen neue Blumen, Sträucher und Bäume auf deiner Wiese bis hin zum 7.000-Wörter-Lebensbaum.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {FOREST_TIERS.map((tier) => {
                    const isUnlocked = learnedCount >= tier.minWords;
                    const isCurrent = currentTier.id === tier.id;
                    const tierProgress = Math.min(
                      100,
                      Math.max(
                        0,
                        Math.round(((learnedCount - tier.minWords) / (tier.maxWords - tier.minWords)) * 100)
                      )
                    );

                    return (
                      <div
                        key={tier.id}
                        className={`rounded-2xl p-4 border transition-all relative overflow-hidden flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-[#1E293B] border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                            : isUnlocked
                            ? 'bg-[#1E293B]/80 border-white/10 hover:border-white/20'
                            : 'bg-[#0F172A]/70 border-white/5 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                                style={{
                                  backgroundColor: `${tier.accentColor}25`,
                                  color: tier.accentColor,
                                }}
                              >
                                <i className={`fa-solid ${tier.icon}`}></i>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{tier.tierNumber}. {tier.nameEs}</span>
                                  {isCurrent && (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                                      AKTUELL
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-[#94A3B8] block">{tier.nameDe}</span>
                              </div>
                            </div>

                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                isUnlocked
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-white/5 text-[#64748B] border-white/5'
                              }`}
                            >
                              ab {tier.minWords} W.
                            </span>
                          </div>

                          <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">{tier.description}</p>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {tier.unlockedVegetation.map((veg, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white/5 text-[#CBD5E1] border border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-1"
                              >
                                <i className="fa-solid fa-leaf text-[8.5px] text-emerald-400"></i>
                                <span>{veg}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: isUnlocked ? (isCurrent ? `${tierProgress}%` : '100%') : '0%',
                              backgroundColor: tier.accentColor,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
