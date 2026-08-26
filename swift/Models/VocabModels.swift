import Foundation

public enum WordType: String, Codable, CaseIterable, Identifiable {
    case verb = "Verb"
    case noun = "Substantiv"
    case adjective = "Adjektiv"
    case adverb = "Adverb"
    case pronoun = "Pronomen"
    case preposition = "Präposition"
    case conjunction = "Konjunktion"
    case exclamation = "Ausruf"
    case phrases = "Phrasen"
    
    public var id: String { rawValue }
    
    public var badgeColorHex: String {
        switch self {
        case .verb: return "#6366F1"        // Indigo
        case .noun: return "#0EA5E9"        // Sky
        case .adjective: return "#10B981"   // Emerald
        case .adverb: return "#F59E0B"      // Amber
        case .pronoun: return "#8B5CF6"     // Purple
        case .preposition: return "#EC4899" // Pink
        case .conjunction: return "#14B8A6" // Teal
        case .exclamation: return "#F43F5E" // Rose
        case .phrases: return "#64748B"     // Slate
        }
    }
}

public struct VocabExample: Codable, Hashable, Identifiable {
    public var id: String { es + "_" + de }
    public let es: String
    public let de: String
    
    public init(es: String, de: String) {
        self.es = es
        self.de = de
    }
}

public struct VocabItem: Identifiable, Codable, Hashable {
    public let id: Int
    public var word: String
    public var translation: String
    public var type: WordType
    public var category: String
    public var grammarNotes: String?
    public var importance: Int? // 1 (Essentiell) bis 5 (Spezialisiert)
    public var parked: Bool?    // Geparkte / pausierte Vokabeln
    public var examples: [VocabExample]
    
    public init(
        id: Int,
        word: String,
        translation: String,
        type: WordType,
        category: String,
        grammarNotes: String? = nil,
        importance: Int? = 3,
        parked: Bool? = false,
        examples: [VocabExample] = []
    ) {
        self.id = id
        self.word = word
        self.translation = translation
        self.type = type
        self.category = category
        self.grammarNotes = grammarNotes
        self.importance = importance
        self.parked = parked
        self.examples = examples
    }
}

public enum LearningDirection: String, Codable, CaseIterable {
    case esToDe = "es-de"
    case deToEs = "de-es"
    
    public var label: String {
        switch self {
        case .esToDe: return "Spanisch ➔ Deutsch"
        case .deToEs: return "Deutsch ➔ Spanisch"
        }
    }
    
    public var shortLabel: String {
        switch self {
        case .esToDe: return "ES ➔ DE"
        case .deToEs: return "DE ➔ ES"
        }
    }
}

public struct ProgressState: Codable, Hashable {
    public var interval: Double     // in days
    public var ease: Double         // SM-2 Ease Factor (default: 2.5)
    public var dueDate: Double      // Timestamp in ms
    public var repetitions: Int     // Successful consecutive repetitions
    public var state: CardState     // new, learning, learned
    public var lastReviewed: Double?
    
    public enum CardState: String, Codable {
        case new
        case learning
        case learned
    }
    
    public init(
        interval: Double = 0,
        ease: Double = 2.5,
        dueDate: Double = 0,
        repetitions: Int = 0,
        state: CardState = .new,
        lastReviewed: Double? = nil
    ) {
        self.interval = interval
        self.ease = ease
        self.dueDate = dueDate
        self.repetitions = repetitions
        self.state = state
        self.lastReviewed = lastReviewed
    }
}

public struct LevelStats: Codable, Hashable {
    public var level1: Int // Neu / Tag 0-1 (Rot)
    public var level2: Int // Einsteiger / Tag 2-3 (Orange)
    public var level3: Int // Fortgeschritten / Tag 4-6 (Blau)
    public var level4: Int // Vertieft / Tag 7-14 (Lila)
    public var level5: Int // Meister / Tag 15+ (Grün)
    
    public init(level1: Int = 0, level2: Int = 0, level3: Int = 0, level4: Int = 0, level5: Int = 0) {
        self.level1 = level1
        self.level2 = level2
        self.level3 = level3
        self.level4 = level4
        self.level5 = level5
    }
}

public enum CardRating: Int {
    case again = 1  // Nochmal (Vergessen)
    case good = 3   // Gut (Gewusst mit kurzem Überlegen)
    case easy = 5   // Einfach (Sofort gewusst)
}

public struct SessionStep: Identifiable, Hashable {
    public var id: String { "\(vocab.id)_\(direction.rawValue)_\(type.rawValue)" }
    public let type: StepType
    public let vocab: VocabItem
    public let direction: LearningDirection
    
    public enum StepType: String {
        case flashcard
        case quiz
    }
    
    public init(type: StepType, vocab: VocabItem, direction: LearningDirection) {
        self.type = type
        self.vocab = vocab
        self.direction = direction
    }
}
