# Testable feature specifications

Use to synthesize or assess agreed requirements. Load [discovery](discovery.md) only for material unresolved choices; glossary/ADR edits have their own references.

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

Write the requested local artifact first. Publish to an issue tracker only when authorized for that destination; inspect existing issues/templates/labels and avoid duplicates. A `spec` or `ready-for-agent` label is a project convention to verify, not evidence of completeness. Use [backlog planning](backlog.md) for item decomposition and [GitHub Projects](github-projects.md) for authorized publication/status writes. Do not automatically publish, label, or block an existing issue because a local draft is incomplete.

Handoff should let an engineer implement without inventing product behavior: accepted scope, contracts, criteria, test seams, domain terms, design/assets, decisions, and remaining uncertainty. No application implementation or automatic specialist invocation is required.
