import Foundation
import SwiftUI

@MainActor
final class AuthManager: ObservableObject {

    enum State: Equatable {
        case loading
        case signedOut
        case needsWorkspace          // authenticated but no workspace membership
        case signedIn
    }

    @Published var state: State = .loading
    @Published var user: SessionUser?
    @Published var memberships: [WorkspaceMembership] = []
    @Published var currentWorkspace: Workspace?
    @Published var errorMessage: String?

    private let client = APIClient.shared

    struct AuthResponse: Decodable {
        let token: String?
        let user: SessionUser
    }
    struct SessionResponse: Decodable {
        let user: SessionUser?
    }

    // MARK: - Lifecycle

    func bootstrap() async {
        guard await client.hasToken() else { state = .signedOut; return }
        do {
            let data = try await client.rawRequest(
                "/api/auth/get-session", needsWorkspace: false)
            let session = try APIClient.makeDecoder().decode(SessionResponse.self, from: data)
            guard let user = session.user else { state = .signedOut; return }
            self.user = user
            try await loadWorkspaces()
        } catch {
            // Token invalid/expired — fall back to signed out.
            await client.setToken(nil)
            state = .signedOut
        }
    }

    // MARK: - Sign in / up

    func signIn(email: String, password: String) async {
        await authenticate(path: "/api/auth/sign-in/email",
                           body: SignInBody(email: email, password: password))
    }

    func signUp(name: String, email: String, password: String) async {
        await authenticate(path: "/api/auth/sign-up/email",
                           body: SignUpBody(name: name, email: email, password: password))
    }

    private func authenticate(path: String, body: Encodable) async {
        errorMessage = nil
        state = .loading
        do {
            let data = try await client.rawRequest(
                path, method: .post, body: body,
                needsWorkspace: false, requiresAuth: false)
            let response = try APIClient.makeDecoder().decode(AuthResponse.self, from: data)
            // rawRequest already captured the set-auth-token header; cover the
            // case where the token only arrives in the body.
            if await !client.hasToken(), let token = response.token {
                await client.setToken(token)
            }
            self.user = response.user
            try await loadWorkspaces()
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
            state = .signedOut
        }
    }

    // MARK: - Workspaces

    func loadWorkspaces() async throws {
        let memberships = try await client.fetchMemberships()
        self.memberships = memberships
        guard !memberships.isEmpty else { state = .needsWorkspace; return }

        let storedId = await client.currentWorkspaceId()
        let chosen = memberships.first { $0.workspaceId == storedId } ?? memberships[0]
        await client.setWorkspaceId(chosen.workspaceId)
        self.currentWorkspace = try? await client.fetchCurrentWorkspace()
        state = .signedIn
    }

    func switchWorkspace(_ membership: WorkspaceMembership) async {
        await client.setWorkspaceId(membership.workspaceId)
        currentWorkspace = try? await client.fetchCurrentWorkspace()
    }

    var currentRole: WorkspaceRole {
        let id = currentWorkspace?.id
        return memberships.first { $0.workspaceId == id }?.role ?? .member
    }

    // MARK: - Sign out

    func signOut() async {
        _ = try? await client.rawRequest("/api/auth/sign-out", method: .post, needsWorkspace: false)
        await client.setToken(nil)
        await client.setWorkspaceId(nil)
        user = nil
        memberships = []
        currentWorkspace = nil
        state = .signedOut
    }
}
