import AVFoundation
import Foundation

struct Options {
    var output = ""
    var maxSeconds = 300.0
}

func fail(_ message: String) -> Never {
    fputs("{\"ok\":false,\"error\":\"\(message.replacingOccurrences(of: "\\\"", with: "'"))\"}\n", stderr)
    exit(1)
}

let args = Array(CommandLine.arguments.dropFirst())
guard args.first == "record" else { fail("usage: record --output <wav> [--max-seconds <seconds>]") }
var options = Options()
var index = 1
while index < args.count {
    switch args[index] {
    case "--output":
        index += 1
        guard index < args.count else { fail("missing output path") }
        options.output = args[index]
    case "--max-seconds":
        index += 1
        if index < args.count { options.maxSeconds = Double(args[index]) ?? options.maxSeconds }
    default: break
    }
    index += 1
}
guard !options.output.isEmpty else { fail("missing output path") }

let engine = AVAudioEngine()
let input = engine.inputNode
let format = input.inputFormat(forBus: 0)
guard format.sampleRate > 0 && format.channelCount > 0 else { fail("no microphone input device") }

do {
    let file = try AVAudioFile(forWriting: URL(fileURLWithPath: options.output), settings: format.settings)
    input.installTap(onBus: 0, bufferSize: 4096, format: format) { buffer, _ in
        do { try file.write(from: buffer) } catch { fputs("audio write failed: \(error)\n", stderr) }
    }
    try engine.start()
    fputs("{\"ok\":true,\"state\":\"recording\"}\n", stdout)
    fflush(stdout)
} catch {
    fail("microphone unavailable: \(error)")
}

let stop = DispatchSemaphore(value: 0)
let timer = DispatchWorkItem { stop.signal() }
DispatchQueue.global().asyncAfter(deadline: .now() + options.maxSeconds, execute: timer)
DispatchQueue.global().async {
    while let line = readLine(strippingNewline: true) {
        if line == "stop" || line == "cancel" { stop.signal(); break }
    }
}
stop.wait()
timer.cancel()
input.removeTap(onBus: 0)
engine.stop()

if FileManager.default.fileExists(atPath: options.output) {
    print("{\"ok\":true,\"state\":\"stopped\",\"path\":\"\(options.output.replacingOccurrences(of: "\\\"", with: "'"))\"}")
} else {
    fail("recording produced no audio")
}
