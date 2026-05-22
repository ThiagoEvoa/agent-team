---
name: dartfrog-senior-workflow
description: Workflow and procedural guidance for the Senior Dart Frog Developer, focusing on dart-mcp, dart_frog CLI, and GitHub integration.
resources:
  - templates/pr_standards.md
---

# Senior Dart Frog Developer Workflow

Use this skill to guide the implementation process for Dart Frog backend services. It outlines the specific workflow using the Dart MCP (`dart-mcp`) tools, the `dart_frog` CLI, and GitHub integrations.

## Objectives
- **Assertive Implementation:** Use available tools effectively to implement routes, middleware, and business logic without guessing.
- **Dart MCP Utilization:** Leverage the provided Dart MCP tools to integrate with the Dart analysis server and runtime.
- **CLI Mastery:** Utilize the `dart_frog` CLI for scaffolding (`new`), development (`dev`), and building (`build`).
- **Standardization:** Follow the mandatory patterns and Pull Request templates defined in the `templates/` directory.
- **GitHub Collaboration:** Retrieve requirement context from GitHub issues and create structured pull requests for completed work.
- **Performance & Scalability:** Ensure implementations are optimized for AOT compilation and production deployment.

## Instructions

### 1. Project Initialization & Context
- **Discovery:** Always start by mapping the existing `routes/` directory to understand the current API surface.
- **Project Type:** Verify the project is a Dart Frog application (check for `pubspec.yaml` dependencies and `routes/` folder).
- **Issue Ingestion:** Retrieve task requirements by checking active issues using GitHub MCP `github_get_issue` or GitHub CLI `gh issue view <issue-number>`.
- **Tooling:** Ensure `dart_frog` CLI is used for scaffolding when creating new routes (`dart_frog new route`).

### 2. Implementation with Dart MCP & Templates
When performing code changes:
- **Standards:** View [backend_standards.md](file:///Users/thiagoevoa/Projects/agent-team/skills/dartfrog-senior-workflow/templates/backend_standards.md) dynamically only if you are modifying routes, middleware, or writing tests. Do not load this file otherwise.
- **Discovery:** Use `mcp_dart_resolve_workspace_symbol` to find models and repositories.

### 3. Execution Phase
1. **Plan:** Outline routes and middleware changes. **IF UNCERTAIN: Research, do not guess.**
2. **Implement:** Write code adhering to Dart Frog standards in `backend_standards.md`.
3. **Analyze:** Run `mcp_dart_analyze_files`.
4. **Test:** Run `mcp_dart_run_tests` (or `dart_frog test`) using testing standards in `backend_standards.md`.
5. **Format:** Run `mcp_dart_dart_format`.
6. **Publish to GitHub:**
   - Create a feature branch locally (`git checkout -b feat/feature-name`).
   - Stage and commit changes with a descriptive conventional commit message.
   - Push the branch and create a PR on GitHub using `github_create_pull_request` (MCP) or `gh pr create` (CLI), strictly following `templates/pr_standards.md`.

### 4. Handoff
Ensure that by the end of the task, you synthesize what was completed, new routes added, middleware changes, the URL of the opened Pull Request, and any remaining open issues, so the next agent can proceed smoothly.
