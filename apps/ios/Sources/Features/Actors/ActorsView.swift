import SwiftUI

struct ActorsView: View {
    @State private var state: Loadable<[Contact]> = .idle
    @State private var search = ""
    @State private var showCreate = false
    @State private var editing: Contact?

    var body: some View {
        NavigationStack {
            Group {
                LoadableView(state: state, retry: { Task { await load() } }) { contacts in
                    let filtered = contacts.filter {
                        search.isEmpty || $0.name.localizedCaseInsensitiveContains(search)
                    }
                    if filtered.isEmpty {
                        ScrollView {
                            EmptyStateView(icon: "person.crop.circle.badge.plus",
                                           title: "No contacts",
                                           message: "Add clients, collaborators, vendors and advisors.",
                                           actionTitle: "Add Contact",
                                           action: { showCreate = true })
                        }
                    } else {
                        List {
                            ForEach(filtered) { actor in
                                Button { editing = actor } label: { ActorRow(actor: actor) }
                                    .buttonStyle(.plain)
                                    .swipeActions {
                                        Button(role: .destructive) {
                                            Task { await delete(actor) }
                                        } label: { Label("Delete", systemImage: "trash") }
                                    }
                            }
                        }
                    }
                }
            }
            .background(Theme.Color.background)
            .navigationTitle("Contacts")
            .searchable(text: $search, prompt: "Search contacts")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showCreate = true } label: { Image(systemName: "plus") }
                }
            }
            .sheet(isPresented: $showCreate) { ActorFormView { await load() } }
            .sheet(item: $editing) { actor in ActorFormView(existing: actor) { await load() } }
            .refreshable { await load() }
            .task { if case .idle = state { await load() } }
        }
    }

    private func load() async {
        if case .idle = state { state = .loading }
        do { state = .loaded(try await APIClient.shared.fetchActors()) }
        catch { state = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription) }
    }

    private func delete(_ actor: Contact) async {
        try? await APIClient.shared.deleteActor(actor.id)
        await load()
    }
}

struct ActorRow: View {
    let actor: Contact
    var body: some View {
        HStack(spacing: Theme.Space.md) {
            Image(systemName: actor.type.icon)
                .foregroundStyle(Theme.Color.accent)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(actor.name).font(Theme.Font.headline).foregroundStyle(Theme.Color.label)
                if let detail = actor.company ?? actor.email {
                    Text(detail).font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                }
            }
            Spacer()
            Pill(text: actor.type.label, color: Theme.Color.accent)
        }
        .padding(.vertical, Theme.Space.xs)
    }
}

struct ActorFormView: View {
    @Environment(\.dismiss) private var dismiss
    var existing: Contact?
    var onSave: () async -> Void

    @State private var name = ""
    @State private var type: ActorType = .client
    @State private var email = ""
    @State private var phone = ""
    @State private var company = ""
    @State private var notes = ""
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Contact") {
                    TextField("Name", text: $name)
                    Picker("Type", selection: $type) {
                        ForEach(ActorType.allCases) { Text($0.label).tag($0) }
                    }
                }
                Section("Details") {
                    TextField("Email", text: $email).keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    TextField("Phone", text: $phone).keyboardType(.phonePad)
                    TextField("Company", text: $company)
                }
                Section("Notes") {
                    TextField("Optional", text: $notes, axis: .vertical).lineLimit(2...4)
                }
                if let error { Text(error).foregroundStyle(Theme.Color.danger) }
            }
            .navigationTitle(existing == nil ? "New Contact" : "Edit Contact")
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
        guard let a = existing else { return }
        name = a.name; type = a.type
        email = a.email ?? ""; phone = a.phone ?? ""
        company = a.company ?? ""; notes = a.notes ?? ""
    }

    private func save() {
        saving = true; error = nil
        let body = ActorBody(name: name,
                             email: email.isEmpty ? nil : email,
                             phone: phone.isEmpty ? nil : phone,
                             type: type.rawValue,
                             company: company.isEmpty ? nil : company,
                             notes: notes.isEmpty ? nil : notes)
        Task {
            do {
                if let existing { _ = try await APIClient.shared.updateActor(existing.id, body) }
                else { _ = try await APIClient.shared.createActor(body) }
                await onSave(); dismiss()
            } catch { self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription }
            saving = false
        }
    }
}
