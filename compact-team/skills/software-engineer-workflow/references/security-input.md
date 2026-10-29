# Input validation and injection prevention

Use for untrusted input, parsing/schema/semantic validation, resource bounds, and injection prevention.

At each relevant boundary, distinguish these checks rather than treating successful parsing as validation:

| Concern | What to establish |
|---|---|
| Origin and identity | Which caller/source is trusted, how that trust is established, and which operation it permits |
| Resource bounds | Supported body/file sizes, pagination, nesting, expensive work, timeouts, and concurrency limits |
| Representation | Allowed lexical forms, encoding, content type, syntax/schema, and deliberate handling of unknown fields |
| Meaning | Domain ranges, relationships, allowed transitions, ownership, and cross-field invariants |

Validate before expensive work or irreversible effects where practical. Keep canonical normalization deliberate and compatible with existing contracts. Enforce domain invariants in their owning operations or validated value types when useful; do not introduce a wrapper for every primitive without a real rule. Check serialization/deserialization and database constraints as well as UI validation.

Parameterize database values and constrain dynamic identifiers. Treat shell, path, HTML, template, and URL contexts with their appropriate escaping/validation mechanisms. Do not concatenate untrusted values into executable commands or queries. Review file/path access and server-initiated requests when affected, including traversal, allowed destinations, and redirects. Use safe established libraries rather than homegrown sanitizers.

Test malformed/oversized inputs and invalid domain values through real owned components. For atomic updates, replay/partial failure, and external-effect coordination use [data integrity](data-integrity.md). Use the [testing guidelines](testing.md), and [review procedure](review.md) for findings and readiness. Do not weaken validation merely to obtain a pass.
