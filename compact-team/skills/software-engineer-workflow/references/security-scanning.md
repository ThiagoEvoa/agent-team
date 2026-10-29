# Security scanner selection and evidence

Use only when selecting, running, or interpreting SAST, secret, dependency, or image scans.

Select security scanning from the artifacts and boundaries being changed, using existing project tools and policy first:

| Check | Apply when relevant | Evidence to retain |
|---|---|---|
| Static application security analysis (SAST) | Application or workflow changes affect untrusted input, privileged operations, or other security-sensitive paths | Scanner/ruleset, revision/files scanned, actionable findings, and exclusions |
| Secret scanning | Source, configuration, CI, or generated artifacts may expose credentials | Supported scanner such as an already configured gitleaks or trufflehog; scan scope and redacted results |
| Dependency vulnerability analysis | Manifests, lockfiles, or shipped runtime dependencies change | Resolved versions, advisory/database freshness, affected configurations, and whether the vulnerable path applies |
| Container image scanning | Building or changing a shipped image/base image | Final runtime image digest, scanner such as configured Trivy, database freshness, OS/package findings, and runtime relevance |

Report pass/fail/not run, distinguish newly introduced from confirmed baseline findings, and assess applicability rather than blindly suppressing or upgrading everything. Use configured checks in CI where appropriate; arranging a new scanner or installation is implementation work within the task's scope, not an implicit review step. Missing tools or stale/offline advisory databases limit the evidence. Never expose a detected secret in reports or use a real credential to test whether it works. Follow the affected [authorization](security-auth.md), [input validation](security-input.md), or [sensitive-data](security-data.md) contracts; scanner success does not establish access-control correctness.
