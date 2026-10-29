# Pull request standards across stacks

Read this reference when preparing or updating a PR, its description, or a PR handoff. Use the target repository's PR template, contribution rules, title convention, and required checks first. Fit the evidence below into that structure; otherwise use the default template. These standards apply to every stack in this bundle. Select actual validation commands from the affected stack's validation reference and repository tooling.

## Title and scope

When no title convention is defined, use `type(scope): description`, with scope optional. Common types are `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, and `ci`. Describe the resulting behavior or concrete change, not the work session. Match the title and description to the final diff, including when scope changes.

Lead with the problem and resulting behavior for a reviewer who has not seen the conversation. Link supplied issues or specifications; use a closing keyword only when the PR resolves that issue and closure is intended. Explain consequential design choices, compatibility effects, and dependencies when they help assess the change. Keep unrelated work out of the diff.

## Default description

Keep small PRs brief. Use this structure when it helps review, omitting sections that do not apply and expanding only where the change warrants it:

```markdown
## Purpose
Problem, resulting behavior, and linked issue/specification when available.

## Changes
Affected behavior/components and material design decisions.

## Verification
- Acceptance criteria or scenarios checked and the evidence for each.
- Commands/tool checks actually run, relevant configuration, and results.
- Manual/browser/runtime steps and observed results when relevant.
- Checks not performed, failed checks, and remaining verification gaps.

## Compatibility and rollout
Breaking changes, migrations, configuration/dependency changes, deployment
ordering, and recovery steps when relevant.
```

For a bug fix, describe the trigger and before/after behavior, with reproduction and regression-check evidence. For a visual change, include relevant screenshots or recordings when available. For an API, package, or persistence change, describe caller compatibility and migration effects. Use component names appropriate to the change rather than requiring UI or backend fields for every stack.

## Verification and handoff

Check the final diff for intended scope, accidental generated artifacts, and exposed credentials. Report formatter, analyzer/typecheck/lint, tests, and build checks according to the repository and affected profiles; there is no universal command set. Identify package, feature, target, toolchain, or environment selections when they affect what a check establishes.

Connect acceptance criteria to meaningful behavioral checks, and identify any unmet or unverified criteria. Include error and boundary scenarios affected by the change. Do not claim complete behavior coverage from a line-coverage percentage or a passing suite alone. Separate confirmed baseline failures from new failures and environment limitations. Record CI as pending until its result is known.

Summarize substantive self-review and unresolved findings using the [review procedure](review.md); distinguish self-review from an independent review. Follow the repository's readiness requirements and disclose material gaps rather than implying approval. Do not require a separate formal report for an ordinary small PR.

Preparing a PR description does not authorize publishing, posting comments, merging, or deploying. Follow the task's existing authorization and the workflow's delivery boundaries. Include the PR URL and actual delivery/check status in the final handoff when a PR exists.
