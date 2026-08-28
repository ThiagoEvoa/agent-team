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

### 3. Execution Phase (Seam-Based TDD)
1. **Plan & Identify Seam:** Analyze project requirements and determine the highest-level clean seam (ViewModel, Repository, or Feature Controller). Review `CONTEXT.md` for domain invariants.
2. **Write Failing Test (Red):** Write behavioral tests against the seam interface before writing the implementation (`flutter test test/feature_test.dart`). Watch it fail.
3. **Implement (Green):** Write minimal, deep implementation code behind the seam to satisfy the tests.
4. **Fast Loop Verification:** Run `mcp_dart_analyze_files` and targeted single test files regularly during development.
5. **Full Suite Verification:** Run `scripts/project_lifecycle.py verify` (or `mcp_dart_run_tests`) once at completion to ensure 100% test pass rate and zero analyzer warnings.
6. **Format:** Run `mcp_dart_dart_format`.
7. **Publish to GitHub:**
   - Ensure you are on your synchronized local feature branch.
   - Stage and commit changes with a descriptive conventional commit message.
   - Push the branch and create a Pull Request on GitHub using `github_create_pull_request` (MCP) or `gh pr create` (CLI), strictly following `templates/pr_standards.md`.

### 4. Handoff & Review Trigger
Synthesize a concise, token-efficient **Handoff Report**:
- List of modified/created files and symbols.
- Test command and proof of pass at the seam.
- Link to the Pull Request or branch diff.
- Trigger handoff to `dart-senior-reviewer` for Two-Axis Review (`📋 Standards` vs `🎯 Spec`).


