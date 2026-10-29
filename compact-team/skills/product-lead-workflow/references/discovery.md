# Requirements discovery

Use only when product intent or consequential choices remain unresolved; agreed requirements go directly to [specification](specification.md).

Read agreed requirements, existing behavior, domain terms, and architecture decisions. For a new or ambiguous idea, identify users, problem, desired outcome/success measure, platform/scope, constraints, and consequential edge cases. Investigate facts yourself, then ask small decision-focused rounds with a recommended option and its trade-off when useful. Do not require an interview before drafting a clear, already-agreed request.

Resolve the next load-bearing uncertainty before exploring dependent details. Use concrete scenarios: permissions, empty/loading/error states, invalid input, partial failure, retries, offline behavior, cancellation, accessibility, and localization only where they affect this feature. Distinguish functional intent from a technical choice; do not lock in frameworks or fragile file layouts prematurely.

Clarified terms use [domain language](domain-language.md); lasting decisions use [ADR recording](architecture-decisions.md).
