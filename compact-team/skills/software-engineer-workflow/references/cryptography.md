# Cryptographic API contracts

Use when implementing or reviewing encryption, signatures, keys, passwords, or token cryptographic verification.

Use established cryptographic APIs and supported authentication/password/token libraries. Preserve their required nonce, key, randomness, signature, and expiry rules. Never invent cryptographic algorithms or treat decoding a token as signature verification. Check uncertain library contracts against the installed version's authoritative documentation. Credential rotation, IAM/account changes, and remote remediation require the task's corresponding scope.

Use [sensitive-data handling](security-data.md) for exposure/lifetime concerns and [authorization](security-auth.md) for trust and permissions. Correct cryptography alone does not establish resource authorization.
