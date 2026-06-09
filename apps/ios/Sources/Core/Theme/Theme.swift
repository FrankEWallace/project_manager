import SwiftUI
import UIKit

/// Design tokens. Mirrors the Blueprint framework rules:
/// 4px base spacing scale, no pure black, single accent, limited type sizes.
enum Theme {

    // MARK: Spacing (4px base scale)
    enum Space {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let xxl: CGFloat = 32
        static let xxxl: CGFloat = 48
    }

    // MARK: Radius
    enum Radius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let pill: CGFloat = 999
    }

    // MARK: Colors
    enum Color {
        static let accent = SwiftUI.Color(hex: 0x6366F1)
        static let accentSoft = SwiftUI.Color(hex: 0x6366F1).opacity(0.12)

        static let gray900 = SwiftUI.Color(hex: 0x111827) // never pure black
        static let gray700 = SwiftUI.Color(hex: 0x374151)
        static let gray500 = SwiftUI.Color(hex: 0x6B7280)
        static let gray400 = SwiftUI.Color(hex: 0x9CA3AF)
        static let gray200 = SwiftUI.Color(hex: 0xE5E7EB)
        static let gray100 = SwiftUI.Color(hex: 0xF3F4F6)

        static let success = SwiftUI.Color(hex: 0x16A34A)
        static let warning = SwiftUI.Color(hex: 0xD97706)
        static let danger = SwiftUI.Color(hex: 0xDC2626)
        static let info = SwiftUI.Color(hex: 0x2563EB)

        static let background = SwiftUI.Color(UIColor.systemGroupedBackground)
        static let surface = SwiftUI.Color(UIColor.secondarySystemGroupedBackground)
        static let label = SwiftUI.Color(UIColor.label)
        static let secondaryLabel = SwiftUI.Color(UIColor.secondaryLabel)
    }

    // MARK: Typography (kept to a few sizes per screen)
    enum Font {
        static let largeTitle = SwiftUI.Font.system(size: 30, weight: .bold, design: .rounded)
        static let title = SwiftUI.Font.system(size: 22, weight: .bold, design: .rounded)
        static let headline = SwiftUI.Font.system(size: 17, weight: .semibold)
        static let body = SwiftUI.Font.system(size: 15, weight: .regular)
        static let callout = SwiftUI.Font.system(size: 14, weight: .medium)
        static let caption = SwiftUI.Font.system(size: 12, weight: .medium)
    }
}

extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }

    /// Parse "#RRGGBB" strings coming from the API (category colors).
    init?(apiHex: String?) {
        guard var s = apiHex?.trimmingCharacters(in: .whitespaces) else { return nil }
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let value = UInt(s, radix: 16) else { return nil }
        self.init(hex: value)
    }
}
