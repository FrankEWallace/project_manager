import XCTest
@testable import ProjectManager

final class MoneyTests: XCTestCase {
    private func decode(_ json: String) throws -> Money {
        try JSONDecoder().decode(Money.self, from: Data(json.utf8))
    }

    func testDecodesJSONNumber() throws {
        XCTAssertEqual(try decode("1234.56").amount, 1234.56, accuracy: 0.0001)
    }

    func testDecodesInteger() throws {
        XCTAssertEqual(try decode("4200").amount, 4200, accuracy: 0.0001)
    }

    func testDecodesNumericString() throws {
        // Drizzle `numeric` columns serialize as JSON strings.
        XCTAssertEqual(try decode("\"1999.99\"").amount, 1999.99, accuracy: 0.0001)
    }

    func testDecodesNegativeString() throws {
        XCTAssertEqual(try decode("\"-50.00\"").amount, -50, accuracy: 0.0001)
    }

    func testThrowsOnNonNumericString() {
        XCTAssertThrowsError(try decode("\"abc\""))
    }

    func testEncodesAsNumber() throws {
        let data = try JSONEncoder().encode(Money(12.5))
        XCTAssertEqual(String(decoding: data, as: UTF8.self), "12.5")
    }

    func testRoundTripWithinModel() throws {
        struct Row: Codable { let total: Money }
        let row = try JSONDecoder().decode(Row.self, from: Data(#"{"total":"100.25"}"#.utf8))
        XCTAssertEqual(row.total.amount, 100.25, accuracy: 0.0001)
    }
}
