# Firebase behavior and rules validation

Use for Firebase diagnosis, emulator/client tests, and validation evidence. Establish [tool targets](firebase-targets.md) before resource operations.

Use the [diagnosis loop](diagnosis.md) with a minimal request, emulator rules check, captured event, or service test. Compare actual project/resource targets and client permissions first. Dart client bugs use Dart tools; other Functions runtimes use their own repository tooling.

Run formatting/lint/build/unit checks with existing tools. Rules syntax validation alone is insufficient: test allowed, denied, unauthenticated, cross-user/tenant, malformed, and privileged-role cases through client contexts. Admin/MCP operations may bypass rules. Exercise affected Functions/database behavior against emulators with verified routing and explicit project targets. Check locally unsupported integration behavior separately; emulator success proves neither deployment nor scale.

Use the shared [review procedure](review.md), checking service contracts above against actual acceptance criteria. Do not load Dart-specific review standards for non-Dart rules/Functions. Report unavailable tests and missing emulator dependencies; obtain any necessary installation/download authorization before adding tools.

Official references: [Rules tests](https://firebase.google.com/docs/rules/unit-tests), [Emulator Suite](https://firebase.google.com/docs/emulator-suite).
