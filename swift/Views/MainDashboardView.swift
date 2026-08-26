import SwiftUI

public struct MainDashboardView: View {
    @ObservedObject var store: VocabStore
    
    @State private var showingSession = false
    @State private var showingSettings = false
    @State private var selectedWord: VocabItem? = nil
    
    public init(store: VocabStore) {
        self.store = store
    }
    
    public var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color(hex: "#0F172A")
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Header
                        headerView
                        
                        // 3 Stat Cards
                        statsCardsView
                        
                        // 5-Level Leitner Progress Bar
                        levelProgressBarView
                        
                        // Primary CTA: Lernen Button
                        startStudyButton
                        
                        // Search & Filter Section
                        searchAndFilterView
                        
                        // Vocabulary List
                        vocabularyListView
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingSession) {
                FlashcardSessionView(
                    store: store,
                    queue: store.prepareSessionQueue()
                )
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView(store: store)
            }
            .sheet(item: $selectedWord) { word in
                WordDetailView(word: word, store: store)
            }
        }
    }
    
    // MARK: - Header
    
    private var headerView: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Vokabeln")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                
                Text("\(store.learnedCount)/\(store.totalCount) gelernt")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(Color(hex: "#94A3B8"))
            }
            
            Spacer()
            
            Button {
                AudioService.shared.triggerHapticFeedback(type: .light)
                showingSettings = true
            } label: {
                Image(systemName: "line.3.horizontal")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color(hex: "#94A3B8"))
                    .frame(width: 42, height: 42)
                    .background(Color(hex: "#1E293B"))
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                    )
            }
        }
        .padding(.vertical, 4)
    }
    
    // MARK: - Stats Cards
    
    private var statsCardsView: some View {
        HStack(spacing: 10) {
            // Card 1: Fällig
            StatCard(
                iconName: "clock.arrow.circlepath",
                iconColor: Color(hex: "#F59E0B"),
                value: "\(store.dueCount)",
                label: "Fällig",
                badgeColor: Color(hex: "#F59E0B").opacity(0.15)
            )
            
            // Card 2: Gelernt
            StatCard(
                iconName: "checkmark.circle.fill",
                iconColor: Color(hex: "#818CF8"),
                value: "\(store.learnedCount)",
                label: "Gelernt",
                badgeColor: Color(hex: "#6366F1").opacity(0.15)
            )
            
            // Card 3: Serie
            StatCard(
                iconName: "flame.fill",
                iconColor: Color(hex: "#EF4444"),
                value: "\(store.streakDays)",
                label: "Tage Serie",
                badgeColor: Color(hex: "#EF4444").opacity(0.15)
            )
        }
    }
    
    // MARK: - 5-Level Progress Bar
    
    private var levelProgressBarView: some View {
        VStack(spacing: 8) {
            let stats = store.levelStats
            let total = max(1, store.totalCount)
            
            GeometryReader { geometry in
                HStack(spacing: 3) {
                    LevelBarSegment(count: stats.level1, total: total, color: Color(hex: "#EF4444"), width: geometry.size.width)
                    LevelBarSegment(count: stats.level2, total: total, color: Color(hex: "#F97316"), width: geometry.size.width)
                    LevelBarSegment(count: stats.level3, total: total, color: Color(hex: "#3B82F6"), width: geometry.size.width)
                    LevelBarSegment(count: stats.level4, total: total, color: Color(hex: "#8B5CF6"), width: geometry.size.width)
                    LevelBarSegment(count: stats.level5, total: total, color: Color(hex: "#22C55E"), width: geometry.size.width)
                }
            }
            .frame(height: 8)
            .clipShape(Capsule())
            
            // Legend
            HStack {
                LevelLegendItem(level: "1", label: "Neu", color: Color(hex: "#EF4444"))
                Spacer()
                LevelLegendItem(level: "2", label: "Start", color: Color(hex: "#F97316"))
                Spacer()
                LevelLegendItem(level: "3", label: "Fortg.", color: Color(hex: "#3B82F6"))
                Spacer()
                LevelLegendItem(level: "4", label: "Vertieft", color: Color(hex: "#8B5CF6"))
                Spacer()
                LevelLegendItem(level: "5", label: "Meister", color: Color(hex: "#22C55E"))
            }
            .padding(.horizontal, 4)
        }
        .padding(14)
        .background(Color(hex: "#1E293B"))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
    }
    
    // MARK: - Start Button
    
    private var startStudyButton: some View {
        Button {
            AudioService.shared.triggerHapticFeedback(type: .medium)
            showingSession = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "play.fill")
                    .font(.system(size: 16, weight: .bold))
                
                Text(store.dueCount > 0 ? "Lernen (\(store.dueCount) fällig)" : "Lernen (10 Vokabeln)")
                    .font(.system(size: 16, weight: .bold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(
                LinearGradient(
                    colors: [Color(hex: "#6366F1"), Color(hex: "#4F46E5")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: Color(hex: "#6366F1").opacity(0.3), radius: 8, x: 0, y: 4)
        }
    }
    
    // MARK: - Search & Category Filters
    
    private var searchAndFilterView: some View {
        VStack(spacing: 12) {
            // Search Input
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(Color(hex: "#64748B"))
                    .font(.system(size: 15))
                
                TextField("Wort, Übersetzung oder Kategorie suchen...", text: $store.searchText)
                    .foregroundColor(.white)
                    .font(.system(size: 14))
                
                if !store.searchText.isEmpty {
                    Button {
                        store.searchText = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(Color(hex: "#64748B"))
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color(hex: "#1E293B"))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.white.opacity(0.05), lineWidth: 1)
            )
            
            // Filter Chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(
                        title: "Alle",
                        isSelected: store.selectedTypeFilter == nil,
                        action: { store.selectedTypeFilter = nil }
                    )
                    
                    ForEach(WordType.allCases) { type in
                        FilterChip(
                            title: type.rawValue,
                            isSelected: store.selectedTypeFilter == type,
                            action: {
                                if store.selectedTypeFilter == type {
                                    store.selectedTypeFilter = nil
                                } else {
                                    store.selectedTypeFilter = type
                                }
                            }
                        )
                    }
                }
            }
        }
    }
    
    // MARK: - Vocabulary List
    
    private var vocabularyListView: some View {
        LazyVStack(spacing: 10) {
            let list = store.filteredVocabList
            
            if list.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 32))
                        .foregroundColor(Color(hex: "#64748B"))
                    Text("Keine Vokabeln gefunden")
                        .foregroundColor(Color(hex: "#94A3B8"))
                        .font(.system(size: 14, weight: .medium))
                }
                .padding(.vertical, 40)
            } else {
                ForEach(list) { vocab in
                    VocabRowView(
                        vocab: vocab,
                        level: store.getCardLevel(for: vocab),
                        onTap: {
                            AudioService.shared.triggerHapticFeedback(type: .light)
                            selectedWord = vocab
                        },
                        onPlayAudio: {
                            AudioService.shared.triggerHapticFeedback(type: .light)
                            AudioService.shared.speakSpanish(vocab.word)
                        }
                    )
                }
            }
        }
    }
}

