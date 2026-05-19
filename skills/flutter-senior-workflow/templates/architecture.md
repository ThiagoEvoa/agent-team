# Flutter Architecture Standards (Official Alignment)

This document defines the mandatory architectural patterns, following the official Flutter "Plated Dinner" recommendation.

## 1. The Two-Layer Baseline (Expandable to Three)
Prefer a 2-layer approach (UI & Data) for most features. Add the **Domain** layer only when complexity warrants it.

### **UI Layer** (Presentation & UI Logic)
- **Widgets:** Visual elements only. No business logic.
- **ViewModels / State Holders:** (BLoC, Riverpod, or ChangeNotifier). 
  - Responsibility: Converting Data Layer events into UI State.
  - *Rule:* Can communicate directly with Repositories for simple operations.

### **Data Layer** (Data Source & Business Logic)
- **Repositories:** The single source of truth for the UI Layer. Handles caching, data merging, and error handling.
- **Data Sources:** Wrappers for external APIs (Dio) or Databases (Drift/Isar).
- **DTOs (Models):** Data transfer objects with `fromJson`/`toJson`.

### **Domain Layer** (Optional - Complex Business Logic)
- **Use Cases / Interactors:** Sits between UI and Data.
- *Mandatory when:* 
  - Logic is reused across multiple ViewModels.
  - Logic merges data from 3+ repositories.
  - Logic is highly complex and needs isolated unit testing.

## 2. Models & Data Flow
- **Immutability:** Use `freezed` or `equatable` for all State and Entities.
- **Unidirectional Data Flow:** Data flows UP (Data -> UI via Streams/Futures), Events flow DOWN (UI -> Data via method calls).
- **Model Separation:** Large apps MUST separate `RemoteModel` (API) from `DomainEntity` (App logic).

## 3. Dependency Injection (DI)
- Use `get_it`, `provider`, or `riverpod` for DI. 
- *Rule:* Always code against **Abstract Classes** (interfaces) for Repositories and Services to allow easy testing with Fakes.

## 4. Error Handling
- Use a functional approach (e.g., `Result<T, Exception>` or `Either`) or custom `Failure` classes.
- Never let raw API exceptions leak into the UI Widgets. Handle them in the Repository/ViewModel.
