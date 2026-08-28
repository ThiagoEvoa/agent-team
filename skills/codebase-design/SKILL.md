---
name: codebase-design
description: Shared architectural vocabulary and principles for designing deep, high-leverage modules and testable interfaces. Use when designing new modules, refactoring interfaces, or deciding seam placement.
resources:
  - DEEPENING.md
  - DESIGN-IT-TWICE.md
---

# Codebase Design

Design **deep modules**: rich behavior encapsulated behind a minimal, clean interface placed at an intentional seam.

The goal is **leverage** for callers, **locality** for maintainers, and natural **testability** for verification.

---

## Canonical Vocabulary
Use these terms consistently:

- **Module:** Any unit of code presenting an interface over an implementation (function, class, package, feature slice).
- **Interface:** Everything a caller must know to use the module correctly (types, parameters, invariants, ordering, error modes).
- **Implementation:** The internal logic and state hidden behind the interface.
- **Depth:** Leverage at the interface. A module is **deep** when substantial behavior sits behind a compact interface, and **shallow** when the interface is as complex as what it hides.
- **Seam:** The location where an interface lives and where behavior can be altered or tested without modifying callers.
- **Adapter:** A concrete implementation that satisfies an interface at a seam (e.g. production HTTP adapter vs in-memory fake).
- **Leverage:** The capability gained per unit of interface learned.
- **Locality:** Concentration of change, error handling, and knowledge within one place.

---

## Core Principles

1. **The Deletion Test:** Imagine deleting the module. If complexity vanishes, it was a pass-through/shallow module. If complexity re-emerges scattered across N callers, the module was earning its keep.
2. **Interface is the Test Surface:** Callers and tests cross the same external seam. If you need to test private internal parts, the module's seam is likely mispositioned.
3. **Accept Dependencies, Don't Create Them:** Inject required dependencies through constructor/factory parameters rather than instantiating hardcoded singletons.
4. **Return Results, Avoid Hidden Side-Effects:** Functional commands/queries with clear outputs make verification effortless.

---

## Extended Guides
- **Deepening & Dependency Strategies:** See [DEEPENING.md](DEEPENING.md) for ports & adapters and replace-don't-layer testing.
- **Exploring Interface Alternatives:** See [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md) for divergent parallel design exploration.
