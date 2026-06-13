import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthManager

    var body: some View {
        switch auth.state {
        case .loading:
            VStack(spacing: Theme.Space.lg) {
                ProgressView()
                Text("Loading…").foregroundStyle(Theme.Color.secondaryLabel)
            }
        case .signedOut:
            LoginView()
        case .needsWorkspace:
            NeedsWorkspaceView()
        case .signedIn:
            MainTabView()
        }
    }
}

struct NeedsWorkspaceView: View {
    @EnvironmentObject private var auth: AuthManager
    var body: some View {
        VStack(spacing: Theme.Space.lg) {
            EmptyStateView(
                icon: "building.2",
                title: "No workspace yet",
                message: "Your account isn't part of a workspace. Create one on the web app or accept an invitation, then sign in again."
            )
            Button("Sign Out") { Task { await auth.signOut() } }
                .buttonStyle(.bordered)
        }
        .padding(Theme.Space.lg)
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "chart.bar.xaxis") }
            ProjectsListView()
                .tabItem { Label("Projects", systemImage: "folder") }
            FinancesView()
                .tabItem { Label("Finances", systemImage: "dollarsign.circle") }
            ActorsView()
                .tabItem { Label("Contacts", systemImage: "person.2") }
            MoreView()
                .tabItem { Label("More", systemImage: "ellipsis.circle") }
        }
    }
}
