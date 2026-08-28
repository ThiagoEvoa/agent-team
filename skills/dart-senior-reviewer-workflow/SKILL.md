---
name: dart-senior-reviewer-workflow
description: Workflow for the Senior Dart Architect Reviewer to perform extremely picky, high-quality reviews (Git changes, Full Project, or remote GitHub Pull Requests).
resources:
  - templates/review_standards.md
---

# Dart Senior Architect Reviewer Workflow

Use this skill to guide the Senior Dart Architect Reviewer agent through codebase reviews. It enforces a strict **Two-Axis Review** methodology:

1. **📋 Standards Axis:** Does the code conform to Dart idioms, project conventions (`templates/review_standards.md`), and the **12 Fowler Code Smells Baseline**?
2. **🎯 Spec Axis:** Does the code faithfully and accurately implement the originating issue/spec without missing requirements or introducing scope creep?

Both axes are evaluated independently (or via parallel sub-agents) to prevent standards checks from masking specification drift, or vice versa.

---

## Objectives
- **Two-Axis Isolation:** Evaluate Standards and Spec compliance separately without merging or cross-ranking findings.
- **Enforce Holistic Dart Standards & Code Smells:** Audit against Effective Dart, Sound Null Safety, Immutability, SOLID principles, security requirements, and the 12 Fowler Code Smells (Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest).
- **Spec Fidelity & Scope Creep Prevention:** Rigorously verify that every requirement in the originating spec or issue is met, and flag unrequested code as scope creep.
- **Empirical Static Validation:** Run `dart analyze`, `dart test`, and `dart pub outdated` to ground findings in compiler facts.
- **Strict Structured Output:** Deliver actionable findings as raw bullet points formatted into the Two-Axis structure.
- **Unified Closure Standard:** End reviews with a short status line covering readiness, unresolved risks, and next action.

---

## Review Modes

### Mode A: Fixed-Point / Branch Review (Default)
1. **Pin the Fixed Point:** Identify the base reference (e.g. `origin/main`, commit SHA, or merge-base). Capture diff using `git diff <fixed-point>...HEAD`.
2. **Identify the Spec Source:**
   - Check commit messages for issue numbers (`#123`, `Closes #45`).
   - Look for spec files in `spec/`, `docs/`, or `.scratch/`.
   - If no spec is available, evaluate Standards axis and note "No spec available for Spec Axis".
3. **Run Two-Axis Evaluation:**
   - **Standards Pass:** Review modified hunks against `templates/review_standards.md` (use `scripts/extract_section.py` for token efficiency) and the 12 Fowler Smells.
   - **Spec Pass:** Compare diff against acceptance criteria from the spec/issue.
4. **Compile Output:** Use `scripts/reviewer_helper.py` to match compiler issues and draft the two-axis report.

### Mode B: GitHub PR Review
1. Fetch PR details and diff using `gh pr diff <pr-number>` or GitHub MCP `github_get_pull_request`.
2. Retrieve the linked issue / spec description from the PR body.
3. Perform the Two-Axis review and post structured comments or global review using `gh pr review` or GitHub MCP.

### Mode C: Full Project Architectural Audit
1. Safely iterate through project modules to assess module depth, circular dependencies, domain invariants, and security posture.
2. If structural Fowler smells (Shotgun Surgery, Divergent Change, Feature Envy, Refused Bequest) are found in **more than 2 modules**, do not attempt to design refactoring solutions yourself. Instead:
   - Document the findings concisely in your Standards Axis output.
   - Add an **`⚠️ Architectural Escalation Recommended`** block listing the affected modules and smells.
   - Recommend invoking `senior-architect` for a full deep-module audit, HTML report, and Design-It-Twice session.


---

## Output Format - STRICT TWO-AXIS STRUCTURE

```markdown
## 📋 Standards Axis
- **Violations & Hard Breaches:**
  - `[File: Line]` **Violation:** [Documented standard breach]. **Fix:** [Specific fix].
- **Code Smells (Judgement Calls):**
  - `[File: Line]` **Smell:** [Fowler Smell Name]. **Fix:** [Refactoring suggestion].
- **Compiler & Analyzer:**
  - `[File: Line]` **Issue:** `dart analyze` / `dart format` finding. **Fix:** [Action].

## 🎯 Spec Axis
- **Missing / Incomplete Requirements:**
  - `[Spec Reference]` **Missing:** [Requirement asked for in spec but missing in diff].
- **Scope Creep / Unrequested Behavior:**
  - `[File: Line]` **Scope Creep:** [Behavior added that was not requested in spec].
- **Incorrect Spec Implementation:**
  - `[File: Line]` **Defect:** [Implementation does not match spec intent]. **Fix:** [Correction].

## Summary
- **Standards Axis:** [X] findings (Worst: [Brief summary or None])
- **Spec Axis:** [Y] findings (Worst: [Brief summary or None])
```

## Parameters
- `fixed_point` (string, optional): Git reference to compare against (e.g. `origin/main`, `HEAD~1`).
- `spec_path` (string, optional): Path to spec markdown file or issue reference.
- `only_staged` (boolean, optional): If true, only review staged changes.
- `full_review` (boolean, optional): If true, performs a comprehensive review of the entire project.
- `pr_number` (integer, optional): The number of the target GitHub Pull Request.
- `files` (array of strings, optional): Specific file paths to review.

