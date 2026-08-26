import React, { useState, useEffect } from 'react';
import { VocabItem, ProgressMap } from '../types';
import { getWordLevelNumber, getLevelColor } from '../utils/srsAlgorithm';
import { highlightWordInSentence, isValidSpanishSentence } from '../utils/textUtils';
import { speakText } from '../utils/audio';
import { useSwipeDownDismiss } from '../hooks/useSwipeDownDismiss';

interface SingleWordModalProps {
  word: VocabItem | null;
  progress: ProgressMap;
  onClose: () => void;
  onRateWord: (wordId: number, direction: string, rating: number) => void;
}

export const SingleWordModal: React.FC<SingleWordModalProps> = ({
  word,
  progress,
  onClose,
  onRateWord,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const { dragProps, sheetStyle, isDragging } = useSwipeDownDismiss({
    onDismiss: onClose,
    threshold: 75,
  });

  useEffect(() => {
    setIsFlipped(false);
  }, [word]);

  if (!word) return null;

  const example = word.examples && word.examples[0] ? word.examples[0] : null;

  const levelNum = getWordLevelNumber(word.id, progress);
  const levelColor = getLevelColor(levelNum);

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
            Schließen
          </button>
          <h2 className="text-[15px] font-bold text-[#94A3B8] text-center flex-1">
            Vokabelkarte
          </h2>
          <div
            className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
            style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
          >
            Level {levelNum}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          <div className="perspective-1000 w-full h-[290px]">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full h-full transform-style-3d transition-transform duration-500 cursor-pointer ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Face (Spanish Side - Monolingual, No Spoiler) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-[#1E293B] rounded-[22px] border border-white/5 flex flex-col items-center justify-between p-6 text-center shadow-lg">
                <div className="w-full flex flex-col items-center justify-center my-auto gap-2">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase bg-[#6366F1]/20 text-[#6366F1]">
                    Spanisch
                  </span>

                  <div className="text-[28px] font-bold text-white tracking-tight my-1">
                    {word.word}
                  </div>

                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {word.category} • {word.type}
                  </div>

                  {example?.es && isValidSpanishSentence(example.es) && (
                    <div className="text-[14px] text-[#94A3B8] leading-snug px-1 mt-1">
                      "{highlightWordInSentence(example.es, word.word)}"
                    </div>
                  )}
                </div>

                {/* Bottom area: Microphone button ON Spanish side */}
                <div className="w-full flex justify-center mt-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(word.word, 'es-ES');
                    }}
                    title="Spanisches Wort vorlesen"
                    className="w-10 h-10 rounded-full bg-[#6366F1] hover:bg-[#5254e0] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-[#6366F1]/30"
                  >
                    <i className="fa-solid fa-microphone text-base"></i>
                  </button>
                </div>
              </div>

              {/* Back Face (German Side - Translation Only, No Sentence) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-[#1E293B] rounded-[22px] border border-white/5 flex flex-col items-center justify-between p-6 text-center shadow-lg">
                <div className="w-full flex flex-col items-center justify-center my-auto gap-2">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase bg-[#22C55E]/20 text-[#22C55E]">
                    Deutsche Übersetzung
                  </span>

                  <div className="text-[28px] font-bold text-[#22C55E] my-1">
                    {word.translation}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="min-h-[90px] flex items-center">
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
                  onClick={() => {
                    onRateWord(word.id, 'es-de', 0);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-[#EF4444] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  Nochmal
                  <span className="text-[9.5px] font-normal opacity-85">1 Tag</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRateWord(word.id, 'es-de', 1);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-[#F59E0B] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  Schwer
                  <span className="text-[9.5px] font-normal opacity-85">Bald</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRateWord(word.id, 'es-de', 2);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-[#6366F1] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  Gut
                  <span className="text-[9.5px] font-normal opacity-85">Optimal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRateWord(word.id, 'es-de', 3);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-[#22C55E] text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  Einfach
                  <span className="text-[9.5px] font-normal opacity-85">Später</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

