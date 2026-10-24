#!/usr/bin/env python3
"""
agents-setup.py

Sets up and wires:
  - agents/  -> ~/.agents/agents/ (or /Users/{user}/.agents/agents/)
  - skills/  -> ~/.agents/skills/ (or /Users/{user}/.agents/skills/)
  - scripts/ -> ~/.agents/scripts/ -> wired into ~/.pi/agent/scripts/
"""

import argparse
import getpass
import os
import shutil
import stat
import sys
import tempfile
from typing import Optional
from pathlib import Path


def resolve_user_home(username: Optional[str]) -> Path:
    if username:
        user_home_macos = Path("/Users") / username
        user_home_linux = Path("/home") / username
        if user_home_macos.exists():
            return user_home_macos
        elif user_home_linux.exists():
            return user_home_linux
        else:
            return user_home_macos
    # Auto-detect current active user home (/Users/{user} on macOS or /home/{user} on Linux)
    return Path.home()


def sync_directory(src_dir: Path, dest_dir: Path, use_symlinks: bool = False, force: bool = True,
                   entries: Optional[set[str]] = None) -> bool:
    """Stage each source before replacing its destination; rollback failed replacements."""
    if not src_dir.is_dir():
        print(f"❌ Error: Source directory does not exist: {src_dir}", file=sys.stderr)
        return False

    dest_dir.mkdir(parents=True, exist_ok=True)
    success = True
    for item in src_dir.iterdir():
        if item.name.startswith(".DS_Store"):
            continue
        if entries is not None and item.name not in entries:
            continue
        target = dest_dir / item.name
        try:
            source = item.resolve(strict=True)
            if target.exists() and os.path.samefile(source, target):
                print(f"⏭️ Already wired: {target}")
                continue
            if source.is_dir() and target.resolve().is_relative_to(source):
                raise ValueError("Destination must not be inside source directory")
            if (target.exists() or target.is_symlink()) and not force:
                print(f"⚠️ Skipping {target}: already exists")
                continue

            # Stage on destination filesystem before touching the installed copy.
            with tempfile.TemporaryDirectory(prefix=".agent-setup-", dir=dest_dir) as tmp:
                staged, backup = Path(tmp) / "new", Path(tmp) / "old"
                if use_symlinks:
                    staged.symlink_to(source)
                elif source.is_dir():
                    shutil.copytree(source, staged)
                else:
                    shutil.copy2(source, staged)
                    if item.suffix == ".py" or os.access(source, os.X_OK):
                        staged.chmod(staged.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                had_target = target.exists() or target.is_symlink()
                if had_target:
                    target.rename(backup)
                try:
                    staged.rename(target)
                except Exception:
                    if had_target:
                        backup.rename(target)
                    raise
            print(f"{'🔗 Linked' if use_symlinks else '📋 Copied'}: {item} -> {target}")
        except Exception as error:
            print(f"❌ Failed sync {item} -> {target}: {error}", file=sys.stderr)
            success = False
    return success


def entries_match(source: Path, target: Path) -> bool:
    """Compare content, including removed resources inside a selected directory."""
    source = source.resolve(strict=True)
    target = target.resolve(strict=True)
    if source == target:
        return True
    if source.is_file():
        return target.is_file() and source.read_bytes() == target.read_bytes()
    if not source.is_dir() or not target.is_dir():
        return False
    source_names = {item.name for item in source.iterdir() if not item.name.startswith('.DS_Store')}
    target_names = {item.name for item in target.iterdir() if not item.name.startswith('.DS_Store')}
    return source_names == target_names and all(
        entries_match(source / name, target / name) for name in sorted(source_names)
    )


def check_directory(src_dir: Path, dest_dir: Path, entries: Optional[set[str]] = None) -> bool:
    """Report missing or changed installed entries without creating or replacing files."""
    if not src_dir.is_dir():
        print(f"Missing source directory: {src_dir}", file=sys.stderr)
        return False
    matches = True
    for source in sorted(src_dir.iterdir()):
        if source.name.startswith('.DS_Store') or (entries is not None and source.name not in entries):
            continue
        target = dest_dir / source.name
        try:
            if entries_match(source, target):
                print(f"Current: {target}")
                continue
            print(f"Drift: {target}")
        except (OSError, RuntimeError) as error:
            print(f"Cannot compare {source} -> {target}: {error}", file=sys.stderr)
        matches = False
    return matches


def wire_directory(src_dir: Path, dest_dir: Path, force: bool = True) -> bool:
    """Wire validated source entries using the same safe replacement path."""
    return sync_directory(src_dir, dest_dir, use_symlinks=True, force=force)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Wire agents, skills, and scripts to ~/.agents (or /Users/{user}/.agents) and wire scripts into ~/.pi/agent/scripts"
    )
    parser.add_argument(
        "--user",
        "-u",
        type=str,
        default=None,
        help="Specify target system username (e.g., thiagoevoa) to install under /Users/{user}/.agents and /Users/{user}/.pi",
    )
    parser.add_argument(
        "--agents-target",
        type=Path,
        default=None,
        help="Target directory for agents and skills (default: ~/.agents or /Users/{user}/.agents)",
    )
    parser.add_argument(
        "--pi-agent-target",
        type=Path,
        default=None,
        help="Target directory for pi agent scripts (default: ~/.pi/agent or /Users/{user}/.pi/agent)",
    )
    parser.add_argument(
        "--symlink",
        "-s",
        action="store_true",
        help="Create symbolic links instead of copying files into ~/.agents",
    )
    parser.add_argument(
        "--no-force",
        action="store_true",
        help="Do not overwrite existing files in destination directories",
    )
    parser.add_argument(
        "--check", action="store_true",
        help="Read-only content check; exit 1 for missing or changed installed entries",
    )
    parser.add_argument(
        "--only", nargs="+", metavar="GROUP/ENTRY",
        help="Limit checking or installation to entries such as agents/rust-senior-engineer.md skills/rust-senior-workflow",
    )

    args = parser.parse_args()
    root_dir = Path(__file__).resolve().parent

    selected = None
    if args.only:
        selected = {"agents": set(), "skills": set(), "scripts": set()}
        for selector in args.only:
            parts = selector.split('/')
            if (len(parts) != 2 or parts[0] not in selected or parts[1] in ('', '.', '..')
                    or parts[1].startswith('.DS_Store')
                    or not (root_dir / parts[0] / parts[1]).exists()):
                parser.error(f"Unknown top-level source entry: {selector}")
            selected[parts[0]].add(parts[1])

    current_user = args.user or getpass.getuser()
    user_home = resolve_user_home(args.user)
    agents_base = args.agents_target or (user_home / ".agents")
    pi_agent_base = args.pi_agent_target or (user_home / ".pi" / "agent")

    force = not args.no_force

    print(f"{'Checking' if args.check else 'Wiring'} configuration from repo root: {root_dir}")
    print(f"Detected user: {current_user} -> Home: {user_home}")

    # 1. Place agents/ into ~/.agents/agents/
    # 2. Place skills/ into ~/.agents/skills/
    # 3. Place scripts/ into ~/.agents/scripts/
    # 4. Wire ~/.agents/scripts/ into ~/.pi/agent/scripts/
    targets = [
        ("agents", root_dir / "agents", agents_base / "agents"),
        ("skills", root_dir / "skills", agents_base / "skills"),
        ("scripts", root_dir / "scripts", agents_base / "scripts"),
    ]

    all_ok = True
    for name, src, dest in targets:
        entries = selected[name] if selected is not None else None
        if entries == set():
            continue
        print(f"\n--- {'Checking' if args.check else 'Syncing'} {name} [{src} -> {dest}] ---")
        ok = (check_directory(src, dest, entries) if args.check else
              sync_directory(src, dest, use_symlinks=args.symlink, force=force, entries=entries))
        if not ok:
            all_ok = False

    # Wire scripts into pi agent runtime
    pi_scripts_dir = pi_agent_base / "scripts"
    script_entries = selected['scripts'] if selected is not None else None
    if script_entries != set():
        print(f"\n--- {'Checking' if args.check else 'Wiring'} scripts into Pi Agent [{agents_base / 'scripts'} -> {pi_scripts_dir}] ---")
        if args.check:
            # Compare runtime scripts to the repository too, so two stale copies cannot pass.
            ok_wire = check_directory(root_dir / 'scripts', pi_scripts_dir, script_entries)
        else:
            ok_wire = sync_directory(agents_base / 'scripts', pi_scripts_dir,
                                     use_symlinks=True, force=force, entries=script_entries)
        if not ok_wire:
            all_ok = False

    if all_ok:
        print("\n✅ Selected installation is current." if args.check else
              "\n✅ All selected agents, skills, and scripts successfully wired.")
    else:
        print("\n⚠️  Installation has drift or could not be checked." if args.check else
              "\n⚠️  Setup completed with errors.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
