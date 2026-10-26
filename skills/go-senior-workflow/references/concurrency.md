# Go concurrency and lifecycle

Use concurrency for a concrete workload. For every goroutine identify who starts it, what bounds its work, how it stops, and who waits for completion. Request work normally inherits request cancellation; durable background work needs an application-owned lifetime and explicit delivery semantics. Avoid detached goroutines whose results or failures are lost.

Pass `context.Context` explicitly, normally as the first parameter, and propagate it to blocking dependencies. Call cancellation functions on owned derived contexts. Do not replace a caller's context with `context.Background()` to hide cancellation; use values for request-scoped metadata rather than dependency injection. See [context](https://pkg.go.dev/context).

Bound worker counts, queues, and fan-out. Make blocking sends, receives, and dependency calls able to terminate when appropriate. Define channel-closing ownership and account for all senders; do not use recover to hide send-on-closed-channel bugs. When one task fails, decide whether siblings cancel, whether partial results remain valid, and how all tasks are joined before return.

Protect shared maps/state with a consistent synchronization strategy. Keep lock ownership behind methods, avoid copying values containing locks, and avoid holding locks during slow network/database work. Channels and atomics are choices with explicit contracts, not automatic improvements over mutexes. Check the [Go memory model](https://go.dev/ref/mem) when reasoning about visibility and synchronization.

For shutdown, stop admission, signal owned work, wait within a bounded budget, then release shared resources after their users finish. Include failure paths during startup and shutdown. For cancellation/leak/race tests coordinate with channels, barriers, or supported testing facilities rather than wall-clock sleeps. Run focused tests and the race detector where supported; investigate actual blocked goroutines or profiles before claiming a leak or performance cause.
