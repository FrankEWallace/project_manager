import SwiftUI

struct CategoriesView: View {
    @State private var state: Loadable<[Category]> = .idle
    @State private var showCreate = false
    @State private var editing: Category?

    var body: some View {
        Group {
            LoadableView(state: state, retry: { Task { await load() } }) { categories in
                if categories.isEmpty {
                    ScrollView {
                        EmptyStateView(icon: "tag", title: "No categories",
                                       message: "Group projects by category for cleaner analytics.",
                                       actionTitle: "Add Category", action: { showCreate = true })
                    }
                } else {
                    List {
                        ForEach(categories) { category in
                            Button { editing = category } label: {
                                HStack(spacing: Theme.Space.md) {
                                    Circle().fill(Color(apiHex: category.color) ?? Theme.Color.accent)
                                        .frame(width: 14, height: 14)
                                    Text(category.name).font(Theme.Font.body)
                                        .foregroundStyle(Theme.Color.label)
                                    Spacer()
                                    if let count = category.projectCount {
                                        Text("\(count)").font(Theme.Font.caption)
                                            .foregroundStyle(Theme.Color.secondaryLabel)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                            .swipeActions {
                                Button(role: .destructive) {
                                    Task { try? await APIClient.shared.deleteCategory(category.id); await load() }
                                } label: { Label("Delete", systemImage: "trash") }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Categories")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCreate = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showCreate) { CategoryFormView { await load() } }
        .sheet(item: $editing) { c in CategoryFormView(existing: c) { await load() } }
        .task { if case .idle = state { await load() } }
    }

    private func load() async {
        if case .idle = state { state = .loading }
        do { state = .loaded(try await APIClient.shared.fetchCategories()) }
        catch { state = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription) }
    }
}

struct CategoryFormView: View {
    @Environment(\.dismiss) private var dismiss
    var existing: Category?
    var onSave: () async -> Void

    @State private var name = ""
    @State private var color = "#6366f1"
    @State private var description = ""
    @State private var saving = false
    @State private var error: String?

    private let palette = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6",
                           "#ef4444","#8b5cf6","#14b8a6","#f97316","#64748b"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Category") {
                    TextField("Name", text: $name)
                    TextField("Description", text: $description, axis: .vertical).lineLimit(2...4)
                }
                Section("Color") {
                    let cols = [GridItem(.adaptive(minimum: 40))]
                    LazyVGrid(columns: cols, spacing: Theme.Space.md) {
                        ForEach(palette, id: \.self) { hex in
                            Circle().fill(Color(apiHex: hex) ?? .gray)
                                .frame(width: 32, height: 32)
                                .overlay {
                                    if hex == color {
                                        Image(systemName: "checkmark").foregroundStyle(.white).font(.caption.bold())
                                    }
                                }
                                .onTapGesture { color = hex }
                        }
                    }
                    .padding(.vertical, Theme.Space.xs)
                }
                if let error { Text(error).foregroundStyle(Theme.Color.danger) }
            }
            .navigationTitle(existing == nil ? "New Category" : "Edit Category")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.disabled(name.isEmpty || saving)
                }
            }
            .onAppear {
                if let c = existing { name = c.name; color = c.color; description = c.description ?? "" }
            }
        }
    }

    private func save() {
        saving = true; error = nil
        let body = CategoryBody(name: name, color: color, icon: nil,
                                description: description.isEmpty ? nil : description)
        Task {
            do {
                if let existing { _ = try await APIClient.shared.updateCategory(existing.id, body) }
                else { _ = try await APIClient.shared.createCategory(body) }
                await onSave(); dismiss()
            } catch { self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription }
            saving = false
        }
    }
}
