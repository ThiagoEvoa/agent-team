# Compact team evaluation

Use this guide to evaluate the two compact personas and their bundled references independently from the specialist team. The inputs and rubrics here are evaluator-only; do not preload them into an agent being evaluated. Use isolated local fixtures, synthetic data, and existing available tools. Do not publish, change accounts, mutate cloud resources, or install the bundle as an incidental evaluation step.

## Routing and reference selection

`compact-routing-evaluation.json` supplies representative requests, the expected compact primary role, and applicable references relative to `compact-team/skills/`. The references identify guidance to apply, not a fixed read order or an exhaustive permitted list. Already-loaded guidance can be reused. Cases may also list `unnecessaryReferences` for isolated tasks that should not eagerly load neighboring responsibilities. Score that context-efficiency dimension separately; additional guidance justified by actual fixture evidence is not automatically a functional failure.

Run each case in a fresh session with `compact-team/SYSTEM.md` and both compact personas available. Give the session only the case's prompt and ask it to identify the primary role and applicable bundled guidance without implementation or external operations. Use `selectAgent` only if that runtime resolves the compact personas; otherwise record the selected bundled persona explicitly. Record unavailable runtime selection separately from semantic routing.

Score role selection, applicable reference selection, and unnecessary eager loads separately. Do not follow every reference link recursively; only open a linked responsibility when its trigger applies. The boundary cases include agreed specs without discovery, backlog planning without board operations, motion briefs without asset editing, and scanner execution without container construction.

 Check action-first distinctions: product design versus API design, motion creation versus integration, research versus diagnosis, plain Dart versus Flutter, and Firebase Functions versus a website. Technology names and the word “Go” in ordinary prose must not override the requested action. Do not interpret this routing-only exercise as verification of the actual requested implementation.

## Engineering behavior

Reuse the existing isolated Rust fixtures using [their evaluator guide](rust-behavior-evaluation.md). Prepare fresh copies with `tests/rust_behavior_eval.py`, then run the compact `software-engineer` with its own bundled workflow instead of the specialist persona. Give it only `TASK.md` and the fixture repository; keep expected answers private. Compare the specialist and compact variants with the same fixture, model/version, tool availability, and clean starting state.

The existing cases exercise supported-feature configuration, deterministic async cancellation, public API compatibility review, and false-positive restraint on a clean review. The existing fixture tests validate the inputs, not agent accuracy. Record actual implementation diffs, checks, findings, and rubric outcomes for each real agent run.

For the newly restored guidance, evaluate these scenarios in appropriate isolated projects or controlled tool sessions:

| Scenario | Observe in the agent's work |
|---|---|
| Behavioral test writing | Real owned collaborators and storage semantics; doubles only at uncontrolled boundaries; assertions on results/state/UI rather than call verification |
| Flutter runtime QA | Correct app/device/environment; launch or attach; current widget inspection before interaction; specific bounded state assertions; reconnect after restart; runtime-error evidence; task-owned cleanup |
| Flutter tools unavailable | Useful supported checks continue; unavailable runtime inspection is reported, with no fabricated observations or implicit installation |
| Security-sensitive change | Identity and resource/tenant authorization traced; input bounds and domain invariants checked; meaningful allowed/denied behavior exercised; secrets absent from evidence |
| Pipeline/container change | Existing applicable SAST, secret, dependency, and image checks selected; exact scope/results reported; missing or stale scanners distinguished from clean scans |
| Recurring review failure | Original symptom and earlier fixes re-examined; cause/seam/design reconsidered; authorized corrections rechecked; no unrequested redesign or endless identical patches |
| Acceptance-test mutation | Passing baseline established; application remains unchanged during example mutations; survivors investigated; tool errors and equivalent/irrelevant mutations distinguished from meaningful kills |

Provide the task and raw fixture/tool state, not the expected response or this rubric. Evaluate observable decisions and artifacts; do not score exact wording, headings, or whether a particular API name was used when an equivalent supported tool works.

## Product behavior and continuity

Use a small agreed feature brief and evaluate specification, UX, motion, or backlog work separately as requested. Check testable criteria, meaningful states and failure paths, consistent domain terminology, usable artifacts, evidence/assumption separation, and clear validation gaps. Verify that a product task does not silently become application implementation or remote publication.

For an explicitly mixed task, provide the completed product artifact as input to engineering and assess whether contracts, acceptance criteria, assets, and unresolved choices survive the transition without repeated discovery or invented requirements. Board changes, external asset processing, and messages require the same task scope as normal work.

## Results

Record case ID, bundle revision/local diff, model/version, toolchain/tools, attempted scope, observed role/references, required behaviors passed/failed/unobserved, unsupported findings, skipped checks, unnecessary eager loads and their justification, and artifact/transcript locations. Keep results outside fixtures. An unobserved behavior is not a pass. Distinguish static link/schema validation, fixture integrity tests, and actual model evaluations; do not report the first two as measured agent performance.
