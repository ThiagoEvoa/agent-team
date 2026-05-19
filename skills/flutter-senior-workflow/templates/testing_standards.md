# Flutter Testing Standards

Adhere to these standards to ensure 100% behavior coverage.

## 1. BDD Structure (Given-When-Then)
Every test MUST follow this visual structure:

```dart
test('should [expected outcome] when [scenario]', () async {
  // Given
  // - Arrange inputs, mocks, and initial state

  // When
  // - Act on the target method/widget

  // Then
  // - Assert expectations and verify mock interactions
});
```

## 2. Mocking & Fakes Guidelines
- **Prefer Real Implementations:** Use real classes and logic whenever possible to ensure tests reflect actual behavior.
- **External Boundaries Only:** Only use mocks or fakes for components that reside outside the application's boundaries (e.g., external APIs, databases, file system, third-party services).
- **Preferred Tool:** `mocktail` (when mocking is strictly necessary for external boundaries).
- **Behavior:** Focus on asserting the resulting state or output. Avoid over-using `verify` to keep tests focused on behavior outcomes.

## 3. Coverage Requirements
- **Edge Cases:** Test null inputs, empty lists, and error responses.
- **Logic:** Every branch of an `if` or `switch` must have a corresponding "Then".
- **Widgets:** Use `goldens` or `find.byType` to verify critical UI state transitions.
