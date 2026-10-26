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
| `firebase-agent.md` | Firebase MCP-driven configuration, rules, Functions, and operations | Firebase services and backend resources |
| `web-senior-developer.md` | Astro and Next.js implementation with framework MCP guidance | Websites and interactive web products |
| `dartfrog-senior-developer.md` | Dart Frog backend development, routing, and middleware | Backend API services |
| `go-senior-developer.md` | Go backend implementation, debugging, architecture, and review | Go HTTP APIs, services, modules, and workspaces |
| `rust-senior-engineer.md` | Rust implementation, architecture, debugging, and two-axis review | Rust crates and Cargo workspaces |
| `dart-senior-reviewer.md` | Two-axis architectural, quality, and security audits | Strict PR and code reviews |
| `senior-architect.md` | High-leverage module design, ADRs, codebase refactors | System architecture |
| `researcher.md` | Multi-source verification, web search, and evidence gathering | Fact retrieval without guessing |
| `flutter-qa-specialist.md` | Automated UI test runs and widget tree inspection | Mobile test automation |
| `devops-specialist.md` | Docker, Kubernetes, CI/CD pipelines, and cloud setup | Infrastructure automation |
| `ui-ux-designer.md` | Design systems, mobile UI/UX, Material Design | Interface and UX specification |
| `lottie-agent.md` | Motion planning, asset creation, optimization, and validation | Lottie JSON and dotLottie assets |
| `rubber-duck.md` | Interactive peer thinking, edge case and logic stress tests | Brainstorming & reasoning |

### 2. Skills (`skills/`)
Structured procedural playbooks and templates loaded by agents:

- `orchestration-workflow`: Dev-review cycles and task progression.
- `to-spec`: Technical specification synthesis.
- `domain-modeling`: Ubiquitous domain language, bounded contexts, ADRs.
- `product-owner-workflow`: GitHub Projects tracking and issue synchronization.
- `flutter-senior-workflow`: Flutter code standards, workspace templates, and validation.
- `firebase-workflow`: Firebase MCP discovery, target verification, secure implementation, emulator validation, and authorized operations.
- `web-senior-workflow`: Astro/Next.js implementation, framework MCP guidance, and validation.
- `dartfrog-senior-workflow`: Backend route structure and middleware patterns.
- `go-senior-workflow`: Go backend package design, HTTP/persistence, concurrency, diagnosis, review, and native validation.
- `rust-senior-workflow`: Rust implementation, debugging, and Cargo validation.
- `rust-senior-review-workflow`: Two-axis Rust PR and code review.
- `dart-senior-reviewer-workflow`: Review standards, Fowler smells, two-axis reports.
- `flutter-qa-consultant`: Dart MCP test runners and UI interaction flows.
- `devops-senior-workflow`: Docker multi-stage builds, Kubernetes manifests, and CI/CD.
- `research-workflow`: Source synthesis and fact checking.
- `ui-ux-mobile-workflow`: Mobile design patterns and accessibility requirements.
- `lottie-workflow`: LottieFiles Creator MCP discovery, motion design, asset validation, and integration handoffs.
- `codebase-design`: Architectural principles for deep module design.
- `improve-codebase-architecture`: Shallow module discovery and refactor reports.
- `diagnosing-bugs`: 6-phase systematic debugging and resolution loop.

The independent [compact team](compact-team/SYSTEM.md) includes Go in its existing `software-engineer` agent and workflow, with a bundled [Go profile](compact-team/skills/software-engineer-workflow/references/go.md) loaded only for Go work.

#### Firebase MCP

`firebase-agent` activates `firebase-workflow` and discovers available Firebase MCP tools at runtime. `pi-config/mcp.json` includes official stdio server preset:

```json
"firebase": {
  "command": "npx",
  "args": ["-y", "firebase-tools@latest", "mcp"]
}
```

Requires compatible Node.js/npm and authorized Firebase CLI credentials (user login or Application Default Credentials). Merge preset into MCP adapter's active configuration; setup scripts do not install MCP servers or copy `pi-config/` presets. Restart/reload MCP connection, then verify tool discovery and project/account context. Never store credentials in repository.

Optional `--dir /absolute/project/path` sets workspace context; `--only auth,firestore,storage` limits feature groups. Pin reviewed CLI version for reproducible environments. Local server can access cloud resources: running emulators does not guarantee MCP calls are local.

