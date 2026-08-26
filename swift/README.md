# 🇪🇸 Vokabeln – Native Swift iOS App (Xcode / SwiftUI)

Ein eleganter, nativer Spanisch-Vokabeltrainer für iPhone & iPad mit Spaced Repetition (SuperMemo SM-2 & Leitner 5-Stufen), nativer Sprachausgabe (AVSpeechSynthesizer) und interaktiven 3D-Flip-Flashcards.

---

## 📱 Features der Swift App

- **Spaced Repetition System (SRS)**: Wissenschaftliche 5-Stufen-Wiederholung nach Vergessenskurve.
- **Interaktive Lernsessions**:
  - 3D Flip-Karten mit haptischem Feedback (`UIImpactFeedbackGenerator`).
  - Bewertungs-Buttons: *Nochmal (1 Tag)*, *Gut (3–6 Tage)*, *Einfach (8+ Tage)*.
  - Automatischer Multiple-Choice Quiz-Modus bei vertieften Vokabeln mit Beispielsätzen.
- **Native Audio-Sprachausgabe**:
  - Spanische & deutsche Aussprache direkt über Apples `AVSpeechSynthesizer` (ohne externe API-Kosten oder Latenz).
- **Vokabel-Explorer & Suche**:
  - Schnelle Filterung nach Wortarten (Verben, Substantive, Adjektive, etc.) und Volltextsuche.
  - Detail-Ansicht mit Grammatik-Hinweisen und Beispielsätzen.
- **Modernes iOS 17+ Dark Design**:
  - Abgestimmte Slate-Farbpalette (`#0F172A`, `#1E293B`, `#6366F1`) mit dynamischen Leitner-Balken und Fortschritts-Statistiken.

---

## 🚀 Schnellanleitung: In Xcode starten

1. **Xcode öffnen**:
   - Wähle **File ➔ New ➔ Project...**
   - Wähle unter **iOS** das Template **App** aus und klicke auf *Next*.

2. **Projekt-Einstellungen**:
   - **Product Name**: `Vokabeln`
   - **Interface**: `SwiftUI`
   - **Language**: `Swift`
   - **Storage**: *None* (die App verwendet die integrierte `VocabStore` Engine).

3. **Dateien ins Xcode-Projekt kopieren**:
   Ziehe alle Ordner und Swift-Dateien aus diesem `/swift/` Verzeichnis in dein Xcode-Projekt:
   - `VokabelnApp.swift` (ersetzt die standardmäßige App-Datei)
   - `Models/VocabModels.swift`
   - `Services/SRSAlgorithm.swift`
   - `Services/AudioService.swift`
   - `Services/VocabStore.swift`
   - `Views/MainDashboardView.swift`
   - `Views/FlashcardSessionView.swift`
   - `Views/WordDetailView.swift`
   - `Views/SettingsView.swift`

4. **Kompilieren & Starten**:
   - Wähle einen Simulator (z. B. *iPhone 16 Pro*) oder dein echtes iPhone aus.
   - Drücke **Cmd + R** (Run).

---

## 📂 Projektstruktur

```
swift/
├── VokabelnApp.swift              # App Entry Point (@main)
├── Models/
│   └── VocabModels.swift          # Datenmodelle (VocabItem, Progress, LevelStats)
├── Services/
│   ├── SRSAlgorithm.swift         # Spaced Repetition Algorithmus (SM-2 + Leitner)
│   ├── AudioService.swift         # AVSpeechSynthesizer & Haptik
│   └── VocabStore.swift           # @MainActor Observable ViewModel & Persistence
├── Views/
│   ├── MainDashboardView.swift    # Haupt-Dashboard (Stats, Leitner-Bar, Liste)
│   ├── FlashcardSessionView.swift # 3D-Flip Lernsession & Quiz
│   ├── WordDetailView.swift       # Vokabel-Inspektor mit Beispielen & Audio
│   └── SettingsView.swift         # Einstellungen, Audio-Speed & Reset
└── README.md
```
