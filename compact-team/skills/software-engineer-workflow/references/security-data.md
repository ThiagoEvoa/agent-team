# Sensitive data and error handling

Use for secrets, sensitive-data lifetime, private outputs/logs, secure storage/transport, and public error mapping.

Keep secrets and privileged operations out of clients, public assets, source control, fixtures, screenshots, and logs. Read only the private fields needed for the task. Return deliberate public errors while retaining useful redacted diagnostics at the established logging boundary; do not echo raw input, credentials, tokens, or database internals.

Minimize sensitive-data copies and lifetime, using platform-supported secure storage and transport. Do not promise reliable memory erasure for immutable strings or garbage-collected runtimes; avoid creating unnecessary copies instead. Keep business rejection and infrastructure failure distinguishable according to the project's error contract.

For cryptographic API contracts load [cryptography](cryptography.md) only when affected.

For credential/artifact scanning use [security scanning](security-scanning.md). Report redacted evidence and distinguish confirmed exposure from unverified risk using the [review procedure](review.md).
