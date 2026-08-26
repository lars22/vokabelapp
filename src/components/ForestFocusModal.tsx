import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VocabItem, SessionStep } from '../types';
import { highlightWordInSentence, isValidSpanishSentence } from '../utils/textUtils';
import { speakText } from '../utils/audio';
import { forestAudio } from '../utils/natureSounds';
import {
  TREE_SPECIES_CATALOG,
  FOCUS_TAGS,
  TreeSpecies,
  FocusTag,
  PlantedTreeRecord,
  addPlantedTree,
  addForestCoins,
  loadUnlockedSpecies,
  FOREST_MOTIVATION_PHRASES,
} from './worlds/forestData';

interface ForestFocusModalProps {
  isOpen: boolean;
  vocabList: VocabItem[];
  sessionQueue: SessionStep[];
  onClose: () => void;
  onRateWord: (wordId: number, direction: string, rating: number) => void;
  onSessionComplete?: (treeRecord: PlantedTreeRecord) => void;
}

export const ForestFocusModal: React.FC<ForestFocusModalProps> = ({
  isOpen,
  vocabList,
  sessionQueue,
  onClose,
  onRateWord,
  onSessionComplete,
}) => {
  // Phase: 'setup' -> 'focus' -> 'completed' -> 'surrendered'
  const [phase, setPhase] = useState<'setup' | 'focus' | 'completed' | 'surrendered'>('setup');

  // Setup Config
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('pine');
  const [selectedTagId, setSelectedTagId] = useState<string>('vocabulario');
  const [targetMinutes, setTargetMinutes] = useState<number>(15);
  const [ambientSound, setAmbientSound] = useState<'off' | 'birds' | 'rain' | 'breeze' | 'fire'>('birds');

  // Focus Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [showSurrenderPrompt, setShowSurrenderPrompt] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Quiz State for sentence questions
  const [quizState, setQuizState] = useState<{
    selectedOption: string | null;
    isCorrect: boolean | null;
    options: string[];
    correctAnswer: string;
  } | null>(null);

  const timerRef = useRef<number | null>(null);
  const unlockedSpecies = loadUnlockedSpecies();

  const selectedSpecies =
    TREE_SPECIES_CATALOG.find((s) => s.id === selectedSpeciesId) || TREE_SPECIES_CATALOG[0];
  const selectedTag = FOCUS_TAGS.find((t) => t.id === selectedTagId) || FOCUS_TAGS[0];

  // Initialize session
  useEffect(() => {
    if (isOpen) {
      setPhase('setup');
      setCurrentIndex(0);
      setIsFlipped(false);
      setQuizState(null);
      setShowSurrenderPrompt(false);
    } else {
      forestAudio.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Rotate motivational quotes every 10 seconds
  useEffect(() => {
    if (phase !== 'focus') return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % FOREST_MOTIVATION_PHRASES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [phase]);

  // Focus Countdown Timer
  useEffect(() => {
    if (phase === 'focus' && !isPaused && secondsRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused, secondsRemaining]);

  // Setup sentence quiz step
  useEffect(() => {
    if (phase !== 'focus' || currentIndex >= sessionQueue.length) return;

    const step = sessionQueue[currentIndex];
    if (step && step.type === 'quiz') {
      const correct = step.vocab.word;
      const opts = [correct];

      while (opts.length < 4 && vocabList.length > 1) {
        const randomV = vocabList[Math.floor(Math.random() * vocabList.length)];
        if (!opts.includes(randomV.word)) {
          opts.push(randomV.word);
        }
      }
      opts.sort(() => Math.random() - 0.5);

      setQuizState({
        selectedOption: null,
        isCorrect: null,
        options: opts,
        correctAnswer: correct,
      });
    } else {
      setQuizState(null);
    }
    setIsFlipped(false);
  }, [currentIndex, phase, sessionQueue, vocabList]);

  if (!isOpen) return null;

  const totalSteps = sessionQueue.length;
  const currentStep = sessionQueue[currentIndex];
  const stepProgressPct = totalSteps > 0 ? (currentIndex / totalSteps) * 100 : 0;
  const timeProgressPct = targetMinutes > 0 ? ((targetMinutes * 60 - secondsRemaining) / (targetMinutes * 60)) * 100 : 0;
  const overallProgressPct = Math.max(stepProgressPct, timeProgressPct);

  // Tree growth stage: 0 = Seed, 1 = Sprout, 2 = Sapling, 3 = Full Tree
  const treeStage = overallProgressPct < 25 ? 0 : overallProgressPct < 60 ? 1 : overallProgressPct < 90 ? 2 : 3;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartPlanting = () => {
    setSecondsRemaining(targetMinutes * 60);
    setPhase('focus');
    setCurrentIndex(0);
    forestAudio.setSoundMode(ambientSound, 0.25);
  };

  const handleSoundChange = (mode: 'off' | 'birds' | 'rain' | 'breeze' | 'fire') => {
    setAmbientSound(mode);
    if (phase === 'focus') {
      forestAudio.setSoundMode(mode, 0.25);
    }
  };

  const handleCompleteSession = () => {
    forestAudio.stop();
    setPhase('completed');

    const rewardCoins = 25 + targetMinutes * 2 + currentIndex * 3;
    setEarnedCoins(rewardCoins);
    addForestCoins(rewardCoins);

    const record: PlantedTreeRecord = {
      id: `planted_${Date.now()}`,
      timestamp: Date.now(),
      speciesId: selectedSpecies.id,
      speciesNameEs: selectedSpecies.nameEs,
      speciesNameDe: selectedSpecies.nameDe,
      tagId: selectedTag.id,
      tagNameEs: selectedTag.nameEs,
      tagColor: selectedTag.color,
      durationMinutes: targetMinutes,
      wordsLearned: currentIndex + 1,
      status: 'healthy',
      modelType: selectedSpecies.modelType,
      leafColor: selectedSpecies.leafColor,
      fruitColor: selectedSpecies.fruitColor,
    };

    addPlantedTree(record);
    if (onSessionComplete) onSessionComplete(record);
  };

  const handleSurrender = () => {
    forestAudio.stop();
    setShowSurrenderPrompt(false);
    setPhase('surrendered');

    // Punish with withered dead tree on the plot
    const record: PlantedTreeRecord = {
      id: `withered_${Date.now()}`,
      timestamp: Date.now(),
      speciesId: selectedSpecies.id,
      speciesNameEs: `${selectedSpecies.nameEs} (Marchito)`,
      speciesNameDe: `${selectedSpecies.nameDe} (Verdorrt)`,
      tagId: selectedTag.id,
      tagNameEs: selectedTag.nameEs,
      tagColor: '#EF4444',
      durationMinutes: Math.max(1, Math.round((targetMinutes * 60 - secondsRemaining) / 60)),
      wordsLearned: currentIndex,
      status: 'withered',
      modelType: selectedSpecies.modelType,
      leafColor: 0x78350f,
    };

    addPlantedTree(record);
    if (onSessionComplete) onSessionComplete(record);
  };

  const handleQuizAnswer = (option: string) => {
    if (!currentStep || !quizState || quizState.selectedOption !== null) return;
    const correct = quizState.correctAnswer;
    const isRight = option === correct;

    setQuizState({
      ...quizState,
      selectedOption: option,
      isCorrect: isRight,
    });

    onRateWord(currentStep.vocab.id, 'es-de', isRight ? 2 : 0);

    setTimeout(() => {
      if (currentIndex + 1 >= totalSteps) {
        handleCompleteSession();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 550);
  };

  const handleFlashcardRating = (rating: number) => {
    if (!currentStep) return;
    onRateWord(currentStep.vocab.id, currentStep.direction, rating);
    if (currentIndex + 1 >= totalSteps) {
      handleCompleteSession();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="bg-[#0F172A] border border-white/15 rounded-3xl w-full max-w-lg min-h-[580px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-[#1E293B]/90 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-md"
                style={{ backgroundColor: `${selectedSpecies.accentColor}25`, color: selectedSpecies.accentColor }}
              >
                <i className={`fa-solid ${selectedSpecies.icon}`}></i>
              </div>
              <div>
                <span className="text-sm font-bold text-white block leading-none">
                  {phase === 'setup'
                    ? 'Planta tu Árbol (Fokus-Session)'
                    : phase === 'focus'
                    ? `${selectedSpecies.nameEs}`
                    : phase === 'completed'
                    ? '¡Árbol Plantado con Éxito!'
                    : 'Árbol Marchito'}
                </span>
                <span className="text-[11px] text-[#94A3B8] font-medium leading-none mt-0.5 block">
                  {phase === 'focus' ? `${selectedTag.nameEs} • ${formatTime(secondsRemaining)}` : selectedTag.nameDe}
                </span>
              </div>
            </div>

            {/* Top Sound & Close buttons */}
            <div className="flex items-center gap-1.5">
              {/* Sound Mode Toggle Button */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    const modes: ('off' | 'birds' | 'rain' | 'breeze' | 'fire')[] = ['birds', 'rain', 'breeze', 'fire', 'off'];
                    const next = modes[(modes.indexOf(ambientSound) + 1) % modes.length];
                    handleSoundChange(next);
                  }}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs transition-all cursor-pointer ${
                    ambientSound !== 'off'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                  }`}
                  title={`Naturklang: ${ambientSound}`}
                >
                  <i
                    className={`fa-solid ${
                      ambientSound === 'birds'
                        ? 'fa-dove'
                        : ambientSound === 'rain'
                        ? 'fa-cloud-rain'
                        : ambientSound === 'breeze'
                        ? 'fa-wind'
                        : ambientSound === 'fire'
                        ? 'fa-fire'
                        : 'fa-volume-xmark'
                    }`}
                  ></i>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (phase === 'focus') {
                    setShowSurrenderPrompt(true);
                  } else {
                    onClose();
                  }
                }}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Schließen"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PHASE 1: PLANTING SETUP (Species, Tag, Duration, Sounds) */}
          {/* ======================================================== */}
          {phase === 'setup' && (
            <div className="p-5 flex-1 overflow-y-auto flex flex-col justify-between gap-5 bg-[#090D16]">
              {/* Center Preview Tree Dial */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                {/* Dial Ring */}
                <div className="relative w-44 h-44 rounded-full flex items-center justify-center border-4 border-dashed border-white/15 p-2 bg-[#0F172A]/80 shadow-2xl">
                  {/* Tree Icon & Preview */}
                  <div
                    className="w-28 h-28 rounded-full flex flex-col items-center justify-center text-center shadow-inner transition-transform hover:scale-105"
                    style={{ backgroundColor: `${selectedSpecies.accentColor}20` }}
                  >
                    <i
                      className={`fa-solid ${selectedSpecies.icon} text-4xl mb-1`}
                      style={{ color: selectedSpecies.accentColor }}
                    ></i>
                    <span className="text-xs font-bold text-white px-2 truncate max-w-[100px]">
                      {selectedSpecies.nameEs.split(' ')[0]}
                    </span>
                  </div>

                  {/* Target Time Badge */}
                  <div className="absolute -bottom-2 bg-[#1E293B] px-3.5 py-1 rounded-full border border-white/15 text-white text-xs font-bold shadow-md">
                    ⏱️ {targetMinutes} Min.
                  </div>
                </div>

                <p className="text-xs text-[#94A3B8] text-center mt-4 max-w-xs italic">
                  "{selectedSpecies.quoteEs}"
                </p>
              </div>

              {/* 1. Select Tree Species Slider/Chips */}
              <div>
                <span className="text-xs font-bold text-[#CBD5E1] mb-2 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-tree text-emerald-400"></i>
                    <span>Baumart auswählen</span>
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    {TREE_SPECIES_CATALOG.filter((s) => unlockedSpecies.includes(s.id)).length}/
                    {TREE_SPECIES_CATALOG.length} Freigeschaltet
                  </span>
                </span>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {TREE_SPECIES_CATALOG.map((sp) => {
                    const isUnlocked = unlockedSpecies.includes(sp.id);
                    const isSelected = selectedSpeciesId === sp.id;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => {
                          if (isUnlocked) setSelectedSpeciesId(sp.id);
                        }}
                        disabled={!isUnlocked}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 min-w-[85px] shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 shadow-lg scale-105 text-white'
                            : isUnlocked
                            ? 'bg-[#1E293B] border-white/10 hover:border-white/20 text-[#CBD5E1]'
                            : 'bg-[#0F172A] border-white/5 opacity-40 cursor-not-allowed text-[#64748B]'
                        }`}
                      >
                        <i className={`fa-solid ${sp.icon} text-lg`} style={{ color: isUnlocked ? sp.accentColor : '#64748b' }}></i>
                        <span className="text-[10.5px] font-bold truncate max-w-[70px]">{sp.nameEs.split(' ')[0]}</span>
                        {!isUnlocked && <i className="fa-solid fa-lock text-[9px] text-amber-400"></i>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Select Tag */}
              <div>
                <span className="text-xs font-bold text-[#CBD5E1] mb-2 block flex items-center gap-1.5">
                  <i className="fa-solid fa-tags text-indigo-400"></i>
                  <span>Lern-Fokus & Tag</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FOCUS_TAGS.map((tag) => {
                    const isSelected = selectedTagId === tag.id;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSelectedTagId(tag.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6366F1]/25 border-[#6366F1] text-white shadow-md'
                            : 'bg-[#1E293B] border-white/5 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                          style={{ backgroundColor: `${tag.color}25`, color: tag.color }}
                        >
                          <i className={`fa-solid ${tag.icon}`}></i>
                        </div>
                        <span className="text-[11px] font-bold truncate">{tag.nameEs.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Duration Selector & Ambient Sound */}
              <div className="grid grid-cols-2 gap-3">
                {/* Duration */}
                <div>
                  <span className="text-xs font-bold text-[#CBD5E1] mb-1.5 block">Dauer (Minuten)</span>
                  <div className="flex gap-1.5">
                    {[10, 15, 25, 45].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTargetMinutes(mins)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          targetMinutes === mins
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                            : 'bg-[#1E293B] text-[#94A3B8] border-white/10 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ambient Nature Sound */}
                <div>
                  <span className="text-xs font-bold text-[#CBD5E1] mb-1.5 block">Naturgeräusch</span>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'birds', label: 'Vögel', icon: 'fa-dove' },
                      { id: 'rain', label: 'Regen', icon: 'fa-cloud-rain' },
                      { id: 'breeze', label: 'Wind', icon: 'fa-wind' },
                      { id: 'off', label: 'Aus', icon: 'fa-volume-xmark' },
                    ].map((snd) => (
                      <button
                        key={snd.id}
                        type="button"
                        onClick={() => handleSoundChange(snd.id as any)}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                          ambientSound === snd.id
                            ? 'bg-[#6366F1] text-white border-[#6366F1] shadow-md'
                            : 'bg-[#1E293B] text-[#94A3B8] border-white/10 hover:text-white'
                        }`}
                      >
                        <i className={`fa-solid ${snd.icon} text-[10px]`}></i>
                        <span>{snd.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Focus Planting Button */}
              <button
                type="button"
                onClick={handleStartPlanting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl transition-all active:scale-98 cursor-pointer mt-2"
              >
                <i className="fa-solid fa-seedling text-xl animate-bounce"></i>
                <span>Plantar Árbol ({targetMinutes} Min. Fokus)</span>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* PHASE 2: ACTIVE FOCUS STUDYING (Growing Tree + Flashcard) */}
          {/* ======================================================== */}
          {phase === 'focus' && (
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col justify-between gap-4 bg-[#090D16]">
              {/* Forest Focus HUD Header */}
              <div className="flex items-center justify-between bg-[#1E293B] px-4 py-2.5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: selectedSpecies.accentColor }}
                  ></span>
                  <span className="text-xs font-bold text-white">
                    {formatTime(secondsRemaining)} verbleibend
                  </span>
                </div>

                {/* Words Counter */}
                <span className="text-xs font-bold text-[#94A3B8]">
                  Wort {Math.min(currentIndex + 1, totalSteps)}/{totalSteps}
                </span>

                {/* Give Up / Pause */}
                <button
                  type="button"
                  onClick={() => setShowSurrenderPrompt(true)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
                >
                  Aufgeben 🥀
                </button>
              </div>

              {/* Circular Tree Growth Animation Widget */}
              <div className="flex flex-col items-center justify-center my-1 relative">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Circular SVG Ring */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-white/10"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke={selectedSpecies.accentColor}
                      strokeWidth="6"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * overallProgressPct) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700"
                    />
                  </svg>

                  {/* Dynamic Tree Inside Ring */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <i
                      className={`fa-solid ${
                        treeStage === 0
                          ? 'fa-seedling'
                          : treeStage === 1
                          ? 'fa-spa'
                          : treeStage === 2
                          ? 'fa-tree'
                          : selectedSpecies.icon
                      } transition-all duration-500`}
                      style={{
                        fontSize: treeStage === 0 ? '1.8rem' : treeStage === 1 ? '2.4rem' : '3.2rem',
                        color: selectedSpecies.accentColor,
                      }}
                    ></i>
                    <span className="text-[10px] font-bold text-white/80 mt-1">
                      {treeStage === 0
                        ? 'Keimling 🌱'
                        : treeStage === 1
                        ? 'Spross 🌿'
                        : treeStage === 2
                        ? 'Junger Baum 🌲'
                        : 'Volle Krone 🌳'}
                    </span>
                  </div>
                </div>

                {/* Rotating Motivational Forest Quote */}
                <p className="text-xs text-emerald-400 font-medium mt-2 text-center animate-pulse">
                  {FOREST_MOTIVATION_PHRASES[currentQuoteIndex]}
                </p>
              </div>

              {/* Current Learning Card / Quiz */}
              {currentStep && (
                <div className="flex-1 flex flex-col justify-center">
                  {currentStep.type === 'flashcard' ? (
                    <>
                      {/* Flashcard Box */}
                      <div className="perspective-1000 w-full h-[210px] sm:h-[230px]">
                        <div
                          onClick={() => setIsFlipped(!isFlipped)}
                          className={`relative w-full h-full transform-style-3d transition-transform duration-500 cursor-pointer ${
                            isFlipped ? 'rotate-y-180' : ''
                          }`}
                        >
                          {/* Front */}
                          <div className="absolute inset-0 w-full h-full backface-hidden bg-[#1E293B] rounded-2xl border border-white/10 flex flex-col items-center justify-between p-4 text-center shadow-lg">
                            <div className="w-full flex items-center justify-between">
                              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase bg-[#6366F1]/20 text-[#6366F1]">
                                {currentStep.direction === 'es-de' ? 'Spanisch' : 'Deutsch'}
                              </span>
                              <span className="text-[10px] text-[#94A3B8]">Klicken zum Umdrehen</span>
                            </div>

                            <div className="my-auto">
                              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                {currentStep.direction === 'es-de'
                                  ? currentStep.vocab.word
                                  : currentStep.vocab.translation}
                              </div>

                              {currentStep.direction === 'es-de' &&
                                isValidSpanishSentence(currentStep.vocab.examples?.[0]?.es) && (
                                  <div className="text-xs text-[#94A3B8] leading-snug mt-2 px-2">
                                    "{highlightWordInSentence(currentStep.vocab.examples[0].es, currentStep.vocab.word)}"
                                  </div>
                                )}
                            </div>

                            {currentStep.direction === 'es-de' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakText(currentStep.vocab.word, 'es-ES');
                                }}
                                className="w-8 h-8 rounded-full bg-[#6366F1] hover:bg-[#5254e0] text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                              >
                                <i className="fa-solid fa-volume-high text-xs"></i>
                              </button>
                            )}
                          </div>

                          {/* Back */}
                          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-[#1E293B] rounded-2xl border border-white/10 flex flex-col items-center justify-between p-4 text-center shadow-lg">
                            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase bg-[#22C55E]/20 text-[#22C55E]">
                              {currentStep.direction === 'es-de' ? 'Übersetzung' : 'Spanisches Lösungswort'}
                            </span>

                            <div className="my-auto">
                              <div className="text-2xl sm:text-3xl font-bold text-[#22C55E]">
                                {currentStep.direction === 'es-de'
                                  ? currentStep.vocab.translation
                                  : currentStep.vocab.word}
                              </div>

                              {currentStep.direction === 'de-es' &&
                                isValidSpanishSentence(currentStep.vocab.examples?.[0]?.es) && (
                                  <div className="text-xs text-[#94A3B8] mt-2">
                                    "{highlightWordInSentence(currentStep.vocab.examples[0].es, currentStep.vocab.word)}"
                                  </div>
                                )}
                            </div>

                            {currentStep.direction === 'de-es' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakText(currentStep.vocab.word, 'es-ES');
                                }}
                                className="w-8 h-8 rounded-full bg-[#6366F1] hover:bg-[#5254e0] text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                              >
                                <i className="fa-solid fa-volume-high text-xs"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Flashcard Action Buttons */}
                      <div className="mt-3">
                        {!isFlipped ? (
                          <button
                            type="button"
                            onClick={() => setIsFlipped(true)}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm cursor-pointer shadow-lg hover:opacity-95"
                          >
                            Karte umdrehen
                          </button>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => handleFlashcardRating(0)}
                              className="py-2.5 px-1 rounded-xl bg-[#EF4444] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                            >
                              Nochmal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFlashcardRating(1)}
                              className="py-2.5 px-1 rounded-xl bg-[#F59E0B] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                            >
                              Schwer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFlashcardRating(2)}
                              className="py-2.5 px-1 rounded-xl bg-[#6366F1] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                            >
                              Gut
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFlashcardRating(3)}
                              className="py-2.5 px-1 rounded-xl bg-[#22C55E] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                            >
                              Einfach
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Sentence Quiz Mode */
                    <div className="flex flex-col gap-3">
                      <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 text-center">
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                          Lückentext-Quiz
                        </span>
                        <div className="text-sm sm:text-base font-semibold text-white">
                          "{highlightWordInSentence(
                            currentStep.vocab.examples?.[0]?.es || currentStep.vocab.word,
                            currentStep.vocab.word
                          )}"
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {quizState?.options.map((option, i) => {
                          const isSelected = quizState.selectedOption === option;
                          const isCorrect = option === quizState.correctAnswer;
                          let btnStyle = 'bg-[#1E293B] border-white/10 text-white hover:border-[#6366F1]/50';

                          if (quizState.selectedOption !== null) {
                            if (isCorrect) btnStyle = 'bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E] font-bold';
                            else if (isSelected) btnStyle = 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] font-bold';
                          }

                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={quizState.selectedOption !== null}
                              onClick={() => handleQuizAnswer(option)}
                              className={`py-3 px-2 rounded-xl border text-sm font-semibold text-center transition-all cursor-pointer truncate ${btnStyle}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Surrender Warning Prompt (Forest App Signature Alert) */}
              {showSurrenderPrompt && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex items-center justify-center p-6 text-center">
                  <div className="bg-[#1E293B] border border-rose-500/40 rounded-3xl p-6 max-w-sm flex flex-col items-center gap-3 shadow-2xl">
                    <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h3 className="text-lg font-bold text-white">¿Te rindes ahora?</h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Wenn du deine Fokus-Session jetzt abbrichst, stirbt dein Baum und wird als verdorrter toter Ast auf deinem Grundstück eingepflanzt! 🥀
                    </p>

                    <div className="flex gap-2 w-full mt-2">
                      <button
                        type="button"
                        onClick={() => setShowSurrenderPrompt(false)}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
                      >
                        Weiter lernen! 🌲
                      </button>
                      <button
                        type="button"
                        onClick={handleSurrender}
                        className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Aufgeben (Baum stirbt)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PHASE 3: SESSION COMPLETED (Celebration & Tree Planted) */}
          {/* ======================================================== */}
          {phase === 'completed' && (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4 bg-[#090D16]">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl animate-bounce"
                  style={{ backgroundColor: `${selectedSpecies.accentColor}25`, color: selectedSpecies.accentColor }}
                >
                  <i className={`fa-solid ${selectedSpecies.icon}`}></i>
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm shadow-md">
                  <i className="fa-solid fa-check"></i>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">¡Enhorabuena! 🌲</h3>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  Dein {selectedSpecies.nameEs} wurde erfolgreich in deinem Wald eingepflanzt!
                </p>
              </div>

              {/* Stats & Reward Pill */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm bg-[#1E293B] p-3 rounded-2xl border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#94A3B8]">Fokuszeit</span>
                  <span className="text-base font-bold text-white">{targetMinutes} Min.</span>
                </div>
                <div className="flex flex-col border-x border-white/10">
                  <span className="text-[10px] text-[#94A3B8]">Vokabeln</span>
                  <span className="text-base font-bold text-emerald-400">+{currentIndex + 1}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#94A3B8]">Sonnen-Taler</span>
                  <span className="text-base font-bold text-amber-300">+{earnedCoins} ☀️</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-bold text-sm shadow-xl cursor-pointer mt-2"
              >
                Wald ansehen & Fertig
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* PHASE 4: SESSION SURRENDERED (Dead Tree Punishment) */}
          {/* ======================================================== */}
          {phase === 'surrendered' && (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4 bg-[#090D16]">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-4xl shadow-inner">
                <i className="fa-solid fa-skull-crossbones"></i>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Árbol Marchito 🥀</h3>
                <p className="text-xs text-[#94A3B8] max-w-xs mt-1">
                  Die Session wurde abgebrochen. Ein toter Baum bleibt auf deiner Wiese als Mahnmal für die nächste Session stehen.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-sm py-3.5 rounded-2xl bg-[#1E293B] hover:bg-[#334155] border border-white/10 text-white font-bold text-sm cursor-pointer"
              >
                Zurück zur Übersicht
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
