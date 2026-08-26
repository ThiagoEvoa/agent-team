---
name: orchestration-workflow
description: Workflow and procedural guidance for the Orchestrator Agent to manage Spec-Driven Development (SDD) lifecycles via implementation, review loops, and GitHub Project backlog management.
parameters:
  spec_path:
    type: string
    description: Absolute or relative path to the project specification markdown file (e.g. spec.md).
    required: true
  project_number:
    type: integer
    description: Optional GitHub Project (v2) number to manage and sync tasks with.
  project_owner:
    type: string
    description: Optional GitHub Project owner login (defaults to "@me" or current user/org).
  repo:
    type: string
    description: Optional GitHub repository (e.g. "owner/repo") for creating linked issues.
  developer_agent:
    type: string
    description: Optional override for the developer agent to use (e.g., flutter-senior-developer).
  reviewer_agent:
    type: string
    description: Optional override for the reviewer agent to use (e.g., dart-senior-reviewer).
---

# Orchestration Workflow Skill

Use this skill to guide the Orchestrator Agent through the coordination, delegation, verification, and GitHub Project backlog lifecycle management of software implementation tasks.

## Objectives
1. **Automate Spec-Driven Execution:** Read and parse specifications from markdown documents.
2. **Synchronize GitHub Project Backlogs & Columns:** Create tasks/issues and move cards across project board columns (`Backlog` -> `Ready` -> `In progress` -> `In review` -> `Done` / `Blocked`) in real time.
3. **Coordinate Implementation and Review Loops:** Manage a strict iteration loop where code is written by a developer agent and reviewed by a reviewer agent.
4. **Verify Deliverables:** Ensure that the reviewer agent explicitly approves the work before considering a task completed.
5. **Handoff and Completion Reporting:** Document all phases, changes made, pull request links, and status updates.

## ⚡ Token Optimization Guidelines
To keep token usage minimal and context windows clean:
- **Concise Prompts**: When invoking subagents, provide ONLY the specific, minimal subset of requirements/specifications related to the current task. Do NOT pass the entire specification file unless the task depends on all of it.
- **Isolate Context**: Do NOT pass full chat histories or unrelated files when spawning new agents. Use branch/share workspace modes selectively if supported to keep workspace footprint low.
- **Feedback Stripping**: When cycling back to the developer agent with reviewer feedback, pass ONLY the specific "Required Improvements" bullet points. Strip out conversational text, nitpicks, and general feedback.
- **Targeted Operations**: Instruct subagents to read only specific files and use the helper script `scripts/extract_section.py` to extract precise sections from standard/template files (or use `view_file` with `StartLine`/`EndLine` for specific code files) instead of dumping full file contents or repeating wide directory scans.
- **No Conversational Overhead**: All reports (Handoff, Review, Orchestrator progress) must be formatted as raw bullet points, avoiding pleasantries or verbose explanations.

---

## 📋 GitHub Projects & Backlog Management Guide

When a GitHub Project is targeted (or when `project_number` is provided), the Orchestrator manages the project board throughout the development lifecycle via the `gh` CLI.

### 1. Project Discovery & Status Field Mapping
Inspect the project schema and map status column names to Option IDs:
```bash
# 1. Get Project ID
gh project view <PROJECT_NUMBER> --owner "<PROJECT_OWNER>" --format json

# 2. Get Field IDs and Single-Select Option IDs (Status, Priority, Size, etc.)
gh project field-list <PROJECT_NUMBER> --owner "<PROJECT_OWNER>" --format json
```
Locate the **Status** field ID (`PVTSSF_...`) and the Option IDs for:
- `Backlog`
- `Ready`
- `In progress`
- `In review`
- `Blocked`
- `Done`

### 2. Task / Issue Ingestion to Project Backlog
For each task or checklist item in the specification:
```bash
# Option A: Create a draft issue directly in the project
gh project item-create <PROJECT_NUMBER> --owner "<PROJECT_OWNER>" --title "Task Title" --body "Description..." --format json

# Option B: Create a repository issue and link it to the project
gh issue create --title "Task Title" --body "Description..." --repo "<REPO>"
gh project item-add <PROJECT_NUMBER> --owner "<PROJECT_OWNER>" --url "<ISSUE_URL>"
```
Set the initial status to `Backlog` (or `Ready`):
```bash
gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<BACKLOG_OPTION_ID>"
```

