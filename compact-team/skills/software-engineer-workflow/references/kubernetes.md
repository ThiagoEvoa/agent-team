# Kubernetes workload configuration

Use for Kubernetes manifests, health probes, resources, rollout settings, and namespace configuration.

For Kubernetes, preserve environment separation and namespace scope; include appropriate health/readiness probes, CPU/memory requests and limits, declarative rollout behavior, and identifying labels. Keep non-sensitive configuration separate from credentials; a Secret object does not by itself establish encryption or safe repository storage. Use existing secret management.

Run existing kube-linter/local-cluster checks where warranted. Use [deployment](deployment.md) for environment operations and [security scanning](security-scanning.md) for relevant artifact checks.
