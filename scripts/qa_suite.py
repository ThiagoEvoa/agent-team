#!/usr/bin/env python3
import sys
import os
import subprocess
import argparse
import re

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
        return res.returncode, res.stdout, res.stderr
    except Exception as e:
        return -1, "", str(e)

def list_devices():
    print("[*] Listing available devices/emulators...")
    code, out, err = run_cmd("flutter devices")
    if code != 0:
        # Fallback to dart list-devices or adb devices
        code, out, err = run_cmd("adb devices")
        if code != 0:
            print(f"[ERROR] Could not fetch devices: {err or out}")
            sys.exit(1)
    print(out)

def run_tests(test_path, device_id=None):
    cmd = f"flutter test {test_path}"
    if device_id:
        cmd += f" -d {device_id}"
    
    print(f"[*] Launching tests on device target using command: '{cmd}'...")
    code, out, err = run_cmd(cmd)
    
    # Save logs to temp location
    log_path = "/tmp/qa_test_run.log"
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("=== STDOUT ===\n")
        f.write(out)
        f.write("\n=== STDERR ===\n")
        f.write(err)
        
    print(f"[*] Test run finished. Logs written to {log_path}")

    # Inspect logs for common runtime errors or failures
    failures = re.findall(r'❌\s+(.+?)|\[FAIL\]\s+(.+?)|Test failed\s+(.+?)', out)
    exceptions = re.findall(r'Exception:\s+(.+?)|Error:\s+(.+?)|Unhandled exception:', out + err, re.IGNORECASE)

    status = "passed" if code == 0 else "failed"
    print(f"[*] Outcome Status: {status.upper()}")
    if failures:
        print(f"[!] Detected {len(failures)} explicit test failure(s).")
    if exceptions:
        print(f"[!] Detected {len(exceptions)} unhandled exception(s) or runtime error(s) in logs.")

    # Ask if they want to generate report
    generate_report(status, log_path, test_path)

def find_report_template():
    home = os.path.expanduser("~")
    path = os.path.join(home, ".gemini/config/skills/flutter-qa-consultant/templates/test_report.md")
    if os.path.exists(path):
        return path
    return None

def generate_report(status, log_path, test_name):
    print("[*] Compiling test report...")
    
    # Read test logs
    logs = ""
    if os.path.exists(log_path):
        with open(log_path, "r", encoding="utf-8") as f:
            logs = f.read()

    template_path = find_report_template()
    report_content = ""
    if template_path:
        with open(template_path, "r", encoding="utf-8") as f:
            report_content = f.read()
            
        # Parse template and populate placeholders
        report_content = report_content.replace("[Test Suite/Scenario]", test_name)
        report_content = report_content.replace("[Outcome Status]", status.upper())
        # Append or replace log section
        if "## Logs" in report_content:
            report_content = report_content.replace("## Logs", f"## Logs\n\n```text\n{logs[:2000]}\n```\n*(Logs truncated to 2000 chars)*")
        else:
            report_content += f"\n\n## Test Logs\n```text\n{logs[:2000]}\n```"
    else:
        # Construct fallback standard report
        report_content = f"""# Test Scenario: {test_name}

## Executive Summary
* **Outcome:** {status.upper()}
* **Execution Environment:** Local Automated QA Runner

## Test Logs & Exceptions
```text
{logs[:3000]}
```
"""

    report_out_path = "test_report.md"
    with open(report_out_path, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print(f"[SUCCESS] Test report generated successfully at: {os.path.abspath(report_out_path)}")

def main():
    parser = argparse.ArgumentParser(description="Flutter QA Consultant Automated Runner")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # List Devices
    subparsers.add_parser("list-devices", help="List active Flutter emulator/simulator devices")

    # Run tests
    run_parser = subparsers.add_parser("run-tests", help="Execute unit/integration tests and capture logs")
    run_parser.add_argument("test_path", help="Path to unit or integration test file")
    run_parser.add_argument("--device", help="Device target ID")

    # Generate report
    rep_parser = subparsers.add_parser("generate-report", help="Manually generate markdown QA report")
    rep_parser.add_argument("--status", choices=["passed", "failed"], required=True)
    rep_parser.add_argument("--log-file", required=True, help="Path to captured stdout log file")
    rep_parser.add_argument("--test-name", required=True, help="Name of the test run")

    args = parser.parse_args()

    if args.command == "list-devices":
        list_devices()
    elif args.command == "run-tests":
        run_tests(args.test_path, args.device)
    elif args.command == "generate-report":
        generate_report(args.status, args.log_file, args.test_name)

if __name__ == "__main__":
    main()
