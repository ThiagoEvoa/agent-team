---
name: go-senior-workflow
description: Implement, debug, refactor, and review Go backend services, HTTP APIs, modules, and workspaces using idiomatic package design and Go-native validation. Use for Go engineering work, not generic backend tasks in another language.
---

# Go Senior Backend Workflow

## Establish context

Read the request and acceptance criteria, repository instructions, affected `go.mod`/`go.sum`, `go.work`/`go.work.sum` when present, CI, generation/build commands, `CONTEXT.md`, and relevant ADRs. Identify affected modules, entrypoints, routes, persistence, and consumers. Preserve the declared Go/toolchain requirements, framework, dependency policy, public API, and deployment constraints unless changing them is in scope.

Use `go version`, `go env GOWORK GOMOD`, local `go doc <package>.<Symbol>`, and `go help <command>` as needed. Use official documentation matching the dependency/toolchain version for uncertain behavior. The [module reference](https://go.dev/ref/mod) explains module and workspace semantics; do not silently upgrade Go or broadly update dependencies to resolve an unrelated failure.

## Package and dependency boundaries

For a new backend growing into multiple features, default to a modular monolith organized by business capabilities. Preserve existing architecture and keep tiny services small. A possible layout is:

```text
cmd/api/main.go          # Configuration, dependency assembly, lifecycle
internal/server/        # Router composition and shared transport middleware
internal/documents/     # Document operations, handlers, persistence
internal/users/         # User operations and handlers
```

This is an example, not a required scaffold. Follow the [official module layout guide](https://go.dev/doc/modules/layout) when deciding command and internal package placement. Keep packages cohesive and imports acyclic; a package directory is not a new module. Separate modules only for real release or dependency boundaries.

Expose small feature operations and route registration functions. Keep parsing/status mapping in handlers and substantial business behavior callable without HTTP. Construct dependencies at startup rather than in hidden globals or `init` side effects. Prefer concrete types until a consumer needs substitution; define small interfaces near their consumer. Avoid interface-per-struct scaffolds, catch-all utility packages, and forwarding service layers without behavior. Check downstream callers before changing exported APIs or error contracts.

## Implement and diagnose

1. Choose a caller-visible seam and expected behavior. For consequential boundaries compare viable interfaces before editing; use the shared design/domain skills only when their deliverables are needed.
2. For a bug, establish an asserted failing test/request with the actual inputs and environment. Minimize the reproduction, rank plausible causes when uncertain, and probe one prediction at a time. Retain a behavioral regression check and rerun the original scenario. If reproduction is blocked, identify the evidence and limit instead of declaring a verified cause.
3. Make the smallest complete change. Return errors from recoverable failures; wrap with `%w` when callers should retain error identity and use `errors.Is`/`errors.As` for classification. Follow the existing logging/error boundary to avoid duplicate logs and leaking internals. Do not panic on invalid external input.
4. Use deterministic, isolated tests through public operations or assembled handlers. Table-driven tests help when cases differ only in inputs/outcomes; avoid mocking every internal call. For races and cancellation use synchronization rather than arbitrary sleeps. Use profiles/benchmarks when performance is the task or a concrete risk.
5. Inspect the final diff for contract changes, generated files, module churn, credentials, and unrelated edits.

Read [HTTP and persistence](references/http-and-persistence.md) when changing routes, middleware, database behavior, or API dependencies. Read [Concurrency and lifecycle](references/concurrency.md) for goroutines, shared state, cancellation, request lifecycle, or shutdown changes.

## Validation

Use repository commands and CI policy first. Run a focused package/test during iteration, then broaden to affected modules and consumers. A single-module baseline is:

```text
gofmt -l <changed-go-files>
go vet ./...
go test ./...
go build ./...
```

Replace placeholders with actual files/packages. `gofmt -l` lists files needing formatting; an empty list is the formatting check. Apply `gofmt -w` only to intended files. `go build` checks production packages; it does not replace tests.

- `./...` is relative to the working directory and does not automatically cover every module in a repository. Inspect `go.work` and run checks in each affected module; check with `GOWORK=off` when a releasable module must work independently of workspace replacements.
- Run `go test -race ./...` for affected concurrent behavior where the target/toolchain supports it. A pass covers executed paths, not all possible races; record unsupported platforms or missing C tooling. See the [race detector guide](https://go.dev/doc/articles/race_detector).
- Check the declared minimum Go version and CI's supported versions for language, standard-library, or dependency changes. Record the actual toolchain; automatic toolchain selection may otherwise hide a compatibility gap. For build tags, `GOOS`/`GOARCH`, or cgo changes, validate relevant supported configurations; cross-compilation is not target-runtime testing.
- For dependency changes, use the repository's module/vendor workflow; review intentional `go mod tidy` changes and avoid unrelated upgrades. Run configured linters and `govulncheck` when available and relevant, reporting missing tools. Consult [Go command documentation](https://pkg.go.dev/cmd/go) for flags supported by the installed version.
- For HTTP changes, exercise the composed router and middleware with `net/http/httptest`; use a test server when network/client behavior matters. Use an isolated real database/integration environment for SQL, transaction, or migration behavior that a mock cannot establish.

Record commands, module directories, toolchain/configuration, outcomes, and skipped checks. Distinguish introduced failures from reproduced baseline failures and environment limits.

## Review and handoff

For review-only work, pin the diff/revision and acceptance criteria before inspecting it; do not modify the target. Perform separate passes:

- **Standards:** package boundaries, error identity, context propagation, goroutine ownership/leaks, synchronization, HTTP limits/auth, database correctness, module/toolchain compatibility, and meaningful test coverage.
- **Spec:** observable routes/statuses/payloads, authorization/tenant isolation, invariants, transaction effects, compatibility, and each stated acceptance criterion. Mark missing criteria as unknown.

Report actionable findings with severity, exact file/line, trigger, consequence, and evidence. Verify compiler/tool claims with diagnostics when possible. State when no actionable findings are established and identify remaining verification gaps. Keep self-review distinct from an independent review; do not automatically delegate or fabricate approval.

For implementation, finish with behavior/files changed, important API/concurrency decisions, actual validation results, and unresolved risks. PRs, remote comments, module publication, and deployments follow the task's authorization; implementing a backend does not by itself authorize them.
