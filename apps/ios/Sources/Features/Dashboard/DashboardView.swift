import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var state: Loadable<DashboardData> = .idle

    private var currency: String { auth.currentWorkspace?.baseCurrency ?? "USD" }

    var body: some View {
        NavigationStack {
            ScrollView {
                LoadableView(state: state, retry: { Task { await load() } }) { data in
                    content(data)
                }
            }
            .background(Theme.Color.background)
            .navigationTitle("Dashboard")
            .refreshable { await load() }
            .task { if case .idle = state { await load() } }
        }
    }

    @ViewBuilder
    private func content(_ data: DashboardData) -> some View {
        VStack(spacing: Theme.Space.lg) {
            kpis(data)
            statusBreakdown(data.portfolio)
            milestones(data.milestones)
            if !data.upcomingPayments.isEmpty { upcoming(data.upcomingPayments) }
            recentProjects(data.projects)
        }
        .padding(Theme.Space.lg)
    }

    private func kpis(_ data: DashboardData) -> some View {
        let cols = [GridItem(.flexible()), GridItem(.flexible())]
        return LazyVGrid(columns: cols, spacing: Theme.Space.md) {
            KPITile(title: "Profit",
                    value: Format.compactCurrency(data.portfolio.financials.profit, code: currency),
                    trend: data.trends.profit.pct)
            KPITile(title: "Income",
                    value: Format.compactCurrency(data.portfolio.financials.totalIncome, code: currency),
                    trend: data.trends.income.pct)
            KPITile(title: "Expenses",
                    value: Format.compactCurrency(data.portfolio.financials.totalExpenses, code: currency),
                    trend: data.trends.expenses.pct,
                    trendPositiveIsGood: false)
            KPITile(title: "Active Projects",
                    value: "\(Int(data.trends.activeProjects.current))",
                    trend: data.trends.activeProjects.pct)
        }
    }

    private func statusBreakdown(_ portfolio: DashboardData.Portfolio) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                HStack {
                    Text("Portfolio").font(Theme.Font.headline)
                    Spacer()
                    if portfolio.overdue > 0 {
                        Pill(text: "\(portfolio.overdue) overdue", color: Theme.Color.danger)
                    }
                    Pill(text: "\(portfolio.totalProjects) total", color: Theme.Color.accent)
                }
                ForEach(portfolio.statusBreakdown) { item in
                    HStack {
                        Circle().fill(item.status.color).frame(width: 8, height: 8)
                        Text(item.status.label).font(Theme.Font.body)
                        Spacer()
                        Text("\(item.count)").font(Theme.Font.callout)
                            .foregroundStyle(Theme.Color.secondaryLabel)
                    }
                }
            }
        }
    }

    private func milestones(_ m: DashboardData.MilestoneSummary) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.sm) {
                HStack {
                    Text("Milestones").font(Theme.Font.headline)
                    Spacer()
                    Text("\(m.completed)/\(m.total)")
                        .font(Theme.Font.callout).foregroundStyle(Theme.Color.secondaryLabel)
                }
                ProgressBar(value: m.completionRate)
                Text("\(m.completionRate)% complete")
                    .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
            }
        }
    }

    private func upcoming(_ payments: [DashboardData.UpcomingPayment]) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                Text("Upcoming Payments").font(Theme.Font.headline)
                ForEach(payments) { p in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(p.description).font(Theme.Font.body).lineLimit(1)
                            Text(p.projectName ?? "—")
                                .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(Format.currency(p.amount.amount, code: p.currency))
                                .font(Theme.Font.callout).foregroundStyle(p.type.color)
                            Text(Format.date(p.date, style: .short))
                                .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                        }
                    }
                }
            }
        }
    }

    private func recentProjects(_ projects: [DashboardData.DashboardProject]) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                Text("Recent Projects").font(Theme.Font.headline)
                if projects.isEmpty {
                    Text("No projects yet.")
                        .font(Theme.Font.body).foregroundStyle(Theme.Color.secondaryLabel)
                } else {
                    ForEach(projects.prefix(6)) { p in
                        NavigationLink(value: p.id) {
                            HStack {
                                Circle().fill(p.health.color).frame(width: 8, height: 8)
                                Text(p.name).font(Theme.Font.body).foregroundStyle(Theme.Color.label)
                                    .lineLimit(1)
                                Spacer()
                                Pill(text: p.status.label, color: p.status.color)
                            }
                        }
                    }
                }
            }
        }
        .navigationDestination(for: String.self) { id in
            ProjectDetailView(projectId: id)
        }
    }

    private func load() async {
        if case .idle = state { state = .loading }
        do {
            let data = try await APIClient.shared.fetchDashboard()
            state = .loaded(data)
        } catch {
            state = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription)
        }
    }
}
