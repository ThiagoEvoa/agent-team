---
name: flutter-senior-workflow
description: Workflow and procedural guidance for the Senior Flutter Developer, focusing on dart-mcp, flutter_workspaces_cli, and GitHub integration.
resources:
  - templates/architecture.md
  - templates/testing_standards.md
  - templates/pubspec_standards.md
  - templates/pr_standards.md
---

# Senior Flutter Developer Workflow

Use this skill to guide the implementation process for Flutter applications. It outlines the specific workflow using the Dart MCP (`dart-mcp`) tools, the `flutter_workspaces_cli`, and GitHub integrations.

## Objectives
- **Assertive Implementation:** Use available tools effectively to implement features, fix bugs, and refactor code without guessing.
- **Dart MCP Utilization:** Leverage the provided Dart MCP tools to deeply integrate with the Dart analysis server and runtime.
- **Workspace Architecture:** For NEW projects, ALWAYS enforce and utilize the `flutter_workspaces_cli`. For EXISTING projects, strictly respect the current architecture (workspaces or not).
- **Standardization:** Follow the mandatory patterns and Pull Request templates defined in the `templates/` directory.
- **GitHub Collaboration:** Retrieve requirement context from GitHub issues and create structured pull requests for completed work.

## Instructions

### 1. Workspace Verification & Initialization
- **Issue Ingestion:** Retrieve task requirements by checking active issues using GitHub MCP `github_get_issue` or GitHub CLI `gh issue view <issue-number>`.
- **Existing Projects:** Check if the project currently uses a workspaces architecture. If it does not, you MUST respect the existing architecture and structure.
- **New Projects:** You MUST ALWAYS use the workspaces architecture and follow `templates/pubspec_standards.md`.
- Command reference: `fws create`.

### 2. Implementation with Dart MCP & Templates
When performing code changes:
- **Architecture:** Consult `templates/architecture.md` for layer and naming standards.
- **Discovery:** Use `mcp_dart_resolve_workspace_symbol` to find definitions. Use `mcp_dart_hover` or `mcp_dart_signature_help` to understand unknown APIs before implementing.
- **Testing:** Apply BDD principles from `templates/testing_standards.md`. Use `mcp_dart_run_tests` for validation.
- **Quality:** Run `mcp_dart_analyze_files`, `mcp_dart_dart_format`, and `mcp_dart_dart_fix`.

### 3. Execution Phase
1. **Plan:** Outline changes based on `architecture.md` and MCP resolution. **IF UNCERTAIN: Research, do not guess.**
2. **Implement:** Write code adhering to layer standards.
3. **Analyze:** Run `mcp_dart_analyze_files`.
4. **Test:** Run `mcp_dart_run_tests` ensuring 100% behavior coverage.
5. **Format:** Run `mcp_dart_dart_format`.
6. **Publish to GitHub:**
   - Create a feature branch locally (`git checkout -b feat/feature-name`).
   - Stage and commit changes with a descriptive conventional commit message.
   - Push the branch and create a PR on GitHub using `github_create_pull_request` (MCP) or `gh pr create` (CLI), strictly following `templates/pr_standards.md`.

### 4. Handoff
Ensure that by the end of the task, you synthesize what was completed, what new symbols were introduced, the URL of the opened Pull Request, and any remaining open issues, so the next agent can proceed smoothly.
