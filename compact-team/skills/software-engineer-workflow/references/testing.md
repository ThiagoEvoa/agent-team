# Behavioral testing across stacks

Read this reference when writing or changing tests, selecting a test boundary, or assessing test quality during review. Use the selected stack's validation reference and repository tooling for commands and runtime setup. These guidelines define how to test across all supported stacks.

## Start from observable behavior

Prefer tests of a capability through the public interface its caller uses. Exercise real collaborating components together and assert the result: returned values, rendered UI, API responses, persisted state, or externally visible effects. Choose the smallest public boundary that exercises the complete behavior being checked; not every scenario needs a browser or full application deployment.

Avoid a test-per-method or test-per-class structure that replaces every collaborator and mirrors the implementation. A small test of a pure function or domain object is still useful when it checks a meaningful rule with real inputs and outputs. The goal is behavioral confidence, regardless of whether the runner calls it a unit, widget, integration, or acceptance test. Internal refactoring that preserves the contract should generally preserve the tests.

Derive scenarios from acceptance criteria and domain invariants. Name each test by its condition and expected outcome. Arrange a starting state, perform the public action, and assert concrete results. Given/When/Then can help express this structure; Gherkin tooling is optional. Cover relevant success, error, boundary, and authorization cases rather than chasing a coverage percentage or duplicating production calculations in expected values.

## Use real components within our control

Assemble production domain objects, services, repositories, handlers, middleware, and UI state components as appropriate to the tested behavior. Do not replace an owned collaborator merely because it is a separate class, package, or layer. Keep dependency construction explicit without introducing an interface for every class just to mock it.

For persistence, use the actual storage engine in an isolated test database when correctness depends on queries, constraints, transactions, or migrations. Use temporary directories for filesystem behavior and local test servers for controlled network behavior. An in-memory mode is appropriate only when it preserves the semantics being tested; an in-memory map does not establish SQL correctness. Use fixtures, unique namespaces, and cleanup so tests do not share mutable state or depend on production resources.

If a required real dependency cannot run in the available environment, report the missing integration evidence. A narrower check can still be useful, but do not silently substitute a mock for owned behavior and describe the integration as tested.

## Substitute only at uncontrolled external boundaries

Use a fake, stub, or mock when a dependency is outside our control and cannot be exercised reliably in isolation, such as a third-party payment, email, or identity service, or an unavailable platform capability. Keep our adapter, request mapping, and business rules real where practical; replace the external endpoint or SDK boundary rather than an internal service. A remote service we own is not automatically an uncontrolled dependency: use its isolated real implementation when available.

Prefer a small deterministic fake that models the external contract and supports relevant success and failure scenarios. If a mocking library is needed, use it to supply boundary responses or failures, not to prescribe an internal call sequence. Inject controlled time, randomness, and scheduling at their system boundaries when behavior depends on them; keep the business logic real.

Keep doubles faithful to the contract: status/error mapping, relevant payloads, and state transitions. Use existing emulator, sandbox, or adapter contract checks where available and within scope to detect drift. A fake-backed test proves our behavior against that modeled contract; report separately whether the real provider integration was exercised.

## Assert outcomes; avoid interaction verification

Do not use mock/spy interaction assertions such as `verify()`, `verifyNever()`, `verifyNoMoreInteractions()`, `toHaveBeenCalled*`, or equivalent call-count/order checks. This applies even when a mock is allowed at an external boundary. Do not recreate the same checks using hand-written invocation counters or call logs.

Assert what the caller can observe instead. For example, check that an order can be retrieved with its saved contents, not that `repository.save()` was called. For an external delivery requirement, inspect the meaningful effect exposed by the boundary fixture, such as the recipient and content in a fake mail inbox, rather than which internal method produced it. A boundary fixture may expose delivered effects; an internal spy renamed as a fake still couples the test to implementation.

When absence, ordering, retries, or idempotency matter, express their contractual consequence: unchanged persisted state after rejection, final outcome under a controlled transient failure, or one delivered receipt after replaying the same request. Exercise the complete operation, including completion of owned background work, before asserting. Do not infer correctness from a matching call sequence.

## Example: payment rejection

This stack-neutral pseudocode illustrates the intended boundary:

```text
Given an application assembled from real checkout, inventory, and order storage
  using an isolated database
And a fake external payment provider configured to decline payment
When the customer submits an order through the public checkout interface
Then the result reports payment declined
And the public order query shows no confirmed order
And the public inventory query shows the original available stock
```

The assertions check the business result and state. They do not verify calls to payment, repository, or inventory methods. Adapt expected state transitions to the actual specification; this example does not define every product's payment workflow.

## Keep tests trustworthy

For a bug, establish that the regression scenario fails for the reported reason before the fix and passes afterward. For new behavior with a practical automated seam, write a meaningful behavioral check before implementation, run it, and confirm that it fails because the required behavior is missing. Then implement the smallest complete change and rerun the same check. Retain the command and observed before/after outcomes in the task evidence; a predicted failure is not an observed one. Missing dependencies, syntax errors, or unrelated baseline failures do not establish the missing behavior. Minimal API declarations may be needed to reach the behavioral assertion.

If a meaningful automated check is impractical or the required environment is unavailable, state the reason and use the available runtime, manual, or narrower checks with their limits. Do not create a token test or claim an unobserved failure. For changes without a behavioral effect, use relevant existing checks rather than inventing a failing test.

Keep fixtures minimal and explicit; avoid shared mutable globals, real-time sleeps, and ordering dependencies between tests. Use controlled synchronization and bounded waits for asynchronous work.

Run focused scenarios while iterating, then the repository's required checks and affected consumers. Report commands, configuration, actual outcomes, and skipped checks. During [review](review.md), assess whether assertions would detect an incorrect observable result and whether doubles hide the behavior under change. Do not rewrite unrelated existing tests solely to enforce a preferred style.
