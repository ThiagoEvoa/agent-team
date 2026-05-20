# DevOps Architecture Standard

## 📁 Infrastructure Structure
```text
/
├── .github/
│   └── workflows/      # CI/CD Pipeline definitions (Actions)
├── infra/
│   ├── docker/         # Dockerfiles and context-specific scripts
│   │   ├── app.Dockerfile
│   │   └── db.Dockerfile
│   ├── k8s/            # Kubernetes manifests or Helm charts
│   │   ├── base/
│   │   └── overlays/
│   └── terraform/      # Infrastructure as Code
├── scripts/            # Automation and maintenance scripts
├── .dockerignore       # Global Docker exclusions
└── docker-compose.yml  # Local development orchestration
```

## 🏗️ Deployment Principles
- **Declarative over Imperative:** Use manifests and IaC instead of manual shell commands for deployment.
- **Separation of Concerns:** Keep infrastructure code (`infra/`) separate from application logic (`lib/`, `src/`).
- **Environment Parity:** Maintain consistency between Dev, Staging, and Production manifests using tools like Kustomize or Helm.

## 🛠️ Tooling Expectations
- **Docker:** Multi-stage builds are mandatory.
- **Kubernetes:** Namespace-scoped resources with clear labeling.
- **Pipelines:** Must include automated rollbacks or "stop-on-failure" logic.
