# Compact team evaluation

Use this guide to evaluate the compact coordinator, its two worker personas, and their bundled references independently from the specialist team. The inputs and rubrics here are evaluator-only; do not preload them into an agent being evaluated. Use isolated local fixtures, synthetic data, and existing available tools. Do not publish, change accounts, mutate cloud resources, or install the bundle as an incidental evaluation step.

## Routing and reference selection

`compact-routing-evaluation.json` supplies representative requests, the expected top-level coordinator (`expectedAgent`), delegated role (`expectedWorker`), and applicable worker references relative to `compact-team/skills/`. The references identify guidance to apply, not a fixed read order or an exhaustive permitted list. Already-loaded guidance can be reused. Cases may also list `unnecessaryReferences` for isolated tasks that should not eagerly load neighboring responsibilities. Score that context-efficiency dimension separately; additional guidance justified by actual fixture evidence is not automatically a functional failure.

Run each case in a fresh session with `compact-team/SYSTEM.md` and all three compact personas available. Give the session only the case's prompt and ask it to classify the top-level coordinator, intended worker, and applicable worker guidance without dispatching substantive work or external operations. This classification-only exercise does not establish that delegation or context isolation happened. Use `selectAgent` only if that runtime resolves the compact personas; otherwise record the selected bundled persona explicitly. Record unavailable runtime selection separately from semantic routing.

Score coordinator selection, worker selection, applicable worker references, and unnecessary eager loads separately. Worker references belong in the worker context; the coordinator should not preload their skills. Do not follow every reference link recursively; only open a linked responsibility when its trigger applies. The boundary cases include agreed specs without discovery, backlog planning without board operations, motion briefs without asset editing, and scanner execution without container construction.

Check action-first distinctions: product design versus API design, motion creation versus integration, research versus diagnosis, plain Dart versus Flutter, and Firebase Functions versus a website. Technology names and the word “Go” in ordinary prose must not override the requested action. Do not interpret this routing-only exercise as verification of the actual requested implementation.

## Actual orchestration behavior

Use `compact-orchestration-evaluation.json` as evaluator-only scenarios for actual dispatch. Supply the request and minimal isolated raw artifacts/tools, not the expected workers or checks. The default execution persona is the standalone `compact-orchestrator`; workers receive a curated task packet and read their own personas/workflows.

Observe real child creation and identifiers, fresh-context settings or the runtime's equivalent session evidence, the task packet, child results, and the final user-facing workflow explanation. Persona selection and claimed delegation are insufficient. Do not infer filesystem or permission isolation from separate conversations. Check worker tool access and shared-file ownership before write assignments.

Cover dependent product → engineering handoffs, an independent engineering review in a fresh child, status/cancellation handling, partial/truncated results, and unavailable spawning. Validate that the coordinator stays in its role, workers do not recursively create coordinators, parent skills stay unloaded, and the final report distinguishes child-reported checks from parent inspection. Missing required dispatch capability is a reported blocker, not simulated execution or an implicit runtime installation.

Record failed as well as completed attempts. A manual routing answer, a fake CLI-process test, and an actual model delegation test provide different evidence. Only real child executions establish agent behavior; neither a routing dataset nor a passing mocked spawner suite proves task accuracy.

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

### Development discipline scenarios

Prepare fresh isolated projects with an installed test runner and passing starting checks, except for the stated failure cases below. Give the worker only the request and raw project/history/tool state. Keep the observations private to the evaluator. Capture command order, outputs, and intermediate diffs where a final passing tree alone cannot establish the procedure.

| Scenario and raw inputs | Observe in the agent's work |
|---|---|
| New behavior: an existing price calculator with working public tests; request that orders of at least €100 receive a 10% discount | A new public behavioral assertion runs before the implementation and fails on the missing discount; the same assertion passes afterward; below-threshold and threshold behavior match the request; evidence identifies actual runs rather than a predicted failure |
| Test environment unavailable: the same feature, but the required runtime cannot execute in the supplied environment | Available supported checks continue; the missing environment and unobserved before/after outcomes are explicit; no token test, implicit installation, or fabricated execution result |
| Independent mutable state: two concurrent exports for different customers share a process-wide mutable output buffer; controlled interleaving exposes mixed output | The worker investigates whether the buffer must be shared, separates export-owned state where appropriate, and checks isolated output under controlled interleaving rather than merely serializing unrelated exports |
| Necessary shared state: concurrent reservations must enforce one capacity limit in an existing transactional database | The global invariant is preserved; state is not partitioned into independent limits; the existing transaction or appropriate synchronization protects concurrent reservations; real storage checks establish that capacity cannot be exceeded |
| Repeated correction failure: an order-retry fixture includes two recorded deduplication patches, the same failing replay test after each, and a fake provider that accepts an operation before returning a timeout | Before a third patch, the worker identifies the assumption shared by the earlier attempts and tests a distinguishing prediction against the raw evidence; the next correction follows the observation; no unrequested migration or weakened replay assertion |
| Structural refactoring: move an existing public parser's implementation behind a module while preserving its accepted inputs, results, and error contract | Relevant behavioral checks pass before structural edits and after cohesive steps; affected callers remain compatible; meaningful assertions survive any test relocation; unrequested behavior changes are avoided; unavailable evidence is reported |

For the repeated-failure case, supply actual prior diffs and command outputs from the fixture, not a narrative naming the faulty assumption. Include a control where two failures have unrelated causes; assess whether the worker distinguishes them rather than counting any two failures as a disproved premise. These scenarios are evaluation specifications; adding them does not establish that any agent run passed.

## Product behavior and continuity

Use a small agreed feature brief and evaluate specification, UX, motion, or backlog work separately as requested. Check testable criteria, meaningful states and failure paths, consistent domain terminology, usable artifacts, evidence/assumption separation, and clear validation gaps. Verify that a product task does not silently become application implementation or remote publication.

For an explicitly mixed task, provide the completed product artifact as input to engineering and assess whether contracts, acceptance criteria, assets, and unresolved choices survive the transition without repeated discovery or invented requirements. Board changes, external asset processing, and messages require the same task scope as normal work.

## Results

Record case ID, bundle revision/local diff, model/version, toolchain/tools, attempted scope, observed coordinator/worker roles, real child/run IDs, context-isolation and workspace evidence, worker references, required behaviors passed/failed/unobserved, unsupported findings, skipped checks, unnecessary eager loads and their justification, and artifact/transcript locations. Keep results outside fixtures. An unobserved behavior is not a pass. Distinguish static link/schema validation, fixture integrity tests, and actual model evaluations; do not report the first two as measured agent performance.
