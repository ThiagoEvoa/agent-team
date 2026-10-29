# Flutter application contracts

Use for Flutter UI/state implementation or framework-specific review. Apply [Dart language contracts](dart.md) when relevant.

- Preserve an existing workspace or traditional project layout. For a new application, prefer Dart Workspaces and `flutter_workspaces_cli` (`fws create`) unless the user chooses otherwise; inspect supported options before running it. Missing scaffolding tools do not authorize silent installation.
- Read [workspace guidance](flutter-workspace.md) only when creating a workspace or editing its package/generation/routing structure.
- When there is no suitable existing feature pattern, use the [Flutter example](flutter-example.md) for dependency assembly, view/state ownership, routing/generation notes, and behavioral checks.
- Keep views focused on rendering and interactions; put meaningful state transitions in ViewModels/controllers and data behavior behind repositories. Represent loading, success, and failure explicitly. Preserve the established state-management and navigation libraries.
- Test observable state, widget behavior, navigation, lifecycle/disposal, and async failures relevant to the change.

Use [toolchain validation](dart-validation.md) for analysis/tests and [runtime QA](flutter-runtime-qa.md) for actual device interactions. Add [Firebase](firebase.md) only when backend resources/contracts change.
