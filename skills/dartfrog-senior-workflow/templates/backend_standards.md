# Dart Frog Backend Standards

## 1. Project Structure & Architecture
- **Structure:** `routes/` (dynamic params `[id].dart`, index files `index.dart`, global middleware `_middleware.dart`). `lib/src/` for shared models, services, repositories. `test/` for testing.
- **Routing:** Check `context.request.method` to handle HTTP methods. Keep handlers thin; delegate to services.
- **DI:** Use `provider` middleware to inject dependencies. Retrieve using `context.read<T>()`.
- **CLI:** Scaffold with `dart_frog new route "/path"`, dev with `dart_frog dev`, build with `dart_frog build`.

## 2. Middleware
- **Responsibilities:** Auth (verify token, inject user), DI (provide services), Logging, CORS/Security headers.
- **Order:** Middleware wraps bottom-to-top. Outermost middleware runs first.

## 3. Testing
- **Unit Tests:** Use `mocktail` to mock `RequestContext` and verify responses (status, body, headers).
- **Integration:** Run `dart_frog test` to verify the request-response lifecycle.
- **Coverage:** Target 100% for `lib/` and critical paths (auth, database, error handling).

## 4. Production Readiness
- **Docker:** Use generated multi-stage Dockerfile with `dart:stable` base image.
- **Config:** Inject environment configs via `Platform.environment` or context providers. Use secret managers for production.
- **AOT & Concurrency:** Compile with `dart_frog build` for native performance. Use Isolates for heavy CPU workloads.
- **Monitoring:** Implement a `/health` endpoint.
