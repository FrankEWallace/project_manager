import SwiftUI

@main
struct ProjectManagerApp: App {
    @StateObject private var auth = AuthManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .tint(Theme.Color.accent)
                .task { await auth.bootstrap() }
        }
    }
}
