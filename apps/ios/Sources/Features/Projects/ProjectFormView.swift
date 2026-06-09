import SwiftUI

struct ProjectFormView: View {
    @Environment(\.dismiss) private var dismiss
    var existing: Project?
    var onSave: () async -> Void

    @State private var name = ""
    @State private var description = ""
    @State private var status: ProjectStatus = .draft
    @State private var health: ProjectHealth = .healthy
    @State private var priority: ProjectPriority = .medium
    @State private var visibility: ProjectVisibility = .workspace
    @State private var currency = "USD"
    @State private var budgetText = ""
    @State private var hasStart = false
    @State private var startDate = Date()
    @State private var hasDue = false
    @State private var dueDate = Date()
    @State private var tagsText = ""

    @State private var saving = false
    @State private var error: String?

    private var isEdit: Bool { existing != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Name", text: $name)
                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(2...5)
                }
                Section("Classification") {
                    Picker("Status", selection: $status) {
                        ForEach(ProjectStatus.allCases) { Text($0.label).tag($0) }
                    }
                    Picker("Health", selection: $health) {
                        ForEach(ProjectHealth.allCases) { Text($0.label).tag($0) }
                    }
                    Picker("Priority", selection: $priority) {
                        ForEach(ProjectPriority.allCases) { Text($0.label).tag($0) }
                    }
                    Picker("Visibility", selection: $visibility) {
                        ForEach(ProjectVisibility.allCases) { Text($0.label).tag($0) }
                    }
                }
                Section("Budget") {
                    Picker("Currency", selection: $currency) {
                        ForEach(Currencies.all, id: \.self) { Text($0).tag($0) }
                    }
                    TextField("Budget amount", text: $budgetText)
                        .keyboardType(.decimalPad)
                }
                Section("Schedule") {
                    Toggle("Start date", isOn: $hasStart)
                    if hasStart { DatePicker("Starts", selection: $startDate, displayedComponents: .date) }
                    Toggle("Due date", isOn: $hasDue)
                    if hasDue { DatePicker("Due", selection: $dueDate, displayedComponents: .date) }
                }
                Section("Tags") {
                    TextField("Comma separated", text: $tagsText)
                        .autocorrectionDisabled()
                }
                if let error {
                    Text(error).foregroundStyle(Theme.Color.danger).font(Theme.Font.callout)
                }
            }
            .navigationTitle(isEdit ? "Edit Project" : "New Project")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.disabled(name.isEmpty || saving)
                }
            }
            .onAppear(perform: populate)
        }
    }

    private func populate() {
        guard let p = existing else { return }
        name = p.name
        description = p.description ?? ""
        status = p.status; health = p.health; priority = p.priority; visibility = p.visibility
        currency = p.currency
        if let b = p.budget { budgetText = String(b.amount) }
        if let s = p.startDate { hasStart = true; startDate = s }
        if let d = p.dueDate { hasDue = true; dueDate = d }
        tagsText = p.tags.joined(separator: ", ")
    }

    private func save() {
        saving = true; error = nil
        let tags = tagsText.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        let body = ProjectBody(
            name: name,
            description: description.isEmpty ? nil : description,
            categoryId: existing?.categoryId,
            status: status.rawValue,
            health: health.rawValue,
            priority: priority.rawValue,
            visibility: visibility.rawValue,
            budget: Double(budgetText),
            currency: currency,
            tags: tags,
            startDate: hasStart ? Format.iso(startDate) : nil,
            dueDate: hasDue ? Format.iso(dueDate) : nil
        )
        Task {
            do {
                if let existing {
                    _ = try await APIClient.shared.updateProject(existing.id, body)
                } else {
                    _ = try await APIClient.shared.createProject(body)
                }
                await onSave()
                dismiss()
            } catch {
                self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription
            }
            saving = false
        }
    }
}

enum Currencies {
    static let all = ["USD","EUR","GBP","MYR","TZS","NGN","KES","GHS","ZAR","INR",
                      "AUD","CAD","SGD","AED","SAR","JPY","CNY","BRL","MXN","PKR"]
}
