---
name: software-engineer-workflow
description: Stack-aware engineering workflow for native Android (Kotlin/Jetpack Compose), native iOS (Swift/SwiftUI), Go, Rust, Dart, Flutter, Dart Frog, Astro, Next.js, and Firebase. Use with the compact software-engineer agent for design, implementation, diagnosis, review, and delivery; load only the relevant stack and task guidance.
---

# Software Engineer Workflow

Use one agent with selectively loaded references. All engineering guidance is bundled here; there are no dependencies on another agents/skills tree or repository helper scripts. Dart language contracts are shared; Flutter and Dart Frog rules load independently for their affected components. Firebase and DevOps are composable capabilities rather than mutually exclusive application stacks. Keep shared rules here or in one task reference; keep runtime-specific rules in the relevant stack profile.

## Establish scope and stack

Read repository instructions, the request/acceptance criteria, relevant `CONTEXT.md`/ADRs, and the affected manifests, source, tests, and CI. Determine whether the task is implementation, diagnosis, review, architecture analysis, or operations; a task may move through several phases.

When delegated, honor the task packet's delivery role, targets, authorization, and review round. Implementation, review, and correction are separate assignments; perform only the assigned work and return its evidence to the coordinator. The coordinator owns independent review dispatch and round counts. Use the [delivery/correction guidance](references/delivery.md) for these boundaries; do not spawn subagents or turn a review-only assignment into fixes.

Before the first implementation edit, follow the branch setup below. This also applies when diagnosis or review transitions into an authorized new implementation.

Honor an explicit stack choice for new work. For existing code, inspect the affected component before choosing its workflow. If the chosen stack conflicts with the implementation, establish whether migration is intended before replacing it. A mention of a technology alone is not a stack choice.

| Evidence in the affected component | Core contract reference |
|---|---|
| `go.mod`, `go.work`, Go sources | [Go packages/errors](references/go.md); add HTTP, persistence, or concurrency guidance only when affected |
| `Cargo.toml`, Rust crate/workspace sources | [Rust ownership/modules](references/rust.md); add HTTP or async guidance only when affected |
| Plain Dart package | [Dart language/packages](references/dart.md) |
| Android Gradle plugin, Android manifest, Kotlin/Java Android sources, Compose or Views | [Native Android contracts](references/android.md) |
| iOS Xcode app target, Swift/Objective-C iOS sources, SwiftUI or UIKit | [Native iOS contracts](references/ios.md) |
| Flutter SDK dependency or Flutter application | [Flutter application contracts](references/flutter.md), plus relevant shared Dart contracts |
| Dart Frog dependency/routes | [Dart Frog HTTP contracts](references/dartfrog.md), plus relevant shared Dart contracts |
| New web project without an agreed framework | [Web framework selection](references/web-stack-selection.md) |
| Astro dependencies/routes/pages | [Astro contracts](references/astro.md), plus relevant shared web contracts |
| Next.js dependencies/routes | [Next.js contracts](references/nextjs.md), plus relevant shared web contracts |
| Firebase rules, indexes, Functions, or service configuration | [Firebase service contracts](references/firebase.md) |
| Dockerfiles or runtime image changes | [Container construction](references/docker.md) |
| Kubernetes manifests | [Kubernetes configuration](references/kubernetes.md) |
| CI workflows or build/test automation | [CI pipeline design](references/ci-cd.md) |
| Environment rollout, workflow dispatch, health verification, or recovery | [Deployment execution](references/deployment.md) |

Route per component in a monorepo; load additional profiles only when the task crosses their boundary. Flutter UI consuming Firebase SDKs starts with Flutter; a web client starts with its actual framework; changing Firebase resources adds the affected Firebase responsibility. A Go or Rust pipeline combines its affected runtime contracts with CI guidance; add container or deployment guidance only for those operations. A `package.json` alone does not establish a web stack: inspect framework dependencies and entrypoints rather than routing Firebase Functions or generic Node tools to Web. Trace contracts across affected components and verify both sides of changed integrations. For an unsupported stack, follow its repository tooling and authoritative documentation; do not force a supported framework onto it.

