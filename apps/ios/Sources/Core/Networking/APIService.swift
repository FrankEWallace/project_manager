import Foundation

/// High-level typed endpoints. All run on the APIClient actor.
extension APIClient {

    // MARK: Workspaces
    func fetchMemberships() async throws -> [WorkspaceMembership] {
        try await request("/api/workspaces/me", needsWorkspace: false)
    }
    func fetchCurrentWorkspace() async throws -> Workspace {
        try await request("/api/workspaces/current")
    }
    func updateWorkspace(_ body: WorkspaceUpdateBody) async throws -> Workspace {
        try await request("/api/workspaces/current", method: .patch, body: body)
    }

    // MARK: Dashboard / Analytics
    func fetchDashboard() async throws -> DashboardData {
        try await request("/api/analytics/dashboard")
    }
    func fetchIncomeExpense(period: String) async throws -> [IncomeExpensePoint] {
        try await request("/api/analytics/income-expense-over-time",
                          query: [QueryItem(name: "period", value: period)])
    }
    func fetchWorkspaceTransactions(limit: Int = 100) async throws -> [WorkspaceTransaction] {
        try await request("/api/analytics/transactions",
                          query: [QueryItem(name: "limit", value: String(limit))])
    }

    // MARK: Projects
    func fetchProjects(status: String? = nil, categoryId: String? = nil,
                       archived: Bool = false) async throws -> [Project] {
        var q = [QueryItem(name: "archived", value: archived ? "true" : "false")]
        if let status { q.append(QueryItem(name: "status", value: status)) }
        if let categoryId { q.append(QueryItem(name: "categoryId", value: categoryId)) }
        return try await request("/api/projects", query: q)
    }
    func fetchProject(_ id: String) async throws -> Project {
        try await request("/api/projects/\(id)")
    }
    func createProject(_ body: ProjectBody) async throws -> Project {
        try await request("/api/projects", method: .post, body: body)
    }
    func updateProject(_ id: String, _ body: ProjectBody) async throws -> Project {
        try await request("/api/projects/\(id)", method: .patch, body: body)
    }
    func deleteProject(_ id: String) async throws {
        try await requestVoid("/api/projects/\(id)", method: .delete)
    }
    func archiveProject(_ id: String) async throws -> Project {
        try await request("/api/projects/\(id)/archive", method: .post)
    }

    // MARK: Phases
    func fetchPhases(projectId: String) async throws -> [Phase] {
        try await request("/api/projects/\(projectId)/phases")
    }
    func createPhase(projectId: String, _ body: PhaseBody) async throws -> Phase {
        try await request("/api/projects/\(projectId)/phases", method: .post, body: body)
    }
    func updatePhase(projectId: String, phaseId: String, _ body: PhaseBody) async throws -> Phase {
        try await request("/api/projects/\(projectId)/phases/\(phaseId)", method: .patch, body: body)
    }
    func completePhase(projectId: String, phaseId: String) async throws {
        try await requestVoid("/api/projects/\(projectId)/phases/\(phaseId)/complete", method: .patch)
    }
    func reopenPhase(projectId: String, phaseId: String) async throws {
        try await requestVoid("/api/projects/\(projectId)/phases/\(phaseId)/reopen", method: .patch)
    }
    func deletePhase(projectId: String, phaseId: String) async throws {
        try await requestVoid("/api/projects/\(projectId)/phases/\(phaseId)", method: .delete)
    }

    // MARK: Milestones
    func createMilestone(projectId: String, phaseId: String, _ body: MilestoneBody) async throws -> Milestone {
        try await request("/api/projects/\(projectId)/phases/\(phaseId)/milestones", method: .post, body: body)
    }
    func updateMilestone(projectId: String, phaseId: String, milestoneId: String, _ body: MilestoneBody) async throws -> Milestone {
        try await request("/api/projects/\(projectId)/phases/\(phaseId)/milestones/\(milestoneId)", method: .patch, body: body)
    }
    func toggleMilestone(projectId: String, phaseId: String, milestoneId: String) async throws -> Milestone {
        try await request("/api/projects/\(projectId)/phases/\(phaseId)/milestones/\(milestoneId)/toggle", method: .patch)
    }
    func deleteMilestone(projectId: String, phaseId: String, milestoneId: String) async throws {
        try await requestVoid("/api/projects/\(projectId)/phases/\(phaseId)/milestones/\(milestoneId)", method: .delete)
    }

