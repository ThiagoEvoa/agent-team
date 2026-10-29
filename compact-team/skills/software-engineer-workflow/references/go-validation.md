# Go toolchain validation

Use when reproducing or running Go checks; select affected modules and supported configurations.

Use the shared [diagnosis loop](diagnosis.md) with an asserted Go unit/handler/integration test or endpoint request. Reproduce before changing production code, retain a behavioral regression check, and rerun the original scenario. Profile measured performance failures; report reproduction limits honestly.

Use repository commands first. During iteration run focused package tests; broaden to affected modules/consumers. A single-module baseline is:

```text
gofmt -l <changed-go-files>
go vet ./...
go test ./...
go build ./...
```

Replace placeholders with actual paths. Formatting passes when no files are listed; apply `gofmt -w` only to intended files. `./...` does not automatically cover nested/sibling modules: inspect `go.work` and check each affected module. Use `GOWORK=off` when a releasable module must work without workspace replacements. Record actual toolchain selection; verify minimum Go/CI versions for compatibility-sensitive changes. Check relevant build tags, target/cgo configuration, generation, and module/vendor changes without unrelated dependency upgrades. Cross-compilation does not verify runtime behavior.

Run `go test -race ./...` for concurrent changes on supported targets; a clean run covers executed paths only. Record unsupported platforms or missing C tooling. Run configured linters or `govulncheck` when available and relevant; report missing checks. See the [race detector guide](https://go.dev/doc/articles/race_detector) and [Go command docs](https://pkg.go.dev/cmd/go).
