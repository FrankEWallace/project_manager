import XCTest
@testable import ProjectManager

final class DateParsingTests: XCTestCase {
    private let utc = TimeZone(identifier: "UTC")!

    private func components(_ date: Date) -> DateComponents {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = utc
        return cal.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
    }

    func testParsesISO8601WithFractionalSeconds() throws {
        let date = try XCTUnwrap(DateParsing.parse("2026-06-09T14:30:00.123Z"))
        let c = components(date)
        XCTAssertEqual(c.year, 2026)
        XCTAssertEqual(c.month, 6)
        XCTAssertEqual(c.day, 9)
        XCTAssertEqual(c.hour, 14)
        XCTAssertEqual(c.minute, 30)
    }

    func testParsesISO8601WithoutFractionalSeconds() throws {
        let date = try XCTUnwrap(DateParsing.parse("2026-06-09T14:30:00Z"))
        XCTAssertEqual(components(date).hour, 14)
    }

    func testParsesDateOnly() throws {
        let date = try XCTUnwrap(DateParsing.parse("2026-06-09"))
        let c = components(date)
        XCTAssertEqual(c.year, 2026)
        XCTAssertEqual(c.month, 6)
        XCTAssertEqual(c.day, 9)
    }

    func testReturnsNilForGarbage() {
        XCTAssertNil(DateParsing.parse("not-a-date"))
        XCTAssertNil(DateParsing.parse(""))
    }

    func testDecoderUsesDateParsing() throws {
        struct Row: Decodable { let createdAt: Date }
        let decoder = APIClient.makeDecoder()
        let row = try decoder.decode(Row.self, from: Data(#"{"createdAt":"2026-06-09T00:00:00Z"}"#.utf8))
        XCTAssertEqual(components(row.createdAt).year, 2026)
    }

    func testDecoderThrowsOnUnrecognizedDate() {
        struct Row: Decodable { let createdAt: Date }
        let decoder = APIClient.makeDecoder()
        XCTAssertThrowsError(try decoder.decode(Row.self, from: Data(#"{"createdAt":"yesterday"}"#.utf8)))
    }
}
