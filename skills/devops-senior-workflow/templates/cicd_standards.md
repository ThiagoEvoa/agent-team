# CI/CD Pipeline Standards

## General Principles
- **Fast Fail:** Run linters and unit tests first.
- **Artifacts:** Build once, deploy many times.
- **Visibility:** Status badges and clear logs for failures.

## GitHub Actions Architecture
### Workflow Triggers (`on`)
- **Event-driven:** Use `push` for main/release branches, `pull_request` for verification.
- **Manual Control:** Include `workflow_dispatch` for on-demand runs and debugging.
- **Reusable:** Use `workflow_call` to enable modular pipeline components.

### Hierarchy & Dependency
- **Jobs:** Units of work on a runner. Parallel by default.
- **Dependencies:** Use `needs: [job_name]` to enforce sequential order (e.g., Deploy needs Build).
- **Concurrency:** Use `concurrency` groups to cancel in-progress runs on the same branch to save runner minutes.

### Modularization
- **Reusable Workflows:** Prefer for complex, multi-job shared logic across repos.
- **Composite Actions:** Use to bundle repetitive steps (e.g., "Setup Flutter & Auth") into a single step.

## Pipeline Stages
1. **Lint/Format:** Code style and static analysis.
2. **Test:** Unit and integration tests.
3. **Security:** SAST, dependency scanning, secret detection.
4. **Build:** Containerize and push to registry.
5. **Deploy:** Staged rollout (Dev -> Staging -> Prod).

## Deployment & Environments
- **Environments:** Use GitHub Environments (e.g., `production`) for deployment jobs.
- **Protection Rules:** Enable "Required Reviewers" and "Wait Timers" for production environments.
- **OIDC:** Use OpenID Connect for cloud authentication (AWS/GCP/Azure) to avoid long-lived secrets.

## GitHub Actions Best Practices
- **Actions Versioning:** Use `actions/checkout@v4`.
- **Caching:** Explicitly cache dependencies (npm, pub, etc.) to reduce build time.
- **Runner Selection:** Default to `ubuntu-latest` unless specific OS requirements exist.
- **Cleanup:** Implement post-deployment health checks and rollback triggers.

