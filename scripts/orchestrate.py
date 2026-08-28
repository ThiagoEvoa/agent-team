#!/usr/bin/env python3
import sys
import os
import json
import re
import argparse
import subprocess

STATE_FILE = ".orchestration_state.json"

def run_cmd(cmd, check=False):
    """Helper to run a shell command and return stdout/stderr."""
    try:
        res = subprocess.run(cmd, shell=True, text=True, capture_output=True, check=check)
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except subprocess.CalledProcessError as e:
        return e.returncode, e.stdout.strip(), e.stderr.strip()

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def fetch_project_meta(project_number, owner="@me"):
    """Fetch GitHub Project ID, Status field ID, and option IDs."""
    print(f"[*] Fetching metadata for Project #{project_number} (owner: {owner})...")
    
    # 1. Project view
    code, out, err = run_cmd(f"gh project view {project_number} --owner \"{owner}\" --format json")
    if code != 0:
        print(f"[ERROR] Failed to view project: {err}")
        return None
    proj_data = json.loads(out)
    project_id = proj_data.get("id")
    project_title = proj_data.get("title")

    # 2. Field list
    code, out, err = run_cmd(f"gh project field-list {project_number} --owner \"{owner}\" --format json")
    if code != 0:
        print(f"[ERROR] Failed to list project fields: {err}")
        return None
    fields_data = json.loads(out)
    
    status_field = None
    for field in fields_data.get("fields", []):
        if field.get("name", "").lower() == "status":
            status_field = field
            break

    if not status_field:
        print("[WARNING] Could not locate 'Status' field on project.")
        return None

    status_field_id = status_field.get("id")
    options_map = {}
    for opt in status_field.get("options", []):
        options_map[opt.get("name").lower()] = {
            "id": opt.get("id"),
            "name": opt.get("name")
        }

    return {
        "project_number": project_number,
        "project_owner": owner,
        "project_id": project_id,
        "project_title": project_title,
        "status_field_id": status_field_id,
        "status_options": options_map
    }

def init_spec(spec_path, project_number=None, project_owner="@me", repo=None):
    if not os.path.exists(spec_path):
        print(f"[ERROR] Specification file '{spec_path}' does not exist.")
        sys.exit(1)

    print(f"[*] Parsing spec file: {spec_path}...")
    with open(spec_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find tasks / checklist items
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
                "line_no": idx + 1,
                "gh_item_id": None
            })

    # If no checklist tasks found, try matching regular list items
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
                        "line_no": idx + 1,
                        "gh_item_id": None
                    })

    state = {
        "spec_path": os.path.abspath(spec_path),
        "tasks": tasks
    }

    # If GitHub Project is specified, link and populate backlog items
    if project_number:
        proj_meta = fetch_project_meta(project_number, project_owner)
        if proj_meta:
            state["github_project"] = proj_meta
            backlog_opt = proj_meta["status_options"].get("backlog") or proj_meta["status_options"].get("todo")
            backlog_opt_id = backlog_opt["id"] if backlog_opt else None

            print(f"[*] Syncing {len(tasks)} tasks to GitHub Project Backlog...")
            for task in tasks:
                create_cmd = f"gh project item-create {project_number} --owner \"{project_owner}\" --title \"{task['text']}\" --body \"Spec Task #{task['id']}: {task['text']}\" --format json"
                code, out, err = run_cmd(create_cmd)
                if code == 0:
                    try:
                        item_json = json.loads(out)
                        task["gh_item_id"] = item_json.get("id")
                        print(f"  [+] Created task #{task['id']} on board: {task['gh_item_id']}")
                        
                        # Set to Backlog status
                        if backlog_opt_id and proj_meta.get("project_id"):
                            edit_cmd = (
                                f"gh project item-edit --id \"{task['gh_item_id']}\" "
                                f"--project-id \"{proj_meta['project_id']}\" "
                                f"--field-id \"{proj_meta['status_field_id']}\" "
                                f"--single-select-option-id \"{backlog_opt_id}\""
                            )
                            run_cmd(edit_cmd)
                    except Exception as e:
                        print(f"  [!] Could not parse item output: {e}")
                else:
                    print(f"  [!] Failed to create project item for #{task['id']}: {err}")

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
    if "github_project" in state:
        proj = state["github_project"]
        print(f"GitHub Project: #{proj.get('project_number')} ({proj.get('project_title')}) [Owner: {proj.get('project_owner')}]")
    print("------------------------------------------------------")
    tasks = state.get("tasks", [])
    if not tasks:
        print("No tasks tracked.")
    for t in tasks:
        status_symbol = " [PND] "
        st = t["status"].lower()
        if st in ["dev", "in progress", "in_progress"]:
            status_symbol = "*[DEV]*"
        elif st in ["review", "in review", "in_review"]:
            status_symbol = "=[REV]="
        elif st in ["blocked"]:
            status_symbol = "![BLK]!"
        elif st in ["done"]:
            status_symbol = " [DON] "
        elif st in ["ready"]:
            status_symbol = " [RDY] "
            
        gh_info = f" | GH: {t['gh_item_id']}" if t.get("gh_item_id") else ""
        print(f"ID #{t['id']:<2} | {status_symbol} | {t['text'][:45]:<45} | Loops: {t['loops']:<2}{gh_info} | {t['notes']}")
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
    target_task = None
    for t in tasks:
        if t["id"] == task_id:
            target_task = t
            break

    if not target_task:
        print(f"[ERROR] Task ID #{task_id} not found.")
        sys.exit(1)

    target_task["status"] = status.lower()
    if loops is not None:
        target_task["loops"] = loops
    if notes is not None:
        target_task["notes"] = notes

    # Sync with GitHub Project if configured
    if "github_project" in state and target_task.get("gh_item_id"):
        proj = state["github_project"]
        target_status_key = status.lower()
        # Normalization of status names
        if target_status_key == "dev":
            target_status_key = "in progress"
        elif target_status_key == "review":
            target_status_key = "in review"

        matching_opt = None
        for opt_key, opt_val in proj.get("status_options", {}).items():
            if opt_key == target_status_key or opt_val.get("name", "").lower() == target_status_key:
                matching_opt = opt_val
                break

        if matching_opt:
            edit_cmd = (
                f"gh project item-edit --id \"{target_task['gh_item_id']}\" "
                f"--project-id \"{proj['project_id']}\" "
                f"--field-id \"{proj['status_field_id']}\" "
                f"--single-select-option-id \"{matching_opt['id']}\""
            )
            print(f"[*] Moving Project Card #{target_task['gh_item_id']} to '{matching_opt['name']}'...")
            code, _, err = run_cmd(edit_cmd)
            if code == 0:
                print(f"[SUCCESS] Updated GitHub Project status to '{matching_opt['name']}'.")
            else:
                print(f"[WARNING] Failed to update GitHub Project column: {err}")
        else:
            print(f"[WARNING] Column status '{status}' not found on GitHub Project.")

    save_state(state)
    print(f"[SUCCESS] Updated Task #{task_id} status to '{status}'.")
    print_status(state)

