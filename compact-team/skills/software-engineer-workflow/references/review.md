# Evidence-based code review

Review for correctness, regressions, reliability, and test gaps. Trace affected callers and relevant contracts. Report actionable findings with file/line evidence and concrete failure scenarios. State what you could not verify. Then rate the review's coverage out of 5 using the criteria below, separately from PR merge readiness.

Review intent, executable behavior, test strength, and structure. Use tool results and observed outcomes to support conclusions, alongside focused code inspection. Passing tests, a clean audit, or favorable metrics do not establish that the requirements themselves are correct. Keep verification proportional to the affected behavior and risk; this procedure requires neither a multi-agent pipeline nor a particular harness.

## Pin the target and criteria

Pin the scope: exact base/head for a PR or commit range; `HEAD` and staged/unstaged scope for local changes; revision and included local changes for a full audit. Preserve a diff snapshot when the working tree may change. Read the originating requirements and ADRs. If the target changes, revalidate affected findings. Always return the exact reviewed head SHA for a PR review; a score for a prior head does not establish readiness of the current head. Report a target change and any evidence that remains stale. Do not reset user work to make review easier.

## Review on two axes

Perform separate passes using the selected stack's standards:

- **Standards:** Correctness, regressions, reliability, security, language/runtime contracts, compatibility, architectural costs, and behavioral test coverage. Use actual diagnostics for compiler findings. Distinguish mandatory repository rules from optional preferences.
- **Spec:** Trace each acceptance criterion through implementation and tests. Identify missing, incorrect, or concretely unrequested behavior. If requirements are unavailable, state the limit; do not invent criteria.

When assessing tests, use the [behavioral testing guidelines](testing.md): real owned collaborators, doubles only at uncontrolled external boundaries, and outcome assertions without mock/spy interaction verification. Report concrete behavior left untested or falsely established; do not turn unrelated legacy test style into a finding by itself.

For affected boundaries, select [authorization](security-auth.md), [input validation](security-input.md), [data integrity](data-integrity.md), [sensitive data](security-data.md), or [cryptography](cryptography.md). For authorized corrections, follow the [delivery loop](delivery.md); recurring failures can require rechecking the seam or architecture rather than another local patch.

## Trace impact and failure paths

Inspect the complete in-scope diff, then follow changed symbols and behavior beyond changed lines into affected callers, consumers, implementations, and tests. Check both sides of API, event, persistence, configuration, and UI boundaries when affected; include indirect or dynamically registered callers where relevant. Record the important paths inspected and any unresolved consumers rather than claiming a repository-wide trace from a text search alone.

Compare previous and proposed behavior against the intended change. Look for regressions in existing supported inputs, outputs, errors, side effects, and compatibility. For reliability, follow relevant failure and recovery paths: partial effects, retries/idempotency, cancellation/timeouts, concurrent or out-of-order work, cleanup, and resource bounds. Select paths from actual change risk; do not impose every case on every task.

For a suspected issue, establish a concrete trigger, execution path, violated contract, and observable consequence. Seek a focused reproduction or regression check when feasible; otherwise distinguish code-supported evidence from behavior not executed. Check guards and caller assumptions before reporting a finding. Test gaps must identify the consequential behavior an existing assertion misses and the scenario that would detect it. Keep speculative risks and unresolved intent under verification gaps or open questions.

## Gather verification evidence

