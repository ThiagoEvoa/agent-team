# Rust HTTP framework selection

Use this guide when building or changing an HTTP API. Inspect the existing `Cargo.toml`, toolchain, deployment constraints, and required features first. Keep a project's established framework unless a migration is part of the request. The choices below are defaults to evaluate, not a required dependency bundle. Check each linked crate's current documentation and compatibility with the project's MSRV and other dependencies before selecting versions or features.

## Framework choice

| Project need | Prefer | Reason |
| --- | --- | --- |
| New JSON API with simple handlers and reusable middleware across Tokio services | [Axum](https://docs.rs/axum/latest/axum/) | Macro-free routing and extractors; uses the Tower middleware ecosystem. |
| Existing Axum service or established Tower middleware | [Axum](https://docs.rs/axum/latest/axum/) | Avoid a migration and reuse existing layers. |
| Existing Actix Web service, team preference for route macros, or a service centered on Actix Web's HTTP features | [Actix Web](https://docs.rs/actix-web/latest/actix_web/) | Its application, routing, middleware, and HTTP features fit those conventions. |
| Neither has a clear advantage | Prototype one representative route and its required middleware in each, then choose the simpler fit | Compare integration effort and maintenance, not only throughput benchmarks. |

Actix Web does not require the separate Actix actor framework. Both frameworks can serve production APIs; database access, blocking work, pool limits, and deployment topology often dominate capacity. Preserve the project's async runtime conventions. [Axum is designed for Tokio](https://docs.rs/axum/latest/axum/#compatibility), and [Actix Web supports Tokio](https://docs.rs/actix-web/latest/actix_web/#features).

When selecting crates for an actual API capability, load [Rust API dependencies](rust-dependencies.md).
