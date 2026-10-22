---
name: rust-senior-review-workflow
description: Review Rust changes or crates against code quality and requirements in separate standards and spec passes. Use for Rust PR, diff, or full-project reviews; do not use as the implementation workflow.
---

# Rust Senior Review Workflow

## Pin the review target

Identify the requested PR, commit range, staged/unstaged diff, or project scope. Find the originating issue, acceptance criteria, and relevant ADRs. If no spec exists, say so and limit the Spec Axis accordingly. Review the actual changed behavior and caller impact; avoid inventing requirements or treating every style preference as a defect.

For a large full-project architecture audit, activate `codebase-design` and `improve-codebase-architecture`; escalate systemic structural findings to the `senior-architect` when available. Keep an ordinary PR review focused on actionable findings.

## Two independent passes

**Standards Axis:** Check correctness and Rust-specific contracts: ownership and borrowing, error propagation, panics on external input, unsafe/FFI soundness, `Send`/`Sync` assumptions, async cancellation and blocking, concurrency races, resource cleanup, feature gates, MSRV/public API compatibility, security boundaries, tests, and meaningful architectural smells. Trace an actual failure path before calling something a bug. Use `cargo fmt --all -- --check`, `cargo check`, `cargo clippy`, and focused `cargo test` with the relevant workspace, target, and feature flags when practical. Do not report a compiler issue without its diagnostic.

**Spec Axis:** Check each acceptance criterion against the diff and tests. Note missing behavior, incorrect behavior, and concrete unrequested changes. Keep spec findings separate from style and maintainability findings.

Treat Fowler smells as prompts for judgment, not a quota. Report a structural smell only when it creates a demonstrated maintenance cost. For unsafe code, identify the violated invariant or the missing proof at a specific boundary; the presence of `unsafe` alone is not a finding.

## Review output

```markdown
## Standards Axis
- [severity] `path:line` — observed defect or maintainability risk; evidence and specific fix.

## Spec Axis
- [severity] criterion and `path:line` — missing, incorrect, or unrequested behavior; evidence and specific fix.

## Validation
- Commands run and results; checks not run and why.

## Status
- Readiness, unresolved risks, and next action.
```

Order findings by severity within each axis. Use precise file locations and concise evidence. If an axis has no findings, say so. Do not modify code or post remote review comments unless the task asks for it.
