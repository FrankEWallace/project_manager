import Foundation

enum APIError: LocalizedError, Equatable {
    case invalidURL
    case notAuthenticated
    case noWorkspace
    case http(status: Int, message: String?)
    case decoding(String)
    case transport(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL."
        case .notAuthenticated: return "You are not signed in."
        case .noWorkspace: return "No workspace selected."
        case let .http(status, message):
            return message ?? "Request failed (\(status))."
        case let .decoding(detail): return "Could not read the server response. \(detail)"
        case let .transport(detail): return detail
        }
    }

    var isUnauthorized: Bool {
        if case let .http(status, _) = self { return status == 401 }
        if case .notAuthenticated = self { return true }
        return false
    }
}
