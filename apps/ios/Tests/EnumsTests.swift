import XCTest
@testable import ProjectManager

final class EnumsTests: XCTestCase {
    func testTransactionTypeSign() {
        XCTAssertEqual(TransactionType.income.sign, "+")
        XCTAssertEqual(TransactionType.expense.sign, "−") // U+2212 minus
    }

    func testTransactionCategoryIncomeClassification() {
        XCTAssertTrue(TransactionCategory.client_payment.isIncome)
        XCTAssertTrue(TransactionCategory.grant.isIncome)
        XCTAssertFalse(TransactionCategory.salary.isIncome)
        XCTAssertFalse(TransactionCategory.hosting.isIncome)
    }

    func testCategoryOptionsPartitionByType() {
        let income = TransactionCategory.options(for: .income)
        let expense = TransactionCategory.options(for: .expense)
        XCTAssertTrue(income.allSatisfy { $0.isIncome })
        XCTAssertTrue(expense.allSatisfy { !$0.isIncome })
        XCTAssertEqual(income.count + expense.count, TransactionCategory.allCases.count)
        XCTAssertTrue(Set(income).isDisjoint(with: Set(expense)))
    }

    func testCategoryLabelHumanizes() {
        XCTAssertEqual(TransactionCategory.client_payment.label, "Client Payment")
        XCTAssertEqual(TransactionCategory.other_expense.label, "Other Expense")
    }

    func testWorkspaceRolePermissions() {
        XCTAssertTrue(WorkspaceRole.owner.canManage)
        XCTAssertTrue(WorkspaceRole.admin.canManage)
        XCTAssertFalse(WorkspaceRole.member.canManage)
    }

    func testInvoiceStatusLabel() {
        XCTAssertEqual(InvoiceStatus.partially_paid.label, "Partially Paid")
        XCTAssertEqual(InvoiceStatus.draft.label, "Draft")
    }

    func testMilestoneStatusIsComplete() {
        XCTAssertTrue(MilestoneStatus.completed.isComplete)
        XCTAssertFalse(MilestoneStatus.open.isComplete)
    }

    func testStatusDecodesFromRawValue() throws {
        let status = try JSONDecoder().decode(ProjectStatus.self, from: Data("\"on_hold\"".utf8))
        XCTAssertEqual(status, .on_hold)
        XCTAssertEqual(status.label, "On Hold")
    }
}
