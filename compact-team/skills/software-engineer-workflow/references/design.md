# Architecture, codebase design, and domain modeling

## Deep modules and useful seams

A module presents an interface over hidden implementation. Its interface includes types, invariants, ordering constraints, error modes, and everything callers must know. Prefer substantial behavior behind a compact interface: depth gives callers leverage and keeps changes local.

- Apply the deletion test: if removing a wrapper removes complexity, inline it; if complexity would scatter across callers, the module earns its place.
- Place behavioral tests at the same public seam callers use. Inject dependencies at construction; keep ownership and side effects explicit. A test that must navigate private implementation may indicate a misplaced seam.
- Group behavior by capability and ownership. Avoid pass-through layers, shared catch-all utilities, and abstractions justified only by hypothetical consumers.
- For pure in-process logic, combine related operations directly. For local storage, use a realistic isolated stand-in when practical. For owned remote services, use a small port with a production adapter and test fake. For third-party services, isolate the SDK at its boundary and use a fake/mock or emulator with contract checks.
- Introduce an adapter interface when alternate production behavior or a useful test substitution warrants it. Avoid recreating the entire dependency graph in tests. Replace obsolete intermediate tests only after preserving their meaningful behavior at the new seam.

For a consequential interface, compare at least two materially different designs before committing: minimal surface, flexible composition, or the common caller's simplest path. Evaluate concrete call sites, error/ownership contracts, depth, locality, compatibility, and testability. Choose from actual requirements; do not build every candidate's extension points.

## Domain language

Read existing `CONTEXT.md` and relevant ADRs before changing domain behavior. Resolve overloaded terms against concrete scenarios and existing rules. Separate business uncertainty from an implementation choice; investigate the code first and ask only when product intent remains unresolved.

Create or update `CONTEXT.md` when a concept becomes clear. Keep it limited to canonical terms, relationships, and business invariants, grouped alphabetically or by bounded context. Keep implementation paths, framework types, and architectural scratch notes elsewhere. Example:

```markdown
## Order
A customer's binding purchase request containing one or more Line Items.
An Order can be cancelled until it is Shipped; a Shipped Order is final.
```

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
