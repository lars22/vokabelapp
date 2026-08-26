import React, { useState } from 'react';
import { VocabItem } from '../types';
import {
  importVocabFromJSON,
  importVocabFromAnkiText,
  loadVocabDatabase,
} from '../utils/vocabStorage';
import { useSwipeDownDismiss } from '../hooks/useSwipeDownDismiss';

interface SettingsModalProps {
  isOpen: boolean;
  vocabList: VocabItem[];
  onClose: () => void;
  onResetProgress: () => void;
  onVocabUpdated: (newList: VocabItem[]) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  vocabList,
  onClose,
  onResetProgress,
  onVocabUpdated,
  isLoggedIn,
  onLogout,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importStatus, setImportStatus] = useState<{ msg: string; isError: boolean } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const { dragProps, sheetStyle, isDragging } = useSwipeDownDismiss({
    onDismiss: onClose,
    threshold: 75,
  });

  if (!isOpen) return null;

  const activeCount = vocabList.filter((v) => !v.parked).length;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        let res;
        if (file.name.endsWith('.json')) {
          res = importVocabFromJSON(text);
        } else {
          res = importVocabFromAnkiText(text);
          if (!res.success && text.trim().startsWith('[')) {
            res = importVocabFromJSON(text);
          }
        }

        if (res.success) {
          setImportStatus({ msg: `Erfolgreich ${res.count} Vokabeln importiert!`, isError: false });
          const updated = loadVocabDatabase();
          onVocabUpdated(updated);
        } else {
          setImportStatus({ msg: res.error || 'Fehler beim Import.', isError: true });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = () => {
    const trimmed = jsonText.trim();
    if (!trimmed) return;

    let res;
    if (trimmed.startsWith('[')) {
      res = importVocabFromJSON(trimmed);
    } else {
      res = importVocabFromAnkiText(trimmed);
    }

    if (res.success) {
      setImportStatus({ msg: `Erfolgreich ${res.count} Vokabeln importiert!`, isError: false });
      setJsonText('');
      onVocabUpdated(loadVocabDatabase());
    } else {
      setImportStatus({ msg: res.error || 'Fehler beim Import.', isError: true });
    }
  };

  const handleConfirmReset = () => {
    setShowConfirmReset(false);
    onResetProgress();
  };

  return (
    <div className="fixed inset-0 w-vw h-vh bg-black/70 backdrop-blur-md z-[100] flex justify-center items-end animate-fadeIn select-none">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div
        {...dragProps}
        style={sheetStyle}
        className="relative w-full max-w-[480px] h-[88dvh] bg-[#0F172A] rounded-t-[28px] flex flex-col border-t border-white/10 shadow-2xl animate-slideUp overflow-hidden touch-pan-y"
      >
        {/* iOS Grabber Area (Draggable) */}
        <div className="modal-drag-handle pt-3 pb-1.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0">
          <div
            className={`w-10 h-1.2 rounded-full transition-colors ${
              isDragging ? 'bg-[#818CF8]' : 'bg-white/30 hover:bg-white/50'
            }`}
          ></div>
        </div>

        {/* iOS Navigation Bar with Frosted Glass Button */}
        <div className="modal-drag-handle flex justify-between items-center px-5 py-2.5 border-b border-white/5 shrink-0">
          <div className="w-[70px]"></div>
          <h2 className="text-[17px] font-semibold text-white tracking-tight text-center flex-1">
            Einstellungen
          </h2>
          <div className="w-[70px] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/15 active:bg-white/20 backdrop-blur-md border border-white/15 text-white text-[13.5px] font-semibold px-3.5 py-1 rounded-full shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Fertig
            </button>
          </div>
        </div>

        {/* iOS Grouped Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          {/* Group 1: Wortschatz & System-Info */}
          <div>
            <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-3 mb-2">
              Wortschatz & System
            </div>
            <div className="bg-[#1E293B] rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
              {/* Row 1: Aktive Vokabeln */}
              <div className="flex items-center justify-between p-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center text-sm">
                    <i className="fa-solid fa-book-open"></i>
                  </div>
                  <div>
                    <div className="text-[14.5px] font-medium text-white">Aktiver Wortschatz</div>
                    <div className="text-[12px] text-[#94A3B8]">
                      Lerne über 5000 Vokabeln für einen aktiven Wortschatz
                    </div>
                  </div>
                </div>
                <div className="text-[14px] font-bold text-[#818CF8]">{activeCount} Wörter</div>
              </div>

              {/* Row 2: Lernmethode */}
              <div className="flex items-start gap-3 p-3.5 px-4">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 text-[#A78BFA] flex items-center justify-center text-sm shrink-0 mt-0.5">
                  <i className="fa-solid fa-brain"></i>
                </div>
                <div>
                  <div className="text-[14.5px] font-medium text-white">Spaced Repetition (5 Stufen)</div>
                  <div className="text-[12px] text-[#94A3B8] leading-relaxed mt-0.5">
                    Wiederholt Vokabeln optimal nach Vergessenskurve.
                  </div>
                </div>
              </div>

              {/* Row 3: Bidirektional */}
              <div className="flex items-start gap-3 p-3.5 px-4">
                <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 text-[#38BDF8] flex items-center justify-center text-sm shrink-0 mt-0.5">
                  <i className="fa-solid fa-arrow-right-arrow-left"></i>
                </div>
                <div>
                  <div className="text-[14.5px] font-medium text-white">Bidirektionales Lernen</div>
                  <div className="text-[12px] text-[#94A3B8] leading-relaxed mt-0.5">
                    Aktives Erinnern (DE ➔ ES) und passives Verstehen (ES ➔ DE).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: Import (Optional) */}
          <div>
            <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-3 mb-2 flex justify-between items-center">
              <span>Eigene Vokabeln</span>
              <button
                type="button"
                onClick={() => setShowImportArea(!showImportArea)}
                className="text-[12px] text-[#818CF8] lowercase font-normal cursor-pointer hover:underline"
              >
                {showImportArea ? 'ausblenden' : 'importieren'}
              </button>
            </div>

            {showImportArea ? (
              <div className="bg-[#1E293B] rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
                <div>
                  <label className="text-[12px] font-medium text-[#94A3B8] block mb-1.5">
                    Datei importieren (.txt, .tsv, .csv, .json):
                  </label>
                  <input
                    type="file"
                    accept=".json,.txt,.tsv,.csv"
                    onChange={handleImportFile}
                    className="w-full text-xs text-[#94A3B8] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#6366F1] file:text-white hover:file:bg-[#5254e0] cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-white/5">
                  <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                    Oder Text einfügen (Wort [TAB] Übersetzung):
                  </label>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder={'el coche\tdas Auto\nla casa\tdas Haus'}
                    className="w-full h-16 p-2 bg-[#0F172A] border border-white/5 rounded-xl text-xs font-mono text-white outline-none focus:border-[#6366F1] resize-none"
                  ></textarea>
                  <button
                    type="button"
                    onClick={handleImportText}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#6366F1] text-white font-semibold text-xs cursor-pointer hover:bg-[#5254e0] transition-colors"
                  >
                    Vokabeln hinzufügen
                  </button>
                </div>

                {importStatus && (
                  <div
                    className={`text-xs p-2.5 rounded-xl font-medium ${
                      importStatus.isError
                        ? 'bg-[#EF4444]/20 text-[#EF4444]'
                        : 'bg-[#22C55E]/20 text-[#22C55E]'
                    }`}
                  >
                    {importStatus.msg}
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => setShowImportArea(true)}
                className="bg-[#1E293B] rounded-2xl p-3.5 px-4 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-[#94A3B8] flex items-center justify-center text-sm">
                    <i className="fa-solid fa-file-import"></i>
                  </div>
                  <span className="text-[14.5px] font-medium text-white">Anki- / CSV-Datei importieren</span>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-[#64748B]"></i>
              </div>
            )}
          </div>

          {/* Group 3: Abmelden (nur sichtbar, wenn per Supabase eingeloggt) */}
          {isLoggedIn && (
            <div>
              <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-3 mb-2">
                Konto
              </div>
              <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout?.();
                  }}
                  className="w-full p-3.5 px-4 text-left font-medium text-[14.5px] cursor-pointer flex items-center justify-between text-white hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 text-[#94A3B8] flex items-center justify-center text-sm">
                      <i className="fa-solid fa-right-from-bracket"></i>
                    </div>
                    <span>Abmelden</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Group 4: Destructive iOS Action */}
          <div>
            <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-3 mb-2">
              Zurücksetzen
            </div>
            <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="w-full p-3.5 px-4 text-left font-medium text-[14.5px] cursor-pointer flex items-center justify-between text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center text-sm">
                    <i className="fa-solid fa-rotate-left"></i>
                  </div>
                  <span>Lernfortschritt zurücksetzen</span>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-[#EF4444]/60"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS-Style Confirmation Alert Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-[320px] bg-[#1E293B]/95 backdrop-blur-xl border border-white/10 rounded-[20px] p-5 shadow-2xl text-center flex flex-col gap-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center text-xl mx-auto">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-white tracking-tight">
                Fortschritt zurücksetzen?
              </h3>
              <p className="text-[13px] text-[#94A3B8] mt-1.5 leading-relaxed">
                Möchtest du wirklich deinen gesamten Lernfortschritt, Level und Serien auf 0 setzen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmReset}
                className="w-full py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-sm transition-all active:scale-98 cursor-pointer shadow-md"
              >
                Fortschritt unwiderruflich löschen
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white font-semibold text-sm transition-all active:scale-98 cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


