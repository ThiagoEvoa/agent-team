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


def sync_directory(src_dir: Path, dest_dir: Path, use_symlinks: bool = False, force: bool = True) -> bool:
    if not src_dir.exists():
        print(f"❌ Error: Source directory does not exist: {src_dir}", file=sys.stderr)
        return False

    dest_dir.mkdir(parents=True, exist_ok=True)
    success = True

    for item in src_dir.iterdir():
        if item.name.startswith(".DS_Store"):
            continue

        target = dest_dir / item.name

        if target.exists() or target.is_symlink():
            if force:
                if target.is_dir() and not target.is_symlink():
                    shutil.rmtree(target)
                else:
                    target.unlink()
            else:
                print(f"⚠️  Skipping {target.name}: already exists (use --force)")
                continue

        try:
            if use_symlinks:
                target.symlink_to(item.resolve())
                print(f"🔗 Linked: {item.relative_to(src_dir.parent)} -> {target}")
            else:
                if item.is_dir():
                    shutil.copytree(item, target)
                else:
                    shutil.copy2(item, target)
                    if item.suffix == ".py" or os.access(item, os.X_OK):
                        current_mode = target.stat().st_mode
                        target.chmod(current_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                print(f"📋 Copied: {item.relative_to(src_dir.parent)} -> {target}")
        except Exception as e:
            print(f"❌ Failed sync {item} -> {target}: {e}", file=sys.stderr)
            success = False

    return success


def wire_directory(src_dir: Path, dest_dir: Path, force: bool = True) -> bool:
    """Creates symlinks in dest_dir pointing to files in src_dir."""
    if not src_dir.exists():
        print(f"❌ Error: Source directory for wiring does not exist: {src_dir}", file=sys.stderr)
        return False

    dest_dir.mkdir(parents=True, exist_ok=True)
    success = True

    for item in src_dir.iterdir():
        if item.name.startswith(".DS_Store"):
            continue

        target = dest_dir / item.name

        if target.exists() or target.is_symlink():
            if force:
                if target.is_dir() and not target.is_symlink():
                    shutil.rmtree(target)
                else:
                    target.unlink()
            else:
                print(f"⚠️  Skipping {target.name}: already exists in {dest_dir} (use --force)")
                continue

        try:
            target.symlink_to(item.resolve())
            print(f"🔌 Wired (symlink): {target} -> {item.resolve()}")
        except Exception as e:
            print(f"❌ Failed wiring {target} -> {item}: {e}", file=sys.stderr)
            success = False

    return success


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

    args = parser.parse_args()
    root_dir = Path(__file__).resolve().parent

    current_user = args.user or getpass.getuser()
    user_home = resolve_user_home(args.user)
    agents_base = args.agents_target or (user_home / ".agents")
    pi_agent_base = args.pi_agent_target or (user_home / ".pi" / "agent")

    force = not args.no_force

    print(f"Wiring configuration from repo root: {root_dir}")
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
        print(f"\n--- Syncing {name} [{src} -> {dest}] ---")
        ok = sync_directory(src_dir=src, dest_dir=dest, use_symlinks=args.symlink, force=force)
        if not ok:
            all_ok = False

    # Wire scripts into pi agent runtime
    pi_scripts_dir = pi_agent_base / "scripts"
    print(f"\n--- Wiring scripts into Pi Agent [{agents_base / 'scripts'} -> {pi_scripts_dir}] ---")
    ok_wire = wire_directory(src_dir=agents_base / "scripts", dest_dir=pi_scripts_dir, force=force)
    if not ok_wire:
        all_ok = False

    if all_ok:
        print("\n✅ All agents, skills, and scripts successfully wired.")
    else:
        print("\n⚠️  Setup completed with errors.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
