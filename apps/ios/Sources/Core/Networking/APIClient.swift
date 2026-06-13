import Foundation

/// Wraps the standard `{ "data": ... }` response envelope used by the Hono API.
struct Envelope<T: Decodable>: Decodable { let data: T }

enum HTTPMethod: String {
    case get = "GET", post = "POST", patch = "PATCH", delete = "DELETE"
}

struct QueryItem { let name: String; let value: String? }

actor APIClient {
    static let shared = APIClient()

    /// Base URL of the Hono API. localhost works from the iOS Simulator.
    /// Override via the `API_BASE_URL` env var or the in-app Settings screen.
    private var baseURL: URL

    private var token: String?
    private var workspaceId: String?

    private let session: URLSession

    init() {
        let stored = UserDefaults.standard.string(forKey: "api_base_url")
        let env = ProcessInfo.processInfo.environment["API_BASE_URL"]
        self.baseURL = URL(string: stored ?? env ?? "http://localhost:3001")!
        self.token = KeychainStore.get("bearer_token")
        self.workspaceId = UserDefaults.standard.string(forKey: "workspace_id")

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
    }

    // MARK: - Configuration

    func setBaseURL(_ string: String) {
        guard let url = URL(string: string) else { return }
        baseURL = url
        UserDefaults.standard.set(string, forKey: "api_base_url")
    }

    func currentBaseURL() -> String { baseURL.absoluteString }

    func setToken(_ value: String?) {
        token = value
        if let value { KeychainStore.set(value, for: "bearer_token") }
        else { KeychainStore.remove("bearer_token") }
    }

    func setWorkspaceId(_ value: String?) {
        workspaceId = value
        if let value { UserDefaults.standard.set(value, forKey: "workspace_id") }
        else { UserDefaults.standard.removeObject(forKey: "workspace_id") }
    }

    func currentWorkspaceId() -> String? { workspaceId }
    func hasToken() -> Bool { token != nil }

    // MARK: - Decoding

    static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let raw = try container.decode(String.self)
            if let date = DateParsing.parse(raw) { return date }
            throw DecodingError.dataCorruptedError(in: container,
                debugDescription: "Unrecognized date: \(raw)")
        }
        return decoder
    }

    // MARK: - Core request

    /// Sends a request and decodes the `data` field of the envelope.
    func request<T: Decodable>(
        _ path: String,
        method: HTTPMethod = .get,
        query: [QueryItem] = [],
        body: Encodable? = nil,
        needsWorkspace: Bool = true
    ) async throws -> T {
        let data = try await rawRequest(path, method: method, query: query,
                                        body: body, needsWorkspace: needsWorkspace)
        do {
            return try Self.makeDecoder().decode(Envelope<T>.self, from: data).data
        } catch {
            throw APIError.decoding(String(describing: error))
        }
    }

    /// Sends a request that returns no meaningful body (e.g. deletes).
    @discardableResult
    func requestVoid(
        _ path: String,
        method: HTTPMethod = .get,
        query: [QueryItem] = [],
        body: Encodable? = nil,
        needsWorkspace: Bool = true
    ) async throws -> Data {
        try await rawRequest(path, method: method, query: query,
                             body: body, needsWorkspace: needsWorkspace)
    }

    /// Lower-level request returning raw bytes plus capturing auth headers.
    @discardableResult
    func rawRequest(
        _ path: String,
        method: HTTPMethod = .get,
        query: [QueryItem] = [],
        body: Encodable? = nil,
        needsWorkspace: Bool = true,
        requiresAuth: Bool = true
    ) async throws -> Data {
        guard var components = URLComponents(
            url: baseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        ) else { throw APIError.invalidURL }

        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.name, value: $0.value) }
        }
        guard let url = components.url else { throw APIError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = method.rawValue
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if requiresAuth {
            guard let token else { throw APIError.notAuthenticated }
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if needsWorkspace {
            guard let workspaceId else { throw APIError.noWorkspace }
            req.setValue(workspaceId, forHTTPHeaderField: "X-Workspace-Id")
        }
        if let body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw APIError.transport(error.localizedDescription)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.transport("No HTTP response.")
        }

        // Capture bearer token issued by Better Auth's bearer plugin.
        if let issued = http.value(forHTTPHeaderField: "set-auth-token"), !issued.isEmpty {
            setToken(issued)
        }

        guard (200..<300).contains(http.statusCode) else {
            let message = Self.extractError(from: data)
            throw APIError.http(status: http.statusCode, message: message)
        }
        return data
    }

    private static func extractError(from data: Data) -> String? {
        struct ErrorBody: Decodable { let error: String? }
        return (try? JSONDecoder().decode(ErrorBody.self, from: data))?.error
    }
}

/// Type-erased Encodable so callers can pass any Encodable body.
struct AnyEncodable: Encodable {
    private let encodeFn: (Encoder) throws -> Void
    init(_ wrapped: Encodable) { self.encodeFn = wrapped.encode }
    func encode(to encoder: Encoder) throws { try encodeFn(encoder) }
}

enum DateParsing {
    private static let withFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let plain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()
    private static let dateOnly: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "UTC")
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    static func parse(_ raw: String) -> Date? {
        withFraction.date(from: raw)
            ?? plain.date(from: raw)
            ?? dateOnly.date(from: raw)
    }
}
