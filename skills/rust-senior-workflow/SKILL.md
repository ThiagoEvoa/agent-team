---
name: rust-senior-workflow
description: Implement, debug, and refactor Rust crates and Cargo workspaces with ownership-aware design, focused tests, and toolchain-native validation. Use for Rust code changes, not independent code reviews.
---

# Rust Senior Engineering Workflow

## Establish context

Read the request or linked issue, `Cargo.toml`, `rust-toolchain.toml` if present, workspace members, feature definitions, repository instructions, `CONTEXT.md`, and relevant ADRs. Identify the package and feature/target combinations affected. Follow the existing edition, MSRV, error conventions, async runtime, and dependency policy; do not impose a new stack on an existing crate.

When an API or toolchain detail is uncertain, check the installed toolchain and official Rust/Cargo or crate documentation. In particular, confirm feature behavior before changing dependency declarations. Cargo features should normally remain additive; `--all-features` does not substitute for checking important `--no-default-features` or mutually constrained configurations. See the [Cargo features reference](https://doc.rust-lang.org/cargo/reference/features.html).

## Design and implement

1. Identify a caller-visible seam and expected behavior. For substantial boundary changes, activate `codebase-design` and compare viable interfaces before editing. Keep the public API smaller than the implementation and state ownership/error invariants clearly.
2. For behavior changes or bugs, create the smallest useful failing test or command that exercises the observed behavior. A regression test should fail before the fix and pass afterward. For uncertain bugs, reproduce and narrow the fault before changing production code.
3. Make the smallest complete change. Use `Result` and typed errors according to the crate's conventions; preserve error context at boundaries. Avoid unnecessary clones, broad `unwrap`/`expect` on fallible external input, hidden blocking in async code, and speculative generic abstractions.
4. Treat `unsafe` and FFI as explicit invariants: prefer safe APIs where practical; document and test assumptions about aliasing, lifetimes, initialization, thread safety, and unwinding at the actual boundary. Do not add `unsafe` merely to satisfy a performance guess.
5. Re-run the focused check while iterating, then inspect the diff for scope, public API compatibility, feature-gated code, and accidental secrets or generated artifacts.

## Validation

Use the repository's documented commands when they exist. Otherwise select commands appropriate to the affected package and target; do not claim a check passed if it was not run:

```text
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

Run relevant feature combinations and target-specific checks when the change touches them. `--workspace` matters because Cargo's default member selection may omit crates; `cargo test` includes documentation tests for selected libraries. See the [Cargo test reference](https://doc.rust-lang.org/cargo/commands/cargo-test.html). If a command fails because of environment or unavailable dependencies, report the exact limitation and keep the code reviewable. Use benchmarks or profiling only when performance is part of the request or a concrete regression risk.

## Handoff

Summarize changed behavior and files, important ownership/API decisions, validation commands and outcomes, and unresolved compatibility or runtime risks. Create a PR only when requested or already authorized by the task's workflow.
