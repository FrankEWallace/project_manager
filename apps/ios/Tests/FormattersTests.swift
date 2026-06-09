import XCTest
@testable import ProjectManager

final class FormattersTests: XCTestCase {
    func testCompactCurrencyThousands() {
        XCTAssertEqual(Format.compactCurrency(12_500, code: "USD"), "$12.5K")
    }

    func testCompactCurrencyMillions() {
        XCTAssertEqual(Format.compactCurrency(2_300_000, code: "USD"), "$2.3M")
    }

    func testCompactCurrencyNegative() {
        XCTAssertEqual(Format.compactCurrency(-5_000, code: "USD"), "-$5.0K")
    }

    func testCompactCurrencySmallFallsBackToFull() {
        // Below 1,000 it uses full currency formatting (no K/M suffix).
        XCTAssertFalse(Format.compactCurrency(750, code: "USD").hasSuffix("K"))
    }

    func testCurrencySymbolMapping() {
        XCTAssertEqual(Format.currencySymbol("USD"), "$")
        XCTAssertEqual(Format.currencySymbol("EUR"), "€")
        XCTAssertEqual(Format.currencySymbol("NGN"), "₦")
        XCTAssertEqual(Format.currencySymbol("GBP"), "£")
    }

    func testPercent() {
        XCTAssertEqual(Format.percent(42), "42%")
    }

    func testDateNilRendersDash() {
        XCTAssertEqual(Format.date(nil), "—")
    }

    func testDaysRemainingNilForNilDate() {
        XCTAssertNil(Format.daysRemaining(to: nil))
    }

    func testDaysRemainingFuture() {
        let tenDays = Calendar.current.date(byAdding: .day, value: 10, to: Date())
        let days = Format.daysRemaining(to: tenDays)
        XCTAssertNotNil(days)
        XCTAssertGreaterThanOrEqual(days ?? 0, 9)
    }

    func testISORoundTrip() throws {
        let iso = Format.iso(Date(timeIntervalSince1970: 1_749_465_000))
        let parsed = try XCTUnwrap(DateParsing.parse(iso))
        XCTAssertEqual(parsed.timeIntervalSince1970, 1_749_465_000, accuracy: 1)
    }
}
