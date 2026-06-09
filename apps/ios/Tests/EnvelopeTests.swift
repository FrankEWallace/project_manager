import XCTest
@testable import ProjectManager

final class EnvelopeTests: XCTestCase {
    func testUnwrapsDataObject() throws {
        struct Item: Decodable, Equatable { let id: String; let name: String }
        let json = #"{"data":{"id":"abc","name":"Acme"}}"#
        let env = try APIClient.makeDecoder().decode(Envelope<Item>.self, from: Data(json.utf8))
        XCTAssertEqual(env.data, Item(id: "abc", name: "Acme"))
    }

    func testUnwrapsDataArray() throws {
        let json = #"{"data":["a","b","c"]}"#
        let env = try APIClient.makeDecoder().decode(Envelope<[String]>.self, from: Data(json.utf8))
        XCTAssertEqual(env.data, ["a", "b", "c"])
    }

    func testThrowsWhenDataKeyMissing() {
        let json = #"{"items":[]}"#
        XCTAssertThrowsError(
            try APIClient.makeDecoder().decode(Envelope<[String]>.self, from: Data(json.utf8))
        )
    }
}
