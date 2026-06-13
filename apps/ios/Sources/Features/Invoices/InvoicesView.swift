import SwiftUI

struct InvoicesView: View {
    @State private var state: Loadable<[Invoice]> = .idle

    var body: some View {
        Group {
            LoadableView(state: state, retry: { Task { await load() } }) { invoices in
                if invoices.isEmpty {
                    ScrollView {
                        EmptyStateView(icon: "doc.text",
                                       title: "No invoices",
                                       message: "Invoices created on the web app appear here.")
                    }
                } else {
                    List {
                        ForEach(invoices) { invoice in
                            NavigationLink {
                                InvoiceDetailView(invoiceId: invoice.id)
                            } label: {
                                InvoiceRow(invoice: invoice)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Invoices")
        .task { if case .idle = state { await load() } }
        .refreshable { await load() }
    }

    private func load() async {
        if case .idle = state { state = .loading }
        do { state = .loaded(try await APIClient.shared.fetchInvoices()) }
        catch { state = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription) }
    }
}

struct InvoiceRow: View {
    let invoice: Invoice
    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.xs) {
            HStack {
                Text(invoice.invoiceNumber).font(Theme.Font.headline)
                Spacer()
                Pill(text: invoice.status.label, color: invoice.status.color)
            }
            HStack {
                Text(invoice.actor?.name ?? "—")
                    .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                Spacer()
                Text(Format.currency(invoice.total.amount, code: invoice.currency))
                    .font(Theme.Font.callout)
            }
        }
        .padding(.vertical, Theme.Space.xs)
    }
}

struct InvoiceDetailView: View {
    let invoiceId: String
    @State private var state: Loadable<Invoice> = .idle
    @State private var showPayment = false

    var body: some View {
        ScrollView {
            LoadableView(state: state, retry: { Task { await load() } }) { invoice in
                VStack(spacing: Theme.Space.lg) {
                    summary(invoice)
                    if let items = invoice.items, !items.isEmpty { itemsCard(items, currency: invoice.currency) }
                    actions(invoice)
                }
                .padding(Theme.Space.lg)
            }
        }
        .background(Theme.Color.background)
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPayment) {
            if case let .loaded(inv) = state {
                PaymentFormView(invoiceId: inv.id, currency: inv.currency,
                                outstanding: inv.total.amount - inv.paidAmount.amount) { await load() }
            }
        }
        .task { if case .idle = state { await load() } }
    }

    private var title: String {
        if case let .loaded(inv) = state { return inv.invoiceNumber }
        return "Invoice"
    }

    private func summary(_ invoice: Invoice) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.sm) {
                HStack {
                    Text(invoice.invoiceNumber).font(Theme.Font.title)
                    Spacer()
                    Pill(text: invoice.status.label, color: invoice.status.color)
                }
                DetailRow(label: "Client", value: invoice.actor?.name ?? "—")
                DetailRow(label: "Issued", value: Format.date(invoice.issueDate))
                DetailRow(label: "Due", value: Format.date(invoice.dueDate))
                Divider()
                DetailRow(label: "Subtotal", value: Format.currency(invoice.subtotal.amount, code: invoice.currency))
                DetailRow(label: "Tax", value: Format.currency(invoice.taxAmount.amount, code: invoice.currency))
                DetailRow(label: "Total", value: Format.currency(invoice.total.amount, code: invoice.currency))
                DetailRow(label: "Paid", value: Format.currency(invoice.paidAmount.amount, code: invoice.currency),
                          valueColor: Theme.Color.success)
            }
        }
    }

    private func itemsCard(_ items: [InvoiceItem], currency: String) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                Text("Line Items").font(Theme.Font.headline)
                ForEach(items) { item in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.description).font(Theme.Font.body)
                            Text("\(Format.currency(item.quantity.amount, code: currency)) × \(Format.currency(item.rate.amount, code: currency))")
                                .font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
                        }
                        Spacer()
                        Text(Format.currency(item.amount.amount, code: currency)).font(Theme.Font.callout)
                    }
                }
            }
        }
    }

    private func actions(_ invoice: Invoice) -> some View {
        VStack(spacing: Theme.Space.md) {
            if invoice.status != .paid && invoice.status != .void {
                Button {
                    showPayment = true
                } label: {
                    Label("Record Payment", systemImage: "dollarsign.circle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.Color.accent)

                if invoice.status == .draft {
                    Button {
                        Task { _ = try? await APIClient.shared.sendInvoice(invoice.id); await load() }
                    } label: {
                        Label("Mark as Sent", systemImage: "paperplane")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }

                Button(role: .destructive) {
                    Task { _ = try? await APIClient.shared.voidInvoice(invoice.id); await load() }
                } label: {
                    Label("Void Invoice", systemImage: "xmark.circle").frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
    }

    private func load() async {
        if case .idle = state { state = .loading }
        do { state = .loaded(try await APIClient.shared.fetchInvoice(invoiceId)) }
        catch { state = .failed((error as? APIError)?.errorDescription ?? error.localizedDescription) }
    }
}

struct PaymentFormView: View {
    @Environment(\.dismiss) private var dismiss
    let invoiceId: String
    let currency: String
    let outstanding: Double
    var onSave: () async -> Void

    @State private var amountText = ""
    @State private var date = Date()
    @State private var notes = ""
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Text(Format.currencySymbol(currency)).foregroundStyle(Theme.Color.secondaryLabel)
                        TextField("0.00", text: $amountText).keyboardType(.decimalPad)
                    }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                    TextField("Notes", text: $notes)
                } footer: {
                    Text("Outstanding: \(Format.currency(outstanding, code: currency))")
                }
                if let error { Text(error).foregroundStyle(Theme.Color.danger) }
            }
            .navigationTitle("Record Payment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.disabled(Double(amountText) == nil || saving)
                }
            }
            .onAppear { if amountText.isEmpty { amountText = String(format: "%.2f", outstanding) } }
        }
    }

    private func save() {
        guard let amount = Double(amountText) else { return }
        saving = true; error = nil
        let body = PaymentBody(amount: amount, currency: currency, normalizedAmount: amount,
                               date: Format.iso(date), notes: notes.isEmpty ? nil : notes)
        Task {
            do {
                _ = try await APIClient.shared.recordPayment(invoiceId: invoiceId, body)
                await onSave(); dismiss()
            } catch { self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription }
            saving = false
        }
    }
}