### 3. Lifecycle Column Transitions
Update item statuses as execution progresses:
```bash
# Move to 'In progress' when development starts:
gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<IN_PROGRESS_OPTION_ID>"

# Move to 'In review' when handed off to reviewer:
gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<IN_REVIEW_OPTION_ID>"

# Move to 'Blocked' if feedback or dependency blocks progress:
gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<BLOCKED_OPTION_ID>"

# Move to 'Done' when review is approved and code verified:
gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<DONE_OPTION_ID>"
```

---

## Workflow Instructions

### 1. Ingestion Phase
At the start of the orchestration:
1. Locate the file at `spec_path`.
2. Read the spec file content using `read_file` (or `scripts/orchestrate.py init <spec_path>`).
3. Extract:
   - The technology stack and requirements.
   - The task list / checklist if present in the specification.
   - Any reference architecture, constraints, or repository laws (e.g. `constitution.md`).
4. **GitHub Project Sync (if project configured)**:
   - Discover field IDs and status options using `gh project field-list`.
   - Ensure all spec tasks exist on the project backlog board in `Backlog` status.

### 2. Agent Selection Matrix
Select the appropriate developer and reviewer agents.
- **Developer Agent Selection** (unless overridden by `developer_agent` parameter):
  - **Flutter/Frontend tasks**: Use `flutter-senior-developer` agent.
  - **Dart Frog/Backend tasks**: Use `dartfrog-senior-developer` agent.
  - **DevOps/Infrastructure/Docker/CI-CD tasks**: Use `devops-specialist` agent.
  - **Default**: Use `self` or prompt the user for guidance.
- **Reviewer Agent Selection** (unless overridden by `reviewer_agent` parameter):
  - **Dart/Flutter/Dart Frog**: Use `dart-senior-reviewer` agent.
  - **Default**: Use a peer developer agent or prompt the user for guidance.

### 3. Execution & Delegation Loop
For each task or requirement set identified in the spec:
1. **Board Update (In Progress)**:
   - If GitHub Project is linked, move the task to `In progress`.
2. **Delegate to Developer Agent**:
   - Invoke the chosen developer agent using `invoke_subagent` (setting `Workspace` to `share` or `branch` to isolate workspace context).
   - In the prompt, provide:
     - ONLY the specific task/spec requirements (no general spec context).
     - Relevant project files and paths to modify or create.
     - An instruction to return a clear, token-efficient **Handoff Report** summarizing the changes made, tests run, and/or Pull Request links created (raw bullet points, no fluff).
   - Wait for the developer agent to finish and retrieve their handoff report.
3. **Board Update (In Review)**:
   - If GitHub Project is linked, move the task to `In review`.
4. **Delegate to Reviewer Agent**:
   - Invoke the reviewer agent using `invoke_subagent`.
   - In the prompt, provide:
     - The target task/spec requirements.
     - The **Handoff Report** from the developer agent.
     - Instructions to review the code changes against the specs and project standards (e.g., `templates/review_standards.md` if available).
     - An instruction to format feedback strictly using the **Review Report Format** (Required Improvements vs. Optional/Nitpicks vs. General Feedback).
   - Wait for the reviewer agent to return their feedback.
5. **Evaluate Feedback & Cycle**:
   - Check the reviewer's feedback for any **Required Improvements**:
     - **If Required Improvements are listed (Code is NOT OK)**:
       - Move task status back to `In progress` (or `Blocked` if blocked by external issue).
       - Prepare a revision instruction containing ONLY the specific feedback points.
       - Send this instruction to the developer agent, requesting a fix.
       - Wait for the developer agent to implement fixes and return a new handoff report.
       - Repeat the review phase (Step 3.4).
     - **If NO Required Improvements are listed / reviewer approves (Code is OK)**:
       - Move task on GitHub Project to `Done`.
       - If backed by an issue, close the issue if appropriate (`gh issue close`).
       - Mark the task/requirement as fully completed locally (`scripts/orchestrate.py update <task_id> done`).
       - Proceed to the next task, or to the Finalization phase.

### 4. Finalization & Completion Phase
Once all tasks in the specification are completed and approved:
1. Verify all board cards are in `Done` column.
2. Compile a master report summarizing:
   - The tasks executed and approved.
   - Number of iteration loops run for each task.
   - Pull request(s) or commits containing the changes.
   - GitHub project board status link.
3. Output a summary to the user and mark the orchestration task as complete.

