import Foundation
import Combine

@MainActor
public final class VocabStore: ObservableObject {
    @Published public var vocabList: [VocabItem] = []
    @Published public var progress: [String: ProgressState] = [:]
    @Published public var streakDays: Int = 1
    @Published public var searchText: String = ""
    @Published public var selectedTypeFilter: WordType? = nil
    
    private let progressStorageKey = "vocab_progress_v2"
    private let streakStorageKey = "vocab_streak_days"
    private let lastStudyDateKey = "vocab_last_study_date"
    
    public init() {
        loadData()
    }
    
    // MARK: - Filtered Vocabulary
    
    public var filteredVocabList: [VocabItem] {
        vocabList.filter { item in
            let matchesSearch: Bool
            if searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                matchesSearch = true
            } else {
                let query = searchText.lowercased()
                matchesSearch = item.word.lowercased().contains(query) ||
                    item.translation.lowercased().contains(query) ||
                    item.category.lowercased().contains(query)
            }
            
            let matchesType: Bool
            if let selectedType = selectedTypeFilter {
                matchesType = item.type == selectedType
            } else {
                matchesType = true
            }
            
            return matchesSearch && matchesType
        }
    }
    
    // MARK: - Statistics
    
    public var totalCount: Int {
        vocabList.count
    }
    
    public var dueCount: Int {
        let today = SRSAlgorithm.getTodayTimestamp()
        var count = 0
        
        let active = vocabList.filter { !($0.parked ?? false) }
        for item in active {
            var isDue = false
            for dir in LearningDirection.allCases {
                let p = progress["\(item.id)_\(dir.rawValue)"]
                if let p = p, p.dueDate <= today {
                    isDue = true
                    break
                }
            }
            if isDue {
                count += 1
            }
        }
        return count
    }
    
    public var learnedCount: Int {
        vocabList.filter { item in
            let pEs = progress["\(item.id)_es-de"]
            let pDe = progress["\(item.id)_de-es"]
            return (pEs?.repetitions ?? 0) >= 2 || (pDe?.repetitions ?? 0) >= 2
        }.count
    }
    
    public var levelStats: LevelStats {
        SRSAlgorithm.calculateLevelStats(vocabList: vocabList, progress: progress)
    }
    
    // MARK: - Session Queue Generation
    
    public func prepareSessionQueue(limit: Int = 10) -> [SessionStep] {
        let today = SRSAlgorithm.getTodayTimestamp()
        
        struct Candidate {
            let vocab: VocabItem
            let direction: LearningDirection
            let priority: Double
        }
        
        var candidates: [Candidate] = []
        let activeVocabs = vocabList.filter { !($0.parked ?? false) }
        
        for vocab in activeVocabs {
            for dir in LearningDirection.allCases {
                let key = "\(vocab.id)_\(dir.rawValue)"
                let p = progress[key]
                let isDue = (p != nil && p!.dueDate <= today)
                let isNew = (p == nil)
                
                let sortScore: Double
                let importance = Double(vocab.importance ?? 3)
                
                if isDue {
                    sortScore = (p!.dueDate) - 1_000_000_000.0
                } else if isNew {
                    sortScore = (importance * 10_000.0) + Double(vocab.id)
                } else {
                    sortScore = (p!.dueDate) + (importance * 1_000.0)
                }
                
                candidates.append(Candidate(vocab: vocab, direction: dir, priority: sortScore))
            }
        }
        
        candidates.sort { $0.priority < $1.priority }
        
        var selected: [Candidate] = []
        var usedIds = Set<Int>()
        
        for cand in candidates {
            if selected.count >= limit { break }
            if !usedIds.contains(cand.vocab.id) {
                selected.append(cand)
                usedIds.insert(cand.vocab.id)
            }
        }
        
        if selected.isEmpty && !vocabList.isEmpty {
            selected.append(Candidate(vocab: vocabList[0], direction: .esToDe, priority: 0))
        }
        
        return selected.map { cand in
            let hasSentence = !cand.vocab.examples.isEmpty && !cand.vocab.examples[0].es.isEmpty
            let key = "\(cand.vocab.id)_\(cand.direction.rawValue)"
            let p = progress[key]
            let isLearnedEnough = (p?.repetitions ?? 0) >= 2
            let isQuiz = cand.direction == .esToDe && hasSentence && isLearnedEnough && Double.random(in: 0...1) < 0.35
            
            return SessionStep(
                type: isQuiz ? .quiz : .flashcard,
                vocab: cand.vocab,
                direction: cand.direction
            )
        }
    }
    
    // MARK: - Rating & Progress Actions
    
    public func rateWord(wordId: Int, direction: LearningDirection, rating: CardRating) {
        let key = "\(wordId)_\(direction.rawValue)"
        let previous = progress[key]
        let updated = SRSAlgorithm.updateCardInterval(rating: rating, previousState: previous)
        
        progress[key] = updated
        saveProgress()
        updateStreak()
    }
    
    public func getCardLevel(for vocab: VocabItem) -> Int {
        let pEs = progress["\(vocab.id)_es-de"]
        let pDe = progress["\(vocab.id)_de-es"]
        let reps = max(pEs?.repetitions ?? 0, pDe?.repetitions ?? 0)
        if reps == 0 { return 1 }
        if reps == 1 { return 2 }
        if reps == 2 { return 3 }
        if reps == 3 { return 4 }
        return 5
    }
    
    // MARK: - Persistence & Loading
    
    private func loadData() {
        loadVocabularyDatabase()
        loadUserProgress()
        loadStreak()
    }
    
    private func loadVocabularyDatabase() {
        // 1. Suche bundled JSON
        if let url = Bundle.main.url(forResource: "vocab_database", withExtension: "json"),
           let data = try? Data(contentsOf: url),
           let list = try? JSONDecoder().decode([VocabItem].self, from: data) {
            self.vocabList = list
            return
        }
        
        // 2. Fallback: Standard-Wortschatz-Seed
        self.vocabList = SeedVocabulary.initialSeed
    }
    
    private func loadUserProgress() {
        guard let data = UserDefaults.standard.data(forKey: progressStorageKey),
              let decoded = try? JSONDecoder().decode([String: ProgressState].self, from: data) else {
            self.progress = [:]
            return
        }
        self.progress = decoded
    }
    
    private func saveProgress() {
        if let data = try? JSONEncoder().encode(progress) {
            UserDefaults.standard.set(data, forKey: progressStorageKey)
        }
    }
    
    private func loadStreak() {
        let savedStreak = UserDefaults.standard.integer(forKey: streakStorageKey)
        self.streakDays = max(1, savedStreak)
    }
    
    private func updateStreak() {
        let lastDate = UserDefaults.standard.string(forKey: lastStudyDateKey)
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayStr = formatter.string(from: Date())
        
        if lastDate != todayStr {
            if let lastDate = lastDate,
               let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date()) {
                let yesterdayStr = formatter.string(from: yesterday)
                if lastDate == yesterdayStr {
                    streakDays += 1
                } else {
                    streakDays = 1
                }
            } else {
                streakDays = 1
            }
            UserDefaults.standard.set(streakDays, forKey: streakStorageKey)
            UserDefaults.standard.set(todayStr, forKey: lastStudyDateKey)
        }
    }
    
    public func resetProgress() {
        UserDefaults.standard.removeObject(forKey: progressStorageKey)
        self.progress = [:]
    }
    
    public func exportProgressJSON() -> String? {
        guard let data = try? JSONEncoder().encode(progress),
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }
        return string
    }
    
    public func importProgressJSON(_ jsonString: String) -> Bool {
        guard let data = jsonString.data(using: .utf8),
              let decoded = try? JSONDecoder().decode([String: ProgressState].self, from: data) else {
            return false
        }
        self.progress = decoded
        saveProgress()
        return true
    }
}

