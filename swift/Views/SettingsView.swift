import SwiftUI

public struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var store: VocabStore
    
    @State private var showingResetAlert = false
    @State private var showingImportSheet = false
    @State private var importText = ""
    @State private var importMessage: String? = nil
    
    public init(store: VocabStore) {
        self.store = store
    }
    
    public var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#0F172A")
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Group 1: Wortschatz & System
                        VStack(alignment: .leading, spacing: 8) {
                            Text("WORTSCHATZ & SYSTEM")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(hex: "#64748B"))
                                .padding(.horizontal, 4)
                            
                            VStack(spacing: 1) {
                                SettingsRow(
                                    icon: "book.fill",
                                    iconColor: Color(hex: "#6366F1"),
                                    title: "Aktiver Wortschatz",
                                    subtitle: "Hochfrequenz-Wortschatz A1–C1",
                                    value: "\(store.totalCount) Wörter"
                                )
                                
                                SettingsRow(
                                    icon: "brain.head.profile",
                                    iconColor: Color(hex: "#8B5CF6"),
                                    title: "Spaced Repetition (5 Stufen)",
                                    subtitle: "Wiederholt Vokabeln optimal nach Vergessenskurve",
                                    value: nil
                                )
                                
                                SettingsRow(
                                    icon: "arrow.left.arrow.right",
                                    iconColor: Color(hex: "#06B6D4"),
                                    title: "Bidirektionales Lernen",
                                    subtitle: "Aktives Erinnern (DE➔ES) & passives Verstehen (ES➔DE)",
                                    value: nil
                                )
                            }
                            .background(Color(hex: "#1E293B"))
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.05), lineWidth: 1)
                            )
                        }
                        
                        // Group 2: Audio
                        VStack(alignment: .leading, spacing: 8) {
                            Text("AUDIO & AUSSPRACHE")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(hex: "#64748B"))
                                .padding(.horizontal, 4)
                            
                            VStack(spacing: 14) {
                                HStack {
                                    Image(systemName: "speaker.wave.3.fill")
                                        .foregroundColor(Color(hex: "#818CF8"))
                                    Text("Sprechgeschwindigkeit")
                                        .font(.system(size: 15, weight: .medium))
                                        .foregroundColor(.white)
                                    Spacer()
                                    Button("Test") {
                                        AudioService.shared.speakSpanish("¡Hola! ¿Cómo estás?")
                                    }
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(Color(hex: "#818CF8"))
                                }
                                
                                Slider(
                                    value: Binding(
                                        get: { Double(AudioService.shared.speechRate) },
                                        set: { AudioService.shared.speechRate = Float($0) }
                                    ),
                                    in: 0.3...0.7,
                                    step: 0.05
                                )
                                .tint(Color(hex: "#6366F1"))
                            }
                            .padding(16)
                            .background(Color(hex: "#1E293B"))
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.05), lineWidth: 1)
                            )
                        }
                        
                        // Group 3: Daten & Sicherung
                        VStack(alignment: .leading, spacing: 8) {
                            Text("DATEN & FORTSCHRITT")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(hex: "#64748B"))
                                .padding(.horizontal, 4)
                            
                            VStack(spacing: 1) {
                                // Reset Progress
                                Button {
                                    showingResetAlert = true
                                } label: {
                                    HStack {
                                        Image(systemName: "arrow.counterclockwise")
                                            .font(.system(size: 15))
                                            .foregroundColor(Color(hex: "#EF4444"))
                                            .frame(width: 32, height: 32)
                                            .background(Color(hex: "#EF4444").opacity(0.15))
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                        
                                        Text("Lernfortschritt zurücksetzen")
                                            .font(.system(size: 15, weight: .medium))
                                            .foregroundColor(Color(hex: "#EF4444"))
                                        
                                        Spacer()
                                        
                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 12))
                                            .foregroundColor(Color(hex: "#64748B"))
                                    }
                                    .padding(14)
                                }
                            }
                            .background(Color(hex: "#1E293B"))
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.05), lineWidth: 1)
                            )
                        }
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Einstellungen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Fertig") {
                        dismiss()
                    }
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Color(hex: "#818CF8"))
                }
            }
            .alert("Lernfortschritt zurücksetzen?", isPresented: $showingResetAlert) {
                Button("Abbrechen", role: .cancel) { }
                Button("Zurücksetzen", role: .destructive) {
                    store.resetProgress()
                    AudioService.shared.triggerHapticFeedback(type: .warning)
                }
            } message: {
                Text("Möchtest du wirklich deinen gesamten Lernfortschritt auf allen Geräten zurücksetzen?")
            }
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String?
    let value: String?
    
    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundColor(iconColor)
                .frame(width: 32, height: 32)
                .background(iconColor.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#94A3B8"))
                        .lineSpacing(2)
                }
            }
            
            Spacer()
            
            if let value = value {
                Text(value)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(Color(hex: "#818CF8"))
            }
        }
        .padding(14)
    }
}
