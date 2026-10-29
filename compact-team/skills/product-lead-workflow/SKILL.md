---
name: product-lead-workflow
description: Product discovery and delivery workflow combining research, requirements, backlog management, UX/UI design, and Lottie motion. Use with the compact product-lead agent to create, assess, and hand off product artifacts; load only the relevant task guidance.
---

# Product Lead Workflow

One agent owns product decisions and artifacts through selectively loaded references. All required guidance is contained in this skill; no other skill, specialist persona, team helper script, or companion agent is required. Keep cross-cutting rules here and task-specific procedures in their reference.

## Route by requested outcome

Read the request, repository instructions, relevant existing specs, domain glossary/ADRs, design context, and assets. Establish which artifact or decision the user needs and reuse agreed requirements. Load only the references needed now; reuse them across phases rather than repeatedly reloading them.

| Requested work | Bundled guidance |
|---|---|
| Investigate/compare options or verify facts | [Research](references/research.md) |
| Clarify missing product requirements | [Discovery](references/discovery.md) |
| Synthesize/review agreed requirements as a testable spec | [Specification](references/specification.md) |
| Clarify terms or update `CONTEXT.md` | [Domain language](references/domain-language.md) |
| Record a qualifying durable trade-off | [ADR recording](references/architecture-decisions.md) |
| Decompose, prioritize, or assess backlog readiness | [Backlog planning](references/backlog.md) |
| Read/write live issues, project items, or fields | [GitHub Projects operations](references/github-projects.md) |
| Assess/report progress, blockers, or completion | [Lifecycle evidence](references/lifecycle.md) |
| Journeys, navigation, information architecture, or recovery states | [UX flows](references/ux-flows.md) |
| Screens, components, tokens, variants, or design-tool context | [UI systems](references/ui-system.md) |
| Specify/review accessible interaction, content, or motion | [Accessibility assessment](references/accessibility.md) |
| Motion purpose, timing/easing, key beats, or storyboard | [Motion design](references/motion-design.md) |
| Inspect/create/edit/export/optimize a Lottie asset | [Lottie authoring](references/lottie.md) |
| Review asset playback, compatibility, accessibility, or performance | [Lottie validation](references/lottie-validation.md) |

Each reference owns one independently requested responsibility. Select from the requested operation; links are conditional, not recursive preload instructions. Discovery is unnecessary when requirements are agreed. Backlog planning does not require board mutation instructions; a motion brief does not require an asset validation pipeline. Reuse guidance already loaded in this context.

A research answer can end with findings. Agreed requirements can go directly to specification. A motion edit can stay within its asset scope. Combine modes when the deliverable crosses boundaries: research informs discovery; a spec supplies backlog acceptance criteria; UX defines states and motion intent; motion supplies playback contracts. This is a routing map, not a mandatory sequence.

Read links relative to their containing file. Use the target project's conventions and tooling; never look for these instructions in its source tree or fall back to unrelated installed skills. Discover connected tools and inspect schemas before depending on them. Missing remote tools may block remote edits or previews, while local analysis, drafts, specifications, and supported asset edits can proceed. Do not fabricate URLs, node IDs, exports, access, or results.

## Decisions and artifact continuity

Resolve discoverable facts with code, documents, or credible sources. Ask concise questions only for consequential choices that remain unknown; progress on independent work while waiting. Preserve existing choices and authorization. Mark non-blocking proposed defaults and validation needs; do not silently turn assumptions into accepted requirements.

Make product, priority, domain, navigation, interaction, visual, and motion decisions at the appropriate level. Describe high-level modules/interfaces or data/state contracts when needed for a testable specification; flag uncertain engineering feasibility for validation rather than presenting it as established. Avoid premature implementation scaffolding.

Keep a small chain of evidence: user outcome → requirement/criterion → flow or artifact → backlog item → verification evidence, using stable IDs or links when helpful. Record changes to scope or decisions where they affect existing artifacts; do not silently let specs, designs, and issues disagree. Create glossary/ADR documentation lazily using the domain-language or decision-record reference only when that artifact is needed. Do not duplicate the same rules in every artifact.

## Review, delivery, and external actions

Deliver the artifacts the task needs rather than a mandatory full package. Review the selected output against its reference's quality gates and the actual request. Separate requirement coverage from artifact quality and distinguish evidence from proposed validation. A locally reviewed draft, a published issue, a tool preview, and a target-runtime validation are different states; report the state actually reached.

Complete concrete local preparation before any still-needed external approval. Use existing authorization for its exact target/scope. Creating issues, changing board status, closing work, publishing comments/designs, uploading private assets, and sending messages are separate external actions; perform only those covered by the task. Re-check the destination before mutation, preserve returned IDs, and verify the resulting state. If a write partially succeeds, inspect what exists before retrying so items are not duplicated. Never mutate boards or publish as an incidental final step.

Return the usable result, important decisions and supporting evidence, review/validation outcomes, external state when relevant, and material open questions. For engineering handoff include behavior/contracts, assets, acceptance checks, constraints, and verification gaps. Handoff artifacts do not require automatically messaging or invoking another agent.
