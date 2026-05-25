# Flutter Clean Architecture / MVVM Workspace Template & Guidelines

This document outlines the architectural patterns, directory structures, configurations, and boilerplate required to develop within this Dart Workspace. The workspace uses **Dart Workspaces** with Flutter, Riverpod, GoRouter, Retrofit, and Freezed.

---

## 1. Workspace Architecture & Packages

This repository is structured as a mono-repo using **Dart Workspaces** (defined in the root [pubspec.yaml](file:///Users/thiagoevoa/Projects/my_app_ref_workspaces/pubspec.yaml)). Workspace resolution allows all packages to share dependency resolutions and build runner pipelines.

### 1.1 Root Configuration
The root [pubspec.yaml](file:///Users/thiagoevoa/Projects/my_app_ref_workspaces/pubspec.yaml) defines the workspace members and common development dependencies:
- **`my_app_ref`**: The main Flutter application.
- **`packages/core`**: The shared core module.
- **`packages/todo_list`**: The reference feature package.

### 1.2 Main Flutter Application (`my_app_ref`)
Located at [my_app_ref/](file:///Users/thiagoevoa/Projects/my_app_ref_workspaces/my_app_ref), this is the main application shell and deployment target.
* **Responsibilities**:
  * Application entrypoint ([main.dart](file:///Users/thiagoevoa/Projects/my_app_ref_workspaces/my_app_ref/lib/main.dart)).
  * Initializes the `ProviderScope` for Riverpod state management.
  * Configures root application settings (App title, Global GoRouter configuration, App Themes, Localization Delegates).
  * Executes platform-specific initializations (e.g. `CustomHttpOverrides.enableLocalhostOverrides()`).

### 1.3 Core Shared Package (`packages/core`)
Located at [packages/core/](file:///Users/thiagoevoa/Projects/my_app_ref_workspaces/packages/core), this is the foundational package of the workspace.
* **Responsibilities**:
  * **Umbrella Export**: Re-exports all shared framework/library dependencies (like `flutter/material.dart`, `flutter_riverpod`, `go_router`, `dio`, `retrofit`, `freezed_annotation`, `riverpod_annotation`) through [packages/core/lib/core.dart](file:///Users/thiagoevoa/Projects/my_app_ref_workspaces/packages/core/lib/core.dart). Feature packages should import `package:core/core.dart` instead of declaring separate direct dependencies.
  * **API / Networking Layer**: Hosts the global `dioProvider` with standard timeouts, loggers, and header configurations.
  * **Themes**: Defines global app themes (`appThemeLight`, `appThemeDark`).
  * **Localization**: Handles application translation maps (`translationEn`, `LocalizationDelegate`, `Localization` helper class).
  * **Navigation**: Manages the root `GoRouter` instance ([packages/core/lib/navigation/router.dart](file:///Users/thiagoevoa/Projects/my_app_ref_workspaces/packages/core/lib/navigation/router.dart)), registering route configurations exposed by features.

### 1.4 Feature Packages (e.g., `packages/todo_list`)
Located inside `packages/`, these are isolated, feature-specific modules containing their own domain, data, and presentation layers.
* **Responsibilities**:
  * Follow clean architecture and MVVM pattern.
  * Adhere to the **Dependency Inversion Principle (DIP)** (i.e. ViewModels read repository providers; concrete API implementations implement repository interfaces).
  * Export their specific GoRouter route config so the `core` router can include it.

---

## 2. Feature Package Directory Structure

Every new feature package (e.g., `packages/new_feature`) must adhere to this folder structure:

```text
packages/new_feature/
├── pubspec.yaml
├── lib/
│   ├── new_feature.dart                       # Package entrypoint (exports public APIs)
│   └── src/
│       ├── data/
│       │   ├── datasources/
│       │   │   ├── new_feature_api.dart       # Retrofit rest client (implements repository)
│       │   │   └── new_feature_api.g.dart     # (Generated)
│       │   ├── models/
│       │   │   ├── new_feature_model.dart     # Freezed & JSON serializable data class
│       │   │   ├── new_feature_model.freezed.dart # (Generated)
│       │   │   └── new_feature_model.g.dart   # (Generated)
│       │   └── repositories/
│       │       └── new_feature_repository.dart # Abstract interface for data contract
│       ├── ui/
│       │   ├── view_models/
│       │   │   ├── new_feature_view_model.dart # Riverpod notifier (manages UI state)
│       │   │   └── new_feature_view_model.g.dart # (Generated)
│       │   ├── views/
│       │   │   └── new_feature_view.dart       # UI View (ConsumerStatefulWidget/ConsumerWidget)
│       │   └── widgets/
│       │       └── .gitkeep                   # Reusable components local to the feature
│       └── util/
│           └── router/
│               └── router.dart                # GoRoute configuration for this feature
```

---

## 3. Template Files

### 3.1 `pubspec.yaml`
Create `packages/new_feature/pubspec.yaml` with the workspace resolution and required code generation dependencies:

```yaml
name: new_feature
description: "A new Flutter feature package."
version: 0.0.1
publish_to: none

environment:
  sdk: ^3.12.0
  flutter: ">=1.17.0"

resolution: workspace

dependencies:
  flutter_riverpod: ^3.1.0
  freezed_annotation: ^3.1.0
  json_annotation: ^4.9.0
  retrofit: ^4.9.2
  riverpod_annotation: ^4.0.0

dev_dependencies:
  build_runner: ^2.15.0
  freezed: ^3.1.0
  json_serializable: ^6.9.5
  riverpod_generator: ^4.0.0
  retrofit_generator: 10.2.1
```

### 3.2 `lib/new_feature.dart`
The entrypoint exposes the GoRouter route so it can be integrated into the central router located in the `core` package:

```dart
library;

export './src/util/router/router.dart';
```

### 3.3 `lib/src/util/router/router.dart`
Declare the route path and builder matching the feature view:

```dart
import 'package:core/core.dart';
import '../../ui/views/new_feature_view.dart';

const newFeaturePath = '/new-feature';

final newFeatureRouter = GoRoute(
  path: newFeaturePath,
  builder: (context, state) => const NewFeatureView(),
);
```

### 3.4 `lib/src/data/models/new_feature_model.dart`
Data models should be immutable, generated using `@freezed`, and support JSON serialization:

```dart
import 'package:core/core.dart';

part 'new_feature_model.freezed.dart';
part 'new_feature_model.g.dart';

@freezed
abstract class NewFeatureModel with _$NewFeatureModel {
  const factory NewFeatureModel({
    required int id,
    required String name,
    required bool isActive,
  }) = _NewFeatureModel;

  factory NewFeatureModel.fromJson(Map<String, Object?> json) =>
      _$NewFeatureModelFromJson(json);

  factory NewFeatureModel.initialState() =>
      const NewFeatureModel(id: 0, name: '', isActive: false);
}
```

### 3.5 `lib/src/data/repositories/new_feature_repository.dart`
Define the repository interface class outlining the data contracts:

```dart
import '../models/new_feature_model.dart';

abstract interface class NewFeatureRepository {
  Future<List<NewFeatureModel>> getItems();
  Future<void> addItem({required NewFeatureModel item});
  Future<void> updateItem({required NewFeatureModel item});
  Future<void> removeItem({required int id});
}
```

### 3.6 `lib/src/data/datasources/new_feature_api.dart`
Implement the repository interface using `retrofit` client generator. Expose the client instance and its repository abstraction via Riverpod providers using `dioProvider` from the `core` package:

```dart
import 'package:core/core.dart';
import '../models/new_feature_model.dart';
import '../repositories/new_feature_repository.dart';

part 'new_feature_api.g.dart';

@riverpod
NewFeatureApi newFeature(Ref ref) => NewFeatureApi(ref.read(dioProvider));

@riverpod
NewFeatureRepository newFeatureRepository(Ref ref) => ref.read(newFeatureProvider);

@RestApi(baseUrl: '')
abstract class NewFeatureApi implements NewFeatureRepository {
  factory NewFeatureApi(Dio dio) = _NewFeatureApi;

  @override
  @GET('/items')
  Future<List<NewFeatureModel>> getItems();

  @override
  @POST('/items')
  Future<void> addItem({required NewFeatureModel item});

  @override
  @PUT('/items/{item}')
  Future<void> updateItem({required NewFeatureModel item});

  @override
  @DELETE('/items/{id}')
  Future<void> removeItem({required int id});
}
```

### 3.7 `lib/src/ui/view_models/new_feature_view_model.dart`
The ViewModel manages state and performs asynchronous operations. Adhere to the Dependency Inversion Principle (DIP) by reading the repository provider instead of the API provider. Use Riverpod's `AsyncValue` to handle loading, error, and data states:

```dart
import 'package:core/core.dart';
import '../../data/models/new_feature_model.dart';
import '../../data/repositories/new_feature_repository.dart';

part 'new_feature_view_model.g.dart';

@riverpod
class NewFeatureViewModel extends _$NewFeatureViewModel {
  @override
  AsyncValue<List<NewFeatureModel>> build() => const AsyncValue.data([]);

  Future<void> loadItems() async {
    try {
      final repository = ref.read(newFeatureRepositoryProvider);
      state = const AsyncValue.loading();
      final result = await repository.getItems();
      state = AsyncValue.data(result);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addItem({required NewFeatureModel item}) async {
    try {
      final repository = ref.read(newFeatureRepositoryProvider);
      await repository.addItem(item: item);
      final currentList = state.value ?? [];
      state = AsyncValue.data([...currentList, item]);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
```

### 3.8 `lib/src/ui/views/new_feature_view.dart`
Create the View page using `ConsumerStatefulWidget` or `ConsumerWidget`. Ensure all external dependencies and styles (such as `Localization.of(context)`) use the exports provided by the `core` package, and map errors to user-friendly localized strings:

```dart
import 'package:core/core.dart';
import '../view_models/new_feature_view_model.dart';

class NewFeatureView extends ConsumerStatefulWidget {
  const NewFeatureView({super.key});

  @override
  ConsumerState<NewFeatureView> createState() => _NewFeatureViewState();
}

class _NewFeatureViewState extends ConsumerState<NewFeatureView> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(newFeatureViewModelProvider.notifier).loadItems(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localization = Localization.of(context);
    final state = ref.watch(newFeatureViewModelProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(localization.title),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Text(localization.errorLoadingTodos),
        ),
        data: (items) => ListView.builder(
          itemCount: items.length,
          itemBuilder: (context, index) {
            final item = items[index];
            return ListTile(
              title: Text(item.name),
              trailing: Icon(
                item.isActive ? Icons.check_circle : Icons.circle_outlined,
              ),
            );
          },
        ),
      ),
    );
  }
}
```

---

## 4. Integration & Code Generation

### 4.1 Code Generation
After creating the new feature files, trigger the build runner from the root of the workspace:

```bash
dart run build_runner build --delete-conflicting-outputs --workspace
```

This will run the generators (`freezed`, `json_serializable`, `retrofit_generator`, `riverpod_generator`) for all packages in the workspace.

### 4.2 Add to GoRouter routes
In `packages/core/lib/navigation/router.dart`, import your route from the new feature and append it to the central route collection:

```dart
import 'package:todo_list/todo_list.dart';
import 'package:new_feature/new_feature.dart'; // Import package

import '../core.dart';

final GoRouter router = GoRouter(
  routes: [
    todoListRouter,
    newFeatureRouter, // Add route here
  ],
);
```
