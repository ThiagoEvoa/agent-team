---
name: dart-senior-reviewer-workflow
description: Workflow for the Senior Dart Architect Reviewer to perform extremely picky, high-quality reviews (Git changes, Full Project, or remote GitHub Pull Requests).
resources:
  - templates/review_standards.md
---

# Dart Senior Architect Reviewer Workflow

Use this skill to guide the Senior Dart Architect Reviewer agent through codebase reviews. It enforces three modes:
1. **Changes Review:** Reviewing only git-modified or staged files.
2. **Full Project Review:** A comprehensive architectural and security audit of the entire project.
3. **GitHub PR Review:** An audit of a remote Pull Request, providing line-by-line or global PR comments on GitHub.

## Objectives
- **Enforce Holistic Dart Standards:** Review code changes against a comprehensive set of Dart-specific architectural, testing, and **security** standards.
- **Identify Gaps with Extreme Pickiness:** Pinpoint specific code that violates standards, misses Dart-native optimizations, or introduces **security vulnerabilities**. Zero tolerance for technical debt or insecure patterns.
- **Validate Architecture & Security:** Ensure changes align with the project's architectural integrity, long-term maintainability, and security posture.
- **Strict Output Format:** Generate actionable feedback EXCLUSIVELY as bullet points for the implementing agent to consume easily.

## Instructions

### 1. Scope Determination
The reviewer must support three primary modes of operation:
- **Mode A: Changes Review (Default)**
  - Use `git status` to identify modified and staged files.
  - Determine if reviewing all changes, staged changes (`--staged`), or specific files.
  - Fetch the current content and the diff/patch for context.
- **Mode B: Full Project Review**
  - Safely map the codebase to prevent context exhaustion (iterate through directories sequentially).
  - Analyze the overall project structure, dependency graphs, and cross-module integrity.
- **Mode C: GitHub PR Review**
  - Fetch the PR details and diff using GitHub MCP `github_get_pull_request` or GitHub CLI `gh pr diff <pr-number>`.
  - Identify modified files and fetch their contents to review context.
  - Submit comments to specific files/lines or as a global review summary using `github_create_comment` / `github_add_comment` (MCP) or `gh pr comment` / `gh pr review` (CLI).

### 2. Analysis Workflow (Applies to all modes)
1. **Fetch Data:** Retrieve content for the target files or directories, or PR diffs.
2. **Gap Analysis:** Compare code against relevant sections of `templates/review_standards.md` with a highly critical eye. To conserve tokens, use the helper script `scripts/extract_section.py` (e.g. `python3 scripts/extract_section.py skills/dart-senior-reviewer-workflow/templates/review_standards.md "<section_name>"`) to query only the necessary sections (e.g., "SOLID Principles", "Security & Data Integrity", etc.).
3. **Empirical Validation:** Attempt to run `dart analyze`, `dart test`, and `dart pub outdated --mode=security` (if applicable) via `run_shell_command` to gather factual data.
4. **Generate Report:** Present findings directly to the user (and post to GitHub if reviewing a PR) strictly using the **Feedback Structure**.

### Feedback Structure - STRICT MANDATE
Your response MUST be exclusively bullet points. No conversational filler, no introductory/concluding paragraphs. 

Format:
- **Required Improvements:**
  - `[File: Line]` **Issue:** [Brief description of violation, citing the standard]. **Fix:** [Clear instruction or short code snippet of the expected fix].
  - `[File: Line]` **Issue:** [Issue]. **Fix:** [Fix].
- **Optional / Nitpicks:**
  - `[File: Line]` **Issue:** [Issue]. **Fix:** [Fix].
- **General Feedback (if any):**
  - **Issue:** [High-level architectural observation]. **Recommendation:** [Suggestion].

## Parameters
- `only_staged` (boolean, optional): If true, only review staged changes.
- `full_review` (boolean, optional): If true, performs a comprehensive review of the entire project.
- `pr_number` (integer, optional): The number of the target GitHub Pull Request.
- `files` (array of strings, optional): Specific file paths to review.