def parse_feedback(raw_feedback):
    print("[*] Parsing reviewer feedback for Required Action Items (Two-Axis & Standards)...")
    lines = raw_feedback.splitlines()
    required = []
    in_required_section = False

    # Check for Two-Axis indicators
    actionable_subheaders = [
        "Violations & Hard Breaches",
        "Compiler & Analyzer",
        "Missing / Incomplete Requirements",
        "Incorrect Spec Implementation",
        "Required Improvements"
    ]

    current_subheader = None
    for line in lines:
        stripped = line.strip()
        
        # Check for start of actionable section
        for sub in actionable_subheaders:
            if re.search(rf'[-*#\s]*{re.escape(sub)}', stripped, re.IGNORECASE):
                in_required_section = True
                current_subheader = sub
                break
        else:
            # Check for non-blocking sections
            if re.search(r'^(#+\s+Summary|[-*#\s]*(Optional|Nitpicks|Code Smells|General Feedback|Scope Creep))', stripped, re.IGNORECASE):
                in_required_section = False
                current_subheader = None

        if in_required_section and stripped:
            if (stripped.startswith("-") or stripped.startswith("*")) and not any(sub.lower() in stripped.lower() for sub in actionable_subheaders):
                if not re.search(r'\[(None|OK|N/A)\]', stripped, re.IGNORECASE):
                    required.append(f"[{current_subheader}] {stripped}" if current_subheader else stripped)

    if required:
        print("\n--- ISOLATED REQUIRED ACTION ITEMS ---")
        for req in required:
            print(req)
        print("--------------------------------------\n")
    else:
        print("\n[OK] No blocking violations, compiler errors, or missing spec requirements found in review feedback.")


def main():
    parser = argparse.ArgumentParser(description="Spec-Driven Orchestration Tracking Script")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Init
    init_parser = subparsers.add_parser("init", help="Initialize orchestration tracking using a spec.md file")
    init_parser.add_argument("spec_path", help="Path to specification Markdown file")
    init_parser.add_argument("--project", type=int, help="GitHub Project (v2) number")
    init_parser.add_argument("--owner", default="@me", help="GitHub Project owner login (default: @me)")
    init_parser.add_argument("--repo", help="GitHub Repository (owner/repo)")

    # Status
    subparsers.add_parser("status", help="Print current status of orchestration tasks")

    # Next
    subparsers.add_parser("next", help="Get the next pending task and suggest the prompt")

    # Update
    update_parser = subparsers.add_parser("update", help="Update a specific task status and sync GitHub Project column")
    update_parser.add_argument("task_id", type=int, help="Task ID to update")
    update_parser.add_argument("status", choices=["pending", "backlog", "ready", "dev", "in progress", "review", "in review", "blocked", "done"], help="New status")
    update_parser.add_argument("--loops", type=int, help="Override loop iteration count")
    update_parser.add_argument("--notes", help="Update notes for the task")

    # Parse feedback
    feedback_parser = subparsers.add_parser("parse-feedback", help="Filter raw reviewer feedback to isolate Required Improvements")
    feedback_parser.add_argument("--raw", required=True, help="Raw text containing reviewer report")

    args = parser.parse_args()

    if args.command == "init":
        init_spec(args.spec_path, args.project, args.owner, args.repo)
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
