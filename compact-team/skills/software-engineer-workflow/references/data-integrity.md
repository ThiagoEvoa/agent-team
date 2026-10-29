# Transactional data integrity

Use for atomic state changes, storage constraints, idempotency, partial failure, and coordination with irreversible effects.

For state changes that must succeed together, preserve transaction boundaries, isolation, uniqueness, and commit/error handling. Define idempotency, retries, partial failure, and coordination with irreversible external effects. Test the actual storage engine where its semantics matter; a fake cannot establish transaction or migration correctness.

Exercise invalid transitions, conflict/rollback/commit failures, replay, and partial external failure against real owned components using [behavioral tests](testing.md). Add [Go persistence](go-persistence.md) only for Go-specific driver/pool/transaction contracts. Report the actual engine and supported configurations checked.
