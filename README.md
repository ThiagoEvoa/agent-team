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
- `notes-extension/notes-extension.ts`: Durable session-note synthesis, semantic note search, and note reading.
- `stt-extension/stt.ts`: Local macOS speech-to-text using AVAudioEngine and whisper.cpp.

#### Speech-to-text Extension

macOS-only local transcription. Setup wires `stt.ts` plus recorder assets into `~/.pi/agent/extensions/`:

```bash
./pi-extensions-setup.py
# Then grant Terminal/Pi microphone access in System Settings.
~/.pi/agent/extensions/stt/build-macos.sh  # only needed if bundled recorder is unavailable
```

Install whisper.cpp and a model:

```bash
brew install whisper-cpp
mkdir -p ~/.cache/whisper
curl -L -o ~/.cache/whisper/ggml-small.bin \\
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

Use `/stt` to start/stop recording. Use `/stt-setup` to diagnose and `/stt-cancel` to discard. Audio remains local and temporary WAV files are deleted after processing.

#### Notes Extension

`notes-extension.ts` stores compact durable lessons under OS account's global `~/.pi/agent/notes/` directory. It resolves OS account home, not project cwd or mutable `HOME`, so notes never land in a repository-local `.pi/agent/notes/` directory:

- `/takenote`: Synthesize and save smallest durable lesson from current session.
- `search_notes`: Search note descriptions/content before loading full notes. Returns a small bounded set of related notes by default.
  - `limit`: Maximum direct matches; default `5`, maximum `20`.
  - `relatedLimit`: Maximum additional related notes; default `3`.
  - `relatedDepth`: Relationship hops; default `1`, maximum `2`.
  - `includeContent`: Include compact previews for direct matches; off by default to reduce context tokens.
- `read_note`: Read note content and related-note links by ID.
- `/takenote --dry-run`: Preview synthesis without writing.
- `/takenote --force-new`: Skip duplicate detection.
- `/takenote --update <id>`: Update existing note by ID.
- `/takenote --related <id1,id2>`: Override related-note links.

#### Bounded related-note search

`search_notes` performs lexical search first, then follows existing `relatedNotes` links with strict bounds. Direct matches appear before related matches:

```text
search_notes(query, limit: 5, relatedLimit: 3, relatedDepth: 1)
  -> up to 5 direct matches
  -> up to 3 one-hop related notes
```

Related results contain `matchType: "related"`, `relatedTo`, and `depth`. They do not include note bodies. This keeps default retrieval compact and lets the agent request more context explicitly with a larger `limit`, `relatedLimit`, or `relatedDepth`.

### 5. Pi Config (`pi-config/`)
Default environment configurations:

- `SYSTEM.md`: Caveman compression rules and automatic agent trigger maps.
- `settings.json`: Token compaction, theme, and runtime defaults.
- `models.json` & `mcp.json`: Model registry and MCP server integration profiles.

---

## Installation & Wiring

### Zero-Config Setup (Default)
Automatically detects current user (`getpass.getuser()` / `Path.home()`) and copies files into `~/.agents/` and `~/.pi/agent/`:

```bash
./agents-setup.py
./pi-extensions-setup.py
```

Use `--store-in-agents` for extension files stored canonically under `~/.agents/extension/` and symlinked into Pi.

### Symlink / Development Mode
Symlinks repository files directly into target directories for active editing:

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

STT assets install under `<target-dir>/stt/`; this matches recorder path used by `stt.ts`.
