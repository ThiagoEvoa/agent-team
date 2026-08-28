#!/usr/bin/env python3
import sys
import os
import subprocess
import re
import argparse

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
        return res.returncode, res.stdout, res.stderr
    except Exception as e:
        return -1, "", str(e)

def parse_diff(diff_content):
    """
    Parses a git diff and returns a dict mapping file path to a list of modified line numbers.
    """
    files_changed = {}
    current_file = None
    current_line = 0

    for line in diff_content.splitlines():
        if line.startswith('+++ b/'):
            current_file = line[6:]
            files_changed[current_file] = set()
        elif line.startswith('@@ '):
            # Parse hunk header e.g. @@ -10,4 +12,6 @@
            match = re.match(r'^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,(\d+))?\s+@@', line)
            if match:
                current_line = int(match.group(1))
        elif current_file:
            if line.startswith('+') and not line.startswith('+++'):
                files_changed[current_file].add(current_line)
                current_line += 1
            elif line.startswith('-'):
                # Deleted lines don't increment line counter in the new file
                pass
            else:
                # Unchanged context line
                current_line += 1

    return {k: sorted(list(v)) for k, v in files_changed.items()}

def parse_dart_analyze_output(output):
    """
    Parses dart analyze output. Standard output is like:
      info • Unused import • lib/main.dart:4:8 • unused_import
      error • Undefined name • lib/main.dart:12:3 • undefined_identifier
    """
    issues = []
    lines = output.splitlines()
    for line in lines:
        # Match standard info/warning/error format:
        # severity • message • path/to/file.dart:line:col • error_code
        match = re.search(r'^\s*(info|warning|error)\s+•\s+(.+?)\s+•\s+(.+?):(\d+):(\d+)\s+•\s+(.+)$', line)
        if match:
            issues.append({
                "severity": match.group(1).upper(),
                "message": match.group(2).strip(),
                "file": match.group(3).strip(),
                "line": int(match.group(4)),
                "code": match.group(6).strip()
            })
    return issues

def build_pr_diff(pr_number):
    print(f"[*] Fetching diff for PR #{pr_number} using gh CLI...")
    code, out, err = run_cmd(f"gh pr diff {pr_number}")
    if code != 0:
        print(f"[ERROR] Failed to fetch PR diff: {err}")
        return None
    return out

def get_git_diff(only_staged=False, fixed_point=None):
    if fixed_point:
        cmd = f"git diff {fixed_point}...HEAD"
    elif only_staged:
        cmd = "git diff --cached"
    else:
        cmd = "git diff HEAD"
    code, out, err = run_cmd(cmd)
    if code != 0:
        print(f"[ERROR] Failed to fetch git diff ({cmd}): {err}")
        return None
    return out

def run_local_audit():
    print("[*] Running local static analysis and audit checks...")
    code, out, _ = run_cmd("dart analyze")
    if code != 0:
        # If dart analyze fails to find dart SDK or similar, try flutter analyze
        _, out_fl, _ = run_cmd("flutter analyze")
        if out_fl:
            out = out_fl
    return parse_dart_analyze_output(out)

def main():
    parser = argparse.ArgumentParser(description="Dart Senior Architect Two-Axis Reviewer Helper Script")
    parser.add_argument("--fixed-point", help="Git reference to compare against (e.g. origin/main, main, HEAD~3)")
    parser.add_argument("--only-staged", action="store_true", help="Only review staged changes")
    parser.add_argument("--pr", type=int, help="Fetch changes from target GitHub PR number")
    parser.add_argument("--spec", help="Path to specification file (e.g. spec.md or issue number)")
    args = parser.parse_args()

    # 1. Fetch diff content
    if args.pr:
        diff_content = build_pr_diff(args.pr)
    else:
        diff_content = get_git_diff(args.only_staged, args.fixed_point)

    if not diff_content:
        print("[!] No git diff or changes detected.")
        sys.exit(0)

    # 2. Parse changes
    changes = parse_diff(diff_content)
    print(f"[*] Detected changes in {len(changes)} files:")
    for filepath, lines in changes.items():
        print(f"  - {filepath} ({len(lines)} lines modified)")

    # 3. Audit local static analysis
    analyzer_issues = run_local_audit()
    print(f"[*] Analyzer found {len(analyzer_issues)} issues in project.")

    # 4. Map analyzer issues to changed lines
    matched_issues = []
    for issue in analyzer_issues:
        filepath = issue["file"]
        line_no = issue["line"]
        normalized_file = os.path.relpath(filepath) if os.path.isabs(filepath) else filepath
        
        for changed_file, changed_lines in changes.items():
            if normalized_file in changed_file or changed_file in normalized_file:
                if line_no in changed_lines:
                    matched_issues.append(issue)

    # 5. Output Two-Axis Review Template
    print("\n" + "="*60)
    print("           DRAFT TWO-AXIS REVIEW REPORT")
    print("="*60)
    print("\n## 📋 Standards Axis")
    print("- **Violations & Hard Breaches:**")
    print("  - `[File: Line]` **Violation:** [Documented repo standard violation]. **Fix:** [Specific fix].")
    
    print("- **Code Smells (Judgement Calls):**")
    print("  - `[File: Line]` **Smell:** [Check for: Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest]. **Fix:** [Refactoring].")
    
    print("- **Compiler & Analyzer:**")
    if matched_issues:
        for issue in matched_issues:
            print(f"  - `[File: {issue['file']}:{issue['line']}]` **Issue:** Compiler {issue['severity']}: {issue['message']} (`{issue['code']}`). **Fix:** Resolve this compiler issue.")
    else:
        print("  - `[None]` **Issue:** No compiler errors or warnings on modified lines.")

    print("\n## 🎯 Spec Axis")
    if args.spec:
        print(f"- *Target Spec / Issue:* `{args.spec}`")
    print("- **Missing / Incomplete Requirements:**")
    print("  - `[Spec Reference]` **Missing:** [Requirement asked for in spec but missing in diff].")
    print("- **Scope Creep / Unrequested Behavior:**")
    print("  - `[File: Line]` **Scope Creep:** [Behavior added that was not in spec].")
    print("- **Incorrect Spec Implementation:**")
    print("  - `[File: Line]` **Defect:** [Implementation deviates from spec]. **Fix:** [Correction].")

    print("\n## Summary")
    print(f"- **Standards Axis:** {len(matched_issues)} compiler findings + [X] smells (Worst: ...)")
    print("- **Spec Axis:** [Y] findings (Worst: ...)")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()

