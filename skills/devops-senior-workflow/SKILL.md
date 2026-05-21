---
name: devops-senior-workflow
description: Workflow and procedural guidance for the Senior DevOps Specialist, focusing on containerization, orchestration, and CI/CD automation using GitHub integrations.
resources:
  - templates/architecture.md
  - templates/docker_standards.md
  - templates/k8s_standards.md
  - templates/cicd_standards.md
  - templates/security_standards.md
---

# Senior DevOps Specialist Workflow

Use this skill to guide the infrastructure and automation processes. It outlines the specific workflow for managing containers, Kubernetes clusters, and CI/CD pipelines.

## Objectives
- **Automated Reliability:** Implement idempotent and self-healing infrastructure.
- **Security by Design:** Enforce "Shift-Left" security principles in all pipelines and container images.
- **Optimization:** Ensure minimal container footprints and efficient resource utilization in orchestrators.
- **Standardization:** Follow the mandatory patterns defined in the `templates/` directory.
- **GitHub Automation Control:** Configure GitHub Actions pipelines, automate workflow dispatch triggers, and securely manage environment secrets.

## Instructions

### 1. Infrastructure Audit & Planning
- **Discovery:** Evaluate existing `Dockerfile`s, `.github/workflows`, and K8s manifests. Use `grep_search` to find scattered configurations.
- **Planning:** Before making changes, consult `templates/architecture.md` to ensure correct file placement and naming.

### 2. Containerization & Orchestration
- **Docker:** Strictly follow `templates/docker_standards.md`. Focus on multi-stage builds and non-root users.
- **Kubernetes:** Apply `templates/k8s_standards.md` for all manifests. Ensure liveness/readiness probes and resource limits are defined.

### 3. Pipeline Automation
- **CI/CD:** Utilize `templates/cicd_standards.md` to build robust pipelines. Ensure every stage (Lint -> Test -> Build -> Deploy) is represented.
- **Secrets Management:** Verify compliance with `templates/security_standards.md`. NEVER hardcode credentials. For GitHub Actions secrets, use GitHub CLI (`gh secret set <secret-name> --body "<secret-value>"`) to manage them securely.

### 4. Validation & Operations Phase
1. **Lint:** Run `hadolint` for Dockerfiles or `kube-linter` for K8s if available.
2. **Local Test:** Use `docker-compose` or `minikube` to verify manifests.
3. **Pipeline Dispatch:** Trigger and test the CI/CD workflows using GitHub CLI (`gh workflow run <workflow-name>`).
4. **Pipeline Monitoring:** Monitor run status using `gh run list` and view specific run logs with `gh run view <run-id>`.
5. **Health Check:** Verify service availability after deployment.

### 5. Handoff
Synthesize the changes made to the infrastructure, new environments created, updated GitHub workflows/secrets, and any manual steps or secrets that need user attention.
