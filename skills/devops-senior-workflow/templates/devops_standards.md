# DevOps Standards

## 1. Project Structure & Principles
- **Structure:** `.github/workflows/` (pipelines), `infra/docker/` (Dockerfiles), `infra/k8s/` (Kubernetes), `infra/terraform/` (IaC), `scripts/`.
- **Declarative:** Use IaC/manifests instead of manual shell commands. Keep infra code separate from application logic.
- **Parity:** Maintain environment consistency (Dev, Staging, Prod) via Kustomize or Helm. Namespace-scoped K8s resources.

## 2. Kubernetes
- **Manifests:** Use declarative YAML with `app`, `env`, and `version` labels.
- **Reliability:** Implement `livenessProbe` and `readinessProbe`. Always set CPU/Memory `requests` and `limits`.
- **Config:** Use `ConfigMaps` for non-sensitive env vars and `Secrets` for credentials. Use `RollingUpdate` deployment.

## 3. CI/CD Pipelines (GitHub Actions)
- **General:** Fast-fail (lint/test first), build once/deploy many, reusable workflows/composite actions, use concurrency groups.
- **Stages:** 1. Lint/Format -> 2. Test -> 3. Security (SAST/secrets) -> 4. Build -> 5. Deploy.
- **Deploy:** Use environments with protection rules (reviews/timers) and OpenID Connect (OIDC) for cloud authentication.

## 4. Security & Hardening
- **Secrets:** NEVER commit plain secrets. Use GitHub Secrets, K8s Secrets, or Vault/AWS Secrets Manager.
- **Workflows:** Explicitly set minimal `GITHUB_TOKEN` permissions. Pin actions to commit SHA. NEVER interpolate GitHub context directly into shell scripts (use environment variables instead).
- **Containers:** Run as non-root (`USER`). Use read-only file systems and mount secrets as files (permissions `400`).
- **Scanning:** Run SAST and secret scanning (`gitleaks`, `trufflehog`) in CI. Rotate credentials regularly.
