import SwiftUI
import Charts

struct FinancesView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var transactions: Loadable<[WorkspaceTransaction]> = .idle
    @State private var series: [IncomeExpensePoint] = []
    @State private var period = "monthly"

    private var currency: String { auth.currentWorkspace?.baseCurrency ?? "USD" }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Space.lg) {
                    chartCard
                    LoadableView(state: transactions, retry: { Task { await load() } }) { txs in
                        transactionsCard(txs)
                    }
                }
                .padding(Theme.Space.lg)
            }
            .background(Theme.Color.background)
            .navigationTitle("Finances")
            .refreshable { await load() }
            .task { if case .idle = transactions { await load() } }
        }
    }

    private var chartCard: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                HStack {
                    Text("Income vs Expenses").font(Theme.Font.headline)
                    Spacer()
                    Picker("Period", selection: $period) {
                        Text("Monthly").tag("monthly")
                        Text("Quarterly").tag("quarterly")
                        Text("Yearly").tag("yearly")
                    }
                    .pickerStyle(.menu)
                    .onChange(of: period) { _, _ in Task { await loadSeries() } }
                }
                if series.isEmpty {
                    Text("Not enough data yet.")
                        .font(Theme.Font.body).foregroundStyle(Theme.Color.secondaryLabel)
                        .frame(maxWidth: .infinity, minHeight: 120)
                } else {
                    Chart {
                        ForEach(series) { point in
                            BarMark(
                                x: .value("Period", point.period),
                                y: .value("Income", point.income)
                            )
                            .foregroundStyle(Theme.Color.success)
                            .position(by: .value("Kind", "Income"))
                            BarMark(
                                x: .value("Period", point.period),
                                y: .value("Expenses", point.expenses)
                            )
                            .foregroundStyle(Theme.Color.danger)
                            .position(by: .value("Kind", "Expenses"))
                        }
                    }
                    .frame(height: 200)
                    HStack(spacing: Theme.Space.lg) {
                        legend("Income", Theme.Color.success)
                        legend("Expenses", Theme.Color.danger)
                    }
                }
            }
        }
    }

    private func legend(_ label: String, _ color: Color) -> some View {
        HStack(spacing: Theme.Space.xs) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
        }
    }

    private func transactionsCard(_ txs: [WorkspaceTransaction]) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                Text("Recent Transactions").font(Theme.Font.headline)
                if txs.isEmpty {
                    Text("No transactions yet.")
                        .font(Theme.Font.body).foregroundStyle(Theme.Color.secondaryLabel)
                } else {
                    ForEach(txs) { tx in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(tx.description).font(Theme.Font.body).lineLimit(1)
                                Text("\(tx.projectName ?? "—") · \(tx.category.label)")
                                    .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                                    .lineLimit(1)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("\(tx.type.sign)\(Format.currency(tx.amount.amount, code: tx.currency))")
                                    .font(Theme.Font.callout).foregroundStyle(tx.type.color)
                                Text(Format.date(tx.date, style: .short))
                                    .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                            }
                        }
                    }
                }
            }
        }
    }

    private func load() async {
        if case .idle = transactions { transactions = .loading }
        await loadSeries()
        do {
            transactions = .loaded(try await APIClient.shared.fetchWorkspaceTransactions())
        } catch {
            transactions = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription)
        }
    }

    private func loadSeries() async {
        series = (try? await APIClient.shared.fetchIncomeExpense(period: period)) ?? []
    }
}
