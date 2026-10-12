---
name: firebase-workflow
description: Workflow and procedural guidance for the Firebase Agent to configure services, implement Security Rules and Functions, validate with emulators, and perform authorized Firebase operations using available Firebase MCP tools.
---

# Firebase Workflow Skill

Use for Firebase project/service configuration, backend implementation, rules, indexes, and Firebase-specific operations. Application UI and SDK consumption remain with platform developers; general CI/CD remains with DevOps.

## Objectives
1. **Verified tooling:** Discover Firebase MCP capabilities and use actual tool schemas.
2. **Correct target:** Confirm account, project, directory, resource IDs, and environment before operations.
3. **Secure implementation:** Enforce least privilege and validate client authorization behavior.
4. **Safe operations:** Prefer emulators; require explicit authorization for cloud side effects.
5. **Evidence-backed delivery:** Separate local edits, tests, remote changes, and deployment status.

## 🛑 Core Rules
- Read repository instructions and acceptance criteria before editing.
- Never infer a production target from a project alias, working directory, or previously selected account alone.
- Confirm authorization for each planned cloud mutation scope. Stop if target, environment, or impact is ambiguous.
- For destructive changes, confirm exact resource IDs, irreversible effects, and recovery/backup plan before proceeding. Never delete projects, databases, user accounts, or production data as routine cleanup.
- Do not change billing plans, enable paid services, rotate credentials, or change IAM without explicit approval.
- Use bounded queries and minimal fields. Redact user data, registration tokens, credentials, and sensitive logs; never paste service-account keys into prompts or reports.
- Never use public allow-all rules as a workaround. Separate development, staging, and production.
- Do not assume MCP calls target emulators because emulator processes are running or environment variables exist. Verify routing for each tool; if unknown, treat it as cloud access.
- No dependency installation, MCP configuration changes, git mutations, or external publication without authorization.
- Never claim testing or deployment succeeded unless verified. Report blocked checks explicitly.

## Trusted References
- Firebase MCP setup, tools, prompts, and resources: https://firebase.google.com/docs/ai-assistance/mcp-server
- Firebase CLI: https://firebase.google.com/docs/cli
- Emulator Suite: https://firebase.google.com/docs/emulator-suite
- Security Rules and tests: https://firebase.google.com/docs/rules and https://firebase.google.com/docs/rules/unit-tests
- Service documentation: https://firebase.google.com/docs

Consult current official documentation and exposed MCP resources for selected services and versions; documentation examples are discovery hints, not guaranteed runtime APIs.

## Workflow

### 0. Tool Availability Gate
1. Discover tools exposed by the Firebase MCP server; `firebase` and `firebase-mcp-server` are server-name hints, not fixed namespaces.
2. Inspect descriptions and argument schemas before invocation. Identify read-only, local-writing, cloud-mutating, destructive, and billing-impacting operations.
3. Discover relevant resources/prompts when supported. Read service initialization/rules guides before using initialization or deployment tools; prompts do not waive approval requirements.
4. Choose path:
   - **Available:** Use verified tools and retain returned resource IDs/job IDs.
   - **Partial:** Use supported operations; edit local files and run existing emulator/test tooling for gaps.
   - **Unavailable:** Continue local inspection, implementation, and tests when possible. Report remote work blocked; request connection/access rather than simulating success.
5. Setup reference (only configure/install with approval):

   ```json
   {
     "mcpServers": {
       "firebase": {
         "command": "npx",
         "args": ["-y", "firebase-tools@latest", "mcp"]
       }
     }
   }
   ```

   Requires Node.js/npm compatible with the selected Firebase CLI. Server uses Firebase CLI credentials (logged-in user or Application Default Credentials); local server can access remote services. Use a reviewed pinned version where reproducibility requires it.
6. Optional `--dir /absolute/project/path` fixes project context; `--only auth,firestore,storage` limits feature groups while core tools remain available. Verify supported flags/groups for the installed version.
7. If authentication is missing, request approved sign-in through supported tooling. Never read or print credential files. Do not log out or switch shared accounts silently.

### 1. Context & Target Verification
1. Inspect `firebase.json`, `.firebaserc`, SDK configuration, rules/index paths, Functions sources, package manifests, and emulator configuration. Preserve existing environments and service boundaries.
2. Use exposed environment/project/app inspection tools to compare active remote context with repository configuration. Names such as `firebase_get_environment` and `firebase_get_project` are documented examples; discover actual exposed names and schemas.
3. Record directory, account identity (without credentials), explicit project ID, environment, app ID/platform, database ID, bucket, region, and service targets as applicable.
4. Resolve mismatches before operations. Do not create resources or switch project/account context automatically to make a command pass.
5. Establish requested deliverable, acceptance criteria, data sensitivity, deployment authorization, and expected cost/scale. Ask only for blocking choices.

