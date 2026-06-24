#!/usr/bin/env python3
import sys
import os
import subprocess
import argparse
import re

def run_cmd(cmd, check=True, capture_output=True):
    """Helper to run shell commands safely."""
    try:
        res = subprocess.run(cmd, shell=True, check=check, text=True, capture_output=capture_output)
        return res.returncode, res.stdout, res.stderr
    except subprocess.CalledProcessError as e:
        return e.returncode, e.stdout, e.stderr

def get_main_branch():
    """Detect if main or master is the default remote branch."""
    _, out, _ = run_cmd("git branch -r")
    if "origin/main" in out:
        return "main"
    return "master"

def get_current_branch():
    _, out, _ = run_cmd("git branch --show-current")
    return out.strip()

def prepare_branch(issue_id):
    print(f"[*] Preparing branch for issue #{issue_id}...")
    
    # 1. Check for dirty working tree
    _, status_out, _ = run_cmd("git status --porcelain")
    if status_out.strip():
        print("[!] Warning: Working tree is dirty. Stashing changes...")
        run_cmd("git stash")

    # 2. Get main branch name
    main_branch = get_main_branch()
    print(f"[*] Checking out {main_branch} and pulling updates...")
    
    # 3. Pull latest changes
    code, _, err = run_cmd(f"git checkout {main_branch}")
    if code != 0:
        print(f"[ERROR] Failed to checkout {main_branch}: {err}")
        return
    
    code, _, err = run_cmd("git pull")
    if code != 0:
        print(f"[ERROR] Failed to git pull: {err}")
        return

    # 4. Create new branch
    branch_name = f"feat/issue-{issue_id}"
    print(f"[*] Creating and checking out branch '{branch_name}'...")
    code, _, err = run_cmd(f"git checkout -b {branch_name}")
    if code != 0:
        # If branch already exists, ask/checkout
        print(f"[!] Branch '{branch_name}' might already exist. Attempting to check it out...")
        code, _, err = run_cmd(f"git checkout {branch_name}")
        if code != 0:
            print(f"[ERROR] Failed to checkout {branch_name}: {err}")
            return
            
    print(f"[SUCCESS] Branch '{branch_name}' is ready.")

def verify_code():
    print("[*] Running code verification checks...")
    all_ok = True
    
    # 1. Format check
    print("  -> Checking code formatting...")
    code, out, err = run_cmd("dart format --output=none --set-exit-if-changed .")
    if code == 0:
        print("     [OK] Code formatting is correct.")
    else:
        print("     [FAIL] Code needs formatting. Run 'dart format .'.")
        all_ok = False

    # 2. Analyze check
    print("  -> Running analyzer...")
    # Try dart analyze, fallback to flutter analyze if it's a flutter workspace
    code, out, err = run_cmd("dart analyze")
    if code != 0:
        # Check if flutter analyze works
        code_fl, out_fl, err_fl = run_cmd("flutter analyze")
        if code_fl != 0:
            print(f"     [FAIL] Analyzer found issues:\n{out_fl or out}")
            all_ok = False
        else:
            print("     [OK] Analyzer passed (via flutter analyze).")
    else:
        print("     [OK] Analyzer passed.")

    # 3. Test check
    print("  -> Running test suite...")
    code, out, err = run_cmd("dart test")
    if code != 0:
        code_fl, out_fl, err_fl = run_cmd("flutter test")
        if code_fl != 0:
            print(f"     [FAIL] Tests failed:\n{out_fl or out}")
            all_ok = False
        else:
            print("     [OK] Tests passed (via flutter test).")
    else:
        print("     [OK] Tests passed.")

    if all_ok:
        print("[SUCCESS] All verification checks passed.")
    else:
        print("[FAIL] Verification failed. Please resolve the issues above.")
        sys.exit(1)

def find_pr_template():
    # Search common skill directories for pr_standards.md template
    home = os.path.expanduser("~")
    search_dirs = [
        os.path.join(home, ".gemini/config/skills/flutter-senior-workflow/templates/pr_standards.md"),
        os.path.join(home, ".gemini/config/skills/dartfrog-senior-workflow/templates/pr_standards.md"),
    ]
    for p in search_dirs:
        if os.path.exists(p):
            return p
    return None

