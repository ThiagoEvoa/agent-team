# Final-answer text to speech

Install from the agent-team repository root:

```sh
./pi-extensions-setup.py --extensions tts
```

The default `./pi-extensions-setup.py` also includes TTS. Both copy and `--symlink` installations, including `--store-in-agents`, install `tts.ts` alongside `tts/core.ts` and this guide. The installer preserves saved settings in `~/.pi/agent/tts.json`; it does not download models or enable speech.

Pi automatically loads `~/.pi/agent/extensions/tts.ts`. Run `/reload` in an existing Pi chat, or restart Pi. Use a Pi release supporting the `agent_settled` extension event (validated with Pi 1.4.0).

Speech is **off by default**. Your task model remains selected in Pi; a separate Ollama speech model reads the final answer after the agent finishes all tools, retries, and continuations. Thinking blocks, tool output, intermediate responses, aborted responses, and errors are never spoken. Only successfully completed answers are read. JSON/print modes do not play audio; interactive TUI and RPC modes with UI support do.

## Setup and use

The machine running the Ollama server needs Ollama **0.40.9 or later**, Apple Silicon, and the Phonon model installed:

```sh
ollama pull phonon:40m-multilingual
```

Playback runs on the Mac running Pi through its built-in `afplay`, even when the Ollama server is remote. No new npm dependencies are needed.

```text
/tts-url http://localhost:11434
/tts-model phonon:40m-multilingual
/tts test
/tts on
```

Use `/tts-url http://YOUR-SERVER:11434` for another server. An optional `/v1` suffix is accepted. TTS has its own URL and does not inherit the OCR URL or the selected task model's URL.

| Command | Behavior |
| --- | --- |
| `/tts` | Toggle automatic final-answer speech |
| `/tts on` / `/tts off` | Enable / disable and save the choice |
| `/tts status` | Show enablement, server, model, and voice |
| `/tts stop` | Cancel current synthesis/playback without disabling future speech |
| `/tts test` | Speak a short setup check, even when automatic speech is off |
| `/tts reset` | Restore all defaults and disable speech |
| `/tts-url [URL\|reset]` | Show, set, or reset the Ollama URL |
| `/tts-model [model\|reset]` | Show, set, or reset the separate speech model |
| `/tts-voice [voice\|reset]` | Show, set, or reset the speech voice (`default` initially) |

List the voices supported by the installed model on your Ollama server, then select one in Pi:

```sh
ollama show phonon:40m-multilingual
```

```text
/tts-voice <voice-name>
/tts test
```

Available voices depend on the speech model. `/tts-voice reset` restores `default`.

Settings persist globally in `~/.pi/agent/tts.json`, independently of chat history. Commands update settings immediately; manual JSON edits take effect on `/reload` or restart. Invalid config disables speech and reports the error; `/tts reset` repairs it.

```json
{
  "enabled": false,
  "ollamaUrl": "http://127.0.0.1:11434",
  "model": "phonon:40m-multilingual",
  "voice": "default"
}
```

Speech runs in the background. The footer shows `TTS: on` or `TTS: speaking…` when enabled (including in your custom TUI when there is room). Starting another agent run, disabling speech, changing settings, reloading, switching sessions, or exiting cancels existing synthesis/playback. Audio files are temporary and deleted after completion, failure, or cancellation. HTTP/player failures appear as UI notifications and leave the chat answer intact. Answers are split at paragraph/sentence/word boundaries into requests of at most 4096 characters. Markdown wrappers are removed; the answer's words and code content are retained. Explicit `<think>`, `<thinking>`, `<analysis>`, and `<reasoning>` regions are also excluded if a model places them inside text.

The speech request sends answer text to the configured server using `POST /v1/audio/speech`, with `response_format: "wav"`. A remote server therefore receives the spoken answer. A 404 usually means the server needs a speech-capable Ollama version; a 400 may indicate an unsupported model or voice. See [Ollama's speech guide](https://docs.ollama.com/capabilities/speech) and the [Phonon multilingual model](https://ollama.com/library/phonon:40m-multilingual).

## Verification

From the repository root, run:

```sh
node --test tests/tts.test.mjs
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'setup_test.py'
```

Tests require Node with native TypeScript support. They use an isolated home directory, mocked HTTP, and a silent fake audio player, without calling your real Ollama server or changing your settings. Playback checks run on macOS. Installer tests cover selected/default installation and repeated copy, symlink, and canonical-storage installs while preserving configuration.
