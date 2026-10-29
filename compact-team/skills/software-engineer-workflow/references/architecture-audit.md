# Architecture audit

Use for a requested structural scan or agreed systemic investigation. Read [module design](design.md), existing context/ADRs, and recent history such as `git log --oneline -n 50`. Start with frequently changed or painful modules, then trace their callers, dependencies, and tests.

Find evidence of shallow interfaces, scattered change, excessive navigation, duplicated ownership, dependency cycles, or tests coupled to internal webs. Apply the deletion test to each candidate and identify the concrete maintenance cost. Avoid speculative cleanups and honor prior ADRs.

Produce a standalone HTML report at the requested artifact location or a temporary path such as `$TMPDIR/architecture-review-<timestamp>.html`. Include a top recommendation and candidate cards containing:

- Affected files, present behavior, and concrete friction.
- Proposed deeper interface and expected locality/leverage gains.
- Before/after dependency or call-flow diagrams.
- A recommendation label: Strong, Worth exploring, or Speculative, with its evidence and uncertainty.

Use embedded CSS and inline SVG for a portable offline report; Mermaid may be used when its renderer is available, but provide readable fallback diagrams if external scripts are unavailable. Open or link the artifact through available viewer tools. Escape source-derived text in HTML.

After a candidate is selected, resolve constraints, ownership, failure behavior, migration, and test seams in decision order. Investigate facts independently; ask the user only about remaining product/trade-off decisions. Compare divergent interfaces using the design reference. For clarified terms load [domain-language maintenance](domain-language.md); for a qualifying durable trade-off load [ADR recording](architecture-decisions.md). An audit does not authorize implementing every proposed refactor; implement the selected scope and verify preserved caller contracts.