def submit_pr(issue_id, title):
    curr_branch = get_current_branch()
    main_branch = get_main_branch()
    if curr_branch == main_branch:
        print(f"[ERROR] Cannot submit PR from the base branch '{main_branch}'. Checkout a feature branch first.")
        sys.exit(1)

    print(f"[*] Submitting Pull Request for branch '{curr_branch}'...")

    # Push branch first
    print("[*] Pushing current branch to remote...")
    code, _, err = run_cmd(f"git push -u origin {curr_branch}")
    if code != 0:
        print(f"[WARNING] Could not push branch: {err}. Proceeding anyway assuming branch is pushed.")

    # Get commits list
    _, commits_out, _ = run_cmd(f"git log origin/{main_branch}..{curr_branch} --oneline")
    if not commits_out.strip():
        # Fallback to local main comparison
        _, commits_out, _ = run_cmd(f"git log {main_branch}..{curr_branch} --oneline")
        
    commit_bullets = "\n".join([f"- {line}" for line in commits_out.strip().splitlines() if line])
    if not commit_bullets:
        commit_bullets = "- No commits found between feature branch and main branch."

    # Locate PR template
    template_path = find_pr_template()
    pr_body = ""
    if template_path:
        print(f"[*] Found PR template at: {template_path}")
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
        
        # Populate template fields dynamically
        pr_body = template_content
        pr_body = pr_body.replace("[Issue Number]", f"#{issue_id}" if issue_id else "N/A")
        pr_body = pr_body.replace("Fixes #", f"Fixes #{issue_id}" if issue_id else "")
        # Add commits to description if placeholder exists or append
        if "## Description" in pr_body:
            pr_body = pr_body.replace("## Description", f"## Description\n\n### Commits:\n{commit_bullets}")
        else:
            pr_body += f"\n\n### Commits:\n{commit_bullets}"
    else:
        print("[!] PR template not found. Creating a generic PR description...")
        pr_body = f"## Description\n\nResolves #{issue_id}\n\n### Commits:\n{commit_bullets}"

    # Write temp file for PR body
    temp_body_path = "/tmp/pr_body.md"
    with open(temp_body_path, "w", encoding="utf-8") as f:
        f.write(pr_body)

    # Use gh CLI to create PR
    pr_title = title if title else f"feat: address issue #{issue_id}"
    print(f"[*] Creating Pull Request using GitHub CLI: '{pr_title}'...")
    gh_cmd = f"gh pr create --title \"{pr_title}\" --body-file \"{temp_body_path}\" --draft=false"
    code, out, err = run_cmd(gh_cmd)
    
    if os.path.exists(temp_body_path):
        os.remove(temp_body_path)

    if code == 0:
        print(f"[SUCCESS] Pull Request created successfully:\n{out.strip()}")
    else:
        print(f"[ERROR] Failed to create Pull Request: {err}")
        print("\nMake sure you have installed 'gh' CLI and are logged in ('gh auth login').")

def main():
    parser = argparse.ArgumentParser(description="Unified Project & PR Lifecycle Helper Script")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Prepare command
    prep_parser = subparsers.add_parser("prepare", help="Check out a clean branch synchronized with remote main/master")
    prep_parser.add_argument("--issue", required=True, help="Issue ID/number")

    # Verify command
    subparsers.add_parser("verify", help="Run dart formatting, analysis, and test checks")

    # Submit command
    sub_parser = subparsers.add_parser("submit", help="Push branch and open a standardized PR on GitHub")
    sub_parser.add_argument("--issue", required=True, help="Issue ID/number")
    sub_parser.add_argument("--title", help="PR Title override")

    args = parser.parse_args()

    if args.command == "prepare":
        prepare_branch(args.issue)
    elif args.command == "verify":
        verify_code()
    elif args.command == "submit":
        submit_pr(args.issue, args.title)

if __name__ == "__main__":
    main()
