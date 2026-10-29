# Architecture decision records

Use only when recording a lasting trade-off; glossary edits use [domain language](domain-language.md).

Record an ADR only for a real trade-off that is hard to reverse and surprising without context. Use the project's existing convention, otherwise `docs/adr/NNNN-short-description.md`:

```markdown
# NNNN. Decision title
Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded by NNNN

## Context and constraints
The problem and load-bearing requirements.

## Options considered
Viable alternatives with their benefits and costs.

## Decision and consequences
Chosen option, reasons, accepted compromises, and migration implications.

## Invariants
Rules callers and maintainers must preserve.
```

Create these artifacts lazily. A rejected refactor merits an ADR only when its rejection meets the same filter. Preserve established decisions unless the current task authorizes reconsidering them.
