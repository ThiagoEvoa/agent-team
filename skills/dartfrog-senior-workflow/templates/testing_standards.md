# Dart Frog Testing Standard

## 🧪 Unit Testing Handlers
- Use `mocktail` to mock `RequestContext` and `Request`.
- Verify response status, body, and headers.

```dart
test('returns 200 and data', () async {
  final context = MockRequestContext();
  final repository = MockRepository();
  when(() => context.read<Repository>()).thenReturn(repository);
  
  final response = await route.onRequest(context);
  expect(response.statusCode, equals(HttpStatus.ok));
});
```

## 🔗 Integration Testing
- Use `dart_frog test`.
- Verify full request-response lifecycle including middleware.

## 📊 Coverage
- Target 100% for `lib/` and middleware.
- Critical paths: Auth flows, Data persistence, Error handling.