    // MARK: Tasks
    func fetchTasks(projectId: String) async throws -> [ProjectTask] {
        try await request("/api/projects/\(projectId)/tasks")
    }
    func createTask(projectId: String, _ body: TaskBody) async throws -> ProjectTask {
        try await request("/api/projects/\(projectId)/tasks", method: .post, body: body)
    }
    func updateTask(projectId: String, taskId: String, _ body: TaskBody) async throws -> ProjectTask {
        try await request("/api/projects/\(projectId)/tasks/\(taskId)", method: .patch, body: body)
    }
    func deleteTask(projectId: String, taskId: String) async throws {
        try await requestVoid("/api/projects/\(projectId)/tasks/\(taskId)", method: .delete)
    }

    // MARK: Transactions
    func fetchTransactions(projectId: String) async throws -> [Transaction] {
        try await request("/api/projects/\(projectId)/transactions")
    }
    func createTransaction(projectId: String, _ body: TransactionBody) async throws -> Transaction {
        try await request("/api/projects/\(projectId)/transactions", method: .post, body: body)
    }
    func deleteTransaction(projectId: String, id: String) async throws {
        try await requestVoid("/api/projects/\(projectId)/transactions/\(id)", method: .delete)
    }

    // MARK: Actors
    func fetchActors() async throws -> [Contact] {
        try await request("/api/actors")
    }
    func createActor(_ body: ActorBody) async throws -> Contact {
        try await request("/api/actors", method: .post, body: body)
    }
    func updateActor(_ id: String, _ body: ActorBody) async throws -> Contact {
        try await request("/api/actors/\(id)", method: .patch, body: body)
    }
    func deleteActor(_ id: String) async throws {
        try await requestVoid("/api/actors/\(id)", method: .delete)
    }

    // MARK: Project actors
    func fetchProjectActors(projectId: String) async throws -> [ProjectActorLink] {
        try await request("/api/projects/\(projectId)/actors")
    }
    func removeProjectActor(projectId: String, actorId: String) async throws {
        try await requestVoid("/api/projects/\(projectId)/actors/\(actorId)", method: .delete)
    }

    // MARK: Categories
    func fetchCategories() async throws -> [Category] {
        try await request("/api/categories")
    }
    func createCategory(_ body: CategoryBody) async throws -> Category {
        try await request("/api/categories", method: .post, body: body)
    }
    func updateCategory(_ id: String, _ body: CategoryBody) async throws -> Category {
        try await request("/api/categories/\(id)", method: .patch, body: body)
    }
    func deleteCategory(_ id: String) async throws {
        try await requestVoid("/api/categories/\(id)", method: .delete)
    }

    // MARK: Invoices
    func fetchInvoices() async throws -> [Invoice] {
        try await request("/api/invoices")
    }
    func fetchInvoice(_ id: String) async throws -> Invoice {
        try await request("/api/invoices/\(id)")
    }
    func createInvoice(_ body: InvoiceBody) async throws -> Invoice {
        try await request("/api/invoices", method: .post, body: body)
    }
    func deleteInvoice(_ id: String) async throws {
        try await requestVoid("/api/invoices/\(id)", method: .delete)
    }
    func sendInvoice(_ id: String) async throws -> Invoice {
        try await request("/api/invoices/\(id)/send", method: .post)
    }
    func recordPayment(invoiceId: String, _ body: PaymentBody) async throws -> Invoice {
        try await request("/api/invoices/\(invoiceId)/payment", method: .post, body: body)
    }
    func voidInvoice(_ id: String) async throws -> Invoice {
        try await request("/api/invoices/\(id)/void", method: .post)
    }

    // MARK: Members / invitations
    func fetchMembers() async throws -> [WorkspaceMember] {
        try await request("/api/invitations/members")
    }
}
