# Flutter Development Standards

## 1. Architecture & Layers
- **UI Layer (Presentation):** Widgets must contain only visual elements. Use ViewModels/State Holders (BLoC, Riverpod, ChangeNotifier) to convert Data Layer events to UI state. Can access Repositories directly.
- **Data Layer:** Repositories (single source of truth; handle caching, merging, error handling), Data Sources (API/DB wrappers), and DTOs/Models (with `fromJson`/`toJson`).
- **Domain Layer (Optional):** Use Cases/Interactors sitting between UI and Data. Use only when logic is reused across 2+ ViewModels, merges 3+ repositories, or requires isolated unit testing.
- **Models & Flow:** Use unidirectional flow (Data -> UI via Streams/Futures, Events -> Data via method calls). Enforce immutability via `freezed` or `equatable`. Keep `RemoteModel` distinct from `DomainEntity` in large apps.
- **Dependency Injection:** Code against abstract classes/interfaces for Repositories and Services. Resolve via `get_it`, `provider`, or `riverpod`.
- **Error Handling:** Use functional approaches (e.g. `Result<T, Exception>`) or custom `Failure` classes. Do not leak raw API exceptions to UI widgets.

## 2. Pubspec & Lints
- **Linting:** All packages must use `flutter_lints` or `very_good_analysis`. Enable `always_use_package_imports: true` in `analysis_options.yaml`.
- **Dependencies:** Prefer `dio`, `json_annotation`, `freezed_annotation` for data; `bloc`, `flutter_bloc`, `equatable` for logic; `mocktail`, `bloc_test` for testing.
- **Workspace:** Use `fws create` for new projects. Version pinning: use caret syntax (`^`), avoid `any`. Local deps must use `path:` references.

## 3. Testing Standards
- **BDD Structure:** Use visual `// Given`, `// When`, `// Then` blocks in tests:
  ```dart
  test('should [outcome] when [scenario]', () async {
    // Given (Arrange inputs, mocks, state)
    // When (Act on target method/widget)
    // Then (Assert expectations & mock interactions)
  });
  ```
- **Mocks & Fakes:** Prefer real implementations. Use mocks/fakes (prefer `mocktail`) only for external boundaries (APIs, databases, system). Avoid over-using `verify`.
- **Coverage:** Test edge cases (null inputs, empty lists, error responses). Every `if`/`switch` branch must have tests. Use goldens or `find.byType` for critical UI state transitions.
