import SwiftUI

public struct FlashcardSessionView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var store: VocabStore
    
    let queue: [SessionStep]
    @State private var currentIndex: Int = 0
    @State private var isFlipped: Bool = false
    @State private var isCompleted: Bool = false
    @State private var sessionHistory: [(vocab: VocabItem, rating: CardRating)] = []
    
    // Quiz State
    @State private var quizOptions: [String] = []
    @State private var selectedQuizOption: String? = nil
    @State private var isQuizAnswered: Bool = false
    
    public init(store: VocabStore, queue: [SessionStep]) {
        self.store = store
        self.queue = queue
    }
    
    public var body: some View {
        ZStack {
            Color(hex: "#0F172A")
                .ignoresSafeArea()
            
            if isCompleted {
                sessionCompletedView
            } else if queue.isEmpty {
                emptyQueueView
            } else {
                activeSessionView
            }
        }
        .onAppear {
            setupStep()
        }
    }
    
    // MARK: - Active Session View
    
    private var activeSessionView: some View {
        let currentStep = queue[currentIndex]
        
        return VStack(spacing: 20) {
            // Top Bar: Close + Progress Bar + Counter
            HStack {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color(hex: "#94A3B8"))
                        .frame(width: 38, height: 38)
                        .background(Color(hex: "#1E293B"))
                        .clipShape(Circle())
                }
                
                // Progress Bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color(hex: "#1E293B"))
                            .frame(height: 6)
                        
                        Capsule()
                            .fill(Color(hex: "#6366F1"))
                            .frame(width: geo.size.width * CGFloat(currentIndex + 1) / CGFloat(queue.count), height: 6)
                            .animation(.spring(), value: currentIndex)
                    }
                }
                .frame(height: 6)
                .padding(.horizontal, 10)
                
                Text("\(currentIndex + 1)/\(queue.count)")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(Color(hex: "#94A3B8"))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            
            // Direction Badge
            HStack(spacing: 6) {
                Image(systemName: currentStep.type == .quiz ? "questionmark.bubble.fill" : "rectangle.2.swap")
                    .font(.system(size: 12))
                Text(currentStep.type == .quiz ? "Quiz-Modus" : currentStep.direction.label)
                    .font(.system(size: 12, weight: .semibold))
            }
            .foregroundColor(Color(hex: "#818CF8"))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color(hex: "#6366F1").opacity(0.15))
            .clipShape(Capsule())
            
            // Central Interactive Card (Flip or Quiz)
            if currentStep.type == .quiz {
                quizCardView(step: currentStep)
            } else {
                flashcard3DView(step: currentStep)
            }
            
            Spacer()
            
            // Action Buttons
            if currentStep.type == .flashcard {
                if isFlipped {
                    ratingButtonsView(step: currentStep)
                } else {
                    revealAnswerButton
                }
            } else {
                if isQuizAnswered {
                    quizNextButton(step: currentStep)
                }
            }
        }
        .padding(.bottom, 24)
    }
    
    // MARK: - Flashcard 3D Flip
    
    private func flashcard3DView(step: SessionStep) -> some View {
        ZStack {
            // Front Card
            cardFront(step: step)
                .opacity(isFlipped ? 0 : 1)
                .rotation3DEffect(.degrees(isFlipped ? 180 : 0), axis: (x: 0, y: 1, z: 0))
            
            // Back Card
            cardBack(step: step)
                .opacity(isFlipped ? 1 : 0)
                .rotation3DEffect(.degrees(isFlipped ? 0 : -180), axis: (x: 0, y: 1, z: 0))
        }
        .frame(maxWidth: .infinity)
        .frame(height: 340)
        .padding(.horizontal, 20)
        .onTapGesture {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                isFlipped.toggle()
                if isFlipped && step.direction == .deToEs {
                    AudioService.shared.speakSpanish(step.vocab.word)
                }
            }
            AudioService.shared.triggerHapticFeedback(type: .light)
        }
    }
    
    private func cardFront(step: SessionStep) -> some View {
        VStack(spacing: 16) {
            Spacer()
            
            Text(step.vocab.type.rawValue)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(hex: step.vocab.type.badgeColorHex))
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Color(hex: step.vocab.type.badgeColorHex).opacity(0.15))
                .clipShape(Capsule())
            
            Text(step.direction == .esToDe ? step.vocab.word : step.vocab.translation)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)
            
            if step.direction == .esToDe {
                Button {
                    AudioService.shared.speakSpanish(step.vocab.word)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "speaker.wave.2.fill")
                        Text("Anhören")
                    }
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(Color(hex: "#818CF8"))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(hex: "#6366F1").opacity(0.12))
                    .clipShape(Capsule())
                }
            }
            
            Spacer()
            
            Text("Tippen zum Umdrehen")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Color(hex: "#64748B"))
                .padding(.bottom, 16)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#1E293B"))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }
    
    private func cardBack(step: SessionStep) -> some View {
        VStack(spacing: 14) {
            Spacer()
            
            Text(step.direction == .esToDe ? step.vocab.translation : step.vocab.word)
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)
            
            if let grammar = step.vocab.grammarNotes, !grammar.isEmpty {
                Text(grammar)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(Color(hex: "#F59E0B"))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
            }
            
            if let firstExample = step.vocab.examples.first {
                VStack(spacing: 4) {
                    Text(firstExample.es)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(hex: "#818CF8"))
                        .multilineTextAlignment(.center)
                    
                    Text(firstExample.de)
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#94A3B8"))
                        .multilineTextAlignment(.center)
                }
                .padding(12)
                .background(Color(hex: "#0F172A").opacity(0.6))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal, 16)
            }
            
            Spacer()
            
            HStack {
                Button {
                    AudioService.shared.speakSpanish(step.vocab.word)
                } label: {
                    Image(systemName: "speaker.wave.2.fill")
                        .foregroundColor(Color(hex: "#818CF8"))
                        .frame(width: 36, height: 36)
                        .background(Color(hex: "#6366F1").opacity(0.2))
                        .clipShape(Circle())
                }
            }
            .padding(.bottom, 16)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#1E293B"))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color(hex: "#6366F1").opacity(0.3), lineWidth: 1.5)
        )
    }
    
    // MARK: - Quiz Mode Card
    
    private func quizCardView(step: SessionStep) -> some View {
        VStack(spacing: 16) {
            Text("Wähle die passende Bedeutung:")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(Color(hex: "#94A3B8"))
            
            Text(step.vocab.word)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)
            
            if let ex = step.vocab.examples.first {
                Text(ex.es)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Color(hex: "#818CF8"))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
            }
            
            VStack(spacing: 10) {
                ForEach(quizOptions, id: \.self) { option in
                    Button {
                        guard !isQuizAnswered else { return }
                        handleQuizOptionSelected(option, step: step)
                    } label: {
                        HStack {
                            Text(option)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.white)
                            Spacer()
                            
                            if isQuizAnswered {
                                if option == step.vocab.translation {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(Color(hex: "#22C55E"))
                                } else if option == selectedQuizOption {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(Color(hex: "#EF4444"))
                                }
                            }
                        }
                        .padding(14)
                        .background(getQuizButtonBg(option: option, step: step))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(getQuizButtonBorder(option: option, step: step), lineWidth: 1.5)
                        )
                    }
                }
            }
            .padding(.horizontal, 16)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(Color(hex: "#1E293B"))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .padding(.horizontal, 20)
    }
    
    private func getQuizButtonBg(option: String, step: SessionStep) -> Color {
        guard isQuizAnswered else { return Color(hex: "#0F172A") }
        if option == step.vocab.translation {
            return Color(hex: "#22C55E").opacity(0.2)
        } else if option == selectedQuizOption {
            return Color(hex: "#EF4444").opacity(0.2)
        }
        return Color(hex: "#0F172A")
    }
    
    private func getQuizButtonBorder(option: String, step: SessionStep) -> Color {
        guard isQuizAnswered else { return Color.white.opacity(0.06) }
        if option == step.vocab.translation {
            return Color(hex: "#22C55E")
        } else if option == selectedQuizOption {
            return Color(hex: "#EF4444")
        }
        return Color.white.opacity(0.06)
    }
    
    private func handleQuizOptionSelected(_ option: String, step: SessionStep) {
        selectedQuizOption = option
        isQuizAnswered = true
        let isCorrect = (option == step.vocab.translation)
        
        if isCorrect {
            AudioService.shared.triggerHapticFeedback(type: .success)
            store.rateWord(wordId: step.vocab.id, direction: step.direction, rating: .good)
            sessionHistory.append((vocab: step.vocab, rating: .good))
        } else {
            AudioService.shared.triggerHapticFeedback(type: .error)
            store.rateWord(wordId: step.vocab.id, direction: step.direction, rating: .again)
            sessionHistory.append((vocab: step.vocab, rating: .again))
        }
    }
    
    // MARK: - Rating Buttons (SM-2)
    
    private var revealAnswerButton: some View {
        Button {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                isFlipped = true
            }
            AudioService.shared.triggerHapticFeedback(type: .light)
        } label: {
            Text("Antwort aufdecken")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(Color(hex: "#6366F1"))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal, 20)
        }
    }
    
    private func ratingButtonsView(step: SessionStep) -> some View {
        HStack(spacing: 10) {
            // Again / Nochmal (1 Tag)
            Button {
                submitRating(.again, step: step)
            } label: {
                VStack(spacing: 2) {
                    Text("Nochmal")
                        .font(.system(size: 14, weight: .bold))
                    Text("1 Tag")
                        .font(.system(size: 11, weight: .medium))
                        .opacity(0.8)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(Color(hex: "#EF4444"))
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            
            // Good / Gut (3-6 Tage)
            Button {
                submitRating(.good, step: step)
            } label: {
                VStack(spacing: 2) {
                    Text("Gut")
                        .font(.system(size: 14, weight: .bold))
                    Text("3-6 Tage")
                        .font(.system(size: 11, weight: .medium))
                        .opacity(0.8)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(Color(hex: "#3B82F6"))
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            
            // Easy / Einfach (8+ Tage)
            Button {
                submitRating(.easy, step: step)
            } label: {
                VStack(spacing: 2) {
                    Text("Einfach")
                        .font(.system(size: 14, weight: .bold))
                    Text("8+ Tage")
                        .font(.system(size: 11, weight: .medium))
                        .opacity(0.8)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(Color(hex: "#22C55E"))
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
        }
        .padding(.horizontal, 20)
    }
    
    private func quizNextButton(step: SessionStep) -> some View {
        Button {
            nextStep()
        } label: {
            Text("Weiter")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(Color(hex: "#6366F1"))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal, 20)
        }
    }
    
    private func submitRating(_ rating: CardRating, step: SessionStep) {
        AudioService.shared.triggerHapticFeedback(type: rating == .again ? .warning : .success)
        store.rateWord(wordId: step.vocab.id, direction: step.direction, rating: rating)
        sessionHistory.append((vocab: step.vocab, rating: rating))
        nextStep()
    }
    
    private func nextStep() {
        if currentIndex + 1 < queue.count {
            currentIndex += 1
            setupStep()
        } else {
            isCompleted = true
            AudioService.shared.triggerHapticFeedback(type: .success)
        }
    }
    
    private func setupStep() {
        isFlipped = false
        isQuizAnswered = false
        selectedQuizOption = nil
        
        guard currentIndex < queue.count else { return }
        let step = queue[currentIndex]
        
        if step.direction == .esToDe {
            AudioService.shared.speakSpanish(step.vocab.word)
        }
        
        if step.type == .quiz {
            // Generate 3 distractors
            var options = [step.vocab.translation]
            let distractors = store.vocabList
                .filter { $0.id != step.vocab.id }
                .shuffled()
                .prefix(3)
                .map { $0.translation }
            
            options.append(contentsOf: distractors)
            self.quizOptions = options.shuffled()
        }
    }
    
    // MARK: - Completion View
    
    private var sessionCompletedView: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(Color(hex: "#22C55E"))
            
            VStack(spacing: 6) {
                Text("Klasse gemacht!")
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                
                Text("\(sessionHistory.count) Vokabeln erfolgreich trainiert")
                    .font(.system(size: 15))
                    .foregroundColor(Color(hex: "#94A3B8"))
            }
            
            // Summary Chips
            HStack(spacing: 12) {
                let againCount = sessionHistory.filter { $0.rating == .again }.count
                let goodCount = sessionHistory.filter { $0.rating == .good }.count
                let easyCount = sessionHistory.filter { $0.rating == .easy }.count
                
                SummaryChip(count: againCount, label: "Nochmal", color: Color(hex: "#EF4444"))
                SummaryChip(count: goodCount, label: "Gut", color: Color(hex: "#3B82F6"))
                SummaryChip(count: easyCount, label: "Einfach", color: Color(hex: "#22C55E"))
            }
            .padding(.horizontal, 20)
            
            Spacer()
            
            Button {
                dismiss()
            } label: {
                Text("Fertig")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color(hex: "#6366F1"))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .padding(.horizontal, 20)
            }
        }
        .padding(.bottom, 24)
    }
    
    private var emptyQueueView: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 48))
                .foregroundColor(Color(hex: "#F59E0B"))
            Text("Keine Vokabeln im Lernstapel")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.white)
            Button("Schließen") {
                dismiss()
            }
            .foregroundColor(Color(hex: "#818CF8"))
        }
    }
}

struct SummaryChip: View {
    let count: Int
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(Color(hex: "#94A3B8"))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(hex: "#1E293B"))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
