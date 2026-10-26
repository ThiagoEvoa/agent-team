# Product ownership and GitHub Projects

## Establish the target and state

Read the relevant spec, repository/project conventions, current issues/items, and the user's authorized scope. Distinguish a prioritization proposal from a request to mutate a live board. Discover actual GitHub tool capabilities or the installed `gh` CLI; do not assume the issue connector also supports Projects v2 writes.

Establish exact repository, project owner/number, project ID, item IDs, field IDs, and single-select option IDs. Inspect live field schemas and map semantic states to actual names/options instead of inventing IDs or creating a replacement workflow. CLI discovery examples, to verify against the installed CLI:

```text
gh project view PROJECT_NUMBER --owner PROJECT_OWNER --format json
gh project field-list PROJECT_NUMBER --owner PROJECT_OWNER --format json
```

Use paginated item/issue reads when necessary; do not report partial pages as a complete board. Report missing permissions/capabilities and continue with a local backlog plan when live operations are unavailable. Do not install tools, change auth scopes, or switch shared accounts silently.

## Ingest and prioritize

Before converting a feature spec into implementation-ready items, check for numbered user stories, observable acceptance criteria, implementation contracts, testing decisions with an explicit seam, and out-of-scope boundaries. Use [specification guidance](specification.md) to repair gaps within scope. Incomplete work can remain a clearly identified discovery/draft item; do not mark it implementation-ready or manufacture a required approval interview.

Create cohesive, independently verifiable work items tied to user outcomes and acceptance criteria. Avoid an issue for every mechanical checklist line. Record dependencies, constraints, relevant design/assets, verification expectations, and the originating spec. Search for existing items and reuse/update them when appropriate; preserve useful context and user-owned prioritization.

Prioritize from value, urgency, risk reduction, dependencies, and available evidence. Use the project's scoring/size conventions if they exist; label estimates and uncertain impact rather than inventing business metrics. Sequence dependencies so a nominally ready item is actually actionable.

For authorized publication choose the appropriate type: a project draft item or a repository issue linked to the project. Capture the returned issue URL and item ID; verify linkage and fields. Use structured bodies or temporary body files for multiline CLI content, not shell-interpolated descriptions. Issue creation, project linking, and field updates may succeed separately: inspect state after a failure before retrying. Do not duplicate successful items.

## Lifecycle and review

Map these meanings to the project's real workflow; do not impose these literal labels:

| State | Evidence |
|---|---|
| Backlog | Candidate work captured with enough context to refine |
| Ready | Required decisions/criteria clear and blocking dependencies resolved |
| In progress | Execution has actually started |
| In review | Concrete deliverable exists and awaits the required review |
| Blocked | Specific external dependency or unresolved decision prevents progress |
| Done | Project completion conditions, acceptance evidence, and required review satisfied |

Do not infer progress from the existence of a plan, mark Done from implementation claims alone, or equate a board status with a merged/released artifact. Record concise blocker reasons and next actions. Change status or close an issue only when authorized and consistent with the observed lifecycle; issue closure and board Done are separate operations.

Review coverage, duplication, dependency ordering, priority rationale, readiness, and correspondence to the spec. For a live update re-read target state, apply scoped changes, and verify the result. For reports count by actual state, list blockers and relevant recent completions, identify retrieval limits, and distinguish proposed changes from applied changes. Include item links/IDs and unresolved partial writes; do not claim synchronization without verification.
