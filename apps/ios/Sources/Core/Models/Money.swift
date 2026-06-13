import Foundation

/// Decodes a monetary value that the API may send as a JSON string
/// (Drizzle `numeric` columns) or a JSON number (computed analytics).
struct Money: Codable, Hashable {
    let amount: Double

    init(_ amount: Double) { self.amount = amount }

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let d = try? c.decode(Double.self) { amount = d; return }
        if let i = try? c.decode(Int.self) { amount = Double(i); return }
        if let s = try? c.decode(String.self), let d = Double(s) { amount = d; return }
        throw DecodingError.dataCorruptedError(
            in: c, debugDescription: "Expected a number or numeric string for Money")
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(amount)
    }
}
