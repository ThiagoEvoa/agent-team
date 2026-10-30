# Delivery and correction loop

Use for multi-step implementation, authorized fixes following review/QA, or recurring verification failures. Keep small work lightweight. This procedure runs within the compact engineer; it does not require a specialist persona, another agent, or team helper scripts.

## Carry the task through completion

1. **Establish the slice:** Carry forward agreed scope, acceptance criteria, domain invariants, affected contracts, and relevant product/design assets. Reuse existing discovery. If a material product choice remains unresolved, identify it and continue independent work; do not silently decide a new business requirement.
2. **Implement and verify:** Work in cohesive, independently verifiable slices. Follow the selected stack and [behavioral testing](testing.md) guidance; retain reproduction/regression evidence for fixes. Run focused checks while editing, then required broader checks for affected consumers.
3. **Review the result:** Inspect the final diff using the [review procedure](review.md). Include QA evidence when relevant. Identify actionable standards/spec findings and verification gaps against the pinned target. Keep self-review separate from any independent review the project requires.
4. **Resolve authorized findings:** For each actionable item, retain its location, trigger, expected behavior, evidence, and proportionate correction. Track whether it is fixed, remains unresolved, or was rejected with a supported reason. Fix the cause, rerun the failing scenario, and check affected consumers; do not change acceptance criteria or tests merely to make the feedback disappear.
5. **Re-review affected behavior:** Inspect the revised diff and update the evidence after fixes. Re-run checks invalidated by the change; preserve still-applicable results rather than repeating unrelated suites. New findings re-enter this loop. A review-only request reports findings and stops without modifying the target.
6. **Report actual completion:** Complete when the requested behavior, required checks, and applicable review conditions are satisfied, or state exactly what remains unverified or blocked. Use [PR standards](pr-standards.md) for PR preparation. Keep publication, merge, deployment, board transitions, and issue closure tied to their actual authorized scope and observed state.

For larger work, use a concise task list or existing issue tracker to retain per-slice criteria, status, latest revision, evidence, findings, and next action. Do not require a new tracking document for a small fix. For mixed product/engineering work, carry the same contracts and evidence across the role transition rather than restarting the task. Use the project's existing board states when board updates are authorized; do not infer Done or issue closure from an implementation claim.

## When corrections keep failing

If the same defect or structural problem survives successive correction/review passes, stop applying the same class of patch. Recheck the original reproduction, assumptions, dependency/environment differences, ownership, seam, and domain rules. A smaller fix that repeatedly breaks another caller can indicate the wrong boundary or an incomplete contract.

After two unsuccessful corrections based on the same assumption fail the same check, state that shared assumption and the observed failures in the task evidence. Before another patch, run a focused experiment that could disprove the assumption, with a predicted distinguishing result; use the [diagnosis loop](diagnosis.md) when needed. Revise the assumption or choose the next correction from the observed result. Unrelated failures or an unavailable tool do not by themselves disprove a design premise. If the experiment cannot run, state the missing evidence and continue only work that does not depend on the unresolved assumption.

Summarize the recurring failure and attempted corrections with evidence. Revisit viable interface designs using [design guidance](design.md). For systemic coupling, scattered changes, or cycles, propose a scoped [architecture audit](architecture-audit.md) and perform it when within the authorized work. Repeated structural failures warrant this consideration even when they occur in fewer than three modules; a numerical smell count is not the only trigger.

When an agreed correction establishes a lasting module boundary, consider an executable architecture check such as an existing import rule, dependency-cycle check, or public-contract test to prevent recurrence. Add only checks that enforce a real contract within scope; do not pin file layouts or instruction prose to a test.

If the correction requires a product decision or a larger migration outside the task, present the concrete decision and its trade-off with the affected evidence. Do not expand into an unrequested redesign, retry cloud operations speculatively, or keep an unbounded fix/review loop running. Report a genuine external blocker with its next action; difficult but actionable local work remains work to complete.

## Handoff

Lead with changed behavior and files, then material decisions, acceptance/regression evidence, review findings resolved or remaining, required checks and outcomes, and the next action when incomplete. State target revision and external delivery status when relevant. A pending job, a locally passing test, a clean self-review, and human approval are different states. Do not claim a sign-off or publication that did not occur.
