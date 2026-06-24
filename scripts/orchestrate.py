#!/usr/bin/env python3
import sys
import os
import json
import re
import argparse

STATE_FILE = ".orchestration_state.json"

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def init_spec(spec_path):
    if not os.path.exists(spec_path):
        print(f"[ERROR] Specification file '{spec_path}' does not exist.")
        sys.exit(1)

    print(f"[*] Parsing spec file: {spec_path}...")
    with open(spec_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find tasks / checklist items
    # Matches: - [ ] Task name OR - [x] Task name
    tasks = []
    lines = content.splitlines()
    for idx, line in enumerate(lines):
        match = re.match(r'^\s*-\s+\[([ xX])\]\s+(.+)$', line)
        if match:
            status_char = match.group(1)
            text = match.group(2).strip()
            status = "done" if status_char.lower() == "x" else "pending"
            tasks.append({
                "id": len(tasks) + 1,
                "text": text,
                "status": status,
                "loops": 0,
                "notes": "",
                "line_no": idx + 1
            })

    # If no checklist tasks found, try matching regular list items under a "Tasks" or "Requirements" header
    if not tasks:
        in_task_section = False
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if re.match(r'^#+\s+(Tasks|Requirements|Todo|Scope)', stripped, re.IGNORECASE):
                in_task_section = True
                continue
            elif in_task_section and re.match(r'^#+', stripped):
                in_task_section = False
            
            if in_task_section:
                # Match numbered list or bullet list
                item_match = re.match(r'^\s*[\-\*]\s+(.+)$', line)
                num_match = re.match(r'^\s*\d+\.\s+(.+)$', line)
                item_text = None
                if item_match:
                    item_text = item_match.group(1).strip()
                elif num_match:
                    item_text = num_match.group(1).strip()
                
                if item_text and not item_text.startswith("["):
                    tasks.append({
                        "id": len(tasks) + 1,
                        "text": item_text,
                        "status": "pending",
                        "loops": 0,
                        "notes": "",
                        "line_no": idx + 1
                    })

    state = {
        "spec_path": os.path.abspath(spec_path),
        "tasks": tasks
    }
    save_state(state)
    print(f"[SUCCESS] Initialized orchestration tracker with {len(tasks)} tasks.")
    print_status(state)

def print_status(state=None):
    if not state:
        state = load_state()
    if not state:
        print("[!] No active orchestration state found. Run 'init' command first.")
        return

    print("\n================ ORCHESTRATION STATUS ================")
    print(f"Spec Path: {state.get('spec_path')}")
    print("------------------------------------------------------")
    tasks = state.get("tasks", [])
    if not tasks:
        print("No tasks tracked.")
    for t in tasks:
        status_symbol = " [PND] "
        if t["status"] == "dev":
            status_symbol = "*[DEV]*"
        elif t["status"] == "review":
            status_symbol = "=[REV]="
        elif t["status"] == "done":
            status_symbol = " [DON] "
            
        print(f"ID #{t['id']:<2} | {status_symbol} | {t['text'][:50]:<50} | Loops: {t['loops']:<2} | {t['notes']}")
    print("======================================================\n")

def get_next_task(state=None):
    if not state:
        state = load_state()
    if not state:
        print("[ERROR] No active orchestration state.")
        sys.exit(1)

    tasks = state.get("tasks", [])
    next_task = None
    for t in tasks:
        if t["status"] != "done":
            next_task = t
            break

    if not next_task:
        print("[SUCCESS] All tasks are marked as Done!")
        return

    print(f"[*] Next Task: #{next_task['id']} - {next_task['text']}")
    print("\n--- RECOMMENDED DEVELOPER PROMPT ---")
    print(f"Implement task: \"{next_task['text']}\" from specification: {os.path.basename(state['spec_path'])}.")
    print("Please follow project coding guidelines, verify code using 'scripts/project_lifecycle.py verify', and produce a clean Handoff Report listing changes made.")
    print("------------------------------------\n")

def update_task(task_id, status, loops=None, notes=None):
    state = load_state()
    if not state:
        print("[ERROR] No active orchestration state.")
        sys.exit(1)

    tasks = state.get("tasks", [])
    found = False
    for t in tasks:
        if t["id"] == task_id:
            t["status"] = status.lower()
            if loops is not None:
                t["loops"] = loops
            if notes is not None:
                t["notes"] = notes
            found = True
            break

    if not found:
        print(f"[ERROR] Task ID #{task_id} not found.")
        sys.exit(1)

    save_state(state)
    print(f"[SUCCESS] Updated Task #{task_id} status to '{status}'.")
    print_status(state)

def parse_feedback(raw_feedback):
    print("[*] Parsing reviewer feedback for Required Improvements...")
    lines = raw_feedback.splitlines()
    required = []
    in_required_section = False

    for line in lines:
        stripped = line.strip()
        # Detect start of Required Improvements header
        if re.search(r'Required\s+Improvements', stripped, re.IGNORECASE):
            in_required_section = True
            continue
        # Detect next header section or conclusion to stop
        elif in_required_section and (stripped.startswith("#") or re.search(r'^(Optional|Nitpicks|General\s+Feedback)', stripped, re.IGNORECASE)):
            in_required_section = False

        if in_required_section and stripped:
            # Bullet point items
            if stripped.startswith("-") or stripped.startswith("*"):
                required.append(stripped)

    if required:
        print("\n--- ISOLATED REQUIRED IMPROVEMENTS ---")
        for req in required:
            print(req)
        print("--------------------------------------\n")
    else:
        print("\n[OK] No Required Improvements found in the reviewer feedback.")

def main():
    parser = argparse.ArgumentParser(description="Spec-Driven Orchestration Tracking Script")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Init
    init_parser = subparsers.add_parser("init", help="Initialize orchestration tracking using a spec.md file")
    init_parser.add_argument("spec_path", help="Path to specification Markdown file")

    # Status
    subparsers.add_parser("status", help="Print current status of orchestration tasks")

    # Next
    subparsers.add_parser("next", help="Get the next pending task and suggest the prompt")

    # Update
    update_parser = subparsers.add_parser("update", help="Update a specific task status")
    update_parser.add_argument("task_id", type=int, help="Task ID to update")
    update_parser.add_argument("status", choices=["pending", "dev", "review", "done"], help="New status")
    update_parser.add_argument("--loops", type=int, help="Override loop iteration count")
    update_parser.add_argument("--notes", help="Update notes for the task")

    # Parse feedback
    feedback_parser = subparsers.add_parser("parse-feedback", help="Filter raw reviewer feedback to isolate Required Improvements")
    feedback_parser.add_argument("--raw", required=True, help="Raw text containing reviewer report")

    args = parser.parse_args()

    if args.command == "init":
        init_spec(args.spec_path)
    elif args.command == "status":
        print_status()
    elif args.command == "next":
        get_next_task()
    elif args.command == "update":
        update_task(args.task_id, args.status, args.loops, args.notes)
    elif args.command == "parse-feedback":
        parse_feedback(args.raw)

if __name__ == "__main__":
    main()
