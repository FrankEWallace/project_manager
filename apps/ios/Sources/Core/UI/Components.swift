import SwiftUI

// MARK: - Card

struct Card<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(Theme.Space.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.Color.surface)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md, style: .continuous))
    }
}

// MARK: - Pill / Badge

struct Pill: View {
    let text: String
    var color: Color = Theme.Color.gray500
    var body: some View {
        Text(text)
            .font(Theme.Font.caption)
            .foregroundStyle(color)
            .padding(.horizontal, Theme.Space.sm)
            .padding(.vertical, Theme.Space.xs)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}

// MARK: - Progress bar

struct ProgressBar: View {
    let value: Int            // 0...100
    var tint: Color = Theme.Color.accent
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.Color.gray200)
                Capsule().fill(tint)
                    .frame(width: geo.size.width * CGFloat(max(0, min(100, value))) / 100)
            }
        }
        .frame(height: 8)
    }
}

// MARK: - KPI tile

struct KPITile: View {
    let title: String
    let value: String
    var trend: Int?
    var trendPositiveIsGood: Bool = true

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.sm) {
                Text(title.uppercased())
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Color.secondaryLabel)
                Text(value)
                    .font(Theme.Font.title)
                    .foregroundStyle(Theme.Color.label)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                if let trend {
                    let good = trendPositiveIsGood ? trend >= 0 : trend <= 0
                    Label("\(abs(trend))%", systemImage: trend >= 0 ? "arrow.up.right" : "arrow.down.right")
                        .font(Theme.Font.caption)
                        .foregroundStyle(good ? Theme.Color.success : Theme.Color.danger)
                }
            }
        }
    }
}

// MARK: - Section header

struct SectionHeader: View {
    let title: String
    var actionTitle: String?
    var action: (() -> Void)?
    var body: some View {
        HStack {
            Text(title).font(Theme.Font.headline).foregroundStyle(Theme.Color.label)
            Spacer()
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(Theme.Font.callout)
                    .foregroundStyle(Theme.Color.accent)
            }
        }
    }
}

// MARK: - Empty / Loading / Error

struct EmptyStateView: View {
    let icon: String
    let title: String
    var message: String?
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: Theme.Space.md) {
            Image(systemName: icon)
                .font(.system(size: 44))
                .foregroundStyle(Theme.Color.gray400)
            Text(title).font(Theme.Font.headline).foregroundStyle(Theme.Color.label)
            if let message {
                Text(message)
                    .font(Theme.Font.body)
                    .foregroundStyle(Theme.Color.secondaryLabel)
                    .multilineTextAlignment(.center)
            }
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.Color.accent)
            }
        }
        .padding(Theme.Space.xl)
        .frame(maxWidth: .infinity)
    }
}

struct InlineError: View {
    let message: String
    var retry: (() -> Void)?
    var body: some View {
        VStack(spacing: Theme.Space.md) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 36))
                .foregroundStyle(Theme.Color.warning)
            Text(message)
                .font(Theme.Font.body)
                .foregroundStyle(Theme.Color.secondaryLabel)
                .multilineTextAlignment(.center)
            if let retry {
                Button("Try Again", action: retry)
                    .buttonStyle(.bordered)
            }
        }
        .padding(Theme.Space.xl)
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Loadable state machine for async screens

enum Loadable<Value> {
    case idle
    case loading
    case loaded(Value)
    case failed(String)
}

/// Renders the right view for a Loadable. Keeps screens declarative.
struct LoadableView<Value, Content: View>: View {
    let state: Loadable<Value>
    var retry: (() -> Void)?
    @ViewBuilder var content: (Value) -> Content

    var body: some View {
        switch state {
        case .idle, .loading:
            ProgressView().frame(maxWidth: .infinity, minHeight: 200)
        case let .failed(message):
            InlineError(message: message, retry: retry)
        case let .loaded(value):
            content(value)
        }
    }
}

// MARK: - Labeled row

struct DetailRow: View {
    let label: String
    let value: String
    var valueColor: Color = Theme.Color.label
    var body: some View {
        HStack {
            Text(label).font(Theme.Font.body).foregroundStyle(Theme.Color.secondaryLabel)
            Spacer()
            Text(value).font(Theme.Font.callout).foregroundStyle(valueColor)
        }
    }
}
