# Skills

This folder contains the workflow guides that agents activate before doing work.

## How to use them
- Skills are procedural playbooks, not personas.
- Agents usually call `activate_skill` at session start.
- Skills define standards, workflows, templates, and reporting formats.

## Skills

| Skill | Purpose | Used by |
|---|---|---|
| `orchestration-workflow` | Spec-driven coordination, delegation, and review loops | `orchestrator` |
| `to-spec` | Turns ideas into structured technical specs | `spec-specialist` |
| `domain-modeling` | Helps define glossary terms, boundaries, and ADRs | `spec-specialist`, `senior-architect` |
| `product-owner-workflow` | Governs backlog and board management | `product-owner` |
| `flutter-senior-workflow` | Flutter implementation standards and workflow | `flutter-senior-developer` |
| `dartfrog-senior-workflow` | Dart Frog backend implementation standards | `dartfrog-senior-developer` |
| `dart-senior-reviewer-workflow` | Two-axis review methodology and review output | `dart-senior-reviewer` |
| `flutter-qa-consultant` | UI testing workflow with Dart MCP tooling | `flutter-qa-specialist` |
| `devops-senior-workflow` | CI/CD, Docker, and infrastructure guidance | `devops-specialist` |
| `research-workflow` | Rigorous research and source-backed answers | `researcher` |
| `ui-ux-mobile-workflow` | Mobile design-system and UX guidance | `ui-ux-designer` |
| `codebase-design` | Architecture vocabulary and design heuristics | `senior-architect` |
| `improve-codebase-architecture` | Deep architecture analysis and report generation | `senior-architect` |
| `diagnosing-bugs` | Deterministic bug repro and triage workflow | most implementation and QA agents |

## Notes
- Skills are reusable and can be shared across agents.
- If a skill and an agent disagree, the skill should define the process and the agent should stay thin.
