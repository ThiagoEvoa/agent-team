# Firebase service contracts

Use for local Firebase configuration, rules, indexes, Functions, and service-specific implementation/review contracts.

Read existing domain invariants and use [design guidance](design.md) when boundaries change. Build the smallest compatible change and keep configuration versioned. Avoid broad initialization that overwrites files. Keep Admin credentials out of clients, queries bounded, fixtures synthetic, and logs/remote reads limited to necessary fields.

| Service | Check when affected |
|---|---|
| Authentication | Provider configuration, ownership/roles, claim trust boundary; privileged user/claim changes are remote mutations |
| Firestore / Realtime Database | Access patterns, tenant isolation, schema validation, bounded queries, indexes, transaction behavior, explicit database/path |
| Storage | Ownership, path isolation, size/type limits, private download URL handling |
| Security Rules | Deny by default; authenticated/unauthenticated, owner/non-owner, cross-tenant, malformed and role cases |
| Functions | Supported runtime/region, secrets, input validation, authorization, idempotency/retries, least-privilege service account |
| Hosting / App Hosting | Build/output, rewrites, environment/secret handling, preview versus production target |
| Messaging / Remote Config | Exact audience/template, user impact, concurrency/version handling, authorization before sending/publishing |
| Logs / Crashlytics | Bounded/redacted evidence; issue-state changes are mutations |
| Data Connect | Supported schema/build/query tools, schema and operation validation, read versus mutation distinction |

Never weaken rules to make a feature pass. SDK configuration is not an authorization boundary.

Before resource/tool operations load [target verification](firebase-targets.md). For tests load [Firebase validation](firebase-validation.md); cloud mutations require [Firebase operations](firebase-operations.md).

Verify uncertain service behavior against [official Firebase service documentation](https://firebase.google.com/docs) for the selected SDK/runtime version.
