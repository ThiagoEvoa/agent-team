# Go HTTP APIs and persistence

## Framework and contracts

Preserve the existing router and middleware. For a new API, start with `net/http` when it meets the requirements; add a router/framework only for concrete routing, middleware, integration, or team needs. Verify the API against the project's Go version and dependency docs before using newer routing features. Do not choose a framework from throughput claims alone. See [net/http](https://pkg.go.dev/net/http) and [httptest](https://pkg.go.dev/net/http/httptest).

Compose feature routes and shared middleware centrally. Validate path/query/body inputs and content types against the API contract. Bound request bodies, pagination, and expensive work; decide whether unknown JSON fields or trailing values are invalid without silently tightening an existing contract. Map domain errors to stable statuses/payloads and keep private diagnostics out of responses. Test middleware order, authentication, per-resource authorization, tenant boundaries, invalid inputs, and dependency failures through the assembled handler.

## Transport and lifecycle

Use explicit `http.Server` configuration at the application boundary. Choose header/read/write/idle limits from the deployment and workload; streaming and long-running handlers may need different deadlines. Propagate `r.Context()` into downstream HTTP/database calls. Reuse appropriately configured clients/transports, bound outbound calls, and close response bodies on every path. Avoid unlimited retries; retry only eligible failures within a deadline and an idempotency contract.

Coordinate server errors, signal handling, and bounded `Shutdown` with application lifecycle ownership. Distinguish expected `http.ErrServerClosed` from startup/serve failures. Wait for graceful shutdown before process exit; explicitly manage upgraded/hijacked connections and background workers because server shutdown alone does not stop them. Test cancellation, timeout, partial failure, and cleanup behavior where affected.

## Persistence

Preserve the project's driver, query/ORM tooling, and migration system. Share a bounded connection pool rather than opening it per request. Keep ownership and resource closure explicit; check iteration and commit errors. Use parameterized values and controlled identifiers, enforce resource ownership in reads/writes, and avoid exposing SQL or credentials to clients.

Use a transaction for business changes that must succeed together. Keep operations on its transaction handle, arrange rollback on failure, and return success only after commit succeeds. Consider isolation, conflict/retry behavior, uniqueness, and idempotency from the actual invariant. Do not combine irreversible external effects with database work as if rollback could undo both; use the project's established coordination pattern when needed. See the [official transaction guide](https://go.dev/doc/database/execute-transactions).

Test database-specific semantics against the appropriate engine in an isolated environment. For migrations assess compatibility with old/new application versions and existing data; prepare and validate local artifacts before any authorized environment change.
