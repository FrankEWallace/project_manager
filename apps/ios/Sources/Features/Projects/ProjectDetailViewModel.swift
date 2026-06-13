import Foundation

@MainActor
final class ProjectDetailViewModel: ObservableObject {
    let projectId: String

    @Published var project: Loadable<Project> = .idle
    @Published var phases: [Phase] = []
    @Published var transactions: [Transaction] = []
    @Published var tasks: [ProjectTask] = []
    @Published var actors: [ProjectActorLink] = []
    @Published var banner: String?

    private let client = APIClient.shared

    init(projectId: String) { self.projectId = projectId }

    var currency: String {
        if case let .loaded(p) = project { return p.currency }
        return "USD"
    }

    func loadAll() async {
        if case .idle = project { project = .loading }
        async let p = client.fetchProject(projectId)
        async let ph = client.fetchPhases(projectId: projectId)
        async let tx = client.fetchTransactions(projectId: projectId)
        async let tk = client.fetchTasks(projectId: projectId)
        async let ac = client.fetchProjectActors(projectId: projectId)
        do {
            project = .loaded(try await p)
            phases = (try? await ph) ?? []
            transactions = (try? await tx) ?? []
            tasks = (try? await tk) ?? []
            actors = (try? await ac) ?? []
        } catch {
            project = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription)
        }
    }

    func reloadProject() async {
        if let p = try? await client.fetchProject(projectId) { project = .loaded(p) }
    }

    func reloadPhases() async {
        phases = (try? await client.fetchPhases(projectId: projectId)) ?? phases
        await reloadProject()
    }

    func reloadTransactions() async {
        transactions = (try? await client.fetchTransactions(projectId: projectId)) ?? transactions
        await reloadProject()
    }

    // MARK: Mutations

    func toggleMilestone(_ m: Milestone) async {
        do {
            _ = try await client.toggleMilestone(projectId: projectId, phaseId: m.phaseId, milestoneId: m.id)
            await reloadPhases()
        } catch { banner = errorText(error) }
    }

    func deletePhase(_ phase: Phase) async {
        do {
            try await client.deletePhase(projectId: projectId, phaseId: phase.id)
            await reloadPhases()
        } catch { banner = errorText(error) }
    }

    func completePhase(_ phase: Phase) async {
        do {
            try await client.completePhase(projectId: projectId, phaseId: phase.id)
            await reloadPhases()
        } catch { banner = errorText(error) }
    }

    func deleteMilestone(_ m: Milestone) async {
        do {
            try await client.deleteMilestone(projectId: projectId, phaseId: m.phaseId, milestoneId: m.id)
            await reloadPhases()
        } catch { banner = errorText(error) }
    }

    func deleteTransaction(_ tx: Transaction) async {
        do {
            try await client.deleteTransaction(projectId: projectId, id: tx.id)
            await reloadTransactions()
        } catch { banner = errorText(error) }
    }

    func toggleTask(_ task: ProjectTask) async {
        let next = task.status == .done ? "todo" : "done"
        do {
            _ = try await client.updateTask(projectId: projectId, taskId: task.id,
                                            TaskBody(title: task.title, status: next))
            tasks = (try? await client.fetchTasks(projectId: projectId)) ?? tasks
        } catch { banner = errorText(error) }
    }

    func deleteProject() async -> Bool {
        do { try await client.deleteProject(projectId); return true }
        catch { banner = errorText(error); return false }
    }

    private func errorText(_ error: Error) -> String {
        (error as? APIError)?.errorDescription ?? error.localizedDescription
    }
}
