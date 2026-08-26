import Foundation

public struct SRSAlgorithm {
    
    /// Heutiges Datum als Millisekunden-Timestamp (00:00 Uhr)
    public static func getTodayTimestamp() -> Double {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        return startOfDay.timeIntervalSince1970 * 1000.0
    }
    
    /// Aktualisiert das Intervall, die Leichtigkeit und das Fälligkeitsdatum
    /// Bewertung (Rating): 1 = Nochmal, 3 = Gut, 5 = Einfach
    public static func updateCardInterval(
        rating: CardRating,
        previousState: ProgressState?
    ) -> ProgressState {
        var state = previousState ?? ProgressState()
        let today = getTodayTimestamp()
        let oneDayMs: Double = 24 * 60 * 60 * 1000.0
        
        let q = Double(rating.rawValue)
        
        if rating == .again {
            // Bei Fehler: Zurück auf Stufe 1
            state.repetitions = 0
            state.interval = 1.0
            state.state = .learning
            state.dueDate = today + oneDayMs
            state.ease = max(1.3, state.ease - 0.2)
        } else {
            // Erfolgreich gewusst
            if state.repetitions == 0 {
                state.interval = 1.0
            } else if state.repetitions == 1 {
                state.interval = rating == .easy ? 4.0 : 3.0
            } else if state.repetitions == 2 {
                state.interval = rating == .easy ? 8.0 : 6.0
            } else if state.repetitions == 3 {
                state.interval = rating == .easy ? 18.0 : 14.0
            } else {
                let multiplier = rating == .easy ? (state.ease * 1.3) : state.ease
                state.interval = round(state.interval * multiplier)
            }
            
            // SM-2 Ease Factor Formel: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            let easeDelta = 0.1 - (5.0 - q) * (0.08 + (5.0 - q) * 0.02)
            state.ease = max(1.3, state.ease + easeDelta)
            state.repetitions += 1
            state.state = state.repetitions >= 2 ? .learned : .learning
            state.dueDate = today + (state.interval * oneDayMs)
        }
        
        state.lastReviewed = Date().timeIntervalSince1970 * 1000.0
        return state
    }
    
    /// Berechnet die 5-Stufen-Leitner Verteilung
    public static func calculateLevelStats(
        vocabList: [VocabItem],
        progress: [String: ProgressState]
    ) -> LevelStats {
        var stats = LevelStats()
        
        for vocab in vocabList {
            let pEs = progress["\(vocab.id)_es-de"]
            let pDe = progress["\(vocab.id)_de-es"]
            
            let reps = max(pEs?.repetitions ?? 0, pDe?.repetitions ?? 0)
            
            if reps == 0 {
                stats.level1 += 1
            } else if reps == 1 {
                stats.level2 += 1
            } else if reps == 2 {
                stats.level3 += 1
            } else if reps == 3 {
                stats.level4 += 1
            } else {
                stats.level5 += 1
            }
        }
        
        return stats
    }
}
