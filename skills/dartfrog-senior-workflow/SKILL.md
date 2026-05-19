---
name: dartfrog-senior-workflow
description: Workflow and procedural guidance for the Senior Dart Frog Developer, focusing on dart-mcp and dart_frog CLI.
resources:
  - templates/architecture.md
  - templates/middleware_standards.md
  - templates/testing_standards.md
  - templates/production_ready.md
---

# Senior Dart Frog Developer Workflow

Use this skill to guide the implementation process for Dart Frog backend services. It outlines the specific workflow using the Dart MCP (`dart-mcp`) tools and the `dart_frog` CLI.

## Objectives
- **Assertive Implementation:** Use available tools effectively to implement routes, middleware, and business logic without guessing.
- **Dart MCP Utilization:** Leverage the provided Dart MCP tools to integrate with the Dart analysis server and runtime.
- **CLI Mastery:** Utilize the `dart_frog` CLI for scaffolding (`new`), development (`dev`), and building (`build`).
- **Standardization:** Follow the mandatory patterns defined in the `templates/` directory.
- **Performance & Scalability:** Ensure implementations are optimized for AOT compilation and production deployment.

## Instructions

### 1. Project Initialization & Context
- **Discovery:** Always start by mapping the existing `routes/` directory to understand the current API surface.
- **Project Type:** Verify the project is a Dart Frog application (check for `pubspec.yaml` dependencies and `routes/` folder).
- **Tooling:** Ensure `dart_frog` CLI is used for scaffolding when creating new routes (`dart_frog new route`).

### 2. Implementation with Dart MCP & Templates
When performing code changes:
- **Architecture:** Consult `templates/architecture.md`. Respect file-system routing. Handle request methods explicitly within handlers.
- **Middleware:** Consult `templates/middleware_standards.md`. Ensure proper order in the pipeline (wrapping from bottom to top).
- **DI:** Use `provider` middleware for injecting dependencies. Access them via `context.read<T>()`.
- **Discovery:** Use `mcp_dart_resolve_workspace_symbol` to find models and repositories.

### 3. Execution Phase
1. **Plan:** Outline routes and middleware changes based on `architecture.md`. **IF UNCERTAIN: Research, do not guess.**
2. **Implement:** Write code adhering to Dart Frog standards. Keep handlers thin; delegate to repositories/services.
3. **Analyze:** Run `mcp_dart_analyze_files`.
4. **Test:** Run `mcp_dart_run_tests` (or `dart_frog test`) using patterns from `templates/testing_standards.md`.
5. **Format:** Run `mcp_dart_dart_format`.

### 4. Handoff
Ensure that by the end of the task, you synthesize what was completed, new routes added, middleware changes, and any remaining open issues, so the next agent can proceed smoothly.
