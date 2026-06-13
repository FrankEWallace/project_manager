import SwiftUI

struct ProjectsListView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var state: Loadable<[Project]> = .idle
    @State private var statusFilter: ProjectStatus?
    @State private var search = ""
    @State private var showingCreate = false

    var body: some View {
        NavigationStack {
            Group {
                LoadableView(state: state, retry: { Task { await load() } }) { projects in
                    let filtered = filter(projects)
                    if filtered.isEmpty {
                        ScrollView {
                            EmptyStateView(
                                icon: "folder.badge.plus",
                                title: "No projects",
                                message: search.isEmpty ? "Create your first project to get started."
                                                        : "No projects match your search.",
                                actionTitle: search.isEmpty ? "New Project" : nil,
                                action: search.isEmpty ? { showingCreate = true } : nil
                            )
                        }
                    } else {
                        List {
                            ForEach(filtered) { project in
                                NavigationLink(value: project.id) {
                                    ProjectRow(project: project, currency: currency(project))
                                }
                            }
                        }
                        .listStyle(.insetGrouped)
                    }
                }
            }
            .background(Theme.Color.background)
            .navigationTitle("Projects")
            .searchable(text: $search, prompt: "Search projects")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { statusMenu }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingCreate = true } label: { Image(systemName: "plus") }
                }
            }
            .navigationDestination(for: String.self) { id in
                ProjectDetailView(projectId: id)
            }
            .sheet(isPresented: $showingCreate) {
                ProjectFormView { await load() }
            }
            .refreshable { await load() }
            .task { if case .idle = state { await load() } }
        }
    }

    private var statusMenu: some View {
        Menu {
            Button("All") { statusFilter = nil }
            Divider()
            ForEach(ProjectStatus.allCases) { s in
                Button { statusFilter = s } label: {
                    Label(s.label, systemImage: statusFilter == s ? "checkmark" : "")
                }
            }
        } label: {
            Image(systemName: statusFilter == nil ? "line.3.horizontal.decrease.circle"
                                                   : "line.3.horizontal.decrease.circle.fill")
        }
    }

    private func currency(_ p: Project) -> String { p.currency }

    private func filter(_ projects: [Project]) -> [Project] {
        projects.filter { p in
            (statusFilter == nil || p.status == statusFilter) &&
            (search.isEmpty || p.name.localizedCaseInsensitiveContains(search))
        }
    }

    private func load() async {
        if case .idle = state { state = .loading }
        do {
            state = .loaded(try await APIClient.shared.fetchProjects())
        } catch {
            state = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription)
        }
    }
}

struct ProjectRow: View {
    let project: Project
    let currency: String

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.sm) {
            HStack(spacing: Theme.Space.sm) {
                Circle().fill(project.health.color).frame(width: 8, height: 8)
                Text(project.name).font(Theme.Font.headline).lineLimit(1)
                Spacer()
                Pill(text: project.status.label, color: project.status.color)
            }
            HStack(spacing: Theme.Space.sm) {
                if project.isOverdue {
                    Pill(text: "Overdue", color: Theme.Color.danger)
                }
                Pill(text: project.priority.label, color: project.priority.color)
                if let budget = project.budget {
                    Text(Format.compactCurrency(budget.amount, code: currency))
                        .font(Theme.Font.caption)
                        .foregroundStyle(Theme.Color.secondaryLabel)
                }
                Spacer()
                if let due = project.dueDate {
                    Text(Format.date(due, style: .short))
                        .font(Theme.Font.caption)
                        .foregroundStyle(Theme.Color.secondaryLabel)
                }
            }
        }
        .padding(.vertical, Theme.Space.xs)
    }
}
