---
name: flutter-senior-workflow
description: Workflow and procedural guidance for the Senior Flutter Developer, focusing on dart-mcp, flutter_workspaces_cli, and GitHub integration.
resources:
  - templates/pr_standards.md
  - templates/project_template.md
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
- **Branch Synchronization:** Before making any code changes, check out the main repository branch (`main` or `master`), pull the latest remote changes (`git pull`), and create a new feature branch (e.g., `git checkout -b feat/feature-name`) from the updated branch to avoid conflicts.
- **Existing Projects:** Analyze the project structure. Check if it uses the workspaces architecture (e.g., `resolution: workspace` in the root `pubspec.yaml`). If it does, use the workspaces guidelines in `project_template.md`. Otherwise, use the existing architecture, directory structure, and patterns adopted by the project.
- **New Projects:** You MUST ALWAYS use the workspaces architecture and follow the guidelines and templates in `project_template.md`.
- Command reference: `fws create`.

### 2. Implementation with Dart MCP & Templates
When performing code changes:
- **Standards:**
  - **Workspaces:** To conserve tokens and avoid reading the entire file, use the Python helper script `scripts/extract_section.py` to extract only the needed section from `project_template.md`.
    Example command: `python3 scripts/extract_section.py skills/flutter-senior-workflow/templates/project_template.md "<section_name>"`
    Available sections:
    - "Workspace Architecture & Packages"
    - "Feature Package Directory Structure"
    - "pubspec.yaml"
    - "lib/new_feature.dart"
    - "lib/src/util/router/router.dart"
    - "lib/src/data/models/new_feature_model.dart"
    - "lib/src/data/repositories/new_feature_repository.dart"
    - "lib/src/data/datasources/new_feature_api.dart"
    - "lib/src/ui/view_models/new_feature_view_model.dart"
    - "lib/src/ui/views/new_feature_view.dart"
    - "Code Generation"
    - "Add to GoRouter routes"
  - **Traditional (Non-Workspace) Projects:** Analyze existing files in the project to learn the adopted patterns, structure, and libraries, and conform to them.
- **Discovery:** Use `mcp_dart_resolve_workspace_symbol` to find definitions. Use `mcp_dart_hover` or `mcp_dart_signature_help` to understand unknown APIs before implementing.
- **Quality:** Run `mcp_dart_analyze_files`, `mcp_dart_dart_format`, and `mcp_dart_dart_fix`.

### 3. Execution Phase
1. **Plan:** Analyze the project structure to determine target architecture. Outline changes based on either `project_template.md` (for workspaces) or the project's existing templates/patterns (for non-workspaces). **IF UNCERTAIN: Research, do not guess.**
2. **Implement:** Write code adhering to the determined architecture (either workspaces as per `project_template.md` or the existing project's structure).
3. **Analyze:** Run `mcp_dart_analyze_files`.
4. **Test:** Run `mcp_dart_run_tests` ensuring 100% behavior coverage.
5. **Format:** Run `mcp_dart_dart_format`.
6. **Publish to GitHub:**
   - Ensure you are on your local feature branch (which was synchronized and created at the start).
   - Stage and commit changes with a descriptive conventional commit message.
   - Push the branch and ALWAYS create a brand new Pull Request on GitHub using `github_create_pull_request` (MCP) or `gh pr create` (CLI), strictly following `templates/pr_standards.md`. DO NOT reuse, push to, or update an existing Pull Request.

### 4. Handoff
Ensure that by the end of the task, you synthesize what was completed, what new symbols were introduced, the URL of the opened Pull Request, and any remaining open issues, so the next agent can proceed smoothly.