Native mobile requests use the Android or iOS profile directly. Flutter's generated `android/` and `ios/` folders do not make a Dart-only UI task native work; add a native profile when changing that platform's code, build, permissions, or integration. A Gradle file alone may be a JVM tool, and `Package.swift` alone may be a non-iOS library: establish the affected target first. Native support does not imply migration to Flutter, Kotlin Multiplatform, Compose Multiplatform, or another shared UI stack.

## Start each new implementation on a new branch

Every distinct new implementation must start on a newly created branch from the project's base branch. Creating this local branch is part of starting implementation and needs no separate confirmation.

1. **Resolve the base:** Use the base branch specified by the user or repository instructions; otherwise use the repository's configured remote default branch. Do not assume the current branch is the base. If the base cannot be determined, ask before implementation edits.
2. **Preserve existing work:** Inspect the working tree and branch state before switching. Do not carry unrelated changes into the new implementation, discard work, or automatically stash/reset it. Use a separate worktree when needed to preserve existing work; if safe isolation is unavailable, ask how to proceed.
3. **Create and switch:** Create a descriptively named branch directly from the resolved base, never from an unrelated feature branch. Follow repository naming conventions; otherwise use `codex/<implementation-name>`. Refresh the remote base ref when available; disclose any inability to refresh before relying on a local ref. Verify the active branch and starting revision before editing. If branch creation fails, resolve it or report the blocker before implementing.
4. **Continue the same implementation:** Keep follow-up edits, verification, and review corrections on that implementation's branch. A new chat, delegated worker, or correction round alone does not start a new implementation. Review-only, research, and diagnosis-only tasks do not create branches.

Include the implementation branch and base in the final handoff. This local setup does not authorize commits, pushes, PR publication, merges, or deployment.

## Load bundled guidance on demand

Read linked files relative to their containing document. Use the target project's own commands and native tooling; this workflow requires no team-specific helper scripts or other installed skills. Consult current official documentation for uncertain framework/tool behavior and the versions in use. If a bundled file is missing, report the incomplete bundle before dependent work rather than loading an unrelated installed skill.

Each reference owns one independently requested responsibility. Select the affected stack contract, then only the operation references needed now. A link is conditional guidance, not an instruction to load every dependency recursively. Reuse references already read in this context; do not preload a stack's implementation, validation, review, and deployment guidance together. Examples remain cohesive artifacts rather than being split into disconnected snippets.

Add operation references at their actual decision points:

| Decision or deliverable | Load only the applicable guidance |
|---|---|
| Module/API boundary, interface alternatives, mutable-state ownership, or structural refactoring | [Module design](references/design.md) |
| Clarify business terms or update `CONTEXT.md` | [Domain language](references/domain-language.md) |
| Record a lasting architecture trade-off | [ADR recording](references/architecture-decisions.md) |
| Write/change tests or choose test doubles | [Behavioral testing](references/testing.md) |
| Run language/framework checks | Affected stack only: [Android](references/android-validation.md), [iOS](references/ios-validation.md), [Go](references/go-validation.md), [Rust](references/rust-validation.md), [Dart/Flutter](references/dart-validation.md), [Web](references/web-validation.md), or [Firebase](references/firebase-validation.md) |
| Native mobile device interaction, runtime QA, or profiling | Affected platform's [Android](references/android-validation.md) or [iOS](references/ios-validation.md) validation guidance |
| Flutter device interaction or runtime QA | [Flutter runtime QA](references/flutter-runtime-qa.md) |
| Change/run adopted Dart generators | [Dart code generation](references/dart-code-generation.md) |
| Identity, session trust, ownership, or tenant/role access | [Authorization contracts](references/security-auth.md) |
| Untrusted input, parsing/schema/domain-value validation, or injection prevention | [Input validation](references/security-input.md) |
| Atomic state updates, idempotency, rollback, or partial effects | [Transactional integrity](references/data-integrity.md) |
| Secrets, private data/errors, or secure storage/transport | [Sensitive-data handling](references/security-data.md) |
| Encryption, signatures, keys, passwords, or token cryptographic verification | [Cryptographic contracts](references/cryptography.md) |
| Select, run, or interpret security scanners | [Security scanning](references/security-scanning.md) |
| Requested systemic structural investigation | [Architecture audit](references/architecture-audit.md) |
| Failure, crash, performance regression, or unexpected behavior | [Diagnosis loop](references/diagnosis.md), plus affected runtime contracts |
| Code review or substantive self-review | [Review procedure](references/review.md); add [Go](references/go-review.md) or [Rust](references/rust-review.md) review contracts only for those languages |
| Execute or interpret mutation checks | [Mutation testing](references/mutation-testing.md) |
| Prepare/update a PR description or PR handoff | [PR standards](references/pr-standards.md) |
| Multi-step implementation, review corrections, or recurring failures | [Delivery/correction loop](references/delivery.md) |
| Firebase tool/emulator/resource operation | [Firebase target verification](references/firebase-targets.md); add [cloud operations](references/firebase-operations.md) only for remote mutations |

