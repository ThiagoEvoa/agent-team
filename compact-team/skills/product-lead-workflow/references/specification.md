# Discovery, domain language, and specifications

## Discover only what is missing

Read agreed requirements, existing behavior, domain terms, and architecture decisions. For a new or ambiguous idea, identify users, problem, desired outcome/success measure, platform/scope, constraints, and consequential edge cases. Investigate facts yourself, then ask small decision-focused rounds with a recommended option and its trade-off when useful. Do not require an interview before drafting a clear, already-agreed request.

Resolve the next load-bearing uncertainty before exploring dependent details. Use concrete scenarios: permissions, empty/loading/error states, invalid input, partial failure, retries, offline behavior, cancellation, accessibility, and localization only where they affect this feature. Distinguish functional intent from a technical choice; do not lock in frameworks or fragile file layouts prematurely.

Keep business terminology consistent. Create/update `CONTEXT.md` when a concept is clarified, grouped alphabetically or by bounded context. Describe entities, relationships, and business invariants; exclude framework classes, implementation paths, and architectural scratch notes. Flag contradictions between glossary, behavior, and requirements rather than silently changing policy.

Record an ADR only for a real trade-off that is hard to reverse and surprising without context. Use the project's convention or `docs/adr/NNNN-short-title.md`, containing context/constraints, options, decision/status, consequences, and preserved invariants. Do not record every routine choice or label an unaccepted proposal as accepted.

## Synthesize a testable spec

Use the project's template when present; otherwise use the structure below. Keep detail proportional to the feature. Derive decisions from the actual conversation and evidence; label proposed defaults, open questions, and feasibility checks. Draft unresolved work honestly rather than marking it ready.

```markdown
# Feature title

## Problem Statement
Affected users, present problem, desired outcome, and success signal.

## Solution Overview
Behavior from the user's perspective and relevant constraints.

## User Stories and Acceptance Criteria
1. As an actor, I want a capability, so that I gain a benefit.
   - AC-1: Observable outcome for a concrete scenario.
   - AC-2: Relevant failure/permission/edge behavior.

## Implementation Decisions
High-level modules/interfaces, domain entities/invariants, state transitions,
data/API/event contracts, agreed constraints, and unresolved feasibility checks.

## Testing Decisions
Caller-visible test seam(s), observable checks mapped to criteria,
existing test patterns where useful, and manual/runtime validation needs.

## Out of Scope
Explicit boundaries for this iteration.

## Open Questions and Further Notes
Only material undecided choices, dependencies, operations, or future migration needs.
```

Select the highest useful external seam: feature operation, ViewModel/controller, repository contract, endpoint, or user journey. Prefer few meaningful seams but cover independent behaviors where needed. Specify outcomes rather than internal implementation assertions. Include relevant design/motion assets and accessibility behavior as acceptance contracts.

## Review and readiness

Check requirement coverage and specification quality separately. Verify numbered stories, testable criteria, consistent domain rules, implementation contracts, an explicit test seam, and out-of-scope boundaries. Identify missing decisions, contradictory states, unsupported technical claims, and added scope. Do not declare readiness when material questions or dependencies prevent implementation/testing.

Write the requested local artifact first. Publish to an issue tracker only when authorized for that destination; inspect existing issues/templates/labels and avoid duplicates. A `spec` or `ready-for-agent` label is a project convention to verify, not evidence of completeness. Use [backlog guidance](backlog.md) for item ingestion and status changes. Do not automatically publish, label, or block an existing issue because a local draft is incomplete.

Handoff should let an engineer implement without inventing product behavior: accepted scope, contracts, criteria, test seams, domain terms, design/assets, decisions, and remaining uncertainty. No application implementation or automatic specialist invocation is required.
