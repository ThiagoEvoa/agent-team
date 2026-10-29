# Dart and Flutter toolchain validation

Use when running analysis, formatting, tests, generation, or build checks for affected Dart packages.

Use the shared [diagnosis loop](diagnosis.md) with a focused Dart unit, Flutter widget/integration, Dart Frog handler, or asserted endpoint check. Confirm the symptom before editing; retain a regression check.

Format and analyze affected packages with the repository's MCP/SDK commands. Apply automated fixes only after reviewing their scope. Run `flutter test` for Flutter components and `dart test` for Dart/backend components; run relevant generation and builds when affected. Broaden to consumers/workspace for shared packages. Prefer installed project commands over nonexistent team helper scripts. Do not claim all packages were checked from a command that only covers one package.

After Dart/Flutter edits, hot reload/restart an available running application using supported tooling and verify the affected behavior. Use [Flutter runtime QA](flutter-runtime-qa.md) when interacting with an app or running a UI scenario: inspect current widgets before actions, reattach after disconnection, and record runtime errors and observed outcomes. If no runtime is available, report runtime verification as not performed. Never deploy a production service as a verification shortcut.
