---
name: improve-codebase-architecture
description: Scan the codebase for shallow modules and architectural friction, present deepening opportunities as a visual HTML report, and facilitate grilling loops on chosen refactors.
resources:
  - HTML-REPORT.md
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities**: refactoring shallow modules into deep modules with compact interfaces, clear seams, and high leverage.

Informed by:
- The vocabulary and principles in `skills/codebase-design/` (Module, Interface, Depth, Seam, Adapter, Leverage, Locality, Deletion Test).
- Domain terms in `CONTEXT.md` and established decisions in `docs/adr/`.

---

## Process

### 1. Explore & Scope (YAGNI)
1. **Focus on Hot Spots First:** Inspect `git log --oneline -n 50` to find files and subsystems with frequent changes or high churn.
2. **Review Domain & Decisions:** Read `CONTEXT.md` and relevant ADRs.
3. **Identify Shallowness & Friction:**
   - Where do callers bounce between multiple micro-helpers to accomplish one conceptual task?
   - Where is the interface as complex as the implementation?
   - Where do tests struggle to mock intricate internal webs?
   - Apply the **Deletion Test**: Would deleting this module concentrate complexity, or simply move pass-through calls?

### 2. Generate & Present HTML Report
1. Compile candidates into a standalone HTML report using Tailwind CSS and Mermaid.js via CDN (see [HTML-REPORT.md](HTML-REPORT.md)).
2. Write the file to `$TMPDIR/architecture-review-<timestamp>.html` (or `/tmp/...`).
3. Open the file for the user (`open <path>` on macOS, `xdg-open` on Linux).
4. Each candidate card must include:
   - Involved files and modules.
   - Current Problem (Shallowness, coupling, or testing pain).
   - Proposed Deepened Solution.
   - Expected Leverage & Locality gains.
   - **Before / After Diagrams** rendered with Mermaid.
   - Recommendation Badge (`Strong`, `Worth exploring`, `Speculative`).
5. Highlight a **Top Recommendation** card.

### 3. Interactive Grilling & Decision Loop
Once the user selects a candidate to explore:
1. Conduct a **Grilling session** along the decision tree frontier: evaluate constraints, state boundaries, what goes behind the internal seam, and what tests survive.
2. If new domain terms arise, update `CONTEXT.md` inline.
3. If an alternative interface is explored, apply **Design It Twice** (`skills/codebase-design/DESIGN-IT-TWICE.md`).
4. If a proposed refactor is rejected for a load-bearing, permanent architectural reason, record an ADR in `docs/adr/` so future reviews do not re-suggest it.
