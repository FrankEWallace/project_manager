import SwiftUI

// MARK: - Phase form

struct PhaseFormView: View {
    @Environment(\.dismiss) private var dismiss
    let projectId: String
    var onSave: () async -> Void

    @State private var name = ""
    @State private var description = ""
    @State private var hasDue = false
    @State private var dueDate = Date()
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Phase") {
                    TextField("Name", text: $name)
                    TextField("Description", text: $description, axis: .vertical).lineLimit(2...4)
                }
                Section {
                    Toggle("Due date", isOn: $hasDue)
                    if hasDue { DatePicker("Due", selection: $dueDate, displayedComponents: .date) }
                }
                if let error { Text(error).foregroundStyle(Theme.Color.danger) }
            }
            .navigationTitle("New Phase")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.disabled(name.isEmpty || saving)
                }
            }
        }
    }

    private func save() {
        saving = true; error = nil
        let body = PhaseBody(name: name,
                             description: description.isEmpty ? nil : description,
                             order: 0,
                             dueDate: hasDue ? Format.iso(dueDate) : nil)
        Task {
            do {
                _ = try await APIClient.shared.createPhase(projectId: projectId, body)
                await onSave(); dismiss()
            } catch { self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription }
            saving = false
        }
    }
}

// MARK: - Milestone form

struct MilestoneFormView: View {
    @Environment(\.dismiss) private var dismiss
    let projectId: String
    let phaseId: String
    var onSave: () async -> Void

    @State private var name = ""
    @State private var description = ""
    @State private var hasDue = false
    @State private var dueDate = Date()
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Milestone") {
                    TextField("Name", text: $name)
                    TextField("Description", text: $description, axis: .vertical).lineLimit(2...4)
                }
                Section {
                    Toggle("Due date", isOn: $hasDue)
                    if hasDue { DatePicker("Due", selection: $dueDate, displayedComponents: .date) }
                }
                if let error { Text(error).foregroundStyle(Theme.Color.danger) }
            }
            .navigationTitle("New Milestone")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.disabled(name.isEmpty || saving)
                }
            }
        }
    }

    private func save() {
        saving = true; error = nil
        let body = MilestoneBody(name: name,
                                 description: description.isEmpty ? nil : description,
                                 order: 0,
                                 dueDate: hasDue ? Format.iso(dueDate) : nil)
        Task {
            do {
                _ = try await APIClient.shared.createMilestone(projectId: projectId, phaseId: phaseId, body)
                await onSave(); dismiss()
            } catch { self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription }
            saving = false
        }
    }
}

// MARK: - Transaction form

struct TransactionFormView: View {
    @Environment(\.dismiss) private var dismiss
    let projectId: String
    let currency: String
    var phases: [Phase] = []
    var onSave: () async -> Void

    @State private var type: TransactionType = .income
    @State private var category: TransactionCategory = .client_payment
    @State private var description = ""
    @State private var amountText = ""
    @State private var date = Date()
    @State private var phaseId: String?
    @State private var notes = ""
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Type", selection: $type) {
                        ForEach(TransactionType.allCases) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: type) { _, newValue in
                        category = TransactionCategory.options(for: newValue).first ?? category
                    }
                    Picker("Category", selection: $category) {
                        ForEach(TransactionCategory.options(for: type)) { Text($0.label).tag($0) }
                    }
                }
                Section("Amount") {
                    TextField("Description", text: $description)
                    HStack {
                        Text(Format.currencySymbol(currency)).foregroundStyle(Theme.Color.secondaryLabel)
                        TextField("0.00", text: $amountText).keyboardType(.decimalPad)
                    }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }
                if !phases.isEmpty {
                    Section("Link") {
                        Picker("Phase", selection: $phaseId) {
                            Text("None").tag(String?.none)
                            ForEach(phases) { Text($0.name).tag(String?.some($0.id)) }
                        }
                    }
                }
                Section("Notes") {
                    TextField("Optional", text: $notes, axis: .vertical).lineLimit(2...4)
                }
                if let error { Text(error).foregroundStyle(Theme.Color.danger) }
            }
            .navigationTitle("New Transaction")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(description.isEmpty || Double(amountText) == nil || saving)
                }
            }
        }
    }

    private func save() {
        guard let amount = Double(amountText) else { return }
        saving = true; error = nil
        // v1: normalization is manual; assume project currency == workspace currency.
        let body = TransactionBody(
            type: type.rawValue,
            category: category.rawValue,
            description: description,
            amount: amount,
            currency: currency,
            normalizedAmount: amount,
            date: Format.iso(date),
            phaseId: phaseId,
            notes: notes.isEmpty ? nil : notes
        )
        Task {
            do {
                _ = try await APIClient.shared.createTransaction(projectId: projectId, body)
                await onSave(); dismiss()
            } catch { self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription }
            saving = false
        }
    }
}
