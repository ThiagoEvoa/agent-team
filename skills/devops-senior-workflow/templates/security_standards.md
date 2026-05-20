# Security & Secrets Standards

## Secrets Management
- **NEVER** commit plain-text secrets (API keys, passwords, private keys) to the repository.
- Use a dedicated Secret Manager:
  - GitHub Actions Secrets (scoped to repo or environment).
  - Kubernetes Secrets (with encryption-at-rest).
  - AWS Secrets Manager / HashiCorp Vault.

## GitHub Actions Hardening
- **SHA Pinning:** Pin third-party actions to a full length commit SHA (e.g., `uses: actions/checkout@8ade135...`) for immutability.
- **Least Privilege:** Explicitly define `permissions` for the `GITHUB_TOKEN` at the top of the workflow:
  ```yaml
  permissions:
    contents: read
    id-token: write # Required for OIDC
  ```
- **Injection Prevention:** NEVER interpolate GitHub context directly into shell scripts. Use environment variables:
  ```yaml
  # BAD
  run: echo "Hello ${{ github.event.issue.title }}"
  # GOOD
  run: echo "Hello $ISSUE_TITLE"
    env:
      ISSUE_TITLE: ${{ github.event.issue.title }}
  ```

## Cloud Authentication (OIDC)
- Prefer **OpenID Connect** over long-lived IAM keys for AWS, GCP, and Azure.
- Enables short-lived, identity-based tokens for deployment.

## Container Security
- Use `readonly` file systems where possible.
- Mount secrets as files with restricted permissions (e.g., `400`).

## Pipeline Security
- Use "Secret Scanning" tools in CI (e.g., `gitleaks`, `trufflehog`).
- Rotate credentials regularly.
- Apply the Principle of Least Privilege to service accounts used in CI/CD.
