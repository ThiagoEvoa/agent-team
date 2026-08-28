---
name: orchestration-workflow
description: Workflow and procedural guidance for the Orchestrator Agent to manage Spec-Driven Development (SDD) lifecycles via implementation and review loops. GitHub Project board management is delegated to the product-owner agent.
parameters:
  spec_path:
    type: string
    description: Absolute or relative path to the project specification markdown file (e.g. spec.md).
    required: true
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
- **Shared Delivery Standard**: All delegated developer, reviewer, and architect work must end with a concise handoff or review report that names changed files, key decisions, validation performed, and any follow-up risks.
- **Workspace Safety**: Do not instruct agents to switch branches, create branches, pull, stash, reset, or otherwise mutate git state unless the user explicitly asked for that workflow.

---

## 📋 GitHub Project Board Management

The Orchestrator does **not** manage the GitHub Project board directly. All board and backlog operations are delegated to the `product-owner` agent.

When a board update is needed, send a message to the `product-owner` agent specifying:
- The item title or ID to update.
- The target column (`In progress`, `In review`, `Blocked`, or `Done`).
- Any relevant context (e.g. blocking reason, linked PR/issue URL).

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
   - Delegate to the `product-owner` agent to ensure all spec tasks exist on the project backlog board in `Backlog` status.

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
- **Architectural Audit** (triggered on demand or by reviewer escalation):
  - Use `senior-architect` when:
    - The `dart-senior-reviewer` raises an **`⚠️ Architectural Escalation Recommended`** flag.
    - A task has accumulated > 2 review cycles with recurring structural Fowler smells.
    - The spec explicitly requires a module redesign or seam migration.


### 3. Execution & Delegation Loop
For each task or requirement set identified in the spec:
1. **Board Update (In Progress)**:
   - Notify the `product-owner` agent to move the task to `In progress`.
2. **Delegate to Developer Agent**:
   - Invoke the chosen developer agent using `invoke_subagent` (setting `Workspace` to `share` or `branch` to isolate workspace context).
   - In the prompt, provide:
     - ONLY the specific task/spec requirements (no general spec context).
     - Relevant project files and paths to modify or create.
     - An instruction to return a clear, token-efficient **Handoff Report** summarizing the changes made, tests run, and/or Pull Request links created (raw bullet points, no fluff).
   - Wait for the developer agent to finish and retrieve their handoff report.
3. **Board Update (In Review)**:
   - Notify the `product-owner` agent to move the task to `In review`.
4. **Delegate to Reviewer Agent**:
   - Invoke the reviewer agent using `invoke_subagent`.
   - In the prompt, provide:
     - The target task/spec requirements.
     - The **Handoff Report** from the developer agent.
     - Instructions to review the code changes using the **Two-Axis Review** format (`📋 Standards` + 12 Fowler Code Smells vs `🎯 Spec Compliance`).
   - Wait for the reviewer agent to return their feedback.
5. **Evaluate Feedback & Cycle**:
   - Parse reviewer feedback using `scripts/orchestrate.py parse-feedback --raw "..."` to isolate actionable items (violations, compiler issues, missing spec items, incorrect implementations):
     - **If Action Items are present (Code is NOT OK)**:
       - Notify the `product-owner` agent to move task status back to `In progress` (or `Blocked` if blocked by external issue).
       - Prepare a revision instruction containing ONLY the isolated action items.
       - Send this instruction to the developer agent, requesting a fix.
       - Wait for the developer agent to implement fixes and return a new handoff report.
       - Repeat the review phase (Step 3.4).
     - **If NO Action Items are present / reviewer approves (Code is OK)**:
       - Notify the `product-owner` agent to move the task to `Done` and close the linked issue if applicable.
       - Mark the task/requirement as fully completed locally (`scripts/orchestrate.py update <task_id> done`).
       - Proceed to the next task, or to the Finalization phase.


### 4. Finalization & Completion Phase
Once all tasks in the specification are completed and approved:
1. Request a board status report from the `product-owner` agent to confirm all cards are in `Done`.
2. Compile a master report summarizing:
   - The tasks executed and approved.
   - Number of iteration loops run for each task.
   - Pull request(s) or commits containing the changes.
3. **Architectural Retrospective (Optional):** If any task accumulated **> 2 review cycles** or received an `⚠️ Architectural Escalation Recommended` flag from the reviewer, invoke `senior-architect` with a summary of the affected modules for a post-sprint deep-module audit and HTML report.
4. Output a summary to the user and mark the orchestration task as complete.
