import SwiftUI

struct ProjectDetailView: View {
    let projectId: String
    @EnvironmentObject private var auth: AuthManager
    @StateObject private var vm: ProjectDetailViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var showEdit = false
    @State private var showAddPhase = false
    @State private var showAddTransaction = false
    @State private var addMilestoneToPhase: Phase?
    @State private var confirmDelete = false

    init(projectId: String) {
        self.projectId = projectId
        _vm = StateObject(wrappedValue: ProjectDetailViewModel(projectId: projectId))
    }

    var body: some View {
        ScrollView {
            LoadableView(state: vm.project, retry: { Task { await vm.loadAll() } }) { project in
                VStack(spacing: Theme.Space.lg) {
                    overview(project)
                    financials(project)
                    phasesSection
                    transactionsSection
                    if !vm.tasks.isEmpty { tasksSection }
                }
                .padding(Theme.Space.lg)
            }
        }
        .background(Theme.Color.background)
        .navigationTitle(projectName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button { showEdit = true } label: { Label("Edit", systemImage: "pencil") }
                    if auth.currentRole.canManage {
                        Button(role: .destructive) { confirmDelete = true } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                } label: { Image(systemName: "ellipsis.circle") }
            }
        }
        .sheet(isPresented: $showEdit) {
            if case let .loaded(p) = vm.project {
                ProjectFormView(existing: p) { await vm.reloadProject() }
            }
        }
        .sheet(isPresented: $showAddPhase) {
            PhaseFormView(projectId: projectId) { await vm.reloadPhases() }
        }
        .sheet(isPresented: $showAddTransaction) {
            TransactionFormView(projectId: projectId, currency: vm.currency,
                                phases: vm.phases) { await vm.reloadTransactions() }
        }
        .sheet(item: $addMilestoneToPhase) { phase in
            MilestoneFormView(projectId: projectId, phaseId: phase.id) { await vm.reloadPhases() }
        }
        .alert("Delete project?", isPresented: $confirmDelete) {
            Button("Delete", role: .destructive) {
                Task { if await vm.deleteProject() { dismiss() } }
            }
            Button("Cancel", role: .cancel) {}
        } message: { Text("This permanently removes the project and all its data.") }
        .overlay(alignment: .bottom) { bannerView }
        .task { if case .idle = vm.project { await vm.loadAll() } }
        .refreshable { await vm.loadAll() }
    }

    private var projectName: String {
        if case let .loaded(p) = vm.project { return p.name }
        return "Project"
    }

    // MARK: Overview

    private func overview(_ p: Project) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                HStack {
                    Pill(text: p.status.label, color: p.status.color)
                    Pill(text: p.health.label, color: p.health.color)
                    Pill(text: p.priority.label, color: p.priority.color)
                    Spacer()
                }
                if let desc = p.description, !desc.isEmpty {
                    Text(desc).font(Theme.Font.body).foregroundStyle(Theme.Color.secondaryLabel)
                }
                if let progress = p.progress {
                    VStack(alignment: .leading, spacing: Theme.Space.xs) {
                        HStack {
                            Text("Progress").font(Theme.Font.caption)
                                .foregroundStyle(Theme.Color.secondaryLabel)
                            Spacer()
                            Text("\(progress)%").font(Theme.Font.caption)
                        }
                        ProgressBar(value: progress)
                    }
                }
                HStack {
                    if let start = p.startDate {
                        Label(Format.date(start, style: .short), systemImage: "calendar")
                            .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                    }
                    if let due = p.dueDate {
                        Label(Format.date(due, style: .short), systemImage: "flag")
                            .font(Theme.Font.caption)
                            .foregroundStyle(p.isOverdue ? Theme.Color.danger : Theme.Color.secondaryLabel)
                    }
                }
                if !p.tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack { ForEach(p.tags, id: \.self) { Pill(text: $0) } }
                    }
                }
            }
        }
    }

    private func financials(_ p: Project) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                Text("Financials").font(Theme.Font.headline)
                if let f = p.financials {
                    HStack {
                        financialItem("Income", f.totalIncome, Theme.Color.success)
                        Divider()
                        financialItem("Expenses", f.totalExpenses, Theme.Color.danger)
                        Divider()
                        financialItem("Profit", f.profit,
                                      f.profit >= 0 ? Theme.Color.success : Theme.Color.danger)
                    }
                    if let budget = f.budget, let used = f.budgetUsed {
                        VStack(alignment: .leading, spacing: Theme.Space.xs) {
                            HStack {
                                Text("Budget used").font(Theme.Font.caption)
                                    .foregroundStyle(Theme.Color.secondaryLabel)
                                Spacer()
                                Text("\(used)% of \(Format.compactCurrency(budget, code: p.currency))")
                                    .font(Theme.Font.caption)
                            }
                            ProgressBar(value: min(100, used),
                                        tint: used > 100 ? Theme.Color.danger : Theme.Color.accent)
                        }
                    }
                } else {
                    Text("No financial data.").font(Theme.Font.body)
                        .foregroundStyle(Theme.Color.secondaryLabel)
                }
            }
        }
    }

    private func financialItem(_ label: String, _ amount: Double, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
            Text(Format.compactCurrency(amount, code: vm.currency))
                .font(Theme.Font.callout).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Phases

    private var phasesSection: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                SectionHeader(title: "Phases", actionTitle: "Add") { showAddPhase = true }
                if vm.phases.isEmpty {
                    Text("No phases yet.").font(Theme.Font.body)
                        .foregroundStyle(Theme.Color.secondaryLabel)
                } else {
                    ForEach(vm.phases) { phase in
                        PhaseCard(
                            phase: phase,
                            onToggleMilestone: { m in Task { await vm.toggleMilestone(m) } },
                            onAddMilestone: { addMilestoneToPhase = phase },
                            onCompletePhase: { Task { await vm.completePhase(phase) } },
                            onDeletePhase: { Task { await vm.deletePhase(phase) } },
                            onDeleteMilestone: { m in Task { await vm.deleteMilestone(m) } }
                        )
                    }
                }
            }
        }
    }

    // MARK: Transactions

    private var transactionsSection: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                SectionHeader(title: "Transactions", actionTitle: "Add") { showAddTransaction = true }
                if vm.transactions.isEmpty {
                    Text("No transactions yet.").font(Theme.Font.body)
                        .foregroundStyle(Theme.Color.secondaryLabel)
                } else {
                    ForEach(vm.transactions.prefix(20)) { tx in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(tx.description).font(Theme.Font.body).lineLimit(1)
                                Text(tx.category.label).font(Theme.Font.caption)
                                    .foregroundStyle(Theme.Color.secondaryLabel)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("\(tx.type.sign)\(Format.currency(tx.amount.amount, code: tx.currency))")
                                    .font(Theme.Font.callout).foregroundStyle(tx.type.color)
                                Text(Format.date(tx.date, style: .short)).font(Theme.Font.caption)
                                    .foregroundStyle(Theme.Color.secondaryLabel)
                            }
                        }
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await vm.deleteTransaction(tx) }
                            } label: { Label("Delete", systemImage: "trash") }
                        }
                    }
                }
            }
        }
    }

    // MARK: Tasks

    private var tasksSection: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                Text("Tasks").font(Theme.Font.headline)
                ForEach(vm.tasks) { task in
                    Button { Task { await vm.toggleTask(task) } } label: {
                        HStack {
                            Image(systemName: task.status == .done ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(task.status == .done ? Theme.Color.success : Theme.Color.gray400)
                            Text(task.title).font(Theme.Font.body)
                                .strikethrough(task.status == .done)
                                .foregroundStyle(Theme.Color.label)
                            Spacer()
                            Pill(text: task.status.label, color: task.status.color)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder private var bannerView: some View {
        if let banner = vm.banner {
            Text(banner)
                .font(Theme.Font.callout)
                .foregroundStyle(.white)
                .padding(Theme.Space.md)
                .background(Theme.Color.danger)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
                .padding(Theme.Space.lg)
                .onAppear {
                    Task { try? await Task.sleep(for: .seconds(3)); vm.banner = nil }
                }
        }
    }
}

struct PhaseCard: View {
    let phase: Phase
    let onToggleMilestone: (Milestone) -> Void
    let onAddMilestone: () -> Void
    let onCompletePhase: () -> Void
    let onDeletePhase: () -> Void
    let onDeleteMilestone: (Milestone) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.sm) {
            HStack {
                Text(phase.name).font(Theme.Font.callout).foregroundStyle(Theme.Color.label)
                Pill(text: phase.status.label, color: phase.status.color)
                Spacer()
                Menu {
                    Button("Add Milestone", action: onAddMilestone)
                    Button("Mark Complete", action: onCompletePhase)
                    Button("Delete Phase", role: .destructive, action: onDeletePhase)
                } label: { Image(systemName: "ellipsis").foregroundStyle(Theme.Color.gray500) }
            }
            HStack {
                ProgressBar(value: phase.progress)
                Text("\(phase.completedMilestones)/\(phase.milestoneCount)")
                    .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
            }
            ForEach(phase.milestones) { m in
                HStack {
                    Button { onToggleMilestone(m) } label: {
                        Image(systemName: m.status.isComplete ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(m.status.isComplete ? Theme.Color.success : Theme.Color.gray400)
                    }
                    Text(m.name).font(Theme.Font.body)
                        .strikethrough(m.status.isComplete)
                        .foregroundStyle(Theme.Color.label)
                    Spacer()
                    if let due = m.dueDate {
                        Text(Format.date(due, style: .short))
                            .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                    }
                }
                .swipeActions {
                    Button(role: .destructive) { onDeleteMilestone(m) } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
        .padding(Theme.Space.md)
        .background(Theme.Color.gray100)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm, style: .continuous))
    }
}
