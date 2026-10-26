# Go backend engineering

## Context and package design

Inspect affected `go.mod`/`go.sum`, `go.work` when present, toolchain requirements, CI, generators, entrypoints, routes, database tooling, `CONTEXT.md`, and ADRs. Preserve supported Go versions, framework, dependencies, exported APIs, and deployment constraints. Use `go version`, `go env GOWORK GOMOD`, local `go doc`/`go help`, and official dependency docs for the version in use. See the [module reference](https://go.dev/ref/mod).

For a new multi-feature backend prefer a modular monolith: feature-owned packages under `internal/`, startup/dependency assembly under an appropriate `cmd/` entrypoint, and central router composition. Tiny services and established projects retain their layout unless change is needed. This is a design option, not a scaffold mandate; see the [module layout guide](https://go.dev/doc/modules/layout). Package boundaries do not require separate modules.

Keep transport parsing/status mapping outside reusable business operations. Expose small feature interfaces, keep imports acyclic, and construct dependencies at startup. Prefer concrete types until a consumer needs substitution; define small interfaces near consumers. Avoid interface-per-struct scaffolds, hidden globals, utility dumping grounds, and layers that only forward calls. Check downstream callers before changing exported types or error contracts.

## HTTP and persistence

Preserve the existing framework; for a new service, `net/http` is a starting point when it meets requirements. Add dependencies for concrete needs and check routing APIs against the declared Go version. Compose middleware and feature routes centrally. Validate inputs and bound bodies, pagination, and costly work according to the API contract. Test authentication, resource/tenant authorization, middleware order, errors, and stable status/payload mapping through assembled handlers with `httptest`; use a test server for network/client behavior. See [net/http](https://pkg.go.dev/net/http).

Configure server header/read/write/idle limits for the deployment, allowing for streaming requirements. Propagate request contexts to downstream calls, reuse configured clients/transports, close response bodies, and bound retries by deadlines and idempotency. Coordinate serve errors, bounded `Shutdown`, worker termination, and process exit; manage hijacked connections separately and distinguish `http.ErrServerClosed` from failures.

Use the existing database driver/migration system, shared bounded pools, parameterized values, and controlled identifiers. Close rows and check iteration errors. Keep atomic operations on the transaction handle, roll back failure paths, and require a successful commit before success. Verify isolation, ownership, idempotency, and migration compatibility against the actual database in an isolated integration environment where mocks cannot establish them. External side effects need explicit coordination because database rollback cannot undo them. See the [transaction guide](https://go.dev/doc/database/execute-transactions).

## Errors and concurrency

Return recoverable errors, preserve identity with `%w` where callers need it, and classify with `errors.Is`/`errors.As`. Follow the established logging boundary and keep private details out of responses. Do not panic on external input.

Every goroutine needs an owner, bounded work, a termination path, and a completion wait. Keep request work tied to its context; application-owned background work needs an explicit lifetime and delivery contract. Propagate context explicitly to blocking operations and cancel owned derived contexts. Bound fan-out/queues, allow blocking channel operations to stop as appropriate, and assign channel-closing ownership. Define sibling cancellation and partial-result behavior on failure. See [context](https://pkg.go.dev/context).

Protect shared state consistently, hide locks behind methods, do not copy lock-containing values, and avoid slow I/O under locks. Use synchronization to establish visibility; channels/atomics do not automatically solve ownership. Stop admission, cancel/join owned work within a shutdown budget, then release shared resources. Use channels/barriers rather than arbitrary sleeps in concurrency tests.

## Diagnosis and validation

Use the shared [diagnosis loop](diagnosis.md) with an asserted Go unit/handler/integration test or endpoint request. Reproduce before changing production code, retain a behavioral regression check, and rerun the original scenario. Profile measured performance failures; report reproduction limits honestly.

Use repository commands first. During iteration run focused package tests; broaden to affected modules/consumers. A single-module baseline is:

```text
gofmt -l <changed-go-files>
go vet ./...
go test ./...
go build ./...
```

Replace placeholders with actual paths. Formatting passes when no files are listed; apply `gofmt -w` only to intended files. `./...` does not automatically cover nested/sibling modules: inspect `go.work` and check each affected module. Use `GOWORK=off` when a releasable module must work without workspace replacements. Record actual toolchain selection; verify minimum Go/CI versions for compatibility-sensitive changes. Check relevant build tags, target/cgo configuration, generation, and module/vendor changes without unrelated dependency upgrades. Cross-compilation does not verify runtime behavior.

Run `go test -race ./...` for concurrent changes on supported targets; a clean run covers executed paths only. Record unsupported platforms or missing C tooling. Run configured linters or `govulncheck` when available and relevant; report missing checks. See the [race detector guide](https://go.dev/doc/articles/race_detector) and [Go command docs](https://pkg.go.dev/cmd/go).

## Review and delivery

Use the shared [review procedure](review.md) for separate Standards and Spec passes against a pinned target. Check package/error contracts, cancellation, goroutine leaks, synchronization, HTTP limits/auth, database semantics, module/toolchain compatibility, and behavioral tests. Verify acceptance criteria for statuses/payloads, authorization, persistence effects, and compatibility; mark absent criteria unknown. Ground findings in exact locations and failure paths, verify compiler claims, and distinguish self-review from independent review.

Add [DevOps](devops.md) for artifacts, containers, CI, or deployment. Report changed behavior/files, important decisions, commands/configurations actually checked and results, plus unresolved gaps. Remote publication, comments, and deployment follow the task's authorized scope.