### 2. Plan & Implement Locally
1. Present concise plan: affected files/services, resource targets, local versus remote operations, validation, cost risks, and rollback approach.
2. Implement smallest compatible change; inspect SDK/runtime versions before choosing APIs.
3. Apply relevant service checks:

   | Service | Required checks |
   |---|---|
   | Authentication | Provider configuration, ownership/roles, custom-claim trust boundary; privileged user updates need approval |
   | Firestore / Realtime Database | Access patterns, bounded queries, schema validation, tenant isolation, indexes, transactions, and explicit database/path targets |
   | Storage | Ownership, size/content-type limits, path isolation, and private download URL handling |
   | Security Rules | Deny by default; authenticated, owner, non-owner, cross-tenant, malformed, and privileged-role cases |
   | Functions | Supported runtime/region, secrets management, input validation, authorization, idempotency/retries, and service-account permissions |
   | Hosting / App Hosting | Correct service, build/output config, rewrites, environment/secrets, and preview versus production target |
   | Messaging / Remote Config | Exact audience/template, user impact, version/concurrency handling, explicit approval before sending/publishing |
   | Crashlytics / logs | Bounded time range, minimal/redacted evidence, reproduced failure; issue-state changes require approval |
   | Data Connect | Discover available schema/build/query capabilities, validate schema/operations, distinguish read queries from mutations |

4. Keep rules, indexes, and service configuration versioned at repository paths. Do not overwrite files via broad initialization without reviewing the proposed scope.
5. For client integration, hand off project/app IDs, SDK configuration paths, emulator endpoints, auth assumptions, and required operations to Flutter/web developer. SDK config is not an authorization boundary; never ship Admin credentials to clients.

### 3. Validate Before Remote Changes
1. Run existing formatting, lint, build, and unit tests for changed code using installed tooling.
2. Use available MCP rule validation for syntax if supported. Then run authorization tests with Emulator Suite and the project's rules-testing library. Syntax success alone is insufficient.
3. Test unauthenticated, allowed, denied, cross-user/tenant, malformed-input, and role cases for affected resources. Admin SDK and privileged MCP operations may bypass rules; validate using client contexts.
4. Exercise Functions/database behavior against emulators where supported; verify connection targets and keep fixtures synthetic. Use existing scripts or a scoped `firebase emulators:exec --project <explicit-project-id> ...` command after checking installed CLI and configuration.
5. For indexes, builds, integrations, or cloud-only behavior not covered locally, state gaps and obtain approval for isolated remote verification. Do not claim emulator success proves production deployment or scale.
6. If tooling is missing, report which checks were not run. Request permission before installing tools or downloading emulator dependencies.

### 4. Authorized Remote Execution
1. Re-check account, project, directory, resource IDs, and environment immediately before mutation. Present exact service/resource scope, expected side effects/costs, and recovery plan; obtain approval covering that scope.
2. Prefer staging/preview and narrowly scoped operations. Do not deploy all services when only one was requested.
3. Use supported Firebase MCP mutation/deployment tools. If absent, an approved CLI fallback must use explicit project and service targets; report fallback rather than silently substituting tools.
4. Preserve returned operation/job IDs. Poll exposed status tools for asynchronous jobs; distinguish accepted, pending, succeeded, and failed states. A started job is not a successful deployment.
5. Verify resulting state with bounded read-only checks and approved smoke tests. Never send real push notifications as an incidental test.
6. On failure, inspect redacted diagnostics, stop further mutations, and use the approved recovery path. Restoring a deployment does not restore deleted data; backups and recovery procedures are service-specific.

### 5. Delivery Report

```markdown
## Firebase Handoff
- Target: project ID, environment, directory, relevant app/database/bucket/region
- Changes: files and cloud resources changed; tools or approved fallback used
- Security: access model, rule cases tested, secrets handling
- Validation: passed / failed / not run, with command/tool evidence and reasons
- Deployment: not requested / not run / pending / succeeded / failed; job ID if applicable
- Integration: SDK/config paths and platform-developer follow-up
- Risks: validation gaps, cost implications, recovery/rollback requirements
```

Keep report concise. Do not include credentials, private records, or sensitive log payloads.
