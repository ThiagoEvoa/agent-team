#!/usr/bin/env bash
# Human-in-the-loop (HITL) reproduction loop script.
# Use when a bug requires human interaction or device UI gestures that cannot be fully automated yet.
# Exit code 1 = bug reproduced (red signal), Exit code 0 = bug did not occur (green signal).

set -euo pipefail

echo "============================================================"
echo "          HUMAN-IN-THE-LOOP DEBUGGING REPRO LOOP            "
echo "============================================================"
echo ""
echo "Please perform the following exact reproduction steps:"
echo "1. Run the target app: flutter run / dart_frog dev"
echo "2. Navigate to the target screen / trigger endpoint"
echo "3. Execute the user action that triggers the defect"
echo ""

read -rp "Did the bug reproduce? (y/n): " answer
case "$answer" in
  [Yy]* )
    echo "[!] Bug reproduced (RED signal)."
    exit 1
    ;;
  * )
    echo "[*] Bug did not reproduce (GREEN signal)."
    exit 0
    ;;
esac
