# Dart language and package contracts

Use for plain Dart and the shared language contracts of Flutter/Dart Frog. Platform-specific rules are independently loaded.

Inspect each affected `pubspec.yaml`, SDK constraints, workspace resolution, entrypoints, source layout, generated-code setup, and CI. Classify packages independently: Flutter apps, plain Dart packages, and Dart Frog services can coexist. Preserve existing architecture and libraries; do not apply UI scaffolding to a plain Dart package.

Discover actual Dart MCP capabilities and schemas. Prefer available analysis, symbol/hover, formatting, dependency, test, and runtime tools for supported operations; native SDK commands are valid fallbacks. Verify CLI/version behavior before scaffolding or building.

Use a public ViewModel, repository, feature operation, or handler seam with observable behavioral tests. Keep domain rules testable outside UI/HTTP, inject dependencies, and follow [module design](design.md) for new boundaries. Implement the smallest complete behavior and inspect the final diff for compatibility, generated artifacts, and scope.

For plain Dart, follow repository conventions, package exports, error contracts, and native Dart tooling. Avoid Flutter/Dart Frog requirements unless that package actually uses the framework.

Check Effective Dart, sound null safety, justified null assertions, appropriate const/final/immutable state, collection idioms, async exception handling, stream/subscription disposal, and state updates after asynchronous boundaries. Follow actual project error conventions rather than introducing blanket null/exception rules.

Assess cohesion, substitution and dependency boundaries, intent-revealing names, unnecessary indirection, domain value validation, and tests through caller-visible seams. Treat Fowler smells as evidence prompts rather than numerical/style quotas. For the affected boundary select [authorization](security-auth.md), [input validation](security-input.md), [data integrity](data-integrity.md), [sensitive-data handling](security-data.md), or [cryptography](cryptography.md).

For Dart, check the Fowler baseline: mysterious names, duplication, feature envy, data clumps, primitive obsession, repeated switches, shotgun surgery, divergent change, speculative generality, message chains, middle men, and refused bequest.

Load [toolchain validation](dart-validation.md) only when running checks. Add [Flutter](flutter.md) or [Dart Frog](dartfrog.md) only for those components.
