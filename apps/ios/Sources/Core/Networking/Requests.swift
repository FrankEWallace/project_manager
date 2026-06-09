import Foundation

// MARK: - Auth

struct SignInBody: Encodable { let email: String; let password: String }
struct SignUpBody: Encodable { let name: String; let email: String; let password: String }

// MARK: - Project

struct ProjectBody: Encodable {
    var name: String
    var description: String?
    var categoryId: String?
    var status: String?
    var health: String?
    var priority: String?
    var visibility: String?
    var budget: Double?
    var currency: String?
    var tags: [String]?
    var startDate: String?
    var dueDate: String?
}

// MARK: - Phase / Milestone / Task

struct PhaseBody: Encodable {
    var name: String
    var description: String?
    var order: Int?
    var startDate: String?
    var dueDate: String?
}

struct MilestoneBody: Encodable {
    var name: String
    var description: String?
    var order: Int?
    var dueDate: String?
    var assignedTo: String?
}

struct TaskBody: Encodable {
    var title: String
    var description: String?
    var status: String?
    var milestoneId: String?
    var phaseId: String?
    var dueDate: String?
    var order: Int?
}

// MARK: - Transaction

struct TransactionBody: Encodable {
    var type: String
    var category: String
    var description: String
    var amount: Double
    var currency: String
    var normalizedAmount: Double
    var date: String
    var phaseId: String?
    var milestoneId: String?
    var actorId: String?
    var notes: String?
}

// MARK: - Actor

struct ActorBody: Encodable {
    var name: String
    var email: String?
    var phone: String?
    var type: String
    var company: String?
    var notes: String?
}

// MARK: - Category

struct CategoryBody: Encodable {
    var name: String
    var color: String?
    var icon: String?
    var description: String?
    var archived: Bool?
}

// MARK: - Invoice

struct InvoiceItemBody: Encodable {
    var description: String
    var details: String?
    var quantity: Double
    var rate: Double
    var sortOrder: Int?
}

struct InvoiceBody: Encodable {
    var projectId: String?
    var actorId: String
    var currency: String
    var normalizedTotal: Double
    var taxRate: Double?
    var issueDate: String
    var dueDate: String
    var notes: String?
    var items: [InvoiceItemBody]
}

struct PaymentBody: Encodable {
    var amount: Double
    var currency: String
    var normalizedAmount: Double
    var date: String
    var notes: String?
}

// MARK: - Workspace / Invitation

struct WorkspaceUpdateBody: Encodable {
    var name: String?
    var baseCurrency: String?
}

struct InviteBody: Encodable { let email: String; let role: String }
