# Flutter runtime QA

Use for real Flutter app interaction, exploratory technical QA, or verification of a changed user journey. Load [Dart contracts](dart.md) only for language-level investigation, [behavioral testing](testing.md) when writing tests, or [diagnosis](diagnosis.md) when a defect needs isolation. Automated behavior tests and runtime interaction provide different evidence; report each separately.

## Establish the application and session

Identify the app root, revision/local changes, build flavor/entrypoint, device/platform, backend environment, and scenario acceptance criteria. Use isolated accounts/data and verified emulator or test-service targets. Do not use production mutations as setup or cleanup. Preserve the user's existing app/session; note what this task launches and owns.

Discover supported device, launch, tooling-daemon connection, widget inspection, interaction, runtime-error, reload/restart, and stop capabilities. Read schemas before calling them. Names such as `list_devices`, `launch_app`, `connect_dart_tooling_daemon`, `get_widget_tree`, and `flutter_driver` are discovery hints, not guaranteed APIs. Do not invent missing capabilities or install/configure tooling implicitly.

For a session this task launches:

1. List available devices and choose one compatible with the requested platform and scenario.
2. Launch the correct app/entrypoint with its test configuration. Wait for a confirmed running state; retain returned session/process IDs and the actual DTD/VM service URI when exposed.
3. Connect using the supported tooling/driver protocol. Check whether the project needs an existing integration-test/driver entrypoint. A successful launch alone does not establish that interaction tools are attached.
4. After a restart, disconnection, or device change, re-establish the supported connection and inspect current state before continuing. Use returned connection details rather than a stale URI.

When attaching to an already-running app, establish the same target and connection facts without restarting it unnecessarily. If attachment, device access, or interaction is unavailable, continue supported local tests and report runtime checks as not run; do not substitute invented observations.

## Inspect, interact, and assert

For each scenario step:

1. Inspect the current widget hierarchy or supported UI snapshot before choosing a target. Never infer the current screen from the previous action alone.
2. Select an unambiguous finder from observed keys, semantics, labels/text, or types. Check visibility, enabled state, scrolling, and overlays as relevant. Prefer stable public UI identifiers over fragile coordinates or internal widget nesting.
3. Perform the supported interaction: tap, enter text, scroll, navigate back, or another observed available action.
4. Wait for a specific expected state with a bounded timeout. Assert the visible content, navigation, validation message, or other required effect. An interaction command succeeding is not evidence that the journey succeeded. Avoid arbitrary sleeps.
5. Inspect runtime exceptions and relevant redacted logs after transitions and at scenario completion. Re-inspect state after an unexpected result before retrying.

Exercise the primary path and affected failure paths: invalid input, empty/loading/error states, denied permissions, interrupted navigation, retries, or backend failure as the feature requires. Use controllable external fixtures at the actual external boundary, keeping owned application behavior real. Include relevant viewport/orientation, text scaling, localization, keyboard occlusion, accessibility semantics, and reduced-motion checks when available; identify device/platform coverage limits.

For hot reload/restart verification, rerun the affected behavior after the runtime acknowledges the operation. A clean reload is not itself a passing scenario. For changes to startup/native configuration or release behavior, use the appropriate restart/build/runtime check rather than claiming debug hot reload establishes release correctness.

## Failures and cleanup

Capture the failing step, expected/actual state, runtime errors, target, and minimal evidence. Use the diagnosis loop to reproduce and narrow a defect before claiming its cause. An intermittent or environment-blocked failure can still be reported honestly with observed evidence and reproduction limits. Preserve a behavioral regression check when fixes are in scope; rerun the original journey afterward.

Stop only processes/sessions launched for this task when their use is complete. Clean up only task-owned test data within the authorized environment. Do not stop the user's pre-existing app, reset their account, or clear shared data as routine teardown.

## Scenario report

For a runtime QA request, use this compact structure, scaled to the scenario. For an implementation task, equivalent evidence may be included in its handoff rather than a separate report.

```markdown
## Target
App root, revision/diff, entrypoint/flavor, backend environment,
device/platform, execution time, and scenario/acceptance criteria.

## Results
| Step | Action and observed target | Expected | Actual | Status |
|---|---|---|---|---|

## Runtime evidence
Exceptions/logs and relevant screenshots or recordings when captured.
Distinguish no errors observed from error inspection not available.

## Status and cleanup
Passed / failed / partial / not run; reproduction or regression-check evidence,
checks/devices not covered, task-owned sessions/data cleaned up, and next action.
```

Link issue/PR context when available. Publishing the report or filing a remote bug follows the task's authorization; it is not an automatic QA step.
