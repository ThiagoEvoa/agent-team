# Dart Frog Production Readiness

## 🐳 Dockerization
- Always use the generated `Dockerfile`.
- Ensure multi-stage builds for small images.
- Base image: `dart:stable`.

## ⚙️ Environment Configuration
- Inject config via `RequestContext` (preferred) or `Platform.environment`.
- Use `.env` files for local dev only; use secret managers for production.

## 🚀 Optimization
- **AOT:** Use `dart_frog build` for native performance.
- **Isolates:** Leverage Dart's concurrency for heavy CPU tasks if needed.
- **Health Checks:** Implement `/health` route for monitoring.
