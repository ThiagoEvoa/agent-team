# Dart, Flutter, and Dart Frog engineering

## Select the component

Inspect each affected `pubspec.yaml`, SDK constraints, workspace resolution, entrypoints, source layout, generated-code setup, and CI. Classify packages independently: Flutter apps, plain Dart packages, and Dart Frog services can coexist. Preserve existing architecture and libraries; do not apply UI scaffolding to a plain Dart package.

Discover actual Dart MCP capabilities and schemas. Prefer available analysis, symbol/hover, formatting, dependency, test, and runtime tools for supported operations; native SDK commands are valid fallbacks. Verify CLI/version behavior before scaffolding or building.

## Design and implement

Use a public ViewModel, repository, feature operation, or handler seam with observable behavioral tests. Keep domain rules testable outside UI/HTTP, inject dependencies, and follow [design/domain guidance](design.md) for new boundaries. Implement the smallest complete behavior and inspect the final diff for compatibility, generated artifacts, and scope.

For plain Dart, follow repository conventions, package exports, error contracts, and native Dart tooling. Avoid Flutter/Dart Frog requirements unless that package actually uses the framework.

For Flutter:
- Preserve an existing workspace or traditional project layout. For a new application, prefer Dart Workspaces and `flutter_workspaces_cli` (`fws create`) unless the user chooses otherwise; inspect supported options before running it. Missing scaffolding tools do not authorize silent installation.
- Read [workspace guidance](flutter-workspace.md) only when creating a workspace or editing its package/generation/routing structure.
- Keep views focused on rendering and interactions; put meaningful state transitions in ViewModels/controllers and data behavior behind repositories. Represent loading, success, and failure explicitly. Preserve the established state-management and navigation libraries.
- Test observable state, widget behavior, navigation, lifecycle/disposal, and async failures relevant to the change.

For Dart Frog:
- Map `routes/`, `index.dart`, dynamic `[id].dart` routes, and `_middleware.dart`. Keep handlers focused on method/parameter validation and HTTP mapping; put substantial behavior in feature operations under the established `lib/` layout.
- Use provider middleware/dependency injection and `context.read<T>()` where the project does. Verify middleware wrapping order, authentication/authorization, CORS, and error mapping through assembled request tests.
- Use the installed `dart_frog` CLI for scaffolding, development, and builds when appropriate; confirm its supported commands. Test exact status, payload, headers, unsupported methods, malformed inputs, authorization failures, and shared state as affected.
- Preserve environment/secret injection and deployment entrypoints. Validate the actual server build/compilation mode rather than assuming a CLI command always produces a native executable.

## Diagnose and verify

Use the shared [diagnosis loop](diagnosis.md) with a focused Dart unit, Flutter widget/integration, Dart Frog handler, or asserted endpoint check. Confirm the symptom before editing; retain a regression check.

Format and analyze affected packages with the repository's MCP/SDK commands. Apply automated fixes only after reviewing their scope. Run `flutter test` for Flutter components and `dart test` for Dart/backend components; run relevant generation and builds when affected. Broaden to consumers/workspace for shared packages. Prefer installed project commands over nonexistent team helper scripts. Do not claim all packages were checked from a command that only covers one package.

After Dart/Flutter edits, hot reload/restart an available running application using supported tooling and verify the affected behavior. If no runtime is available, report runtime verification as not performed. Never deploy a production service as a verification shortcut.

## Review

Use the shared [review procedure](review.md). Check Effective Dart, sound null safety, justified null assertions, appropriate const/final/immutable state, collection idioms, async exception handling, stream/subscription disposal, and state updates after asynchronous boundaries. Follow actual project error conventions rather than introducing blanket null/exception rules.

Assess cohesion, substitution and dependency boundaries, intent-revealing names, unnecessary indirection, domain value validation, and tests through caller-visible seams. Treat Fowler smells as evidence prompts rather than numerical/style quotas. Check inputs, tenant/ownership boundaries, secret/log exposure, and trusted cryptographic APIs; never invent cryptography.

Add [Firebase](firebase.md) when changing rules/services or backend authorization contracts; a client SDK import alone does not require it. Add [DevOps](devops.md) for pipelines, containers, or deployment. Complete the review and handoff within this agent; publishing is governed by the user's authorized scope.
