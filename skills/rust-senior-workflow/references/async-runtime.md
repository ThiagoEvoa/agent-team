# Async runtime contracts

Use these checks when changing async execution, shared state, or an HTTP request's lifecycle. Inspect the runtime and dependency versions in the project before choosing APIs.

- **Task ownership:** Identify who observes each spawned task's result and panic, requests cancellation, and waits for completion. Dropping a task handle may leave the task running; verify the runtime's behavior. Keep request-owned work from continuing after its result is discarded unless that lifetime is intentional.
- **Cancellation and partial effects:** At each relevant `.await`, timeout, and `select!` branch, consider what remains if the future is dropped. Keep dequeued messages, partially written data, permits, and transaction state recoverable according to the operation's contract. A timeout does not automatically roll back external effects. Test cancellation at a controlled pending point rather than relying on sleeps.
- **Resource bounds:** Bound queues, in-flight tasks, retries, and pool usage where external load can grow them. Define backpressure or overload behavior. Carry deadlines across retries and downstream calls when required; avoid resetting the full time budget on every attempt. Retry operations only when their side effects permit it.
- **Blocking and locks:** Keep blocking I/O and CPU-heavy work off async workers using the project's established approach. Bound such work; moving it to a blocking pool does not guarantee that cancellation stops it. Keep critical sections short and avoid holding synchronous guards across suspension points.
- **Shutdown:** Stop accepting new work, signal owned tasks, drain or cancel in-flight operations according to the service contract, then await completion within a deliberate shutdown budget. Exercise cleanup and error paths, not only successful startup and responses.

Use deterministic coordination in tests, such as channels, barriers, manually polled futures, or the runtime's test clock. For an HTTP change, test through the assembled router when middleware ordering, request limits, error mapping, or cancellation affects the behavior. Preserve established authentication and authorization checks and avoid exposing credentials or internal errors in responses or traces.

Runtime-specific references: [Tokio cancellation](https://tokio.rs/tokio/tutorial/select), [Tokio shutdown](https://tokio.rs/tokio/topics/shutdown), [Tokio blocking tasks](https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html). Check the corresponding documentation for other runtimes rather than applying Tokio APIs universally.
