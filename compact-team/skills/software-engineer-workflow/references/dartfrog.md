# Dart Frog HTTP contracts

Use for Dart Frog routes, middleware, request/response behavior, and server lifecycle. Apply [Dart language contracts](dart.md) when relevant.

- Map `routes/`, `index.dart`, dynamic `[id].dart` routes, and `_middleware.dart`. Keep handlers focused on method/parameter validation and HTTP mapping; put substantial behavior in feature operations under the established `lib/` layout.
- Use provider middleware/dependency injection and `context.read<T>()` where the project does. Verify middleware wrapping order, authentication/authorization, CORS, and error mapping through assembled request tests.
- Use the installed `dart_frog` CLI for scaffolding, development, and builds when appropriate; confirm its supported commands. Test exact status, payload, headers, unsupported methods, malformed inputs, authorization failures, and shared state as affected.
- Preserve environment/secret injection and deployment entrypoints. Validate the actual server build/compilation mode rather than assuming a CLI command always produces a native executable.
- For production lifecycle changes, verify the existing health/readiness contract, startup/shutdown behavior, and deployment checks with [deployment](deployment.md). For measured CPU bottlenecks, profile first and use the supported isolate/worker approach when warranted; do not assume asynchronous I/O moves CPU work off the request path.

Use [toolchain validation](dart-validation.md) for checks and [deployment](deployment.md) when changing production lifecycle or environment.
