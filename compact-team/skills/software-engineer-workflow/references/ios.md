# Native iOS implementation

Use for iOS/iPadOS application or library implementation, platform integrations, and iOS-specific diagnosis/review. Swift with SwiftUI is the default for new native UI unless the user chooses otherwise. Preserve working UIKit, Objective-C, and existing architecture; use supported interoperability at affected seams instead of rewriting an app to adopt a new framework.

## Establish current tools and availability

Inspect the workspace/project or adopted project generator, app/extension targets, schemes, configurations, deployment targets, Swift language mode, concurrency settings, package resolution, capabilities, and CI. `Package.swift` alone does not establish an iOS application.

For new projects, dependency choices, migrations, or version-dependent APIs, consult live official [Xcode compatibility](https://developer.apple.com/support/xcode/), [release notes](https://developer.apple.com/documentation/xcode-release-notes), [Swift releases](https://www.swift.org/install/), and relevant Apple SDK documentation. Record the checked date, stable versions selected, and compatibility constraints. Choose the newest stable compatible toolchain for new work; preserve existing pins unless an upgrade is required or requested. Distinguish installed SDK, Swift compiler, language mode, and minimum OS: they are separate decisions. If live verification is unavailable, state that freshness is unverified and work from the supported repository baseline.

- Retain the product's deployment target; gate newer APIs with availability checks or supported fallbacks. A newer Xcode does not justify silently dropping older devices. Avoid beta-only APIs as defaults.
- Prefer Swift Package Manager for suitable new dependencies; preserve working CocoaPods, binary frameworks, or other adopted tooling. Keep the repository's resolution policy and verify deployment-target, privacy, license, and toolchain compatibility.
- Use the adopted project format/generator and preserve target membership, resources, configurations, and shared schemes. Do not overwrite an existing project, hand-edit generated output instead of its source, or introduce a generator merely for convenience.

## State, UI, and navigation

- Keep one explicit owner for view state and side effects. Use value types for data where suitable; introduce services, repositories, or observable presentation models when they clarify ownership and testing. SwiftUI does not require a ViewModel for every view.
- For supported deployment targets, prefer [Observation](https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro): `@Observable`, owned state with `@State`, and `@Bindable` when bindings are needed. Preserve `ObservableObject`/`@StateObject`/`@ObservedObject` where compatibility or the existing design calls for them. Do not recreate owned reference state on each render.
- Use value-driven `NavigationStack`/`NavigationSplitView` where available, with explicit route and sheet ownership. Validate incoming universal links and restoration state; check access at destinations. Keep effects out of `body`; tie view-bound async work to lifecycle, such as `.task(id:)`, and handle cancellation and stale responses.
- Follow the accepted design and current [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/). Respect system navigation, safe areas, keyboard, Dynamic Type, VoiceOver, localization/RTL, reduced motion, and iPad resizing. Adopt new system visual treatments through supported controls and availability checks rather than hard-coded replicas.

## Concurrency and data

- Use structured `async`/`await`, cancellation, and actors for appropriate shared state. Isolate UI state to `MainActor`; treat each suspension as a possible reentrancy point and recheck stale assumptions before applying a result.
- Inspect Swift language mode, default actor isolation, and upcoming-feature settings before reasoning about execution. `async`, `Task {}`, and `nonisolated` do not universally mean background execution. Check the selected compiler's [concurrency semantics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/) and [migration guidance](https://www.swift.org/migration/documentation/migrationguide/); use supported explicit concurrency mechanisms, including `@concurrent` where appropriate. Keep CPU-heavy/blocking work off the UI actor.
- Resolve isolation and `Sendable` errors at ownership boundaries; do not silence them with blanket `@unchecked Sendable`, `nonisolated(unsafe)`, disabled checking, or detached tasks. Avoid unrelated whole-app language-mode migrations for a small fix.
- Use `URLSession` async APIs where suitable, with validated responses, cancellation, and explicit offline/retry behavior. Preserve adopted networking layers. Store secrets using Keychain rather than `UserDefaults` or source; apply appropriate file protection and logging redaction.
- Evaluate [SwiftData](https://developer.apple.com/documentation/swiftdata) for suitable new persisted models on supported OS versions; retain Core Data/other storage when appropriate. Verify schema migrations against existing stores, actor/context ownership, save errors, and offline/conflict semantics. Do not replace a user's store with an empty database to hide migration failure.
- Match background execution to the system capability: background URL sessions, BackgroundTasks, notifications, and extensions have different lifetimes and constraints. Handle expiration/cancellation; an ordinary task is not a guarantee of execution while suspended. Inspect entitlements, usage descriptions, privacy manifests, and SDK required-reason APIs when affected.

For UIKit/SwiftUI or Objective-C interoperability, preserve ownership, lifecycle, delegate, nullability, and main-thread contracts. For Flutter bridges, verify the Dart/native schema, error/cancellation behavior, and both callers. Native support does not imply adopting a shared UI framework.

Load [iOS validation](ios-validation.md) when selecting/running checks or interacting with a simulator/device. In reviews, check actor isolation, task lifetime, state ownership, OS availability, persistence, accessibility, and affected capabilities alongside the shared review procedure.
