# Firebase engineering and operations

## Tool and target verification

Use this profile for service configuration, rules, indexes, Functions, emulator work, or service operations. Client UI/SDK work starts with its application profile and adds Firebase when backend resources/contracts change.

Discover actual Firebase MCP tools and inspect schemas; availability depends on server version and enabled groups. Prefer supported Firebase MCP operations, use local repository/emulator tooling for gaps, and report missing capabilities. Server installation, authentication changes, and MCP configuration are separate operations requiring task authorization. Never read or print credential files.

Inspect `firebase.json`, `.firebaserc`, SDK configuration, rules/index paths, Functions manifests, runtime versions, and emulator settings. Before resource operations establish account, explicit project ID, directory, environment, and relevant app/database/bucket/region. Resolve mismatches before acting. Do not infer production from an alias or switch account/project to make a command pass. Verify each tool's emulator/cloud routing; unknown routing is cloud access even if emulators are running.

## Implement and design

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

## Diagnose, test, and review

Use the [diagnosis loop](diagnosis.md) with a minimal request, emulator rules check, captured event, or service test. Compare actual project/resource targets and client permissions first. Dart client bugs use Dart tools; other Functions runtimes use their own repository tooling.

Run formatting/lint/build/unit checks with existing tools. Rules syntax validation alone is insufficient: test allowed, denied, unauthenticated, cross-user/tenant, malformed, and privileged-role cases through client contexts. Admin/MCP operations may bypass rules. Exercise affected Functions/database behavior against emulators with verified routing and explicit project targets. Check locally unsupported integration behavior separately; emulator success proves neither deployment nor scale.

Use the shared [review procedure](review.md), checking service contracts above against actual acceptance criteria. Do not load Dart-specific review standards for non-Dart rules/Functions. Report unavailable tests and missing emulator dependencies; obtain any necessary installation/download authorization before adding tools.

## Remote operations and completion

Use existing authorization for the verified target and scope; local implementation alone does not authorize cloud changes. Before a still-unauthorized mutation, present the concrete resources, environment, side effects/costs, and recovery approach. Billing/IAM/credential changes, user/claim updates, notification sending, project/resource creation, deployment, and destruction need corresponding authorization. Destructive scope must include exact IDs, irreversible effects, and recovery/backup expectations.

Prefer staging/preview and narrow service/resource operations. Re-check target immediately before execution. Use supported MCP mutations or an authorized CLI fallback with explicit project and service targets. Preserve operation/job IDs and verify completion/state with bounded checks. On failure inspect diagnostics, stop speculative mutations, and follow the authorized recovery path; deployment rollback does not restore deleted data.

Report target, files/resources changed, security cases, validation, deployment status/job outcome, integration configuration/endpoints, and gaps. Add [DevOps](devops.md) for general CI/infrastructure while retaining these Firebase target controls.

Official references: [Firebase MCP](https://firebase.google.com/docs/ai-assistance/mcp-server), [CLI](https://firebase.google.com/docs/cli), [Emulators](https://firebase.google.com/docs/emulator-suite), [Rules tests](https://firebase.google.com/docs/rules/unit-tests), [service documentation](https://firebase.google.com/docs). Verify APIs/versions when needed.
