# Rust HTTP API stack

Use this guide when building or changing an HTTP API. Inspect the existing `Cargo.toml`, toolchain, deployment constraints, and required features first. Keep a project's established framework unless a migration is part of the request. The choices below are defaults to evaluate, not a required dependency bundle. Check each linked crate's current documentation and compatibility with the project's MSRV and other dependencies before selecting versions or features.

## Framework choice

| Project need | Prefer | Reason |
| --- | --- | --- |
| New JSON API with simple handlers and reusable middleware across Tokio services | [Axum](https://docs.rs/axum/latest/axum/) | Macro-free routing and extractors; uses the Tower middleware ecosystem. |
| Existing Axum service or established Tower middleware | [Axum](https://docs.rs/axum/latest/axum/) | Avoid a migration and reuse existing layers. |
| Existing Actix Web service, team preference for route macros, or a service centered on Actix Web's HTTP features | [Actix Web](https://docs.rs/actix-web/latest/actix_web/) | Its application, routing, middleware, and HTTP features fit those conventions. |
| Neither has a clear advantage | Prototype one representative route and its required middleware in each, then choose the simpler fit | Compare integration effort and maintenance, not only throughput benchmarks. |

Actix Web does not require the separate Actix actor framework. Both frameworks can serve production APIs; database access, blocking work, pool limits, and deployment topology often dominate capacity. Preserve the project's async runtime conventions. [Axum is designed for Tokio](https://docs.rs/axum/latest/axum/#compatibility), and [Actix Web supports Tokio](https://docs.rs/actix-web/latest/actix_web/#features).

## Dependencies to consider

Use the linked official crate documentation when the corresponding need arises. Do not add a crate merely because it appears in this table.

| Need | Dependency and documentation | Selection note |
| --- | --- | --- |
| HTTP server and routing | [axum](https://docs.rs/axum/latest/axum/) **or** [actix-web](https://docs.rs/actix-web/latest/actix_web/) | Choose one for the service. |
| Async runtime | [tokio](https://docs.rs/tokio/latest/tokio/) | Use directly for Axum's runtime, I/O, or tasks; Actix Web also supports Tokio. Enable only required features. |
| Typed JSON request and response models | [serde](https://docs.rs/serde/latest/serde/) | Use `Serialize` and `Deserialize` derives. Add [serde_json](https://docs.rs/serde_json/latest/serde_json/) as a direct dependency only when code manipulates JSON values or calls its API directly. |
| SQL database with explicit queries | [sqlx](https://docs.rs/sqlx/latest/sqlx/) | Prefer when SQL control and optional compile-time query checking matter. Use its pool and migrations if they meet the project's needs; check runtime, database, TLS, and macro features. |
| ORM for relational CRUD and relationships | [sea-orm](https://docs.rs/sea-orm/latest/sea_orm/) | Prefer when model-driven CRUD reduces code. Use [sea-orm-migration](https://docs.rs/sea-orm-migration/latest/sea_orm_migration/) if the project adopts its migration workflow. Do not add SQLx separately unless directly used. |
| Structured diagnostics | [tracing](https://docs.rs/tracing/latest/tracing/) and [tracing-subscriber](https://docs.rs/tracing-subscriber/latest/tracing_subscriber/) | Emit spans/events and configure collection for the executable. |
| Actix Web request spans | [tracing-actix-web](https://docs.rs/tracing-actix-web/latest/tracing_actix_web/) | Add when Actix requests should create tracing spans; Actix Web's built-in logger uses a different logging API. |
| Typed application errors | [thiserror](https://docs.rs/thiserror/latest/thiserror/) | Derive domain and infrastructure errors; map them to deliberate HTTP responses. |
| Axum HTTP middleware | [tower-http](https://docs.rs/tower-http/latest/tower_http/) | Add the features needed for tracing, CORS, compression, request IDs, or timeouts. Add [tower](https://docs.rs/tower/latest/tower/) directly only when using its `ServiceBuilder` or other APIs. |
| Actix Web CORS | [actix-cors](https://docs.rs/actix-cors/latest/actix_cors/) | Add only when browser clients need cross-origin access; configure allowed origins deliberately. |
| Actix Web cookie sessions | [actix-session](https://docs.rs/actix-session/latest/actix_session/) | Use when server-managed sessions are required; choose storage and cookie settings for the deployment. |
| Actix Web Basic or Bearer header extraction | [actix-web-httpauth](https://docs.rs/actix-web-httpauth/latest/actix_web_httpauth/) | It extracts credentials and supplies middleware; token verification and authorization remain application responsibilities. |
| Axum cookies or typed headers | [axum-extra](https://docs.rs/axum-extra/latest/axum_extra/) | Enable only the needed optional features. |
| Generated OpenAPI contract | [utoipa](https://docs.rs/utoipa/latest/utoipa/) with [utoipa-axum](https://docs.rs/utoipa-axum/latest/utoipa_axum/) or [utoipa-actix-web](https://docs.rs/utoipa-actix-web/latest/utoipa_actix_web/) | Add if clients or documentation need a schema. Check adapter compatibility and route registration rules before using it. |
| Reusable field validation | [validator](https://docs.rs/validator/latest/validator/) | Add when request types have enough repeated validation to justify derives; keep business rules in the domain layer. |
| Outbound HTTP | [reqwest](https://docs.rs/reqwest/latest/reqwest/) | Add only if the API calls other HTTP services; reuse a configured client. |
| UUID identifiers | [uuid](https://docs.rs/uuid/latest/uuid/) | Add when the domain uses UUIDs; enable only needed generation and Serde features. |

Avoid choosing a database crate, authentication scheme, session backend, or OpenAPI generator before the API actually needs one. In particular, credential extraction does not establish authentication, and CORS is not an authorization mechanism. When changing dependency declarations, inspect the selected versions' feature documentation and run the relevant build and test matrix.
