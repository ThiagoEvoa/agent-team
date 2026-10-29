# Flutter workspace guidance

Read only for workspace/package structure, generation, or route integration. Preserve existing architecture and dependency choices. For a new application, inspect the installed `flutter_workspaces_cli` and SDK before choosing commands or package constraints; use `fws create` when compatible and available. Do not copy hardcoded SDK/package versions from unrelated examples.

When the project lacks a useful feature example, read the [portable Flutter feature example](flutter-example.md) for model/repository/ViewModel/view composition and outcome-based tests. Adapt it to the existing state-management and persistence contracts rather than treating it as a mandatory scaffold.

A typical workspace contains a root `pubspec.yaml` enumerating workspace members, an application shell, genuinely shared packages, and feature packages. Member packages use `resolution: workspace` when supported by the chosen Dart SDK. Resolve dependencies at the workspace root using its established tooling and lockfile policy. Declare package dependencies explicitly; do not rely on accidental transitive resolution.

The application shell owns startup, dependency assembly, theme/localization, and route composition. A feature package owns its behavior and exposes a compact public library. A possible shape is:

```text
app/
packages/
  core/                  # Only shared behavior with real consumers
  feature_name/
    lib/feature_name.dart
    lib/src/
      data/              # Models, repositories, external adapters as needed
      ui/                # Views, state/ViewModels, local widgets
      routing/           # Feature route definitions when useful
    test/
```

Treat the layout as an example, not a requirement to create empty layers. Domain operations can live in a domain directory when complexity justifies it. Keep cross-feature dependencies on public APIs and avoid cycles. Prefer the application shell as composition root; do not create a shared core that depends back on all feature packages.

When the selected stack uses Riverpod, construct/inject repository providers, let ViewModels own meaningful state transitions, and let views observe state and invoke actions. Model loading/error/data, disposal, cancellation, repeated actions, and navigation side effects deliberately. For Bloc or another existing approach, preserve equivalent boundaries.

Use GoRouter feature route exports when it is the chosen router; assemble them in the established composition root. Keep authorization/redirect behavior and deep links intact. Use Freezed/JSON generation, Retrofit, or other generators only when adopted or justified by actual requirements; verify generator/runtime compatibility. Prefer existing build scripts; run build_runner only for the packages/workspace supported by the installed version and configuration. Review generated diffs and never silently discard conflicting user files.

Test feature behavior at public seams, the shell's route/dependency integration, and affected generated serialization. Validate affected packages and consumers. Keep local network overrides and development-only credentials out of production initialization.
