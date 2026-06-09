import Foundation

// MARK: - Auth / Workspace

struct SessionUser: Codable, Identifiable, Hashable {
    let id: String
    let email: String
    let name: String?
    let image: String?
}

struct Workspace: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let slug: String
    let baseCurrency: String
    let logoUrl: String?
    let createdAt: Date?
    let updatedAt: Date?
}

struct WorkspaceMembership: Codable, Identifiable, Hashable {
    let id: String
    let workspaceId: String
    let userId: String
    let role: WorkspaceRole
    let joinedAt: Date?
}

struct WorkspaceMember: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let role: WorkspaceRole
    let joinedAt: Date?
    let name: String?
    let email: String?
}

// MARK: - Category

struct Category: Codable, Identifiable, Hashable {
    let id: String
    let workspaceId: String?
    let name: String
    let color: String
    let icon: String?
    let description: String?
    let archived: Bool?
    let projectCount: Int?
}

// MARK: - Project

struct ProjectFinancials: Codable, Hashable {
    let totalIncome: Double
    let totalExpenses: Double
    let profit: Double
    let budget: Double?
    let budgetUsed: Int?
}

struct Project: Codable, Identifiable, Hashable {
    let id: String
    let workspaceId: String
    let categoryId: String?
    let name: String
    let slug: String
    let description: String?
    let status: ProjectStatus
    let health: ProjectHealth
    let priority: ProjectPriority
    let visibility: ProjectVisibility
    let budget: Money?
    let currency: String
    let tags: [String]
    let startDate: Date?
    let dueDate: Date?
    let completedAt: Date?
    let archived: Bool
    let ownerId: String
    let createdBy: String
    let createdAt: Date
    let updatedAt: Date
    // Populated only on the detail endpoint
    let category: Category?
    let progress: Int?
    let financials: ProjectFinancials?

    var isOverdue: Bool {
        guard status == .active, let due = dueDate else { return false }
        return due < Date()
    }
}

// MARK: - Phases / Milestones / Tasks

struct Phase: Codable, Identifiable, Hashable {
    let id: String
    let projectId: String
    let name: String
    let description: String?
    let status: PhaseStatus
    let order: Int
    let startDate: Date?
    let dueDate: Date?
    let completedAt: Date?
    let createdAt: Date
    let updatedAt: Date
    let milestones: [Milestone]
    let progress: Int
    let milestoneCount: Int
    let completedMilestones: Int
}

struct Milestone: Codable, Identifiable, Hashable {
    let id: String
    let phaseId: String
    let projectId: String
    let name: String
    let description: String?
    let status: MilestoneStatus
    let order: Int
    let dueDate: Date?
    let completedAt: Date?
    let assignedTo: String?
    let createdAt: Date
    let updatedAt: Date
}

struct ProjectTask: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let description: String?
    let status: TaskStatus
    let order: Int
    let dueDate: Date?
    let completedAt: Date?
    let milestoneId: String?
    let phaseId: String?
    let createdAt: Date
    let milestoneName: String?
    let phaseName: String?
}

// MARK: - Transactions

struct Transaction: Codable, Identifiable, Hashable {
    let id: String
    let projectId: String
    let phaseId: String?
    let milestoneId: String?
    let taskId: String?
    let actorId: String?
    let type: TransactionType
    let category: TransactionCategory
    let description: String
    let amount: Money
    let currency: String
    let normalizedAmount: Money
    let workspaceCurrency: String
    let date: Date
    let invoiceId: String?
    let receiptUrl: String?
    let notes: String?
    let createdAt: Date
    let actor: Contact?
}

/// Workspace-wide transaction row from the analytics endpoint (flatter shape).
struct WorkspaceTransaction: Codable, Identifiable, Hashable {
    let id: String
    let description: String
    let type: TransactionType
    let category: TransactionCategory
    let amount: Money
    let currency: String
    let date: Date
    let projectId: String
    let projectName: String?
    let notes: String?
}

// MARK: - Actors

/// Maps to the API's `actors` entity. Named `Contact` to avoid clashing with
/// Swift's built-in `Actor` protocol (which breaks generic inference).
struct Contact: Codable, Identifiable, Hashable {
    let id: String
    let workspaceId: String?
    let name: String
    let email: String?
    let phone: String?
    let type: ActorType
    let company: String?
    let notes: String?
    let createdAt: Date?
    let updatedAt: Date?
}

struct ProjectActorLink: Codable, Identifiable, Hashable {
    let id: String
    let projectId: String
    let actorId: String
    let role: String?
    let joinedAt: Date?
    let actor: Contact?
}

// MARK: - Invoices

struct InvoiceItem: Codable, Identifiable, Hashable {
    let id: String?
    let description: String
    let details: String?
    let quantity: Money
    let rate: Money
    let amount: Money
    let sortOrder: Int?
}

struct Invoice: Codable, Identifiable, Hashable {
    let id: String
    let workspaceId: String
    let projectId: String?
    let actorId: String
    let invoiceNumber: String
    let sequenceNumber: Int
    let status: InvoiceStatus
    let currency: String
    let subtotal: Money
    let taxRate: Money
    let taxAmount: Money
    let total: Money
    let paidAmount: Money
    let issueDate: Date
    let dueDate: Date
    let notes: String?
    let createdAt: Date
    let items: [InvoiceItem]?
    let actor: Contact?
    let project: Project?
}

struct InvoiceSettings: Codable, Hashable {
    let id: String?
    let invoicePrefix: String
    let companyName: String?
    let companyAddress: String?
    let companyEmail: String?
    let companyPhone: String?
    let paymentDetails: String?
    let defaultTaxRate: Money?
    let defaultPaymentTermsDays: Int?
}
