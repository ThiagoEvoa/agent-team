# Deployment execution and verification

Use for authorized workflow dispatch, rollout, environment diagnosis, health verification, or recovery. Configuration authoring stays in the relevant container/pipeline/runtime reference.

Use the [diagnosis loop](diagnosis.md) to reproduce the actual failing step/container with its command, image, environment, and artifact inputs. For application failures use the runtime's reproduction tools. Narrow a hypothesis, fix the cause, and rerun the failed stage; do not demand Dart tooling for generic infrastructure failures.

Run available config linters, such as hadolint or kube-linter, relevant [security scans](security-scanning.md), and local build/test checks. Use existing Compose/local cluster tools where warranted. Review environment readiness and ordering using the [review procedure](review.md). Missing tools are verification gaps, not successful checks or automatic installation permission.

Complete local preparation before remote dispatch/deployment. Verify environment and authorized scope, preserve run/job IDs, and confirm final status and relevant health checks. A dispatched workflow is not a successful pipeline. For Firebase cloud changes also apply [Firebase operations](firebase-operations.md). On failure inspect redacted diagnostics and use the authorized recovery path rather than repeated speculative deployments. Report changes, checks, affected artifact/environment, remote outcome, and remaining gaps.
