# Go HTTP transport contracts

Use when implementing or inspecting Go handlers, middleware, clients, deadlines, or server shutdown.

Preserve the existing framework; for a new service, `net/http` is a starting point when it meets requirements. Add dependencies for concrete needs and check routing APIs against the declared Go version. Compose middleware and feature routes centrally. Validate inputs and bound bodies, pagination, and costly work according to the API contract. Test authentication, resource/tenant authorization, middleware order, errors, and stable status/payload mapping through assembled handlers with `httptest`; use a test server for network/client behavior. See [net/http](https://pkg.go.dev/net/http).

Configure server header/read/write/idle limits for the deployment, allowing for streaming requirements. Propagate request contexts to downstream calls, reuse configured clients/transports, close response bodies, and bound retries by deadlines and idempotency. Coordinate serve errors, bounded `Shutdown`, worker termination, and process exit; manage hijacked connections separately and distinguish `http.ErrServerClosed` from failures.
