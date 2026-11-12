# Android validation and runtime QA

Use when choosing/running Android checks, inspecting a device, or investigating Android runtime/performance behavior. Use the project's adopted commands and CI first; a successful Gradle sync or Compose preview alone does not verify application behavior.

## Discover tools and exact targets

Inspect the wrapper/toolchain and available SDK packages before building. Typical read-only discovery includes `./gradlew --version`, `./gradlew projects`, and `./gradlew :app:tasks --all`; replace `:app` with the actual module. Do not dump local properties, signing values, or environment secrets into evidence.

Discover exposed IDE/MCP capabilities before relying on them. The official [Android CLI](https://developer.android.com/cli) can assist with project/toolchain, IDE, and device workflows when installed and supported; inspect `android --help`, its installed version/help, and current [release notes](https://developer.android.com/tools/agents/android-cli/release-notes) before choosing commands. Do not confuse the modern CLI with the obsolete SDK `android` tool. Missing CLI/IDE integration is not a blocker for supported Gradle and [SDK tools](https://developer.android.com/tools). Do not install tools, register servers, or change global IDE settings as an incidental check.

For device operations, inspect `adb devices -l`, choose one authorized emulator/device, and use `adb -s SERIAL` on every device command. Establish package ID, variant, backend environment, API level, and task-owned test data before launch. Never choose an arbitrary attached phone. If no appropriate device is available, continue supported host checks and report the runtime gap.

## Check the affected contract

- Run the affected module/variant's unit tests, Android lint, and compilation/package build. Typical tasks are `:app:testDebugUnitTest`, `:app:lintDebug`, and `:app:assembleDebug`; discover actual flavor/build-type tasks rather than assuming these names. Run adopted formatting/static-analysis tasks when relevant; do not introduce a new linter merely to validate a fix.
- Use deterministic coroutine tests with controlled dispatchers/time for cancellation, retries, and state transitions. Choose JUnit/AndroidX versions supported by the repository and runner rather than imposing a new test engine. Validate Room migrations against real schema histories when changed.
- Use [Compose semantics testing](https://developer.android.com/develop/ui/compose/testing) for Compose UI, or adopted Espresso/UI Automator tests at the appropriate boundary. Prefer meaningful text/roles/state assertions over coordinates or sleeps. Run discovered connected or Gradle-managed-device instrumentation tasks when runtime behavior is affected; record the device/API and variant. Distinguish local JVM tests from tests that actually ran on Android.
- Exercise changed success and failure paths plus relevant recreation/restoration, permission denial, back/deep links, offline behavior, resizing, large text, and accessibility. Scope the matrix to the change and declared supported devices; do not claim minimum/latest OS coverage from one emulator.

When interacting manually or through a connector, inspect the current UI before actions and assert the resulting state. Capture relevant, redacted logcat/crash/ANR evidence for the app and time window. Do not wipe a device, clear user data, uninstall another app, or terminate unrelated sessions to simplify reproduction. A force-stop/relaunch checks a different scenario from OS process-death restoration; describe what was actually exercised.

For a performance task, reproduce the symptom and measure with the installed Android Studio profilers, Perfetto, or adopted Macrobenchmark/Baseline Profile tooling. Compare representative builds and devices; debug recomposition counts or preview smoothness alone are not performance evidence. Add profiling only when the task warrants it.

## Report accurately

Return exact tasks/tool operations, module/variant, tested device/API, observed assertions, failures, skipped checks, and report/artifact paths. Separate compile, unit, instrumentation, manual UI, and performance evidence. A release build involving R8/resources needs affected release-path validation; a debug build is not proof of release readiness. Keep signing credentials out of logs and follow existing authorization for signed artifacts, Play publication, or remote device services; none is required merely to prove a local fix.
