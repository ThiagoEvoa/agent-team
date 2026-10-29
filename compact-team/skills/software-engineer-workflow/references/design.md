# Module and interface design

Use when designing or refactoring a module boundary or comparing interfaces.

A module presents an interface over hidden implementation. Its interface includes types, invariants, ordering constraints, error modes, and everything callers must know. Prefer substantial behavior behind a compact interface: depth gives callers leverage and keeps changes local.

- Apply the deletion test: if removing a wrapper removes complexity, inline it; if complexity would scatter across callers, the module earns its place.
- Place behavioral tests at the same public seam callers use. Inject dependencies at construction; keep ownership and side effects explicit. A test that must navigate private implementation may indicate a misplaced seam.
- Group behavior by capability and ownership. Avoid pass-through layers, shared catch-all utilities, and abstractions justified only by hypothetical consumers.
- Follow the [behavioral testing guidelines](testing.md): compose real owned components, including isolated storage/services when their semantics matter. Substitute only at uncontrolled external boundaries, keeping our adapters real where practical. Assert observable outcomes rather than interactions with collaborators.
- Introduce an adapter interface when alternate production behavior or a useful test substitution warrants it. Avoid recreating the entire dependency graph in tests. Replace obsolete intermediate tests only after preserving their meaningful behavior at the new seam.

For a consequential interface, compare at least two materially different designs before committing: minimal surface, flexible composition, or the common caller's simplest path. Evaluate concrete call sites, error/ownership contracts, depth, locality, compatibility, and testability. Choose from actual requirements; do not build every candidate's extension points.