1. **Intent:** Map each acceptance criterion or domain invariant to a concrete scenario, its expected outcome, and the evidence available. Include relevant rejection, boundary, authorization, and recovery cases. Derive expectations from the request, supplied examples, and human-authored or human-reviewed specifications rather than reverse-engineering them from the implementation. State assumptions and missing criteria; an agent-written test agreeing with agent-written code is not independent confirmation of intent. Gherkin is useful when behavioral specification warrants it, but is not mandatory for every change.
2. **Behavior:** Inspect and run the relevant existing scenarios through real owned components using the selected stack's commands. Confirm that assertions reach the changed behavior and check meaningful outcomes. For UI or operational changes, include available browser/runtime checks or product walkthrough evidence. Distinguish observed results from steps merely proposed for a human to perform. Record unavailable environments and missing integration evidence.
3. **Test strength:** Inspect assertions for incorrect outcomes they would miss. Use focused production-code mutation testing when warranted by important business rules, complex decisions, a regression, or uncertain assertions and supported by available tooling. For an existing Gherkin execution pipeline, consider acceptance mutation to check that scenario values reach the application and assertions. Load [mutation testing](mutation-testing.md) only when executing or interpreting those checks; coverage alone does not establish assertion quality.
4. **Structure:** Inspect module boundaries, dependency direction/cycles, duplication, and concentrated complexity in the changed code and affected consumers. Use existing architecture checks and available complexity, coverage, CRAP, or duplication reports to investigate concrete risks. CRAP combines complexity with coverage; neither it nor any score alone proves a defect or correctness. Use repository-defined thresholds, or report measurements and limitations without inventing universal numeric gates. Keep focused code inspection for security boundaries, compatibility, concurrency, and other contracts the executed checks do not establish.
5. **Gaps:** Separate confirmed defects, unmet requirements, unverified behavior, and environment/tool limitations. Record which scenarios and checks ran against which target and configuration. A missing optional tool is a limitation, not automatically a code defect; a missing required check remains a readiness gap. Revalidate affected evidence after fixes or target changes, without repeating unrelated checks unnecessarily.

## Findings and readiness

Give each finding a stable ID and state its trigger, caller impact, exact file/line, evidence, and proportionate correction. Describe the concrete failure scenario, expected versus actual behavior, and whether it was reproduced or established by inspection. Anchor the finding to the smallest useful line range in the reviewed target and cite caller/contract evidence when needed. Preserve supplied IDs across correction/review handoffs and verify prior findings explicitly as resolved, unresolved, or otherwise disposed of with evidence; assign new IDs to new findings. Report a defect once, cross-referencing it if both axes apply. Keep unproven hypotheses under open questions, with evidence needed to resolve them. Empty axes may have no findings. A smell is a prompt to investigate, not a quota: report demonstrated maintenance cost rather than a pattern name alone.

For systemic structural problems, propose the scoped [architecture audit](architecture-audit.md); do not expand an ordinary review into a redesign automatically.

Use the repository's severity scheme; otherwise P0 critical unconditional failure, P1 serious/common-path defect, P2 material narrower-trigger defect, P3 concrete low-impact issue. Rank within each axis. Verify baseline failures before calling them pre-existing; separate environment limitations from code defects. Keep unrelated baseline defects outside a diff review's findings; a full-project audit may include them within scope. Read-only checks may run during review; changes and remote comments require task authorization.

Keep self-review distinct from independent review and human sign-off. Present acceptance behavior, architectural consequences, and unresolved gaps clearly enough for the responsible human to assess. An agent's readiness assessment is not human approval or authorization to merge or deploy.

## Review coverage score

Report **Review coverage: N/5** for a requested code review, including non-PR reviews. For a substantive self-review, a compact score and evidence summary in the handoff is sufficient. Award one point for each fully satisfied criterion below; use whole numbers, with partial or unverified criteria receiving no point. Explain each awarded or withheld point with actual evidence, concisely.

| Point | Criterion for earning it |
|---|---|
| Scope and intent | The complete agreed target was inspected and available requirements/invariants were mapped to behavior and evidence, with no material ambiguity left unresolved. |
| Callers and contracts | Affected callers/consumers and relevant boundary contracts were traced on both sides, with no material path left uninspected. |
| Failure analysis | Correctness, regression, and reliability risks relevant to the change were examined through concrete success, boundary, failure, and recovery scenarios. |
| Verification and tests | Relevant assertions were assessed for missed incorrect outcomes, and required checks plus risk-relevant behavioral verification were executed against the reviewed target with outcomes recorded. |
| Reporting and limits | Actionable findings have precise locations, failure scenarios, and supporting evidence; prior findings were dispositioned when supplied; skipped checks, unverified behavior, and scope limits are explicit. |

Apply criteria to the agreed scope and actual risks, documenting justified nonapplicability rather than inventing work. Declaring a material gap does not satisfy the affected criterion: for example, an unavailable required runtime withholds the verification point even when the limitation is well reported. Optional tooling is not a prerequisite when other evidence satisfies the criterion. Missing specifications can be replaced by an established existing contract only when that contract resolves the actual review question; do not invent intent.

