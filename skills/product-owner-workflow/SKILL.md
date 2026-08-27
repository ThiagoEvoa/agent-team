---
name: product-owner-workflow
description: Workflow and procedural guidance for the Product Owner Agent to manage GitHub Projects (v2) boards, maintain backlogs, ingest specifications into tasks/issues, and track lifecycle column transitions.
parameters:
  spec_path:
    type: string
    description: Absolute or relative path to the project specification markdown file (e.g. spec.md).
    required: false
  project_number:
    type: integer
    description: GitHub Project (v2) number to manage and sync tasks with.
    required: true
  project_owner:
    type: string
    description: GitHub Project owner login (defaults to "@me" or current user/org).
  repo:
    type: string
    description: Optional GitHub repository (e.g. "owner/repo") for creating linked issues.
---

# Product Owner Workflow Skill

Use this skill to guide the Product Owner Agent through GitHub Projects (v2) board management, backlog grooming, task/issue creation, and lifecycle column transitions.

## Objectives
1. **Ingest Specifications into the Backlog:** Read spec files and create corresponding tasks/issues on the project board.
2. **Synchronize GitHub Project Columns:** Move cards across columns (`Backlog` -> `Ready` -> `In progress` -> `In review` -> `Done` / `Blocked`) in real time.
3. **Maintain a Healthy Backlog:** Ensure items are correctly prioritized, described, and in the right column at all times.
4. **Report Board Status:** Provide clear summaries of column distributions, blocked items, and overall progress.

---

## 📋 GitHub Projects & Backlog Management Guide

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
Set the initial status to `Backlog`:
```bash
gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<BACKLOG_OPTION_ID>"
```

### 3. Lifecycle Column Transitions
Update item statuses as execution progresses:
```bash
# Move to 'Ready' when a task is groomed and ready to be picked up:
gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<READY_OPTION_ID>"

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
When a `spec_path` is provided:
1. Read the spec file using `read_file`.
2. Extract:
   - The task list / checklist items.
   - Descriptions, dependencies, and acceptance criteria per task.
3. Discover field IDs and status options using `gh project field-list`.
4. Create each task on the project board with status `Backlog`.

### 2. Backlog Grooming
Review all items in `Backlog`:
- Ensure each item has a clear title, description, and acceptance criteria.
- Move well-defined, dependency-free items to `Ready`.
- Flag items missing context as `Blocked` with a note explaining what is needed.

### 3. Lifecycle Tracking
Respond to status change requests from the Orchestrator or other agents:
- When notified that development has started on an item → move to `In progress`.
- When notified that development is complete → move to `In review`.
- When notified that an item is blocked → move to `Blocked`.
- When notified that review is approved → move to `Done` and close the linked issue if applicable:
  ```bash
  gh issue close <ISSUE_NUMBER> --repo "<REPO>"
  ```

### 4. Status Reporting
On request, provide a board status summary:
1. Count items per column.
2. List any `Blocked` items with their blocking reason.
3. List items in `Done` that were completed in the current session.
4. Output as raw bullet points — no conversational overhead.
