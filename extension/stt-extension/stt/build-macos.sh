#!/bin/sh
set -eu
cd "$(dirname "$0")"
xcrun swiftc -O recorder.swift -o macos-recorder -framework AVFoundation
chmod 755 macos-recorder
printf 'Built %s\n' "$PWD/macos-recorder"
