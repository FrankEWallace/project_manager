import Foundation

struct DashboardData: Codable, Hashable {
    let portfolio: Portfolio
    let trends: Trends
    let projects: [DashboardProject]
    let milestones: MilestoneSummary
    let upcomingPayments: [UpcomingPayment]
    let onboarding: Onboarding

    struct Portfolio: Codable, Hashable {
        let statusBreakdown: [StatusCount]
        let overdue: Int
        let totalProjects: Int
        let financials: Financials
    }

    struct StatusCount: Codable, Hashable, Identifiable {
        let status: ProjectStatus
        let count: Int
        var id: String { status.rawValue }
    }

    struct Financials: Codable, Hashable {
        let totalIncome: Double
        let totalExpenses: Double
        let profit: Double
    }

    struct Trends: Codable, Hashable {
        let income: Trend
        let expenses: Trend
        let profit: Trend
        let activeProjects: Trend
    }

    struct Trend: Codable, Hashable {
        let current: Double
        let previous: Double
        let pct: Int?
    }

    struct DashboardProject: Codable, Hashable, Identifiable {
        let id: String
        let name: String
        let status: ProjectStatus
        let health: ProjectHealth
        let priority: ProjectPriority
        let budget: Money?
        let dueDate: Date?
        let createdAt: Date
    }

    struct MilestoneSummary: Codable, Hashable {
        let total: Int
        let completed: Int
        let completionRate: Int
    }

    struct UpcomingPayment: Codable, Hashable, Identifiable {
        let id: String
        let description: String
        let type: TransactionType
        let amount: Money
        let currency: String
        let date: Date
        let projectId: String
        let projectName: String?
        let category: TransactionCategory
    }

    struct Onboarding: Codable, Hashable {
        let hasProject: Bool
        let hasActor: Bool
        let hasMember: Bool
    }
}

struct IncomeExpensePoint: Codable, Hashable, Identifiable {
    let period: String
    let income: Double
    let expenses: Double
    var id: String { period }
}
