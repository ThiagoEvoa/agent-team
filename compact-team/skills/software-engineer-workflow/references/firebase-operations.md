# Firebase cloud mutations

Use only for authorized remote Firebase changes and completion/recovery checks. Establish [tool targets](firebase-targets.md) immediately before execution.

Use existing authorization for the verified target and scope; local implementation alone does not authorize cloud changes. Before a still-unauthorized mutation, present the concrete resources, environment, side effects/costs, and recovery approach. Billing/IAM/credential changes, user/claim updates, notification sending, project/resource creation, deployment, and destruction need corresponding authorization. Destructive scope must include exact IDs, irreversible effects, and recovery/backup expectations.

Prefer staging/preview and narrow service/resource operations. Re-check target immediately before execution. Use supported MCP mutations or an authorized CLI fallback with explicit project and service targets. Preserve operation/job IDs and verify completion/state with bounded checks. On failure inspect diagnostics, stop speculative mutations, and follow the authorized recovery path; deployment rollback does not restore deleted data.

Report target, files/resources changed, security cases, validation, deployment status/job outcome, integration configuration/endpoints, and gaps. Add [deployment](deployment.md) for general CI/infrastructure while retaining these Firebase target controls.
