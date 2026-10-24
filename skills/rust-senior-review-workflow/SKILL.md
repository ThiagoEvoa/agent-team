---
name: rust-senior-review-workflow
description: Review Rust changes or crates against code quality and requirements in separate standards and spec passes. Use for Rust PR, diff, or full-project reviews; do not use as the implementation workflow.
---

# Rust Senior Review Workflow

## Pin the review target

Identify the requested PR, commit range, staged/unstaged diff, or project scope. Find the originating issue, acceptance criteria, and relevant ADRs. If no spec exists, say so and limit the Spec Axis accordingly. Review the actual changed behavior and caller impact; avoid inventing requirements or treating every style preference as a defect.

Record the exact base and head commit IDs for a PR or commit-range review. For local changes, record `HEAD`, whether the scope is staged, unstaged, or both, and the reviewed diff; preserve a snapshot if it may change during the review. For a full-project audit, identify the revision and any included local changes. If the target changes, re-check affected findings before handing off. Do not reset or overwrite the user's work to obtain a clean target.

For a large full-project architecture audit, activate `codebase-design` and `improve-codebase-architecture`; escalate systemic structural findings to the `senior-architect` when available. Keep an ordinary PR review focused on actionable findings.

## Two independent passes

**Standards Axis:** Check correctness and Rust-specific contracts: ownership and borrowing, error propagation, panics on external input, unsafe/FFI soundness, `Send`/`Sync` assumptions, async cancellation and blocking, concurrency races, resource cleanup, feature gates, MSRV/public API compatibility, security boundaries, tests, and meaningful architectural smells. Trace an actual failure path before calling something a bug. Use `cargo fmt --all -- --check`, `cargo check`, `cargo clippy`, and focused `cargo test` with the relevant workspace, target, and feature flags when practical. Do not report a compiler issue without its diagnostic.

Use [Validation decisions](../rust-senior-workflow/references/validation.md) for checks affected by MSRV, features, targets, public APIs, and dependencies. For async changes, use [Async runtime contracts](../rust-senior-workflow/references/async-runtime.md) to inspect task ownership, cancellation, resource bounds, and shutdown. These references guide investigation; they are not quotas for findings.

When a review requires consulting official Rust or Cargo documentation, locate the local copy with `rustup doc --path` (add `--cargo` for Cargo) and read the relevant files without opening a browser. If it is unavailable or a different version is needed, use the official online documentation. Check third-party crate behavior against documentation for the version under review.

**Spec Axis:** Check each acceptance criterion against the diff and tests. Note missing behavior, incorrect behavior, and concrete unrequested changes. Keep spec findings separate from style and maintainability findings.

Treat Fowler smells as prompts for judgment, not a quota. Report a structural smell only when it creates a demonstrated maintenance cost. For unsafe code, identify the violated invariant or the missing proof at a specific boundary; the presence of `unsafe` alone is not a finding.

## Finding quality and severity

Use the repository's severity scale when defined; otherwise use P0 for an immediate, unconditional critical failure, P1 for a serious defect in a supported/common path requiring prompt correction, P2 for a material defect with a narrower trigger, and P3 for a concrete low-impact issue. State the trigger, caller impact, evidence, and a proportionate correction. Keep optional preferences out of the defect list.

Keep unresolved hypotheses under open questions with the missing evidence and a way to resolve them. A confirmed defect may be established by a clear code path without a runnable test; label which evidence supports it. Do not report speculative compiler failures as confirmed defects. Separate change-induced failures from baseline failures and environment limitations, and call a failure pre-existing only after verifying it against the base. In a diff review, keep unrelated baseline defects out of the change's finding list; a full-project audit may include them within scope. Report a defect once and cross-reference it if it affects both axes.

## Review output

```markdown
## Target
- Exact base/head revisions, or HEAD and the local diff scope/snapshot; originating spec.

## Standards Axis
- [severity] `path:line` — observed defect or maintainability risk; evidence and specific fix.

## Spec Axis
- [severity] criterion and `path:line` — missing, incorrect, or unrequested behavior; evidence and specific fix.

## Validation
- Commands, toolchain, features/targets, and results; baseline failures, environment limits, and skipped checks.

## Open questions
- Unresolved hypotheses and the evidence needed; omit when empty.

## Status
- Readiness, unresolved risks, and next action; qualify conclusions when material checks were not run.
```

Order findings by severity within each axis. Use precise file locations and concise evidence. If an axis has no findings, say so. Do not modify code or post remote review comments unless the task asks for it.
