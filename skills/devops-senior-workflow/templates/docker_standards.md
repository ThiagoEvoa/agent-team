# Docker Standards

## Base Images
- Use official, minimal base images (e.g., `alpine`, `slim`).
- Pin versions: e.g., `node:20-alpine`, avoid `latest`.

## Multi-Stage Builds
- Separate the build environment from the runtime environment.
- Standard pattern: Copy dependencies and build source in a `builder` stage, then copy final production artifacts (e.g. static files, compiled binaries) into a minimal runtime image.

## Security
- `USER` instruction: Never run containers as root.
- Scan images for vulnerabilities (e.g., using `trivy`).
- Avoid installing build tools, compiler dependencies, or SSH in the final production image.

## Performance
- Optimize caching: Copy dependency manifests (e.g. `package.json`) and run installation before copying the rest of the source.
- Exclude `node_modules`, `.git`, build logs, etc., using `.dockerignore`.
