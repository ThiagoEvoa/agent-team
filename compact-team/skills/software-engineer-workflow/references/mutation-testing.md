# Mutation testing

Use when executing or interpreting production-code or acceptance-example mutations. It complements [behavioral tests](testing.md); a code review does not require it automatically.

Establish a passing unmutated baseline for the selected scenarios first. Use an existing supported mutation tool with a bounded scope around the changed behavior. Review-only work must leave the target unchanged: use temporary isolated copies or supported tooling that reliably restores mutations; do not hand-edit the review target. Tool installation or new test infrastructure is separate implementation work, not an automatic consequence of review. Report unavailable tooling and the checks still needed.

Distinguish the two mutation targets:

- **Production code:** Change implementation logic while retaining the original test expectations. A killed mutant demonstrates that a test detected that particular change. Investigate survivors as possible missing scenarios or weak assertions; identify equivalent mutations and justified exclusions with evidence.
- **Acceptance examples:** With the application unchanged, mutate Gherkin example values through the existing acceptance pipeline. For example, changing an expected total from €10 to €11 should fail against a result of €10. A survivor may reveal an ignored value, missing assertion, or disconnected step. Some input changes legitimately preserve the outcome, so assess survivors against the scenario contract rather than assuming every mutation must fail.

Report scope, commands, killed/surviving mutations, equivalent or excluded cases, and execution errors or timeouts separately. Do not count infrastructure failures as evidence that assertions detected a defect. Do not weaken expectations, delete scenarios, or alter exclusions/thresholds merely to obtain a passing result. When fixes are authorized, improve observable behavioral checks using real components; mutation testing does not justify mock interaction assertions. Mutation results add evidence about tested distinctions and do not prove all behavior correct.

Background: [Acceptance Pipeline Specification](https://github.com/unclebob/Acceptance-Pipeline-Specification).
