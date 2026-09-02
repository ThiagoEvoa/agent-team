# Agent Team

Complete multi-agent development ecosystem for the `pi` coding assistant. Integrates specialized autonomous personas, reusable skills, helper workflow automation scripts, TypeScript UI/spawner extensions, and configuration presets.

---

## Repository Structure

```
agent-team/
├── agents/                  # Specialized agent role definitions (Markdown)
├── skills/                  # Procedural workflows, playbooks, and templates
├── scripts/                 # Automation helper scripts for agent loops & extraction
├── extension/               # TypeScript extensions for pi agent runtime
├── pi-config/               # Baseline pi settings, MCP configs, models, and SYSTEM prompt
├── agents-setup.py          # Setup script to wire agents, skills, and scripts
├── pi-extensions-setup.py   # Setup script to wire pi TypeScript extensions
└── README.md
```

---

## Components

### 1. Agents (`agents/`)
Markdown specifications defining agent persona, constraints, and tool access:

| Agent | Purpose | Target Domain |
|---|---|---|
| `orchestrator.md` | Coordinates specs, task delegation, dev-review loops | Multi-step lifecycle coordination |
| `spec-specialist.md` | Requirements discovery, specs, and execution checklists | Spec-Driven Development (SDD) |
| `product-owner.md` | Backlog grooming and GitHub Projects (v2) board transitions | Task & board lifecycle |
| `flutter-senior-developer.md` | Dart MCP & workspace-driven Flutter development | Frontend mobile applications |
| `dartfrog-senior-developer.md` | Dart Frog backend development, routing, and middleware | Backend API services |
| `dart-senior-reviewer.md` | Two-axis architectural, quality, and security audits | Strict PR and code reviews |
| `senior-architect.md` | High-leverage module design, ADRs, codebase refactors | System architecture |
| `researcher.md` | Multi-source verification, web search, and evidence gathering | Fact retrieval without guessing |
| `flutter-qa-specialist.md` | Automated UI test runs and widget tree inspection | Mobile test automation |
| `devops-specialist.md` | Docker, Kubernetes, CI/CD pipelines, and cloud setup | Infrastructure automation |
| `ui-ux-designer.md` | Design systems, mobile UI/UX, Material Design | Interface and UX specification |
| `rubber-duck.md` | Interactive peer thinking, edge case and logic stress tests | Brainstorming & reasoning |

### 2. Skills (`skills/`)
Structured procedural playbooks and templates loaded by agents:

- `orchestration-workflow`: Dev-review cycles and task progression.
- `to-spec`: Technical specification synthesis.
- `domain-modeling`: Ubiquitous domain language, bounded contexts, ADRs.
- `product-owner-workflow`: GitHub Projects tracking and issue synchronization.
- `flutter-senior-workflow`: Flutter code standards, workspace templates, and validation.
- `dartfrog-senior-workflow`: Backend route structure and middleware patterns.
- `dart-senior-reviewer-workflow`: Review standards, Fowler smells, two-axis reports.
- `flutter-qa-consultant`: Dart MCP test runners and UI interaction flows.
- `devops-senior-workflow`: Docker multi-stage builds, Kubernetes manifests, and CI/CD.
- `research-workflow`: Source synthesis and fact checking.
- `ui-ux-mobile-workflow`: Mobile design patterns and accessibility requirements.
- `codebase-design`: Architectural principles for deep module design.
- `improve-codebase-architecture`: Shallow module discovery and refactor reports.
- `diagnosing-bugs`: 6-phase systematic debugging and resolution loop.

### 3. Helper Scripts (`scripts/`)
Token-efficient automation utilities executed by agents and workflows:

- `extract_section.py`: Extracts specific headings from large markdown templates to reduce LLM context usage.
- `orchestrate.py`: Parses feedback, tracks task progression, and initializes specs.
- `project_lifecycle.py`: Runs automated workspace verification and test suites.
- `reviewer_helper.py`: Correlates compiler outputs with review checklists.
- `qa_suite.py`: Automates QA pipeline triggers and report generation.
- `devops_trigger.py`: Orchestrates CI/CD container validation.

### 4. Pi Extensions (`extension/`)
TypeScript runtime modules providing UI enhancements and subagent coordination:

- `custom-tui/custom-tui.ts`: Terminal UI improvements and status formatting.
- `agent-switcher/agent-switcher.ts`: Interactive agent selector and prompt switching.
- `subagent-spawner/subagent-spawner.ts`: Isolated subagent delegation and execution management.

### 5. Pi Config (`pi-config/`)
Default environment configurations:

- `SYSTEM.md`: Caveman compression rules and automatic agent trigger maps.
- `settings.json`: Token compaction, theme, and runtime defaults.
- `models.json` & `mcp.json`: Model registry and MCP server integration profiles.

---

## Installation & Wiring

### Zero-Config Setup (Default)
Automatically detects current user (`getpass.getuser()` / `Path.home()`), installs canonical files to `~/.agents/` (`/Users/{user}/.agents/`), and wires them directly into `~/.pi/agent/`:

```bash
./agents-setup.py
./pi-extensions-setup.py
```

### Symlink / Development Mode
Symlinks repository files directly into `~/.agents/` and `~/.pi/agent/` for active editing:

```bash
./agents-setup.py --symlink
./pi-extensions-setup.py --symlink
```

### Script Options

#### `agents-setup.py`
- `--symlink` / `-s`: Create symbolic links instead of copying.
- `--user` / `-u <username>`: Explicitly override target user home.
- `--agents-target <path>`: Custom base directory for `.agents` (default: `~/.agents`).
- `--pi-agent-target <path>`: Custom base directory for `.pi/agent` (default: `~/.pi/agent`).
- `--no-force`: Prevent overwriting existing target files.

#### `pi-extensions-setup.py`
- `--symlink` / `-s`: Create symbolic links.
- `--user` / `-u <username>`: Explicitly override target user home.
- `--target-dir <path>`: Custom destination directory for pi extensions (default: `~/.pi/agent/extensions`).
- `--agents-target <path>`: Custom base directory for `.agents` (default: `~/.agents`).
- `--no-force`: Prevent overwriting existing target files.
