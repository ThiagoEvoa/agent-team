# Design It Twice

When architecting a critical module or refactoring a complex subsystem, avoid anchoring on the first plausible design. Use the **Design It Twice** pattern (Ousterhout): explore radically different interface designs before committing.

---

## Process

### 1. Frame the Problem Space
Document:
- Constraints the interface must satisfy.
- Underlying dependencies and their categories ([DEEPENING.md](DEEPENING.md)).
- Concrete scenarios/call-sites that will use the module.

### 2. Formulate 3 Radically Divergent Designs
Formulate 3 distinct design candidates with varying constraints:

- **Candidate A: Minimal Surface Area:**
  - Aim for 1–3 entry points max.
  - Maximise leverage per call; encapsulate configuration and state transitions entirely within the module.
- **Candidate B: Maximum Flexibility & Extensibility:**
  - Pluggable strategy/handler architecture.
  - Highly configurable for diverse future use cases.
- **Candidate C: Common-Caller Optimization:**
  - Make the 90% common use case a one-liner / zero-config call.
  - Expose progressive disclosure for advanced callers.

### 3. Compare & Synthesize
Evaluate each candidate along three dimensions:
1. **Depth (Leverage):** How much behavior is exercised per unit of interface surface?
2. **Locality:** Does change concentrate inside the module, or does it leak across callers?
3. **Seam Placement & Testability:** How easily can callers and tests exercise the module?

Select the strongest candidate (or synthesize an intentional hybrid) with explicit technical justification.
