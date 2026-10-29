# Rust module and ownership contracts

Use for Rust ownership, crate/module boundaries, errors, unsafe/FFI invariants, and public APIs.

Inspect Cargo manifests, workspace members/default members, feature flags, edition/MSRV, toolchain pin, CI, and target configuration. Preserve the existing framework, error conventions, async runtime, dependency policy, and public contracts. Verify uncertain behavior against documentation for the actual version. Locate official local Rust/Cargo docs with `rustup doc --path` or `rustup doc --path --cargo`; use official online docs when necessary.

For a new multi-feature HTTP API, prefer a modular monolith organized by capabilities. A small feature may remain one module. Features own routes, business operations, models, and persistence; the application composes routers and dependencies at startup. Keep transport parsing/error mapping outside reusable business behavior. Expose only useful feature operations/router builders and keep internals private. Existing projects and tiny APIs retain their architecture unless migration is in scope.

Hide storage representation and locks behind methods. Introduce storage traits or separate crates only when alternate implementations, reuse, or test seams justify them. Avoid raw mutexes in public APIs, bypassing encapsulation through `Deref`, or service layers that merely forward calls. Keep normal initialization consistent between `new()` and `Default`.

Identify a public behavioral seam, write a meaningful failing check for changed behavior, then implement the smallest complete change. Preserve error context with typed `Result` conventions. Avoid fallible-input panics, unnecessary clones, hidden blocking, speculative generics, and unjustified `unsafe`. For unsafe/FFI changes, state and test aliasing, lifetime, initialization, thread-safety, and unwinding invariants at the boundary. Check external callers before changing visibility, trait bounds, errors, or types.

Read [HTTP framework selection](rust-http.md) or [API dependency selection](rust-dependencies.md) only when choosing/changing API dependencies. Read [async contracts](rust-async.md) for task ownership, cancellation, shared state, request lifecycle, or shutdown changes.

Test assembled routers when middleware, shared state, limits, auth, or response mapping changes. For layout-only refactors preserve paths, status codes, bodies, and external APIs.

Use [Rust validation](rust-validation.md) only when selecting/running checks and [Rust review contracts](rust-review.md) for review-specific investigation.
