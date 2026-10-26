---
name: software-engineer-workflow
description: Stack-aware engineering workflow for Go, Rust, Dart, Flutter, Dart Frog, Astro, Next.js, and Firebase. Use with the compact software-engineer agent for design, implementation, diagnosis, review, and delivery; load only the relevant stack and task guidance.
---

# Software Engineer Workflow

Use one agent with selectively loaded references. All engineering guidance is bundled here; there are no dependencies on another agents/skills tree or repository helper scripts. Flutter, Dart Frog, and plain Dart share one profile because their language, diagnosis, and review practices overlap. Firebase and DevOps are composable capabilities rather than mutually exclusive application stacks. Keep shared rules here or in one task reference; keep runtime-specific rules in the relevant stack profile.

## Establish scope and stack

Read repository instructions, the request/acceptance criteria, relevant `CONTEXT.md`/ADRs, and the affected manifests, source, tests, and CI. Determine whether the task is implementation, diagnosis, review, architecture analysis, or operations; a task may move through several phases.

Honor an explicit stack choice for new work. For existing code, inspect the affected component before choosing its workflow. If the chosen stack conflicts with the implementation, establish whether migration is intended before replacing it. A mention of a technology alone is not a stack choice.

| Evidence in the affected component | Read next |
|---|---|
| `go.mod`, `go.work`, Go backend/module sources | [Go](references/go.md) |
| `Cargo.toml`, Rust crate/workspace sources | [Rust](references/rust.md) |
| `pubspec.yaml`; Flutter SDK dependency or Dart Frog dependency/routes | [Dart / Flutter / Dart Frog](references/dart.md) |
| New website/web product; Astro/Next.js dependencies, framework config, page/route entrypoints | [Web: Astro / Next.js](references/web.md) |
| Firebase rules, indexes, Functions, `firebase.json`, or Firebase service operations | [Firebase](references/firebase.md) |
| Dockerfiles, deployment manifests, CI workflows, infrastructure | [DevOps](references/devops.md), plus the affected runtime profile when needed |

Route per component in a monorepo; load additional profiles only when the task crosses their boundary. Flutter UI consuming Firebase SDKs starts with Dart; a web client starts with Web; changing Firebase rules or services adds Firebase. A Go or Rust deployment pipeline combines its runtime profile and DevOps. A `package.json` alone does not establish a web stack: inspect framework dependencies and entrypoints rather than routing Firebase Functions or generic Node tools to Web. Trace contracts across affected components and verify both sides of changed integrations. For an unsupported stack, follow its repository tooling and authoritative documentation; do not force a supported framework onto it.

## Load bundled guidance on demand

Read linked files relative to their containing document. Use the target project's own commands and native tooling; this workflow requires no team-specific helper scripts or other installed skills. Consult current official documentation for uncertain framework/tool behavior and the versions in use. If a bundled file is missing, report the incomplete bundle before dependent work rather than loading an unrelated installed skill.

Read a selected reference once per context and only the supporting sections needed for the current operation. Reuse loaded guidance across phases. Add these shared references only at their actual decision points:

| Decision or deliverable | Bundled guidance |
|---|---|
| New module/API boundary, test seam, substantial refactor; domain terminology or durable trade-off | [Design and domain modeling](references/design.md) |
| Requested architecture scan or systemic structural investigation | [Architecture audit](references/architecture-audit.md), together with the design reference |
| Failure, crash, performance regression, or unexpected behavior | [Diagnosis loop](references/diagnosis.md), using the selected stack's reproduction and validation tooling |
| Requested code review; focused self-review after substantive changes | [Review procedure](references/review.md), plus the selected stack's standards |
| Containers, CI/CD, infrastructure, deployment | [DevOps](references/devops.md) |

Preserve existing architecture unless change is requested or needed for the outcome. Choose boundaries from concrete behavior and change pressure; compare alternatives for consequential interfaces. Keep small features simple. Read domain/ADR templates only when writing them; create documents lazily for clarified concepts or real trade-offs. An ordinary fix or code review does not require an HTML architecture audit. If a review exposes systemic structural issues, report their evidence and scope an architecture follow-up; perform it when authorized.

## Execute and verify

Use the selected profile for implementation, runtime-specific diagnosis, validation, and review. For behavior changes, select a caller-visible seam and meaningful behavioral checks. For bugs, reproduce and narrow the actual symptom before fixing it, retain an appropriate regression check, and rerun the original scenario. If reproduction is blocked, gather evidence and state the limit instead of claiming a confirmed cause.

After implementation, inspect the final diff and validate affected contracts. Use the stack's review guidance for a focused self-review of substantive changes; load only its relevant standards, and keep formal audit/reporting work proportional to the request. For a review-only task, pin the actual diff/revision and criteria before separate Standards and Spec passes; report missing criteria rather than inventing them. Do not modify the review target unless fixes are requested.

This agent owns all selected phases; no specialist personas or automatic delegation are required. Optional peer review remains distinct from self-review. Tool availability, user scope, and existing authorization govern execution: publishing, remote comments, workflow dispatch, secrets/account changes, and cloud mutations are delivery operations, not automatic consequences of implementing code. Complete and validate local work first; obtain any still-missing authorization for the concrete target/scope before external side effects. Do not ask again for scope already authorized.

Finish with changed behavior/files, important decisions, commands/tool checks actually run and results, and unresolved risks or blocked checks. State deployment/publication status when relevant. Never describe a skipped check or merely started job as successful.
