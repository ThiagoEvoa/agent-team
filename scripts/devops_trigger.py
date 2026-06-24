#!/usr/bin/env python3
import sys
import os
import subprocess
import time
import argparse

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
        return res.returncode, res.stdout, res.stderr
    except Exception as e:
        return -1, "", str(e)

def audit_configs():
    print("[*] Running static DevOps configuration audit...")
    dockerfiles = []
    k8s_files = []

    # Search for Dockerfiles and K8s YAML files
    for root, dirs, files in os.walk("."):
        # Exclude common ignore dirs
        if any(ignored in root for ignored in [".git", "node_modules", "build", ".dart_tool"]):
            continue
        for file in files:
            if file.lower().startswith("dockerfile"):
                dockerfiles.append(os.path.join(root, file))
            elif file.endswith(".yaml") or file.endswith(".yml"):
                # Simple check if it looks like Kubernetes manifest
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read(500) # Read start of file
                        if "apiVersion:" in content or "kind:" in content:
                            k8s_files.append(full_path)
                except Exception:
                    pass

    # 1. Dockerfile Linting
    print(f"[*] Found {len(dockerfiles)} Dockerfile(s).")
    for df in dockerfiles:
        print(f"  -> Linting: {df}")
        code, out, err = run_cmd(f"hadolint {df}")
        if code == 127:
            print("     [INFO] 'hadolint' is not installed. Skipping Dockerfile lint.")
            break
        elif code == 0:
            print("     [OK] Dockerfile parsed clean.")
        else:
            print(f"     [FAIL] Dockerfile issues found:\n{out or err}")

    # 2. Kubernetes Manifest Linting
    print(f"[*] Found {len(k8s_files)} Kubernetes manifest(s).")
    for kf in k8s_files:
        print(f"  -> Auditing K8s: {kf}")
        code, out, err = run_cmd(f"kube-linter lint {kf}")
        if code == 127:
            print("     [INFO] 'kube-linter' is not installed. Skipping Kubernetes lint.")
            break
        elif code == 0:
            print("     [OK] Kubernetes manifest is clean.")
        else:
            print(f"     [FAIL] Kubernetes manifest issues found:\n{out or err}")

def trigger_workflow(workflow_name, poll=False):
    print(f"[*] Dispatching GitHub workflow '{workflow_name}'...")
    
    # Trigger the workflow run
    code, out, err = run_cmd(f"gh workflow run {workflow_name}")
    if code != 0:
        print(f"[ERROR] Failed to dispatch workflow: {err or out}")
        print("Ensure GitHub CLI 'gh' is logged in and workflow exists.")
        sys.exit(1)
        
    print(f"[SUCCESS] Dispatched workflow '{workflow_name}' successfully.")
    
    if not poll:
        print("[*] Polling disabled. Check pipeline status manually on GitHub.")
        return

    # Wait a few seconds for the run to register on GitHub
    print("[*] Waiting for run to register...")
    time.sleep(5)

    # Get the latest run ID
    code, out, err = run_cmd(f"gh run list --workflow={workflow_name} --limit=1 --json databaseId,status")
    if code != 0 or not out.strip():
        print("[WARNING] Could not retrieve the run ID. Proceeding to poll latest run...")
        run_id = None
    else:
        try:
            import json
            runs = json.loads(out)
            if runs:
                run_id = runs[0]["databaseId"]
                print(f"[*] Tracked Run ID: {run_id}")
            else:
                run_id = None
        except Exception:
            run_id = None

    # Polling Loop
    print("[*] Polling run status. Please wait...")
    while True:
        target = f"{run_id}" if run_id else f"--workflow={workflow_name} --limit=1"
        code, out, err = run_cmd(f"gh run view {target} --json status,conclusion")
        if code != 0:
            print(f"[WARNING] Could not check status: {err}. Retrying in 10s...")
            time.sleep(10)
            continue
            
        try:
            import json
            info = json.loads(out)
            # gh run view with run_id might return a dict, with workflow it returns a list
            if isinstance(info, list):
                if not info:
                    print("[WARNING] No runs found. Retrying in 10s...")
                    time.sleep(10)
                    continue
                run_info = info[0]
            else:
                run_info = info

            status = run_info.get("status")
            conclusion = run_info.get("conclusion")
            
            print(f"  -> Current Status: {status} | Conclusion: {conclusion or 'In Progress'}")
            
            if status == "completed":
                if conclusion == "success":
                    print("[SUCCESS] GitHub Actions run completed successfully!")
                else:
                    print(f"[FAIL] GitHub Actions run completed with status: {conclusion}")
                    sys.exit(1)
                break
        except Exception as e:
            print(f"[WARNING] Failed to parse output: {e}. Retrying in 10s...")
            
        time.sleep(15)

def main():
    parser = argparse.ArgumentParser(description="DevOps Infrastructure Audit and Pipeline Dispatcher")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Lint Command
    subparsers.add_parser("lint", help="Audit local configurations with hadolint and kube-linter")

    # Run Command
    run_parser = subparsers.add_parser("run", help="Dispatch and poll GitHub Action workflow")
    run_parser.add_argument("workflow", help="Name or filename of the GitHub workflow")
    run_parser.add_argument("--poll", action="store_true", help="Poll execution status until completion")

    args = parser.parse_args()

    if args.command == "lint":
        audit_configs()
    elif args.command == "run":
        trigger_workflow(args.workflow, args.poll)

if __name__ == "__main__":
    main()
