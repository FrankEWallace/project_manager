import Foundation

enum Format {
    /// Currency formatting using the workspace/transaction currency code.
    static func currency(_ amount: Double, code: String = "USD") -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = code
        f.maximumFractionDigits = amount.rounded() == amount ? 0 : 2
        return f.string(from: NSNumber(value: amount)) ?? "\(amount)"
    }

    static func compactCurrency(_ amount: Double, code: String = "USD") -> String {
        let abs = Swift.abs(amount)
        let sign = amount < 0 ? "-" : ""
        let symbol = currencySymbol(code)
        switch abs {
        case 1_000_000...:
            return "\(sign)\(symbol)\(String(format: "%.1f", abs / 1_000_000))M"
        case 1_000...:
            return "\(sign)\(symbol)\(String(format: "%.1f", abs / 1_000))K"
        default:
            return currency(amount, code: code)
        }
    }

    static func currencySymbol(_ code: String) -> String {
        let locale = Locale(identifier: "en_US")
        return locale.localizedCurrencySymbol(forCurrencyCode: code) ?? code
    }

    static func date(_ date: Date?, style: DateFormatter.Style = .medium) -> String {
        guard let date else { return "—" }
        let f = DateFormatter()
        f.dateStyle = style
        f.timeStyle = .none
        return f.string(from: date)
    }

    static func relative(_ date: Date?) -> String {
        guard let date else { return "—" }
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .full
        return f.localizedString(for: date, relativeTo: Date())
    }

    /// Days remaining (negative = overdue).
    static func daysRemaining(to date: Date?) -> Int? {
        guard let date else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: date).day
    }

    static func percent(_ value: Int) -> String { "\(value)%" }

    /// ISO8601 string for sending dates to the API.
    static func iso(_ date: Date) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f.string(from: date)
    }
}

extension Locale {
    func localizedCurrencySymbol(forCurrencyCode code: String) -> String? {
        guard let symbol = currencySymbol else { return code }
        // Common overrides for codes the locale doesn't symbolize nicely.
        let map: [String: String] = [
            "USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥", "CNY": "¥",
            "INR": "₹", "NGN": "₦", "ZAR": "R", "KES": "KSh", "GHS": "₵",
            "TZS": "TSh", "AUD": "A$", "CAD": "C$", "SGD": "S$", "AED": "AED",
            "SAR": "SAR", "BRL": "R$", "MXN": "MX$", "PKR": "₨", "MYR": "RM",
        ]
        return map[code] ?? symbol
    }
}
