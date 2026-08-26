import SwiftUI

public struct WordDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let word: VocabItem
    @ObservedObject var store: VocabStore
    
    public init(word: VocabItem, store: VocabStore) {
        self.word = word
        self.store = store
    }
    
    public var body: some View {
        ZStack {
            Color(hex: "#0F172A")
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Grabber & Header
                VStack(spacing: 12) {
                    Capsule()
                        .fill(Color.white.opacity(0.2))
                        .frame(width: 36, height: 4)
                        .padding(.top, 10)
                    
                    HStack {
                        Text("Vokabel-Details")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.white)
                        Spacer()
                        Button("Fertig") {
                            dismiss()
                        }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Color(hex: "#818CF8"))
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)
                }
                
                Divider()
                    .background(Color.white.opacity(0.06))
                
                ScrollView {
                    VStack(spacing: 16) {
                        // Word Banner Card
                        VStack(spacing: 12) {
                            HStack {
                                Text(word.type.rawValue)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(Color(hex: word.type.badgeColorHex))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(Color(hex: word.type.badgeColorHex).opacity(0.15))
                                    .clipShape(Capsule())
                                
                                Text(word.category)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(Color(hex: "#94A3B8"))
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.white.opacity(0.05))
                                    .clipShape(Capsule())
                                
                                Spacer()
                                
                                Button {
                                    AudioService.shared.triggerHapticFeedback(type: .light)
                                    AudioService.shared.speakSpanish(word.word)
                                } label: {
                                    Image(systemName: "speaker.wave.2.fill")
                                        .font(.system(size: 16))
                                        .foregroundColor(Color(hex: "#818CF8"))
                                        .frame(width: 40, height: 40)
                                        .background(Color(hex: "#6366F1").opacity(0.2))
                                        .clipShape(Circle())
                                }
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(word.word)
                                    .font(.system(size: 30, weight: .bold, design: .rounded))
                                    .foregroundColor(.white)
                                
                                Text(word.translation)
                                    .font(.system(size: 18, weight: .medium))
                                    .foregroundColor(Color(hex: "#94A3B8"))
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(18)
                        .background(Color(hex: "#1E293B"))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.white.opacity(0.06), lineWidth: 1)
                        )
                        
                        // Grammar Notes (if present)
                        if let grammar = word.grammarNotes, !grammar.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 6) {
                                    Image(systemName: "info.circle.fill")
                                        .foregroundColor(Color(hex: "#F59E0B"))
                                        .font(.system(size: 13))
                                    Text("Grammatik & Verwendung")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(Color(hex: "#F59E0B"))
                                }
                                Text(grammar)
                                    .font(.system(size: 14))
                                    .foregroundColor(.white)
                                    .lineSpacing(3)
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(hex: "#1E293B"))
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color(hex: "#F59E0B").opacity(0.2), lineWidth: 1)
                            )
                        }
                        
                        // Example Sentences
                        if !word.examples.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Beispielsätze")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(Color(hex: "#94A3B8"))
                                    .padding(.horizontal, 4)
                                
                                ForEach(word.examples) { ex in
                                    HStack(alignment: .top, spacing: 12) {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(ex.es)
                                                .font(.system(size: 15, weight: .semibold))
                                                .foregroundColor(.white)
                                            Text(ex.de)
                                                .font(.system(size: 13))
                                                .foregroundColor(Color(hex: "#94A3B8"))
                                        }
                                        Spacer()
                                        Button {
                                            AudioService.shared.speakSpanish(ex.es)
                                        } label: {
                                            Image(systemName: "speaker.wave.2.fill")
                                                .font(.system(size: 12))
                                                .foregroundColor(Color(hex: "#818CF8"))
                                                .frame(width: 32, height: 32)
                                                .background(Color(hex: "#6366F1").opacity(0.15))
                                                .clipShape(Circle())
                                        }
                                    }
                                    .padding(14)
                                    .background(Color(hex: "#1E293B"))
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                                }
                            }
                        }
                        
                        // SRS Status
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Lernstatus (Spaced Repetition)")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(Color(hex: "#94A3B8"))
                                .padding(.horizontal, 4)
                            
                            let level = store.getCardLevel(for: word)
                            let pEs = store.progress["\(word.id)_es-de"]
                            let pDe = store.progress["\(word.id)_de-es"]
                            
                            HStack(spacing: 12) {
                                StatusBox(
                                    title: "Leitner-Stufe",
                                    value: "Stufe \(level)",
                                    subtitle: level >= 4 ? "Vertieft / Meister" : "Lernphase"
                                )
                                StatusBox(
                                    title: "Wiederholungen",
                                    value: "\(max(pEs?.repetitions ?? 0, pDe?.repetitions ?? 0))x",
                                    subtitle: "Intervall: \(Int(pEs?.interval ?? 0)) Tage"
                                )
                            }
                        }
                    }
                    .padding(20)
                }
            }
        }
    }
}

struct StatusBox: View {
    let title: String
    let value: String
    let subtitle: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(Color(hex: "#94A3B8"))
            Text(value)
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(.white)
            Text(subtitle)
                .font(.system(size: 11))
                .foregroundColor(Color(hex: "#64748B"))
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "#1E293B"))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