// MARK: - Subcomponents

struct StatCard: View {
    let iconName: String
    let iconColor: Color
    let value: String
    let label: String
    let badgeColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: iconName)
                    .font(.system(size: 14))
                    .foregroundColor(iconColor)
                Spacer()
            }
            
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundColor(.white)
            
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(Color(hex: "#94A3B8"))
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "#1E293B"))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
    }
}

struct LevelBarSegment: View {
    let count: Int
    let total: Int
    let color: Color
    let width: CGFloat
    
    var body: some View {
        let fraction = CGFloat(count) / CGFloat(total)
        let segWidth = max(2, width * fraction)
        
        Rectangle()
            .fill(color)
            .frame(width: segWidth)
    }
}

struct LevelLegendItem: View {
    let level: String
    let label: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)
            
            Text("L\(level): \(label)")
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(Color(hex: "#94A3B8"))
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: isSelected ? .bold : .medium))
                .foregroundColor(isSelected ? .white : Color(hex: "#94A3B8"))
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? Color(hex: "#6366F1") : Color(hex: "#1E293B"))
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(isSelected ? Color.clear : Color.white.opacity(0.06), lineWidth: 1)
                )
        }
    }
}

struct VocabRowView: View {
    let vocab: VocabItem
    let level: Int
    let onTap: () -> Void
    let onPlayAudio: () -> Void
    
    var levelColor: Color {
        switch level {
        case 1: return Color(hex: "#EF4444")
        case 2: return Color(hex: "#F97316")
        case 3: return Color(hex: "#3B82F6")
        case 4: return Color(hex: "#8B5CF6")
        default: return Color(hex: "#22C55E")
        }
    }
    
    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .center, spacing: 12) {
                // Level Indicator Dot
                Circle()
                    .fill(levelColor)
                    .frame(width: 8, height: 8)
                
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 8) {
                        Text(vocab.word)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text(vocab.type.rawValue)
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(Color(hex: vocab.type.badgeColorHex))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(hex: vocab.type.badgeColorHex).opacity(0.15))
                            .clipShape(Capsule())
                    }
                    
                    Text(vocab.translation)
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#94A3B8"))
                        .lineLimit(1)
                }
                
                Spacer()
                
                // Audio Speak Button
                Button(action: onPlayAudio) {
                    Image(systemName: "speaker.wave.2.fill")
                        .font(.system(size: 14))
                        .foregroundColor(Color(hex: "#818CF8"))
                        .frame(width: 36, height: 36)
                        .background(Color(hex: "#6366F1").opacity(0.15))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(14)
            .background(Color(hex: "#1E293B"))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.04), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Color Hex Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
