# CI pipeline design

Use for workflow stages, artifact contracts, caches, permissions, secrets, and build/test automation.

Inspect the existing CI workflows, Dockerfiles, orchestration/IaC, runtime pins, artifact contracts, environments, and secret handling. Preserve the repository's deployment topology and tools. Use declarative, idempotent configuration and reproducible artifacts; prefer replacing immutable infrastructure over ad hoc runtime patches.

Combine this profile with the affected application profile:
- Go: affected modules/workspace, Go/toolchain versions, build tags, target architecture, cgo/runtime libraries, race-capable test stage, binary entrypoint and shutdown.
- Rust: selected crates/features/targets, toolchain/MSRV, native dependencies, runtime libraries.
- Flutter/Dart: SDK/workspace resolution, generation, platform builds and tests.
- Dart Frog: server build, handler tests, actual compilation mode, entrypoint and health.
- Astro/Next.js: package manager/lockfile, framework/Node versions, static versus server output, adapter/runtime, environment boundaries, preview and production build checks.
- Firebase: Functions runtime, rules/emulator tests, explicit project and scoped service targets.

Prefer fast lint/test feedback, relevant security checks, build-once artifacts, and explicit deployment stages. Reuse workflow components when useful; use concurrency controls and protected environments as appropriate. Match caches to lockfiles, SDKs, targets, and relevant build inputs. Prevent untrusted contributions from reaching privileged deploy credentials.

Use minimal explicit token permissions, reviewed action commit pins, and established OIDC/cloud authentication where supported. Pass untrusted CI context through safely handled inputs/environment rather than interpolating it directly into shell code. Do not expose secrets through command arguments, generated files, logs, or reports. Configure secret/account changes only within authorized scope and safe input mechanisms.

For scanner selection use [security scanning](security-scanning.md); for workflow dispatch or environment rollout use [deployment](deployment.md).
