import React, { useState, useEffect } from 'react';
import { VocabItem, SessionStep } from '../types';
import { highlightWordInSentence, isValidSpanishSentence } from '../utils/textUtils';
import { speakText } from '../utils/audio';
import { addPlantedTree, addForestCoins, TREE_SPECIES_CATALOG, FOCUS_TAGS } from './worlds/forestData';
import { useSwipeDownDismiss } from '../hooks/useSwipeDownDismiss';

interface SessionModalProps {
  isOpen: boolean;
  vocabList: VocabItem[];
  sessionQueue: SessionStep[];
  onClose: () => void;
  onRateWord: (wordId: number, direction: string, rating: number) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  vocabList,
  sessionQueue,
  onClose,
  onRateWord,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [treePlanted, setTreePlanted] = useState(false);

  const { dragProps, sheetStyle, isDragging } = useSwipeDownDismiss({
    onDismiss: onClose,
    threshold: 75,
  });

  const [quizState, setQuizState] = useState<{
    selectedOption: string | null;
    isCorrect: boolean | null;
    options: string[];
    correctAnswer: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setQuizState(null);
      setTreePlanted(false);
    }
  }, [isOpen]);

  // Setup quiz options when current step changes
  useEffect(() => {
    if (!isOpen || currentIndex >= sessionQueue.length) return;

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
  }, [currentIndex, isOpen, sessionQueue, vocabList]);

  if (!isOpen) return null;

  const total = sessionQueue.length;
  const isDone = currentIndex >= total;
  const progressPct = total > 0 ? (currentIndex / total) * 100 : 100;
  const currentStep = sessionQueue[currentIndex];

  // Plant a tree on session finish
  const handleFinishSession = () => {
    if (!treePlanted && total > 0) {
      const coinsReward = 20 + total * 2;
      setEarnedCoins(coinsReward);
      addForestCoins(coinsReward);

      // Random species from base catalog
      const species = TREE_SPECIES_CATALOG[Math.floor(Math.random() * 3)];
      const tag = FOCUS_TAGS[0];

      addPlantedTree({
        id: `planted_${Date.now()}`,
        timestamp: Date.now(),
        speciesId: species.id,
        speciesNameEs: species.nameEs,
        speciesNameDe: species.nameDe,
        tagId: tag.id,
        tagNameEs: tag.nameEs,
        tagColor: tag.color,
        durationMinutes: 10,
        wordsLearned: total,
        status: 'healthy',
        modelType: species.modelType,
        leafColor: species.leafColor,
        fruitColor: species.fruitColor,
      });
      setTreePlanted(true);
    }
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
      if (currentIndex + 1 >= total) {
        handleFinishSession();
      }
      setCurrentIndex((prev) => prev + 1);
    }, 500);
  };

  const handleFlashcardRating = (rating: number) => {
    if (!currentStep) return;
    onRateWord(currentStep.vocab.id, currentStep.direction, rating);
    if (currentIndex + 1 >= total) {
      handleFinishSession();
    }
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 w-vw h-vh bg-black/70 backdrop-blur-md z-[100] flex justify-center items-end animate-fadeIn select-none">
      {/* Backdrop tap to dismiss */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div
        {...dragProps}
        style={sheetStyle}
        className="relative w-full max-w-[480px] h-[88dvh] bg-[#0F172A] rounded-t-[28px] flex flex-col border-t border-white/10 shadow-2xl animate-slideUp overflow-hidden touch-pan-y"
      >
        {/* iOS Grabber Area */}
        <div className="modal-drag-handle pt-3 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0">
          <div
            className={`w-10 h-1.2 rounded-full transition-colors ${
              isDragging ? 'bg-[#818CF8]' : 'bg-white/30 hover:bg-white/50'
            }`}
          ></div>
        </div>

        {/* Header with iOS Glass Button */}
        <div className="modal-drag-handle flex justify-between items-center px-5 py-2.5 border-b border-white/5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/15 active:bg-white/20 backdrop-blur-md border border-white/15 text-white text-[13.5px] font-semibold px-3.5 py-1 rounded-full shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Beenden
          </button>
          <h2 className="text-[15px] font-bold text-[#94A3B8] text-center flex-1">Lernen</h2>
          <div className="w-[70px]"></div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
          {/* Progress Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-grow h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-[#94A3B8] shrink-0">
              {Math.min(currentIndex + 1, total)}/{total}
            </span>
          </div>

          {!isDone && currentStep ? (
            <div className="flex-1 flex flex-col justify-center gap-5 my-auto">
              {currentStep.type === 'flashcard' ? (
                /* FLASHCARD STEP */
                <>
                  <div className="perspective-1000 w-full h-[290px]">
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className={`relative w-full h-full transform-style-3d transition-transform duration-500 cursor-pointer ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-[#1E293B] rounded-[22px] border border-white/5 flex flex-col items-center justify-between p-6 text-center shadow-lg">
                        <div className="w-full flex flex-col items-center justify-center my-auto gap-2">
                          <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase bg-[#6366F1]/20 text-[#6366F1]">
                            {currentStep.direction === 'es-de' ? 'Spanisch' : 'Deutsch'}
                          </span>

                          <div className="text-[28px] font-bold text-white tracking-tight my-1">
                            {currentStep.direction === 'es-de'
                              ? currentStep.vocab.word
                              : currentStep.vocab.translation}
                          </div>

                          {currentStep.direction === 'es-de' &&
                            isValidSpanishSentence(currentStep.vocab.examples?.[0]?.es) && (
                              <div className="text-[14px] text-[#94A3B8] leading-snug px-1">
                                "{highlightWordInSentence(currentStep.vocab.examples[0].es, currentStep.vocab.word)}"
                              </div>
                            )}
                        </div>

                        {/* Bottom area: microphone button ONLY if this front side is Spanish */}
                        {currentStep.direction === 'es-de' && (
                          <div className="w-full flex justify-center mt-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(currentStep.vocab.word, 'es-ES');
                              }}
                              title="Spanisches Wort vorlesen"
                              className="w-10 h-10 rounded-full bg-[#6366F1] hover:bg-[#5254e0] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-[#6366F1]/30"
                            >
                              <i className="fa-solid fa-microphone text-base"></i>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Back */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-[#1E293B] rounded-[22px] border border-white/5 flex flex-col items-center justify-between p-6 text-center shadow-lg">
                        <div className="w-full flex flex-col items-center justify-center my-auto gap-2">
                          <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase bg-[#22C55E]/20 text-[#22C55E]">
                            {currentStep.direction === 'es-de' ? 'Deutsche Übersetzung' : 'Spanisches Lösungswort'}
                          </span>

                          <div className="text-[28px] font-bold text-[#22C55E] my-1">
                            {currentStep.direction === 'es-de'
                              ? currentStep.vocab.translation
                              : currentStep.vocab.word}
                          </div>

                          {currentStep.direction === 'de-es' &&
                            isValidSpanishSentence(currentStep.vocab.examples?.[0]?.es) && (
                              <div className="text-[13px] text-[#94A3B8] mt-1">
                                "{highlightWordInSentence(currentStep.vocab.examples[0].es, currentStep.vocab.word)}"
                              </div>
                            )}
                        </div>

                        {/* Bottom area: microphone button ONLY if this back side is Spanish */}
                        {currentStep.direction === 'de-es' && (
                          <div className="w-full flex justify-center mt-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(currentStep.vocab.word, 'es-ES');
                              }}
                              title="Spanisches Wort vorlesen"
                              className="w-10 h-10 rounded-full bg-[#6366F1] hover:bg-[#5254e0] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-[#6366F1]/30"
                            >
                              <i className="fa-solid fa-microphone text-base"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Actions */}
                  <div className="min-h-[90px] flex items-center mt-2">
                    {!isFlipped ? (
                      <button
                        type="button"
                        onClick={() => setIsFlipped(true)}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-[15px] cursor-pointer shadow-lg hover:opacity-95 transition-opacity"
                      >
                        Karte umdrehen
                      </button>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => handleFlashcardRating(0)}
                          className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-[#EF4444] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                        >
                          Nochmal
                          <span className="text-[9.5px] font-normal opacity-85">1 Tag</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFlashcardRating(1)}
                          className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-[#F59E0B] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                        >
                          Schwer
                          <span className="text-[9.5px] font-normal opacity-85">Bald</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFlashcardRating(2)}
                          className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-[#6366F1] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                        >
                          Gut
                          <span className="text-[9.5px] font-normal opacity-85">Optimal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFlashcardRating(3)}
                          className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-[#22C55E] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                        >
                          Einfach
                          <span className="text-[9.5px] font-normal opacity-85">Später</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* FAST MULTI-CHOICE QUIZ STEP */
                <div className="flex flex-col gap-4">
                  <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 text-center shadow-lg">
                    <div className="text-[11.5px] text-[#94A3B8] font-bold uppercase tracking-wider mb-3">
                      Satz-Quiz: Welches Wort gehört in den Satz?
                    </div>
                    <div className="text-[18px] font-semibold text-white leading-relaxed">
                      "{highlightWordInSentence(
                        currentStep.vocab.examples?.[0]?.es || currentStep.vocab.word,
                        currentStep.vocab.word
                      )}"
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {quizState?.options.map((option, i) => {
                      const isSelected = quizState.selectedOption === option;
                      const isCorrect = option === quizState.correctAnswer;
                      let btnStyle = 'bg-[#1E293B] border-white/5 text-white hover:border-[#6366F1]/50';

                      if (quizState.selectedOption !== null) {
                        if (isCorrect) {
                          btnStyle = 'bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E] font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] font-bold';
                        }
                      }

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={quizState.selectedOption !== null}
                          onClick={() => handleQuizAnswer(option)}
                          className={`w-full py-4 px-5 rounded-xl border-2 text-[16px] font-semibold text-center transition-all transform active:scale-98 cursor-pointer ${btnStyle}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SESSION DONE WITH TREE PLANTED REWARD */
            <div className="flex flex-col items-center justify-center gap-4 py-6 text-center my-auto">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-4xl mb-1 shadow-lg border border-emerald-500/30">
                <i className="fa-solid fa-tree"></i>
              </div>

              <div>
                <div className="inline-flex items-center justify-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-white">Session erfolgreich beendet</h3>
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">
                    <i className="fa-solid fa-check"></i>
                  </div>
                </div>
                <p className="text-[13px] text-[#94A3B8] max-w-[320px] leading-relaxed mt-1 mx-auto">
                  Ein neuer Baum wächst auf deiner Wiese! Dein Wald dankt dir für die heutige Lerneinheit.
                </p>
              </div>

              {/* Reward Pill */}
              <div className="bg-[#1E293B] px-4 py-2 rounded-2xl border border-amber-400/30 text-amber-300 font-bold text-sm flex items-center gap-2">
                <i className="fa-solid fa-sun text-amber-400"></i>
                <span>+{earnedCoins || 25} Sonnen-Taler erhalten!</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[15px] cursor-pointer shadow-lg hover:opacity-95 transition-opacity"
              >
                Zum 3D-Wald zurückkehren
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

