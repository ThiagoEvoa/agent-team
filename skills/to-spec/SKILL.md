---
name: to-spec
description: Synthesize the current conversation context into a structured, testable specification and publish it to the issue tracker. Use when requirements are agreed upon and need to be formalized into an actionable spec.
---

# To-Spec Synthesis

Turn the current conversation context and codebase understanding into a formal, testable specification. **Do NOT interview the user; synthesize what has already been decided.**

---

## Process

1. **Explore Repo & Context:** Review `CONTEXT.md` for ubiquitous language and `docs/adr/` for existing decisions.
2. **Determine Test Seams:** Identify the highest-level clean seams where the feature will be tested. Minimal seams across the feature are preferred (ideally one external seam).
3. **Draft the Spec:** Format according to the template below.
4. **Publish:** Create the issue on GitHub or write to `spec.md`, applying the `ready-for-agent` / `spec` label.

---

## Spec Template

```markdown
# [Feature Title]

## Problem Statement
The problem that the user or system is facing, from the user's / business perspective.

## Solution Overview
The high-level solution to the problem, from the user's perspective.

## User Stories
An extensive, numbered list covering all user interactions and edge cases:
1. As an <actor>, I want <capability>, so that <benefit>.
2. As an <actor>, I want <capability>, so that <benefit>.

## Implementation Decisions
Key architectural and design choices made:
- **Modules & Interfaces:** Which modules will be built or modified, and their high-level interfaces.
- **Data Models & Schemas:** Core entities and invariants (referencing `CONTEXT.md`).
- **Contracts & Interactions:** State transitions, API payloads, or event sequences.
*(Avoid hardcoding fragile file paths or premature implementation details unless quoting a prototype schema/state machine).*

## Testing Decisions
Explicit testing strategy:
- **Test Seam:** The external seam where automated tests will exercise behavior (e.g., ViewModel / Repository / Bloc / Endpoint level).
- **Behavioral Verification:** Focus on observable outcomes rather than internal state.
- **Prior Art:** Existing tests in the repo to use as reference patterns.

## Out of Scope
Explicitly list what will NOT be done in this iteration.

## Further Notes
Any operational considerations, telemetry, or future migrations.
```
