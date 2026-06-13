import SwiftUI

// MARK: - Project

enum ProjectStatus: String, Codable, CaseIterable, Identifiable {
    case draft, active, on_hold, completed, cancelled
    var id: String { rawValue }
    var label: String {
        switch self {
        case .draft: "Draft"
        case .active: "Active"
        case .on_hold: "On Hold"
        case .completed: "Completed"
        case .cancelled: "Cancelled"
        }
    }
    var color: Color {
        switch self {
        case .draft: Theme.Color.gray500
        case .active: Theme.Color.info
        case .on_hold: Theme.Color.warning
        case .completed: Theme.Color.success
        case .cancelled: Theme.Color.danger
        }
    }
}

enum ProjectHealth: String, Codable, CaseIterable, Identifiable {
    case healthy, at_risk, delayed, blocked
    var id: String { rawValue }
    var label: String {
        switch self {
        case .healthy: "Healthy"
        case .at_risk: "At Risk"
        case .delayed: "Delayed"
        case .blocked: "Blocked"
        }
    }
    var color: Color {
        switch self {
        case .healthy: Theme.Color.success
        case .at_risk: Theme.Color.warning
        case .delayed: Theme.Color.warning
        case .blocked: Theme.Color.danger
        }
    }
}

enum ProjectPriority: String, Codable, CaseIterable, Identifiable {
    case low, medium, high, critical
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var color: Color {
        switch self {
        case .low: Theme.Color.gray500
        case .medium: Theme.Color.info
        case .high: Theme.Color.warning
        case .critical: Theme.Color.danger
        }
    }
}

enum ProjectVisibility: String, Codable, CaseIterable, Identifiable {
    case `private`, workspace
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
}

// MARK: - Hierarchy

enum PhaseStatus: String, Codable, CaseIterable {
    case pending, active, completed, skipped
    var label: String { rawValue.capitalized }
    var color: Color {
        switch self {
        case .pending: Theme.Color.gray500
        case .active: Theme.Color.info
        case .completed: Theme.Color.success
        case .skipped: Theme.Color.gray400
        }
    }
}

enum MilestoneStatus: String, Codable {
    case open, completed
    var isComplete: Bool { self == .completed }
}

enum TaskStatus: String, Codable, CaseIterable {
    case todo, in_progress, done, cancelled
    var label: String {
        switch self {
        case .todo: "To Do"
        case .in_progress: "In Progress"
        case .done: "Done"
        case .cancelled: "Cancelled"
        }
    }
    var color: Color {
        switch self {
        case .todo: Theme.Color.gray500
        case .in_progress: Theme.Color.info
        case .done: Theme.Color.success
        case .cancelled: Theme.Color.gray400
        }
    }
}

// MARK: - Financials

enum TransactionType: String, Codable, CaseIterable, Identifiable {
    case income, expense
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var color: Color { self == .income ? Theme.Color.success : Theme.Color.danger }
    var sign: String { self == .income ? "+" : "−" }
}

enum TransactionCategory: String, Codable, CaseIterable, Identifiable {
    case client_payment, grant, sponsorship, investment, refund, other_income
    case salary, contractor, software, hosting, hardware, transport
    case marketing, legal, office, utilities, other_expense
    var id: String { rawValue }
    var label: String {
        rawValue.split(separator: "_").map { $0.capitalized }.joined(separator: " ")
    }
    var isIncome: Bool {
        switch self {
        case .client_payment, .grant, .sponsorship, .investment, .refund, .other_income: true
        default: false
        }
    }
    static func options(for type: TransactionType) -> [TransactionCategory] {
        allCases.filter { type == .income ? $0.isIncome : !$0.isIncome }
    }
}

enum ActorType: String, Codable, CaseIterable, Identifiable {
    case client, collaborator, vendor, advisor, investor
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var icon: String {
        switch self {
        case .client: "person.crop.circle"
        case .collaborator: "person.2"
        case .vendor: "shippingbox"
        case .advisor: "lightbulb"
        case .investor: "chart.line.uptrend.xyaxis"
        }
    }
}

enum InvoiceStatus: String, Codable, CaseIterable {
    case draft, sent, partially_paid, paid, void
    var label: String {
        switch self {
        case .partially_paid: "Partially Paid"
        default: rawValue.capitalized
        }
    }
    var color: Color {
        switch self {
        case .draft: Theme.Color.gray500
        case .sent: Theme.Color.info
        case .partially_paid: Theme.Color.warning
        case .paid: Theme.Color.success
        case .void: Theme.Color.gray400
        }
    }
}

enum WorkspaceRole: String, Codable {
    case owner, admin, member
    var label: String { rawValue.capitalized }
    var canManage: Bool { self == .owner || self == .admin }
}
