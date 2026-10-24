# Rust agent behavior evaluation

These four tasks test engineering behavior independently of persona routing. Each fixture is a dependency-free Cargo crate; Rust and Git are required. The JSON dataset contains evaluator-only rubrics and expected baseline outcomes. Do not give it to the agent being evaluated.

Prepare one task in an isolated directory:

```bash
python3 tests/rust_behavior_eval.py feature-regression /tmp/rust-eval-feature
```

Other case IDs: `async-cancellation`, `public-api-review`, `clean-review`. The preparer refuses nonempty destinations, creates local base/head commits, and writes a sibling `TASK.md` containing only the request, revision IDs, and repository path. It does not invoke a model or contact a remote service.

Run each task in a fresh session with the current Rust agent and skills. Give that session only `TASK.md` and access to its fixture repository, not the dataset or this evaluator guide. Allow local edits for implementation cases; keep review cases read-only apart from build artifacts. Preserve the session transcript, commands, final diff, and review findings outside the fixture. Use a fresh prepared copy for each attempt. Do not run fixtures against an application repository or production resources.

Score each attempt against the case's rubric after it finishes:

- Record each required behavior as pass, fail, or unobserved, with transcript or file evidence. An unobserved behavior does not count as a pass.
- Record unsupported findings separately, including a finding's claimed failure path. If the agent demonstrates a real defect absent from the rubric, investigate it before counting it as a false positive.
- Re-run the case's `baselineChecks` against the implementation's final tree; all must now succeed. Verify signatures, feature defaults, dependencies, and tests still satisfy the task. Passing weakened tests does not establish correctness.
- For reviews, verify the finding location, pinned revisions, severity and spec linkage. Confirm tracked source files remain unchanged. The public API case has a failing head and passing base; the clean review case should have no confirmed defects unless new evidence establishes one.
- Record model/version, agent and skill revision, toolchain, case, attempt count, checks skipped, required behaviors passed/total, unsupported finding count, and final outcome. Do not present fixture integrity tests as measured agent accuracy.

The deterministic Python suite prepares the crates and verifies their expected baseline outcomes, including passing review bases. It validates the evaluation inputs, not model performance. Model evaluation is a separate, explicit run.
