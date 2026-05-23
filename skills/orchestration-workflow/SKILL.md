---
name: orchestration-workflow
description: Workflow and procedural guidance for the Orchestrator Agent to manage Spec-Driven Development (SDD) lifecycles via implementation and review loops.
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

Use this skill to guide the Orchestrator Agent through the coordination, delegation, and verification of software implementation tasks.

## Objectives
1. **Automate Spec-Driven Execution:** Read and parse specifications from markdown documents.
2. **Coordinate Implementation and Review Loops:** Manage a strict iteration loop where code is written by a developer agent and reviewed by a reviewer agent.
3. **Verify Deliverables:** Ensure that the reviewer agent explicitly approves the work before considering a task completed.
4. **Handoff and Completion Reporting:** Document all phases, changes made, pull request links, and status updates.

## ⚡ Token Optimization Guidelines
To keep token usage minimal and context windows clean:
- **Concise Prompts**: When invoking subagents, provide ONLY the specific, minimal subset of requirements/specifications related to the current task. Do NOT pass the entire specification file unless the task depends on all of it.
- **Isolate Context**: Do NOT pass full chat histories or unrelated files when spawning new agents. Use branch/share workspace modes selectively if supported to keep workspace footprint low.
- **Feedback Stripping**: When cycling back to the developer agent with reviewer feedback, pass ONLY the specific "Required Improvements" bullet points. Strip out conversational text, nitpicks, and general feedback.
- **Targeted Operations**: Instruct subagents to read only specific files and use precise line numbers or range-based lookups (`view_file` with `StartLine`/`EndLine`) instead of dumping full file contents or repeating wide directory scans.
- **No Conversational Overhead**: All reports (Handoff, Review, Orchestrator progress) must be formatted as raw bullet points, avoiding pleasantries or verbose explanations.

## Workflow Instructions

### 1. Ingestion Phase
At the start of the orchestration:
1. Locate the file at `spec_path`.
2. Read the spec file content using `read_file`.
3. Extract:
   - The technology stack and requirements.
   - The task list / checklist if present in the specification.
   - Any reference architecture, constraints, or repository laws (e.g. `constitution.md`).

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
1. **Delegate to Developer Agent**:
   - Invoke the chosen developer agent using `invoke_subagent` (setting `Workspace` to `share` or `branch` to isolate workspace context).
   - In the prompt, provide:
     - ONLY the specific task/spec requirements (no general spec context).
     - Relevant project files and paths to modify or create.
     - An instruction to return a clear, token-efficient **Handoff Report** summarizing the changes made, tests run, and/or Pull Request links created (raw bullet points, no fluff).
   - Wait for the developer agent to finish and retrieve their handoff report.
2. **Delegate to Reviewer Agent**:
   - Invoke the reviewer agent using `invoke_subagent`.
   - In the prompt, provide:
     - The target task/spec requirements.
     - The **Handoff Report** from the developer agent.
     - Instructions to review the code changes against the specs and project standards (e.g., `templates/review_standards.md` if available).
     - An instruction to format feedback strictly using the **Review Report Format** (Required Improvements vs. Optional/Nitpicks vs. General Feedback).
   - Wait for the reviewer agent to return their feedback.
3. **Evaluate Feedback & Cycle**:
   - Check the reviewer's feedback for any **Required Improvements**:
     - **If Required Improvements are listed (Code is NOT OK)**:
       - Prepare a revision instruction containing ONLY the specific feedback points.
       - Send this instruction to the developer agent, requesting a fix.
       - Wait for the developer agent to implement fixes and return a new handoff report.
       - Repeat the review phase (Step 3.2).
     - **If NO Required Improvements are listed / reviewer approves (Code is OK)**:
       - Mark the task/requirement as fully completed.
       - Proceed to the next task, or to the Finalization phase.

### 4. Finalization & Completion Phase
Once all tasks in the specification are completed and approved:
1. Compile a master report summarizing:
   - The tasks executed and approved.
   - Number of iteration loops run for each task.
   - Pull request(s) or commits containing the changes.
2. Output a summary to the user and mark the orchestration task as complete.