Preserve existing architecture unless change is requested or needed for the outcome. Choose boundaries from concrete behavior and change pressure; compare alternatives for consequential interfaces. Keep small features simple. Read domain/ADR templates only when writing them; create documents lazily for clarified concepts or real trade-offs. An ordinary fix or code review does not require an HTML architecture audit. If a review exposes systemic structural issues, report their evidence and scope an architecture follow-up; perform it when authorized.

## Execute and verify

Use the selected profile for implementation, runtime-specific diagnosis, validation, and review. For behavior changes, select a caller-visible seam and write checks using the [behavioral testing guidelines](references/testing.md). For bugs, reproduce and narrow the actual symptom before fixing it, retain an appropriate regression check, and rerun the original scenario. If reproduction is blocked, gather evidence and state the limit instead of claiming a confirmed cause.

After implementation, inspect the final diff and validate affected contracts. Use the [review procedure](references/review.md) and relevant stack standards for a focused self-review of substantive changes; keep formal reporting proportional to the request. For a review-only task, pin the actual diff/revision and criteria before separate Standards and Spec passes. Review correctness, regressions, reliability, and test gaps; trace affected callers and contracts; report actionable findings with file/line evidence, concrete failure scenarios, and verification limits. Use the procedure's defined review coverage score separately from its PR readiness score; report missing criteria rather than inventing them. Do not modify the review target unless fixes are requested.

For authorized fixes, use the [delivery and correction loop](references/delivery.md) to resolve actionable findings and revalidate affected behavior. When the same failures recur, revisit the cause, seam, or design rather than applying another speculative patch. Keep completion tied to acceptance evidence and required review, with unresolved work explicit.

The executing engineer owns the selected phases within the assigned scope; no specialist personas or automatic delegation are required. For orchestrated implementation, independent PR review is required under the coordinator's delivery workflow, subject to a narrower user scope or explicit opt-out. Self-review does not satisfy that gate. Outside that mandatory workflow, peer review follows the user's and repository's requirements; any independent review remains distinct from self-review and is not dispatched by this worker.

Tool availability, user scope, and existing authorization govern execution: publishing, remote comments, workflow dispatch, secrets/account changes, and cloud mutations are delivery operations, not automatic consequences of implementing code. Carry forward the coordinator packet's existing task-scoped publication and card-update authorization without asking again; it does not authorize merging, deployment, issue closure, or marking the card Done. Complete and validate local work first; obtain any still-missing authorization for the concrete target/scope before external side effects. Direct invocation does not automatically inherit the coordinator's standing delivery authorization.

Finish with changed behavior/files, important decisions, commands/tool checks actually run and results, and unresolved risks or blocked checks. State deployment/publication status when relevant. Never describe a skipped check or merely started job as successful.
