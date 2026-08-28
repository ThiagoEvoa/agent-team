# Agents

This folder contains the agent personas used by the Copilot CLI workspace.

## How to use them
- Pick the agent that matches the task domain.
- Each agent is a role description plus the tools and rules it should follow.
- Most agents expect you to activate a matching skill first.

## Agents

| Agent | Purpose | Best for |
|---|---|---|
| `orchestrator` | Coordinates specs, task flow, and reviewer/developer handoffs | Multi-step delivery and agent routing |
| `spec-specialist` | Turns rough ideas into structured specs | Discovery, user stories, and implementation planning |
| `product-owner` | Manages backlog and project board state | GitHub Projects and lifecycle tracking |
| `flutter-senior-developer` | Implements Flutter features and fixes | Flutter app code changes |
| `dartfrog-senior-developer` | Implements Dart Frog backend work | APIs, routes, middleware, backend logic |
| `dart-senior-reviewer` | Reviews code with standards/spec checks | PR review and code quality audits |
| `senior-architect` | Reviews system structure and refactor direction | Architecture, module design, ADRs |
| `researcher` | Finds and verifies facts from code or the web | Research-heavy tasks and evidence gathering |
| `flutter-qa-specialist` | Runs Flutter UI tests with real app interactions | UI validation and runtime testing |
| `devops-specialist` | Handles CI/CD, Docker, and deployment | Infrastructure and pipeline tasks |
| `ui-ux-designer` | Produces UI/UX direction and design-system guidance | App screens, flows, and visual design |
| `rubber-duck` | Acts as a reasoning partner | Idea stress-testing and tradeoff discussion |

## Notes
- Agents are intentionally specialized.
- Use the narrowest agent that can complete the task well.
- If work spans multiple domains, start with the orchestrator.
