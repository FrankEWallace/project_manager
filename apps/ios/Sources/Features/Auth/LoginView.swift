import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthManager

    private enum Mode { case signIn, signUp }
    @State private var mode: Mode = .signIn
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var showServerSheet = false
    @FocusState private var focus: Field?
    private enum Field { case name, email, password }

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Space.xl) {
                header

                VStack(spacing: Theme.Space.md) {
                    if mode == .signUp {
                        labeledField("Name") {
                            TextField("Your name", text: $name)
                                .textContentType(.name)
                                .focused($focus, equals: .name)
                        }
                    }
                    labeledField("Email") {
                        TextField("you@example.com", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .focused($focus, equals: .email)
                    }
                    labeledField("Password") {
                        SecureField("••••••••", text: $password)
                            .textContentType(mode == .signUp ? .newPassword : .password)
                            .focused($focus, equals: .password)
                    }
                }

                if let error = auth.errorMessage {
                    Text(error)
                        .font(Theme.Font.callout)
                        .foregroundStyle(Theme.Color.danger)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button(action: submit) {
                    HStack {
                        if auth.state == .loading { ProgressView().tint(.white) }
                        Text(mode == .signIn ? "Sign In" : "Create Account")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .tint(Theme.Color.accent)
                .disabled(!isValid || auth.state == .loading)

                Button {
                    withAnimation { mode = (mode == .signIn ? .signUp : .signIn); auth.errorMessage = nil }
                } label: {
                    Text(mode == .signIn
                         ? "Don't have an account? Sign up"
                         : "Already have an account? Sign in")
                        .font(Theme.Font.callout)
                }
            }
            .padding(Theme.Space.lg)
        }
        .background(Theme.Color.background)
        .safeAreaInset(edge: .bottom) {
            Button {
                showServerSheet = true
            } label: {
                Label("Server settings", systemImage: "gearshape")
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Color.secondaryLabel)
            }
            .padding(.bottom, Theme.Space.sm)
        }
        .sheet(isPresented: $showServerSheet) { ServerSettingsView() }
    }

    private var header: some View {
        VStack(spacing: Theme.Space.sm) {
            Image(systemName: "square.stack.3d.up.fill")
                .font(.system(size: 48))
                .foregroundStyle(Theme.Color.accent)
            Text("Project Manager")
                .font(Theme.Font.largeTitle)
                .foregroundStyle(Theme.Color.label)
            Text("Your operational intelligence center")
                .font(Theme.Font.body)
                .foregroundStyle(Theme.Color.secondaryLabel)
        }
        .padding(.top, Theme.Space.xxxl)
    }

    private func labeledField<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Theme.Space.xs) {
            Text(label).font(Theme.Font.caption).foregroundStyle(Theme.Color.secondaryLabel)
            content()
                .padding(Theme.Space.md)
                .background(Theme.Color.surface)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm, style: .continuous))
        }
    }

    private var isValid: Bool {
        let base = email.contains("@") && password.count >= 8
        return mode == .signUp ? base && !name.isEmpty : base
    }

    private func submit() {
        focus = nil
        Task {
            switch mode {
            case .signIn: await auth.signIn(email: email, password: password)
            case .signUp: await auth.signUp(name: name, email: email, password: password)
            }
        }
    }
}

struct ServerSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var url = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("http://localhost:3001", text: $url)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                } header: {
                    Text("API base URL")
                } footer: {
                    Text("Point the app at your Hono API. Use your machine's LAN IP when running on a physical device.")
                }
            }
            .navigationTitle("Server")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await APIClient.shared.setBaseURL(url); dismiss() }
                    }
                    .disabled(url.isEmpty)
                }
            }
            .task { url = await APIClient.shared.currentBaseURL() }
        }
    }
}
