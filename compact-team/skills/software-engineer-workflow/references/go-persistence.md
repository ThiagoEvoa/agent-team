# Go persistence contracts

Use for Go database queries, pools, transactions, migrations, and external-effect coordination.

Use the existing database driver/migration system, shared bounded pools, parameterized values, and controlled identifiers. Close rows and check iteration errors. Keep atomic operations on the transaction handle, roll back failure paths, and require a successful commit before success. Verify isolation, ownership, idempotency, and migration compatibility against the actual database in an isolated integration environment where mocks cannot establish them. External side effects need explicit coordination because database rollback cannot undo them. See the [transaction guide](https://go.dev/doc/database/execute-transactions).
