# Project Manager — iOS App

Native SwiftUI client for the Project Manager operational platform. Talks to the
Hono API (`apps/api`) using the same Better Auth bearer tokens and the
`X-Workspace-Id` header the web app uses.

## Requirements

- Xcode 16+ (built/tested with Xcode 26)
- iOS 17.0+ deployment target
- [XcodeGen](https://github.com/yonyz/XcodeGen) — `brew install xcodegen`

## Generate & run

```bash
cd apps/ios
xcodegen generate          # creates ProjectManager.xcodeproj from project.yml
open ProjectManager.xcodeproj
# …or from the CLI:
xcodebuild -project ProjectManager.xcodeproj -scheme ProjectManager \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17' build
```

The `.xcodeproj` is generated and git-ignored — edit `project.yml`, not the
project file. Re-run `xcodegen generate` after adding files.

## Pointing at the API

Defaults to `http://localhost:3001` (works from the Simulator). Change it from the
login screen → **Server settings**, or **More → Settings**. On a physical device,
use your Mac's LAN IP (e.g. `http://192.168.1.20:3001`) and make sure the API's
`WEB_URL`/CORS allows it. The Simulator is permitted plaintext HTTP to localhost
via `NSAllowsLocalNetworking`.

Override at launch with the `API_BASE_URL` environment variable in the scheme.

## Architecture

```
Sources/
  App/            App entry, root state routing, tab bar
  Core/
    Networking/   APIClient (actor), typed APIService, request DTOs, errors
    Auth/         AuthManager (ObservableObject), Keychain token store
    Models/       Codable models + enums + Money (string/number-tolerant)
    Theme/        Design tokens (4px scale, indigo accent, no pure black)
    UI/           Reusable components (Card, Pill, KPITile, Loadable views)
    Utils/        Currency/date formatting
  Features/
    Auth/         Login / sign-up, server settings
    Dashboard/    Analytics dashboard (KPIs, trends, milestones, upcoming)
    Projects/     List, detail (phases/milestones/transactions/tasks), forms
    Finances/     Workspace transactions + income/expense chart (Swift Charts)
    Actors/       Contact directory (clients/collaborators/vendors/…)
    Categories/   Category management
    Invoices/     Invoice list, detail, record payment / send / void
    More/         Members, workspace switch, settings, sign out
```

### Notes

- **Auth**: `POST /api/auth/sign-in/email` returns a bearer token via the
  `set-auth-token` header (Better Auth bearer plugin); `APIClient` captures and
  stores it in the Keychain and sends `Authorization: Bearer …` thereafter.
- **Money**: Drizzle `numeric` columns serialize as JSON strings while computed
  analytics come back as numbers — `Money` decodes either.
- The API model named `actors` maps to the Swift type **`Contact`** to avoid
  colliding with Swift's built-in `Actor` protocol.
