# Local speech-to-text

macOS-only Pi extension. Audio stays local: `AVAudioEngine` records a temporary WAV; `whisper.cpp` transcribes it; WAV is deleted after every terminal state.

## Install

```sh
cd ~/.pi/agent/extensions/stt
./build-macos.sh
brew install whisper-cpp
mkdir -p ~/.cache/whisper
curl -L -o ~/.cache/whisper/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

Allow Terminal/Pi microphone access: **System Settings → Privacy & Security → Microphone**.

Pi loads `stt.ts` as an extension. Run `/stt-setup` to diagnose.

## Use

- `/stt` or `Ctrl+Shift+V`: start recording
- same command/shortcut: stop, transcribe, insert at editor end
- `/stt-cancel`: cancel and delete audio

`/stt setup` is also accepted as a diagnostic alias by convention; use `/stt-setup` on current Pi.

## Configuration

Optional `~/.pi/agent/stt.json`:

```json
{
  "recorder": "/Users/me/.pi/agent/extensions/stt/macos-recorder",
  "whisper": "whisper-cli",
  "model": "/Users/me/.cache/whisper/ggml-small.bin",
  "language": "auto",
  "maxSeconds": 300
}
```

Environment variables override file values: `PI_STT_RECORDER`, `PI_STT_WHISPER`, `PI_STT_MODEL`, `PI_STT_LANGUAGE`, `PI_STT_MAX_SECONDS`.

No cloud provider, network request, transcript logging, or persistent audio storage is used.
