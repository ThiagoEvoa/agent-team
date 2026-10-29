# GitHub Projects and issue operations

Use for live issue/project reads, publication, linking, field changes, or closure. Work-item content comes from [backlog planning](backlog.md); status meaning comes from [lifecycle reporting](lifecycle.md).

Read the relevant spec, repository/project conventions, current issues/items, and the user's authorized scope. Distinguish a prioritization proposal from a request to mutate a live board. Discover actual GitHub tool capabilities or the installed `gh` CLI; do not assume the issue connector also supports Projects v2 writes.

Establish exact repository, project owner/number, project ID, item IDs, field IDs, and single-select option IDs. Inspect live field schemas and map semantic states to actual names/options instead of inventing IDs or creating a replacement workflow. CLI discovery examples, to verify against the installed CLI:

```text
gh project view PROJECT_NUMBER --owner PROJECT_OWNER --format json
gh project field-list PROJECT_NUMBER --owner PROJECT_OWNER --format json
```

Use paginated item/issue reads when necessary; do not report partial pages as a complete board. Report missing permissions/capabilities and continue with a local backlog plan when live operations are unavailable. Do not install tools, change auth scopes, or switch shared accounts silently.

For authorized publication choose the appropriate type: a project draft item or a repository issue linked to the project. Capture the returned issue URL and item ID; verify linkage and fields. Use structured bodies or temporary body files for multiline CLI content, not shell-interpolated descriptions. Issue creation, project linking, and field updates may succeed separately: inspect state after a failure before retrying. Do not duplicate successful items.

For a live update re-read target state, apply scoped changes, and verify the result. Preserve links/IDs and unresolved partial writes. Issue closure and board Done are separate operations; neither is inferred from a developer claim.
