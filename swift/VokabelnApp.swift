import SwiftUI

@main
struct VokabelnApp: App {
    @StateObject private var store = VocabStore()
    
    var body: some Scene {
        WindowGroup {
            MainDashboardView(store: store)
                .preferredColorScheme(.dark)
        }
    }
}
