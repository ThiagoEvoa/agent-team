# Dart Frog Middleware Standard

## 🛡️ Core Responsibilities
- **Authentication:** Verify tokens, inject user profile.
- **Dependency Injection:** Provide repositories and services.
- **Logging:** Log requests/responses for observability.
- **Headers:** Add CORS, security headers, etc.

## 📝 Pattern
```dart
Handler middleware(Handler handler) {
  return handler
    .use(requestLogger())
    .use(provider<Repository>((context) => Repository()))
    .use(authMiddleware());
}
```

## ⚠️ Best Practices
- **Order:** Middleware wraps from bottom to top. `requestLogger` (top) is the outermost.
- **Context:** Use middleware to attach data to `context` for downstream handlers.
- **Thin Handlers:** Handlers should only extract data from `context` and call services.