// MARK: - Initial Seed Data

public struct SeedVocabulary {
    public static let initialSeed: [VocabItem] = [
        VocabItem(
            id: 1,
            word: "el tiempo",
            translation: "die Zeit / das Wetter",
            type: .noun,
            category: "Grundwortschatz",
            grammarNotes: "maskulin: el tiempo; Plural: los tiempos",
            importance: 1,
            examples: [
                VocabExample(es: "No tengo mucho tiempo hoy.", de: "Ich habe heute nicht viel Zeit."),
                VocabExample(es: "¿Qué tiempo hace en Madrid?", de: "Wie ist das Wetter in Madrid?")
            ]
        ),
        VocabItem(
            id: 2,
            word: "hablar",
            translation: "sprechen / reden",
            type: .verb,
            category: "Verben",
            grammarNotes: "regelmäßiges Verb auf -ar (hablo, hablas, habla)",
            importance: 1,
            examples: [
                VocabExample(es: "Hablo un poco de español todos los días.", de: "Ich spreche jeden Tag ein bisschen Spanisch.")
            ]
        ),
        VocabItem(
            id: 3,
            word: "la casa",
            translation: "das Haus / das Zuhause",
            type: .noun,
            category: "Wohnen",
            grammarNotes: "feminin: la casa, en casa = zu Hause",
            importance: 1,
            examples: [
                VocabExample(es: "Vamos a casa después del trabajo.", de: "Wir gehen nach der Arbeit nach Hause.")
            ]
        ),
        VocabItem(
            id: 4,
            word: "aprender",
            translation: "lernen",
            type: .verb,
            category: "Bildung",
            grammarNotes: "regelmäßig auf -er: aprendo, aprendes, aprende",
            importance: 1,
            examples: [
                VocabExample(es: "Quiero aprender español con fluidez.", de: "Ich möchte fließend Spanisch lernen.")
            ]
        ),
        VocabItem(
            id: 5,
            word: "bonito",
            translation: "schön / hübsch",
            type: .adjective,
            category: "Beschreibung",
            grammarNotes: "Angleichung: bonito/bonita/bonitos/bonitas",
            importance: 2,
            examples: [
                VocabExample(es: "Esta ciudad es muy bonita.", de: "Diese Stadt ist sehr schön.")
            ]
        ),
        VocabItem(
            id: 6,
            word: "siempre",
            translation: "immer / stets",
            type: .adverb,
            category: "Zeit & Frequenz",
            importance: 1,
            examples: [
                VocabExample(es: "Siempre leo antes de dormir.", de: "Ich lese immer vor dem Schlafen.")
            ]
        ),
        VocabItem(
            id: 7,
            word: "la comida",
            translation: "das Essen / die Mahlzeit",
            type: .noun,
            category: "Essen & Trinken",
            importance: 1,
            examples: [
                VocabExample(es: "La comida española es deliciosa.", de: "Das spanische Essen ist köstlich.")
            ]
        ),
        VocabItem(
            id: 8,
            word: "entender",
            translation: "verstehen / begreifen",
            type: .verb,
            category: "Verben",
            grammarNotes: "Diphthongierung: e -> ie (entiendo, entiendes)",
            importance: 1,
            examples: [
                VocabExample(es: "¿Entiendes esta frase?", de: "Verstehst du diesen Satz?")
            ]
        ),
        VocabItem(
            id: 9,
            word: "gracias",
            translation: "danke / vielen Dank",
            type: .exclamation,
            category: "Höflichkeit",
            importance: 1,
            examples: [
                VocabExample(es: "Muchas gracias por tu ayuda.", de: "Vielen Dank für deine Hilfe.")
            ]
        ),
        VocabItem(
            id: 10,
            word: "el amigo",
            translation: "der Freund",
            type: .noun,
            category: "Menschen & Beziehungen",
            importance: 1,
            examples: [
                VocabExample(es: "Mi amigo vive en Barcelona.", de: "Mein Freund lebt in Barcelona.")
            ]
        )
    ]
}
