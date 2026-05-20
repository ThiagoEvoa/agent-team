# Kubernetes Standards

## Manifests
- Use declarative YAML.
- Labels: Always include `app`, `env`, and `version`.

## Reliability
- **Probes:**
  - `livenessProbe`: Restart unhealthy containers.
  - `readinessProbe`: Traffic routing safety.
- **Resources:**
  - Always set `requests` and `limits` for CPU and Memory.

## Configuration
- `ConfigMaps`: For non-sensitive env vars.
- `Secrets`: For credentials, encrypted at rest.

## Deployment Strategy
- Prefer `RollingUpdate`.
- Use `HorizontalPodAutoscaler` (HPA) for dynamic scaling.
