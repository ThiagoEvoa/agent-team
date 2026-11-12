# iOS validation and runtime QA

Use when choosing/running iOS checks, interacting with a simulator/device, or investigating runtime/performance behavior. Prefer the repository's adopted scripts, schemes, test plans, and CI. A SwiftUI preview or a host-only Swift package test does not establish that the iOS app builds or behaves correctly.

## Discover tools and exact targets

On a supported macOS host, inspect `xcode-select -p`, `xcodebuild -version`, `xcodebuild -showsdks`, and `xcrun swift --version`. Command Line Tools alone may provide Swift without a usable iOS SDK/Simulator. Confirm the selected developer directory and repository pin; do not change the global selection or install Xcode/runtimes as an incidental check. A per-command `DEVELOPER_DIR` may select an already installed compatible Xcode.

Discover exposed Xcode MCP capabilities and schemas before using them. Apple's [external-agent integration](https://developer.apple.com/documentation/xcode/giving-external-agents-access-to-xcode) provides IDE build/test/project capabilities; use an already configured, authorized connection when available, checking its workspace and target. Consult installed-version documentation for bridge/server differences rather than assuming `mcpbridge` or a newer server mode exists. Do not enable servers, broaden directory access, or change Intelligence/security settings to bypass a missing tool. Fall back to supported command-line tools and report missing IDE-only evidence.

Resolve the actual `.xcworkspace` or `.xcodeproj` and pass the matching `-workspace` or `-project` option consistently to `xcodebuild`. Discover schemes with `-list -json`, then inspect `-showdestinations` for the selected scheme. Use `xcrun simctl list devices available` to identify an appropriate simulator; select its UDID explicitly rather than an ambiguous device name or `booted` when multiple sessions exist. Confirm bundle ID, configuration, backend, and test data. Hardware operations use available supported tooling and the exact authorized device; do not assume a simulator covers capabilities that require hardware.

## Check the affected contract

- Build the actual app/extension targets with the resolved scheme, configuration, SDK, and destination. Run `xcodebuild test` for the affected scheme/test plan and destination, following the repository's flags. Keep task output in an isolated DerivedData directory and use a fresh `-resultBundlePath` for each run. Preserve exit status when piping output; save relevant `.xcresult` artifacts and use the installed `xcresulttool` help/schema to inspect failures.
- Prefer [Swift Testing](https://developer.apple.com/documentation/xcode/adding-tests-to-your-xcode-project) for suitable new unit/integration tests supported by the toolchain; retain existing XCTest coverage. Use XCTest/XCUIAutomation for UI workflows and supported performance measurement. Both frameworks can coexist, but do not mix their assertion/expectation APIs within one test. Run `swift test` for relevant packages when appropriate and separately build/test their iOS consumers.
- Test caller-visible state, async failure/cancellation, stale results, actor boundaries, and persistence/migrations when changed. Control time, network responses, and task completion rather than relying on arbitrary sleeps. Account for parallel Swift Testing execution; isolate mutable test state or serialize only when shared resources require it.
- Run the repository's adopted formatting, lint, and strict-concurrency checks where applicable; a new formatter or global language-mode change is not a validation prerequisite. Preserve meaningful compiler warnings and test assertions rather than suppressing them to obtain a green build.
- Exercise the affected simulator/device path: navigation and sheets, background/foreground or relaunch, denied permissions, deep links, offline/error states, Dynamic Type/VoiceOver, and iPad resizing as relevant. Use current UI inspection, semantic queries/accessibility identifiers, and bounded assertions. Previews help inspect layout; record preview, simulator, and hardware results separately.

Install/launch only the task's built app on the selected test destination using supported IDE tools or explicit `simctl` UDID commands. Inspect current UI before interactions, collect relevant redacted crash/runtime logs, and clean up only resources created for this task. Do not erase a shared simulator, reset user permissions/data, or stop unrelated sessions to hide a failure. State any scenario that could not be reproduced, including hardware-only behavior such as push, sensors, or background conditions.

For performance investigations, use Instruments, signposts, memory tools, or adopted XCTest metrics with representative builds and devices. Reproduce and compare the actual symptom; a preview or simulator timing alone is not evidence of hardware performance.

## Signing and evidence

Use simulator builds for checks that do not need signing. Device/archive validation must respect the existing bundle identifiers, team, entitlements, provisioning, and keychain. Do not enable automatic account/provisioning updates or change signing settings solely to get a build through. Follow existing authorization for archive/export/upload, TestFlight/App Store publication, or remote services.

Return the selected Xcode/Swift/SDK, workspace/project, scheme/configuration, destination/OS, exact commands/tool operations and results, `.xcresult`/log paths, observed UI assertions, and unavailable checks. A missing macOS/Xcode host, SDK, scheme, runtime, or signing resource is an explicit evidence gap; continue independent supported checks without claiming app or device validation passed.
