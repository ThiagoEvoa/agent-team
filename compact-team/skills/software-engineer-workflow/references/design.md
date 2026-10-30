# Module and interface design

Use when designing or refactoring a module boundary or comparing interfaces.

A module presents an interface over hidden implementation. Its interface includes types, invariants, ordering constraints, error modes, and everything callers must know. Prefer substantial behavior behind a compact interface: depth gives callers leverage and keeps changes local.

- Apply the deletion test: if removing a wrapper removes complexity, inline it; if complexity would scatter across callers, the module earns its place.
- Place behavioral tests at the same public seam callers use. Inject dependencies at construction; keep ownership and side effects explicit. A test that must navigate private implementation may indicate a misplaced seam.
- Group behavior by capability and ownership. Avoid pass-through layers, shared catch-all utilities, and abstractions justified only by hypothetical consumers.
- Follow the [behavioral testing guidelines](testing.md): compose real owned components, including isolated storage/services when their semantics matter. Substitute only at uncontrolled external boundaries, keeping our adapters real where practical. Assert observable outcomes rather than interactions with collaborators.
- Introduce an adapter interface when alternate production behavior or a useful test substitution warrants it. Avoid recreating the entire dependency graph in tests. Replace obsolete intermediate tests only after preserving their meaningful behavior at the new seam.

For a consequential interface, compare at least two materially different designs before committing: minimal surface, flexible composition, or the common caller's simplest path. Evaluate concrete call sites, error/ownership contracts, depth, locality, compatibility, and testability. Choose from actual requirements; do not build every candidate's extension points.

## Mutable-state ownership

Before adding locks, queues, or other serialization, determine whether concurrent operations need the same mutable state. Prefer operation-owned state or partition it by its real owner when that preserves the required invariants. Do not split state whose correctness requires a shared transaction or global constraint.

When sharing is necessary, identify the owner and permitted writers. Prefer one writer where practical and enforce its ownership through the API or execution structure. Otherwise define the synchronization or transaction boundary that preserves the invariant; a lock alone does not establish correct ownership. Use the affected runtime's concurrency contracts and [data integrity](data-integrity.md) guidance when applicable. Verify isolation between independent operations and the relevant conflict, cancellation, or partial-failure behavior with controlled behavioral checks.

## Behavior-preserving refactoring

Identify the caller-visible contract and establish passing relevant behavioral checks before changing structure. Add characterization checks where meaningful behavior lacks coverage, without treating a known defect as intended behavior. Refactor in cohesive steps, rerunning the affected checks after each step and checking consumers when a boundary changes. Preserve meaningful assertions when moving tests to a new public seam.

Separate structural work from new behavior when doing so makes failures easier to attribute; a coordinated API migration may require changes together. If a baseline or environment is unavailable, record that limit and the evidence still needed rather than claiming behavior was proved unchanged. A refactoring request alone does not authorize changing the contract or undertaking a broader redesign.