Coverage measures how thoroughly the review was performed, not code quality, test line coverage, or a probability of correctness. A thorough review may earn 5/5 coverage while finding a blocking defect and assigning a low PR score. Conversely, no findings after an incomplete inspection does not justify full coverage or readiness. State the most useful next verification for withheld points; do not expand scope or repeat checks solely to increase the score. Reassess affected points if the target changes. Coverage never replaces the PR score or satisfies the orchestrator's independent PR-readiness gate.

## PR score and merge recommendation

Every PR review, including a PR self-review summarized in a handoff, must report **PR score: N/5** using a whole number from 0 to 5. Score merge readiness for the pinned revision using both review axes and the available validation evidence:

| Score | Meaning |
|---|---|
| 0 | Critical blocker: confirmed catastrophic failure, such as severe data loss or a critical security defect. |
| 1 | Serious defects: major correctness, security, or compatibility problems require substantial correction. |
| 2 | Material defects or unmet acceptance criteria require correction before merging. |
| 3 | No confirmed material defect, but required checks, unresolved questions, or missing evidence prevent a readiness recommendation. |
| 4 | Ready to merge with only concrete, nonblocking issues; required checks and acceptance evidence are satisfied. |
| 5 | Ready to merge: no actionable findings within the reviewed scope, with required checks and acceptance evidence satisfied. |

Use the lowest applicable score; passing checks do not offset confirmed defects. Missing required validation or material acceptance evidence caps the score at 3. A missing optional tool alone does not lower the score. A 5 reflects the reviewed scope and evidence, not a guarantee of defect-free code.

Explain the score in 1–3 sentences naming the decisive findings or gaps and relevant verification results. Give an explicit recommendation: **Ready to merge**, **Request changes**, or **Hold for verification/clarification**. Scores 0–2 require changes; 3 requires resolving the stated gaps; 4–5 support merging subject to the repository's remaining approval requirements. State what must change before merging when blocked. Include the score, explanation, and recommendation in the final user-facing review and any parent handoff; recompute them after fixes or revision changes.

The rubric describes the reviewed revision's readiness; the orchestrator applies a stricter delivery gate. Under that workflow, **4/5 does not pass** even when the recommendation is favorable: only an independent **5/5** stops the loop successfully. Report the honest score without inflating it or changing the rubric to force passage. The coordinator owns round counts, fresh correction/review dispatch, the three-scored-review limit, and the stop decision. Reviewers return evidence and do not apply fixes, start another round, post remote approvals, merge, or mark the card Done as part of review.

For a formal review, use this compact structure; a focused implementation self-review can be summarized in the handoff:

```markdown
## PR assessment
PR score: N/5 — brief explanation tied to findings and verification evidence.
Recommendation: Ready to merge / Request changes / Hold for verification/clarification.
Required next action when blocked. Include this section for PR reviews.
## Target
Exact base/head revisions (including reviewed head SHA), diff scope, and originating requirements.
## Standards Axis
Stable finding ID, severity, file:line, trigger, evidence, impact, correction; or no findings.
## Spec Axis
Stable finding ID, criterion and file:line, missing/incorrect/unrequested behavior; or no findings.
Prior finding IDs and evidence-backed dispositions when supplied.
## Validation
Commands, runtime/toolchain/configuration, outcomes, baseline failures, skipped checks.
Acceptance criteria/scenarios and evidence for each; unverified criteria.
Important callers/contracts traced and relevant regression/reliability scenarios inspected.
Mutation and structural checks when warranted: scope, results, survivors/exclusions,
project thresholds, and unavailable tooling. Omit irrelevant optional checks.
## Review coverage
Review coverage: N/5 — earned/withheld points and supporting evidence.
Explicit unverified behavior, scope limits, and next verification for material gaps.
## Open questions
Only unresolved matters and how to resolve them; omit when empty.
## Status
Readiness, material gaps, and next action.
```

## Background

This procedure adapts verification ideas from Robert C. Martin's [September 2026 interview](https://www.aviator.co/podcast/uncle-bob-martin-ai-clean-code) and his [Acceptance Pipeline Specification](https://github.com/unclebob/Acceptance-Pipeline-Specification). Use the project's own tools and thresholds; these references do not require adopting his orchestration, installations, or personal thresholds.
