# Container image construction

Use for Dockerfiles, image build/runtime compatibility, caching, and container hardening.

Use compatible official/minimal pinned base images and cache-aware stages. Copy dependency manifests before frequently changing sources, separate build tools from runtime artifacts, exclude unnecessary context with `.dockerignore`, and run as non-root. Verify native binary compatibility with runtime libraries; a smaller image is useful only if it runs the artifact. Keep credentials out of layers and use supported build/runtime secret mechanisms. Apply read-only filesystems and restricted mounts where compatible.

Run existing hadolint/build/container checks when available. Use [security scanning](security-scanning.md) for image vulnerability checks and [deployment](deployment.md) for running an image in an environment.
