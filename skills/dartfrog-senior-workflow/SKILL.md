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
- **Standards:** To conserve tokens, use the helper script `scripts/extract_section.py` (e.g. `python3 scripts/extract_section.py skills/dartfrog-senior-workflow/templates/backend_standards.md "<section_name>"`) to query only the necessary sections (e.g., "Middleware", "Testing", etc.) dynamically if you are modifying routes, middleware, or writing tests.
- **Discovery:** Use `mcp_dart_resolve_workspace_symbol` to find models and repositories.

### 3. Execution Phase (Seam-Based TDD)
1. **Plan & Identify Seam:** Outline routes, middleware, and backend repositories. Check `CONTEXT.md` for domain invariants.
2. **Write Failing Test (Red):** Write route/handler unit tests (`dart test test/routes/...`) asserting expected status codes and JSON payloads before writing handler logic.
3. **Implement (Green):** Write minimal route handler and controller logic behind the seam.
4. **Fast Loop Verification:** Run `mcp_dart_analyze_files` and targeted route test files regularly.
5. **Full Suite Verification:** Run `dart test` (or `dart_frog test`) ensuring 100% test pass rate and zero analyzer warnings.
6. **Format:** Run `mcp_dart_dart_format`.
7. **Publish to GitHub:**
   - Ensure you are on your synchronized local feature branch.
   - Stage and commit changes with a descriptive conventional commit message.
   - Push the branch and create a Pull Request on GitHub using `github_create_pull_request` (MCP) or `gh pr create` (CLI), strictly following `templates/pr_standards.md`.

### 4. Handoff & Review Trigger
Synthesize a concise, token-efficient **Handoff Report**:
- Summary of routes added/modified, middleware transitions, and database models.
- Test command and proof of pass at the seam.
- Link to the Pull Request or branch diff.
- Trigger handoff to `dart-senior-reviewer` for Two-Axis Review (`📋 Standards` vs `🎯 Spec`).

