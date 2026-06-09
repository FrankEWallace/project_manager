import SwiftUI

struct MoreView: View {
    @EnvironmentObject private var auth: AuthManager

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink { InvoicesView() } label: {
                        Label("Invoices", systemImage: "doc.text")
                    }
                    NavigationLink { CategoriesView() } label: {
                        Label("Categories", systemImage: "tag")
                    }
                    NavigationLink { MembersView() } label: {
                        Label("Team Members", systemImage: "person.3")
                    }
                }
                Section("Workspace") {
                    if let ws = auth.currentWorkspace {
                        DetailRow(label: "Name", value: ws.name)
                        DetailRow(label: "Base currency", value: ws.baseCurrency)
                        DetailRow(label: "Your role", value: auth.currentRole.label)
                    }
                    if auth.memberships.count > 1 {
                        NavigationLink { WorkspacePickerView() } label: {
                            Label("Switch Workspace", systemImage: "arrow.left.arrow.right")
                        }
                    }
                    NavigationLink { SettingsView() } label: {
                        Label("Settings", systemImage: "gearshape")
                    }
                }
                Section {
                    if let user = auth.user {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(user.name ?? "Signed in").font(Theme.Font.headline)
                            Text(user.email).font(Theme.Font.caption)
                                .foregroundStyle(Theme.Color.secondaryLabel)
                        }
                    }
                    Button(role: .destructive) {
                        Task { await auth.signOut() }
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("More")
        }
    }
}

struct WorkspacePickerView: View {
    @EnvironmentObject private var auth: AuthManager
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List(auth.memberships) { membership in
            Button {
                Task { await auth.switchWorkspace(membership); dismiss() }
            } label: {
                HStack {
                    Text(membership.workspaceId == auth.currentWorkspace?.id
                         ? (auth.currentWorkspace?.name ?? membership.workspaceId)
                         : membership.workspaceId)
                        .foregroundStyle(Theme.Color.label)
                    Spacer()
                    if membership.workspaceId == auth.currentWorkspace?.id {
                        Image(systemName: "checkmark").foregroundStyle(Theme.Color.accent)
                    }
                    Pill(text: membership.role.label, color: Theme.Color.accent)
                }
            }
        }
        .navigationTitle("Workspaces")
    }
}

struct MembersView: View {
    @State private var state: Loadable<[WorkspaceMember]> = .idle

    var body: some View {
        Group {
            LoadableView(state: state, retry: { Task { await load() } }) { members in
                List(members) { member in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(member.name ?? member.email ?? "Member")
                                .font(Theme.Font.headline)
                            if let email = member.email {
                                Text(email).font(Theme.Font.caption)
                                    .foregroundStyle(Theme.Color.secondaryLabel)
                            }
                        }
                        Spacer()
                        Pill(text: member.role.label, color: Theme.Color.accent)
                    }
                }
            }
        }
        .navigationTitle("Members")
        .task { if case .idle = state { await load() } }
    }

    private func load() async {
        if case .idle = state { state = .loading }
        do { state = .loaded(try await APIClient.shared.fetchMembers()) }
        catch { state = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription) }
    }
}

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var baseURL = ""
    @State private var saved = false

    var body: some View {
        Form {
            Section {
                TextField("http://localhost:3001", text: $baseURL)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                Button("Save") {
                    Task { await APIClient.shared.setBaseURL(baseURL); saved = true }
                }
            } header: {
                Text("API base URL")
            } footer: {
                Text(saved ? "Saved. Pull to refresh data." : "Use your machine's LAN IP on a physical device.")
            }
        }
        .navigationTitle("Settings")
        .task { baseURL = await APIClient.shared.currentBaseURL() }
    }
}
