---
name: software-engineer-workflow
description: Stack-aware engineering workflow for Go, Rust, Dart, Flutter, Dart Frog, Astro, Next.js, and Firebase. Use with the compact software-engineer agent for design, implementation, diagnosis, review, and delivery; load only the relevant stack and task guidance.
---

# Software Engineer Workflow

Use one agent with selectively loaded references. All engineering guidance is bundled here; there are no dependencies on another agents/skills tree or repository helper scripts. Dart language contracts are shared; Flutter and Dart Frog rules load independently for their affected components. Firebase and DevOps are composable capabilities rather than mutually exclusive application stacks. Keep shared rules here or in one task reference; keep runtime-specific rules in the relevant stack profile.

## Establish scope and stack

Read repository instructions, the request/acceptance criteria, relevant `CONTEXT.md`/ADRs, and the affected manifests, source, tests, and CI. Determine whether the task is implementation, diagnosis, review, architecture analysis, or operations; a task may move through several phases.

Honor an explicit stack choice for new work. For existing code, inspect the affected component before choosing its workflow. If the chosen stack conflicts with the implementation, establish whether migration is intended before replacing it. A mention of a technology alone is not a stack choice.

| Evidence in the affected component | Core contract reference |
|---|---|
| `go.mod`, `go.work`, Go sources | [Go packages/errors](references/go.md); add HTTP, persistence, or concurrency guidance only when affected |
| `Cargo.toml`, Rust crate/workspace sources | [Rust ownership/modules](references/rust.md); add HTTP or async guidance only when affected |
| Plain Dart package | [Dart language/packages](references/dart.md) |
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
| Run language/framework checks | Affected stack only: [Go](references/go-validation.md), [Rust](references/rust-validation.md), [Dart/Flutter](references/dart-validation.md), [Web](references/web-validation.md), or [Firebase](references/firebase-validation.md) |
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

After implementation, inspect the final diff and validate affected contracts. Use the stack's review guidance for a focused self-review of substantive changes; load only its relevant standards, and keep formal audit/reporting work proportional to the request. For a review-only task, pin the actual diff/revision and criteria before separate Standards and Spec passes; report missing criteria rather than inventing them. Do not modify the review target unless fixes are requested.

For authorized fixes, use the [delivery and correction loop](references/delivery.md) to resolve actionable findings and revalidate affected behavior. When the same failures recur, revisit the cause, seam, or design rather than applying another speculative patch. Keep completion tied to acceptance evidence and required review, with unresolved work explicit.

This agent owns all selected phases; no specialist personas or automatic delegation are required. Optional peer review remains distinct from self-review. Tool availability, user scope, and existing authorization govern execution: publishing, remote comments, workflow dispatch, secrets/account changes, and cloud mutations are delivery operations, not automatic consequences of implementing code. Complete and validate local work first; obtain any still-missing authorization for the concrete target/scope before external side effects. Do not ask again for scope already authorized.

Finish with changed behavior/files, important decisions, commands/tool checks actually run and results, and unresolved risks or blocked checks. State deployment/publication status when relevant. Never describe a skipped check or merely started job as successful.
