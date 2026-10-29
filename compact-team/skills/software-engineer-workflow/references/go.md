# Go package and error contracts

Use for Go package boundaries, module context, dependency assembly, and error semantics.

Inspect affected `go.mod`/`go.sum`, `go.work` when present, toolchain requirements, CI, generators, entrypoints, routes, database tooling, `CONTEXT.md`, and ADRs. Preserve supported Go versions, framework, dependencies, exported APIs, and deployment constraints. Use `go version`, `go env GOWORK GOMOD`, local `go doc`/`go help`, and official dependency docs for the version in use. See the [module reference](https://go.dev/ref/mod).

For a new multi-feature backend prefer a modular monolith: feature-owned packages under `internal/`, startup/dependency assembly under an appropriate `cmd/` entrypoint, and central router composition. Tiny services and established projects retain their layout unless change is needed. This is a design option, not a scaffold mandate; see the [module layout guide](https://go.dev/doc/modules/layout). Package boundaries do not require separate modules.

Keep transport parsing/status mapping outside reusable business operations. Expose small feature interfaces, keep imports acyclic, and construct dependencies at startup. Prefer concrete types until a consumer needs substitution; define small interfaces near consumers. Avoid interface-per-struct scaffolds, hidden globals, utility dumping grounds, and layers that only forward calls. Check downstream callers before changing exported types or error contracts.

Return recoverable errors, preserve identity with `%w` where callers need it, and classify with `errors.Is`/`errors.As`. Follow the established logging boundary and keep private details out of responses. Do not panic on external input.

Load [HTTP](go-http.md), [persistence](go-persistence.md), or [concurrency](go-concurrency.md) only when those contracts change. Use [Go validation](go-validation.md) for commands and [Go review contracts](go-review.md) during review.
