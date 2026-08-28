---
name: domain-modeling
description: Build and sharpen the project's ubiquitous domain language and architecture decisions. Use when defining domain vocabulary, updating CONTEXT.md, or recording Architectural Decision Records (ADRs).
resources:
  - CONTEXT-FORMAT.md
  - ADR-FORMAT.md
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design and discuss features.

This is an **active discipline**: challenging ambiguous terms, exploring edge-case scenarios, cross-referencing code against domain definitions, and recording glossary terms and ADRs the moment decisions crystallize.

---

## Repository Structure

For most repositories, a single root context suffices:
```
/
├── CONTEXT.md               ← Canonical ubiquitous language glossary
├── docs/
│   └── adr/
│       ├── 0001-state-management-choice.md
│       └── 0002-offline-sync-strategy.md
└── lib/ / src/
```

Files are created **lazily**:
- Create `CONTEXT.md` when the first domain concept is clarified.
- Create `docs/adr/` when the first real architectural trade-off is made.

---

## Active Disciplines During Design Sessions

### 1. Challenge Against the Glossary
When ambiguous or conflicting terms appear in discussions, challenge them immediately against `CONTEXT.md`:
> *"The glossary defines 'Wallet' as X, but you mentioned 'Account balance'. Are these distinct concepts or should we consolidate?"*

### 2. Sharpen Fuzzy & Overloaded Language
Replace generic labels (`Data`, `Manager`, `Helper`, `Processor`) with precise canonical domain entities.

### 3. Discuss Concrete Edge-Case Scenarios
Probe boundaries by formulating concrete scenarios:
> *"What happens to pending Orders when an Account is suspended mid-checkout?"*

### 4. Cross-Reference with Code
Verify if the implementation matches the stated business model:
> *"The code allows canceling completed trips, but the domain rule states completed trips are final. Which is correct?"*

### 5. Update `CONTEXT.md` Inline
Update `CONTEXT.md` immediately upon reaching clarity. Keep it strictly focused on domain terms and business invariants—**zero implementation details or file paths**. Follow [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

### 6. Record ADRs Under the 3-Way Filter
Offer an ADR only when:
1. **Hard to reverse**
2. **Surprising without context**
3. **The result of a real trade-off**

Follow the template in [ADR-FORMAT.md](./ADR-FORMAT.md).
