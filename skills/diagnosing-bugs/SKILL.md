---
name: diagnosing-bugs
description: Rigorous 6-phase diagnosis and resolution loop for hard bugs, crashes, and performance regressions in Dart, Flutter, and Dart Frog. Use when the user reports a bug, crash, test failure, unexpected behavior, or regression.
resources:
  - scripts/hitl-loop.template.sh
---

# Diagnosing Bugs

A disciplined 6-phase protocol for diagnosing and resolving hard bugs. **Do NOT skip phases unless explicitly justified.**

When exploring the codebase, read `CONTEXT.md` (if present) for domain definitions, and check `docs/adr/` for architectural invariants.

---

## 🔒 Redact Secrets First
Show commands, outputs, and captured traces safely:
- Write `<REDACTED>` in place of tokens, passwords, private keys, or PII.
- Drive loops via environment variables so credentials remain secure.
- In network traces / HAR files, quote only lines essential to the signal.

---

## Phase 1: Build a Tight Feedback Loop (MANDATORY GATE)

> [!IMPORTANT]
> **This is the core discipline.** If you have a **tight** pass/fail signal that goes red on *this specific bug*, finding the root cause is mechanical. If you do not have a red loop, no amount of staring at code will save you.
> **DO NOT GUESS OR PROPOSE HYPOTHESES BEFORE A RUNNABLE RED COMMAND EXISTS.**

### Constructing the Loop (Dart / Flutter / Backend):
1. **Failing Unit / Widget Test:** `dart test test/path_to_test.dart` or `flutter test test/widget_test.dart`.
2. **Curl / Endpoint Script:** For Dart Frog backends, `curl -s -X POST http://localhost:8080/api/...` asserting exact error response.
3. **CLI / Fixture Harness:** Run CLI commands or isolate functions with fixture input, diffing output.
4. **Integration Test / Driver Script:** `flutter test integration_test/app_test.dart` or Dart MCP widget tree inspections.
5. **Replay Captured Trace / Event:** Replay a captured JSON payload or state sequence through the Bloc / ViewModel / Repository.
6. **Bisection Harness:** If the bug appeared between commits or versions, automate `git bisect run`.
7. **HITL Bash Loop:** If physical human action is required, drive it via `scripts/hitl-loop.template.sh`.

### Tighten the Loop
- **Fast:** Runs in seconds, not minutes.
- **Deterministic:** Same verdict on every run (for race conditions/flaky bugs: stress loop 100x to achieve high repro rate).
- **Sharp:** Asserts on the exact symptom, not merely "didn't crash".

### Completion Gate for Phase 1:
You must name **one single command** you have already executed that is:
- [ ] **Red-capable:** Drives the code path and asserts the user's exact symptom.
- [ ] **Deterministic:** Consistent red verdict.
- [ ] **Agent-runnable:** Automated (or structured HITL script).

---

## Phase 2: Reproduce + Minimise

1. **Verify Symptom:** Confirm the failure matches the user's exact bug report (not an unrelated nearby error).
2. **Minimise the Repro:** Shrink inputs, widgets, state, and dependencies **one at a time**, re-running the loop after each cut.
3. **Completion Criterion:** Every remaining element is **load-bearing**: removing any single piece makes the loop pass (turn green).

---

## Phase 3: Generate 3–5 Ranked Hypotheses

Generate **3 to 5 ranked, falsifiable hypotheses** before testing any of them.

> **Hypothesis Format:**
> *"If `<root cause X>` is true, then `<changing variable Y>` will make the bug disappear / `<changing variable Z>` will make it worse."*

- If a hypothesis cannot make a concrete falsifiable prediction, discard or sharpen it.
- Present the ranked list clearly to the user / invoker before testing.

---

## Phase 4: Targeted Instrumentation

1. **Probe One Variable at a Time:** Each probe must test a specific prediction from Phase 3.
2. **Tagged Logging:** Prefix all temporary debug statements with a unique tag:
   ```dart
   print('[DEBUG-8f2a] State before transition: $state');
   ```
   *Tagged logs can be grepped and removed 100% cleanly.*
3. **Performance Regressions:** Do not use verbose logs for perf; establish baseline profiling / `Stopwatch` measurements first, then bisect.

---

## Phase 5: Fix + Regression Test at Correct Seam

1. **Seam Validation:** Ensure a clean test seam exists where the test exercises the **real bug pattern** at the call site.
   - *If no correct seam exists, document that the architecture is shallow/coupled as an architectural finding.*
2. **TDD Flow:**
   - Turn the minimised repro into a permanent regression test at the seam.
   - Run the test -> Watch it fail (**Red**).
   - Apply the minimal fix.
   - Run the test -> Watch it pass (**Green**).
   - Re-run the Phase 1 feedback loop against the original un-minimised scenario to confirm full resolution.

---

## Phase 6: Complete Cleanup

Before declaring the task done:
- [ ] Original repro command passes (re-run Phase 1 loop).
- [ ] Permanent regression test passes.
- [ ] All `[DEBUG-...]` logs removed (`git grep '[DEBUG-'`).
- [ ] Any throwaway harness or script deleted or moved to `.scratch/`.
- [ ] Root cause and hypothesis confirmed in commit / PR description.
