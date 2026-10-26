# DevOps across stacks

Inspect the existing CI workflows, Dockerfiles, orchestration/IaC, runtime pins, artifact contracts, environments, and secret handling. Preserve the repository's deployment topology and tools. Use declarative, idempotent configuration and reproducible artifacts; prefer replacing immutable infrastructure over ad hoc runtime patches.

Combine this profile with the affected application profile:
- Go: affected modules/workspace, Go/toolchain versions, build tags, target architecture, cgo/runtime libraries, race-capable test stage, binary entrypoint and shutdown.
- Rust: selected crates/features/targets, toolchain/MSRV, native dependencies, runtime libraries.
- Flutter/Dart: SDK/workspace resolution, generation, platform builds and tests.
- Dart Frog: server build, handler tests, actual compilation mode, entrypoint and health.
- Astro/Next.js: package manager/lockfile, framework/Node versions, static versus server output, adapter/runtime, environment boundaries, preview and production build checks.
- Firebase: Functions runtime, rules/emulator tests, explicit project and scoped service targets.

## Containers and orchestration

Use compatible official/minimal pinned base images and cache-aware stages. Copy dependency manifests before frequently changing sources, separate build tools from runtime artifacts, exclude unnecessary context with `.dockerignore`, and run as non-root. Verify native binary compatibility with runtime libraries; a smaller image is useful only if it runs the artifact. Keep credentials out of layers and use supported build/runtime secret mechanisms. Apply read-only filesystems and restricted mounts where compatible.

For Kubernetes, preserve environment separation and namespace scope; include appropriate health/readiness probes, CPU/memory requests and limits, declarative rollout behavior, and identifying labels. Keep non-sensitive configuration separate from credentials; a Secret object does not by itself establish encryption or safe repository storage. Use existing secret management.

## Pipelines and security

Prefer fast lint/test feedback, relevant security checks, build-once artifacts, and explicit deployment stages. Reuse workflow components when useful; use concurrency controls and protected environments as appropriate. Match caches to lockfiles, SDKs, targets, and relevant build inputs. Prevent untrusted contributions from reaching privileged deploy credentials.

Use minimal explicit token permissions, reviewed action commit pins, and established OIDC/cloud authentication where supported. Pass untrusted CI context through safely handled inputs/environment rather than interpolating it directly into shell code. Do not expose secrets through command arguments, generated files, logs, or reports. Configure secret/account changes only within authorized scope and safe input mechanisms.

## Diagnosis, validation, and delivery

Use the [diagnosis loop](diagnosis.md) to reproduce the actual failing step/container with its command, image, environment, and artifact inputs. For application failures use the runtime's reproduction tools. Narrow a hypothesis, fix the cause, and rerun the failed stage; do not demand Dart tooling for generic infrastructure failures.

Run available config linters, such as hadolint or kube-linter, and relevant local build/test checks. Use existing Compose/local cluster tools where warranted. Review through the [shared procedure](review.md), including permissions, secret exposure, cache correctness, artifact compatibility, and deployment ordering. Missing tools are verification gaps, not successful checks or automatic installation permission.

Complete local preparation before remote dispatch/deployment. Verify environment and authorized scope, preserve run/job IDs, and confirm final status and relevant health checks. A dispatched workflow is not a successful pipeline. Firebase operations also follow [its profile](firebase.md). On failure inspect redacted diagnostics and use the authorized recovery path rather than repeated speculative deployments. Report changes, checks, affected artifact/environment, remote outcome, and remaining gaps.
