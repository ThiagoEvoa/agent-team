# Rust engineering

## Context and implementation

Inspect Cargo manifests, workspace members/default members, feature flags, edition/MSRV, toolchain pin, CI, and target configuration. Preserve the existing framework, error conventions, async runtime, dependency policy, and public contracts. Verify uncertain behavior against documentation for the actual version. Locate official local Rust/Cargo docs with `rustup doc --path` or `rustup doc --path --cargo`; use official online docs when necessary.

For a new multi-feature HTTP API, prefer a modular monolith organized by capabilities. A small feature may remain one module. Features own routes, business operations, models, and persistence; the application composes routers and dependencies at startup. Keep transport parsing/error mapping outside reusable business behavior. Expose only useful feature operations/router builders and keep internals private. Existing projects and tiny APIs retain their architecture unless migration is in scope.

Hide storage representation and locks behind methods. Introduce storage traits or separate crates only when alternate implementations, reuse, or test seams justify them. Avoid raw mutexes in public APIs, bypassing encapsulation through `Deref`, or service layers that merely forward calls. Keep normal initialization consistent between `new()` and `Default`.

Identify a public behavioral seam, write a meaningful failing check for changed behavior, then implement the smallest complete change. Preserve error context with typed `Result` conventions. Avoid fallible-input panics, unnecessary clones, hidden blocking, speculative generics, and unjustified `unsafe`. For unsafe/FFI changes, state and test aliasing, lifetime, initialization, thread-safety, and unwinding invariants at the boundary. Check external callers before changing visibility, trait bounds, errors, or types.

Read [HTTP framework/dependency decisions](rust-http.md) only when choosing/changing API dependencies. Read [async contracts](rust-async.md) for task ownership, cancellation, shared state, request lifecycle, or shutdown changes.

## Diagnosis and validation

Use the shared [diagnosis loop](diagnosis.md) with a focused Cargo test/CLI/router reproduction. Use controlled async coordination rather than arbitrary sleeps. Retain a regression check and rerun the original scenario.

Use repository commands first. Start with the affected package/test; broaden to consumers/workspace for shared contracts. Typical workspace checks are:

```text
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

Apply the project's lint policy instead of introducing unrelated cleanup. Read [validation decisions](rust-validation.md) for MSRV, features, targets, dependencies, docs, or unsafe changes. Cargo default members can omit crates; current-toolchain and all-features passes alone do not establish supported configuration coverage. Record actual toolchain, feature/target selection, command outcomes, and skipped checks.

## Review and delivery

Use the shared [review procedure](review.md) for separate Standards and Spec passes. Inspect ownership/borrowing, errors/panics, unsafe/FFI soundness, Send/Sync assumptions, cancellation/blocking, races, cleanup, feature gates, MSRV/public API compatibility, security, and test seams. Trace actual failure paths; unsafe code alone is not a defect, and compiler claims require diagnostics. A clear code path may establish a defect even without a runnable test; label the evidence.

Test assembled routers when middleware, shared state, limits, auth, or response mapping changes. For layout-only refactors preserve paths, status codes, bodies, and external APIs. Add [DevOps](devops.md) for shipped artifacts, pipelines, or deployment. Report changed behavior, ownership/API decisions, verification, and remaining compatibility/runtime risks.
