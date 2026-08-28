# Architecture Decision Record (ADR) Format

ADRs record significant architectural decisions that shape the system.

## The Strict 3-Way ADR Filter
Offer to write or propose an ADR **ONLY** when all 3 criteria are met:
1. **Hard to Reverse:** The cost of changing your mind later is high.
2. **Surprising without Context:** A future engineer will wonder *"Why did they do it this way?"*
3. **The Result of a Real Trade-Off:** Genuine alternatives were evaluated and rejected for specific technical/business reasons.

If any criterion is missing (e.g. trivial choices, obvious standard practices), **skip the ADR**.

---

## File Naming & Location
Store ADRs in `docs/adr/NNNN-short-description.md` (e.g., `docs/adr/0001-bloc-state-management.md`).

---

## Template

```markdown
# [Number]. [Title]

Date: [YYYY-MM-DD]
Status: [Proposed | Accepted | Superseded by ADR-XXXX]

## Context & Problem Statement
What context led to this decision? What problem or trade-off needed resolving?

## Considered Options
- **Option 1:** [Description, Pros, Cons]
- **Option 2:** [Description, Pros, Cons]

## Decision Outcome
Chosen Option: **[Option Name]**, because [load-bearing reasons and trade-offs].

### Positive Consequences
- [Expected benefits, leverage, testability]

### Negative Consequences / Trade-offs
- [Accepted compromises, limitations, migration burden]

## Invariants & Rules
- [Specific rules callers and maintainers must respect]
```
