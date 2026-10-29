# Go concurrency and lifecycle

Use for goroutine ownership, cancellation, shared state, resource bounds, and shutdown.

Every goroutine needs an owner, bounded work, a termination path, and a completion wait. Keep request work tied to its context; application-owned background work needs an explicit lifetime and delivery contract. Propagate context explicitly to blocking operations and cancel owned derived contexts. Bound fan-out/queues, allow blocking channel operations to stop as appropriate, and assign channel-closing ownership. Define sibling cancellation and partial-result behavior on failure. See [context](https://pkg.go.dev/context).

Protect shared state consistently, hide locks behind methods, do not copy lock-containing values, and avoid slow I/O under locks. Use synchronization to establish visibility; channels/atomics do not automatically solve ownership. Stop admission, cancel/join owned work within a shutdown budget, then release shared resources. Use channels/barriers rather than arbitrary sleeps in concurrency tests.
