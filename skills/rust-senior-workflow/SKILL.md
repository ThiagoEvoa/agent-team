---
name: rust-senior-workflow
description: Implement, debug, and refactor Rust crates and Cargo workspaces with ownership-aware design, focused tests, and toolchain-native validation. Use for Rust code changes, not independent code reviews.
---

# Rust Senior Engineering Workflow

## Establish context

Read the request or linked issue, `Cargo.toml`, `rust-toolchain.toml` or `rust-toolchain` if present, workspace members, feature definitions, repository instructions, `CONTEXT.md`, and relevant ADRs. Inspect CI and `.cargo/config.toml` for supported toolchains, targets, and custom commands. Identify the package and feature/target combinations affected. Follow the existing edition, MSRV, error conventions, async runtime, and dependency policy; do not impose a new stack on an existing crate.

When an API or toolchain detail is uncertain, check the installed toolchain and authoritative documentation. For official Rust or Cargo documentation, locate the active toolchain's local copy with `rustup doc --path` (or `rustup doc --path --cargo`) and read the relevant files without launching a browser. If `rustup` or the docs are unavailable, or a different version is needed, use the official online documentation. For third-party crates, consult documentation matching the dependency version. In particular, confirm feature behavior before changing dependency declarations. Cargo features should normally remain additive; `--all-features` does not substitute for checking important `--no-default-features` or mutually constrained configurations. See the [Cargo features reference](https://doc.rust-lang.org/cargo/reference/features.html).

## HTTP APIs

For an HTTP API, read the [Axum and Actix Web decision guide](references/http-api-stack.md) before choosing or changing the framework or adding dependencies. Preserve an existing framework unless the task calls for migration. For a new API, select the framework from the required middleware, HTTP features, team conventions, and maintenance needs; document the tradeoff. Use the guide's official crate documentation links to check current versions, feature flags, and integration compatibility. Add only dependencies used by the project, and do not treat framework benchmarks alone as a scalability decision.

## Architecture: modules by feature

For new HTTP APIs and APIs growing into multiple features, default to a modular monolith: one application whose modules are organized around capabilities such as documents, users, and authentication. Keep the current simple layout for a tiny single-feature API; preserve an existing project's architecture unless a migration is part of the task. These feature modules are separate from Cargo feature flags.

A possible layout as features grow:

```text
src/
  main.rs                # Configuration, dependency construction, server startup
  lib.rs                 # Small public application interface
  router.rs              # Assemble feature routers and application middleware
  state.rs               # Application dependencies shared with HTTP handlers
  features.rs            # Declare feature modules
  features/
    documents.rs         # Declare internals; expose the feature router or operations
    documents/
      routes.rs
      handlers.rs
      store.rs
    users.rs
    users/
      routes.rs
      handlers.rs
```

Treat this as an example, not a required scaffold. A small feature can live in one module. Add files for business operations, models, errors, or persistence only when the behavior justifies them. Non-HTTP crates can use the same feature boundaries with entry points appropriate to their callers.

- Each feature owns its routes, HTTP handlers, business behavior, and storage implementation. The application router composes feature routers. Keep HTTP parsing and response mapping in handlers; place substantial business rules in feature operations that can be used without HTTP.
- Expose a small feature interface, typically a router builder and any operations other features actually need. Keep handlers and implementation modules private, using `pub(super)` or `pub(crate)` only as needed. Cross-feature calls use the owning feature's interface; avoid reaching into its handlers or storage internals. Put shared concepts in shared modules only when they have clear ownership and real consumers.
- Construct dependencies at startup and pass them into application assembly. Let `AppState` hold feature-owned stores or services and genuinely shared resources such as pools or clients. Keep document-specific behavior in a `DocumentStore` rather than making application state itself the document store as more features arrive.
- Hide locks and storage representation behind methods. Avoid exposing a raw mutex or using `Deref` to bypass the store interface. For simple in-memory operations with low contention, a synchronous mutex is reasonable if no guard crosses `.await`; account for document cloning and other work performed under the lock. When `new()` and `Default` both mean normal initialization, make them produce the same initial state.
- Introduce storage traits when alternate implementations or a useful test seam justify them. Add service layers, separate crates, or ports and adapters when concrete complexity or reuse calls for those boundaries; do not create pass-through layers or a crate for every feature by default.
- Test through the public feature operations and assembled HTTP router. Supply isolated dependencies per test, verify shared state when it is part of the contract, and preserve route paths, status codes, and response bodies during a layout-only refactor. Check external callers before narrowing an existing public API.

## Design and implement

1. Identify a caller-visible seam and expected behavior. For substantial boundary changes, activate `codebase-design` and compare viable interfaces before editing. Keep the public API smaller than the implementation and state ownership/error invariants clearly.
2. For behavior changes or bugs, create the smallest useful failing test or command that exercises the observed behavior. A regression test should fail before the fix and pass afterward. For uncertain bugs, reproduce and narrow the fault before changing production code.
3. Make the smallest complete change. Use `Result` and typed errors according to the crate's conventions; preserve error context at boundaries. Avoid unnecessary clones, broad `unwrap`/`expect` on fallible external input, hidden blocking in async code, and speculative generic abstractions.
4. Treat `unsafe` and FFI as explicit invariants: prefer safe APIs where practical; document and test assumptions about aliasing, lifetimes, initialization, thread safety, and unwinding at the actual boundary. Do not add `unsafe` merely to satisfy a performance guess.
5. Re-run the focused check while iterating, then inspect the diff for scope, public API compatibility, feature-gated code, and accidental secrets or generated artifacts.

For async tasks, shared state, or request lifecycle changes, read [Async runtime contracts](references/async-runtime.md). Apply the checks to the code being changed; preserve the project's runtime and avoid adding infrastructure for hypothetical needs.

## Validation

Use the repository's documented commands when they exist. Read [Validation decisions](references/validation.md) to select checks for MSRV, Cargo features, deployment targets, documentation, and dependency changes. Start with the affected package and broaden to its consumers or workspace when shared contracts change. A typical workspace baseline is:

```text
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

`--workspace` matters because Cargo's default member selection may omit crates; `cargo test` includes documentation tests for selected libraries. See the [Cargo test reference](https://doc.rust-lang.org/cargo/commands/cargo-test.html). Record commands, toolchain, feature/target selection, outcomes, and skipped checks. If a command fails, distinguish a change-induced failure from a reproduced baseline failure or an environment limitation. Do not claim a check passed if it was not run. Use benchmarks or profiling only when performance is part of the request or a concrete regression risk.

## Handoff

Summarize changed behavior and files, important ownership/API decisions, validation commands and outcomes, and unresolved compatibility or runtime risks. Create a PR only when requested or already authorized by the task's workflow.