- Firebase service configuration, rules, indexes, Functions, and Firebase-specific operations → `firebase-agent`.
- Flutter/web SDK consumption and UI → platform developer, Firebase support as needed.
- General CI/CD/infrastructure → `devops-specialist`; research/review/QA remain action-first.
- Cloud mutations and deployment require explicit target/scope authorization.

See [Firebase workflow](skills/firebase-workflow/SKILL.md) and [official MCP documentation](https://firebase.google.com/docs/ai-assistance/mcp-server).

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
- `tts-extension/tts.ts`: Optional final-answer speech through a separately configured Ollama speech model, with macOS playback.
- `pdf-img-ocr/pdf-img-ocr.ts`: PNG, JPEG, and PDF OCR through Pi's selected Ollama vision model.

#### Agent Selection

Automatic selection uses model's semantic, action-first routing through `selectAgent`.
Tool returns agent instructions and updates footer through Pi's status store.
Last-used agent remains visible after completion; next task starts unselected.
No separate keyword router or process-global display state.

- `/agent <exact-name>` pins a manual persona across tasks.
- `/agent auto` returns to per-task semantic selection.
- `/agent` opens agent picker; only valid persona files appear (not README files).
- `spawnSubagent` requires explicit `agent` selected using semantic routing. Enable with `/subagent on`; no retired keyword inference. Timeout/abort sends `SIGTERM`, then `SIGKILL` after a one-second grace period; POSIX process-group cleanup also covers descendants.
- Reload extensions with `/reload` after installation or changes.

Regression tests (Node with native TypeScript support):

```bash
node --test tests/*.test.mjs
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p '*_test.py'
```

Installer tests cover source/destination identity, failed copies, missing sources, and repeated copy/symlink installation. Subagent tests use fake CLI processes: no model requests or cloud operations.
TTS tests use mocked speech requests and a silent player, checking final-answer filtering, saved settings, long answers, and cancellation. TTS installer checks cover direct and canonical-storage modes and preserve user settings.
Firebase tests check persona/skill wiring, MCP preset, catalogs, and routing documentation.
Selection-mechanism tests do not evaluate model routing accuracy. `tests/routing-evaluation.json` provides separate model-routing cases: in a fresh `/agent auto` session with current SYSTEM.md, request only persona selection for each prompt (no implementation or remote actions), then compare first `selectAgent` argument with `expectedAgent`. Record model/version and mismatches. This model evaluation is not part of deterministic unit tests.
For Rust engineering behavior, use the [isolated task evaluation](tests/rust-behavior-evaluation.md): feature configuration, async cancellation, public API compatibility review, and a clean review for false-positive measurement. The Python suite verifies fixture baselines with offline Cargo tests when Rust and Git are available; actual agent accuracy requires separate fresh-session runs.
Core selection tests use isolated agent fixtures. With Pi installed, integration test also
loads both extensions through Pi's real loader and renders custom footer.
Set `PI_EXTENSION_LOADER` to override loader discovery.

#### PDF and image OCR extension

Install Poppler, then select an image-capable Ollama model in Pi. The selected model must be installed on the Ollama server:

```bash
brew install poppler
./pi-extensions-setup.py --extensions pdf-img-ocr
```

In Pi, use `/ocr ./image.png` or `/ocr ./document.pdf`; the agent can also call the `ocr` tool with a local path. The extension uses Pi's currently selected Ollama model ID and its configured server address, including tagged IDs such as `glm-ocr:bf16`. PDFs are rendered at 200 DPI and OCRed one page at a time. Long results are saved in a private temporary text file, and Pi receives its path and a preview.

Use `/ocr-url http://192.168.1.20:11434` only if OCR should use a different Ollama address from the selected Pi model. A Pi model URL ending in `/v1` is accepted; the extension removes `/v1` because OCR uses Ollama's native `/api` endpoints. `/ocr-url` shows the effective address, and `/ocr-url reset` restores the selected model's configured address. The override is saved in `~/.pi/agent/pdf-img-ocr.json` and applies to both the tool and command across Pi sessions. The source image or rendered PDF pages are sent to that Ollama server. Reload Pi extensions with `/reload` after installation or an update.

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

#### Text-to-speech Extension

TTS is installed by default, or select it explicitly:

```bash
./pi-extensions-setup.py --extensions tts
```

On the Ollama server, install `phonon:40m-multilingual` with `ollama pull phonon:40m-multilingual`. Phonon requires Apple Silicon and Ollama 0.40.9 or newer. Playback uses the Mac running Pi and its built-in `afplay`; the Ollama server may be remote. Use a Pi release supporting `agent_settled` (validated with Pi 1.4.0).

In Pi, reload, configure the server, test, and enable speech:

```text
/reload
/tts-url http://YOUR-OLLAMA-SERVER:11434
/tts test
/tts on
```

Speech is off by default. Your selected task model stays independent of the speech model, which defaults to `phonon:40m-multilingual`. Only the completed final assistant answer is spoken after tools, retries, and continuations finish. Thinking, tool output, intermediate messages, errors, and aborted/truncated responses are excluded.

Use `/tts` to toggle, `/tts off` to disable, `/tts stop` to cancel current speech, and `/tts status` to inspect settings. `/tts-model <model>` selects the speech model; `/tts-voice <voice-name>` selects a voice supported by that model. Run `ollama show phonon:40m-multilingual` on the server to list its voices, then `/tts test` to hear your choice. `/tts-voice reset` restores the default voice.

Settings persist in `~/.pi/agent/tts.json` and are preserved by installation. The TTS URL is separate from OCR and the selected task model; `/v1` suffixes are accepted. Answer text is sent to the configured speech server. Playback runs in the background, with temporary audio cleanup and cancellation on new runs or session shutdown. The custom footer displays TTS status when space permits. See the [full TTS setup and command guide](extension/tts-extension/tts/README.md).

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

Install selected extensions only:

```bash
./pi-extensions-setup.py --extensions custom-tui notes stt tts
```

Omit `--extensions` to install all extensions, including TTS (disabled until `/tts on`). Use `--store-in-agents` for extension files stored canonically under `~/.agents/extension/` and symlinked into Pi.

### Symlink / Development Mode
Symlinks repository files directly into target directories for active editing:

```bash
./agents-setup.py --symlink
./pi-extensions-setup.py --symlink
```

Installer stages sources before replacement and restores prior destinations if replacement fails. Same-file sources are skipped safely. Helper scripts are repository-owned files recovered from Git history, not links into one user's installation. `pi-config/` presets still require manual merging.

Check installed content without changing files. Exit code `0` means current; `1` means missing, changed, or unreadable entries. Extra resources inside a selected skill count as drift; unrelated installed top-level entries are ignored. Use `--only` for a scoped update, then check the same entries:

```bash
./agents-setup.py --only agents/rust-senior-engineer.md skills/rust-senior-workflow skills/rust-senior-review-workflow
./agents-setup.py --check --only agents/rust-senior-engineer.md skills/rust-senior-workflow skills/rust-senior-review-workflow
```

Add `--symlink` to the installation command for development mode. A scoped agent/skill update leaves other entries and Pi script wiring untouched. Restart the consuming session or reload its instructions after updating copied files.

### Script Options

#### `agents-setup.py`
- `--symlink` / `-s`: Create symbolic links instead of copying.
- `--user` / `-u <username>`: Explicitly override target user home.
- `--agents-target <path>`: Custom base directory for `.agents` (default: `~/.agents`).
- `--pi-agent-target <path>`: Custom base directory for `.pi/agent` (default: `~/.pi/agent`).
- `--no-force`: Prevent overwriting existing target files.
- `--check`: Compare installed content with the repository without writing; exit nonzero on drift or comparison errors.
- `--only <group/entry> [<group/entry> ...]`: Limit checking or installation to named top-level entries in `agents/`, `skills/`, or `scripts/`.

#### `pi-extensions-setup.py`
- `--symlink` / `-s`: Create symbolic links.
- `--user` / `-u <username>`: Explicitly override target user home.
- `--target-dir <path>`: Custom destination directory for pi extensions (default: `~/.pi/agent/extensions`).
- `--agents-target <path>`: Custom base directory for `.agents` (default: `~/.agents`).
- `--no-force`: Prevent overwriting existing target files.
- `--extensions <name> [<name> ...]`: Install selected extensions; default installs all. Choices: `custom-tui`, `agent-switcher`, `subagent-spawner`, `notes`, `pdf-img-ocr`, `stt`, `tts`.

STT assets install under `<target-dir>/stt/`; this matches recorder path used by `stt.ts`.
TTS installs `<target-dir>/tts.ts`, `<target-dir>/tts/core.ts`, and `<target-dir>/tts/README.md`. No speech settings or models are installed or overwritten.
