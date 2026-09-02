#!/usr/bin/env python3
"""
pi-extensions-setup.py

Sets up and wires custom TypeScript extensions to ~/.pi/agent/extensions.

Installation options:
  1. Direct installation (default):
     - Copies / symlinks files directly to ~/.pi/agent/extensions (or custom --target-dir)
  2. Via ~/.agents canonical storage (--store-in-agents / --user):
     - Places extension files into ~/.agents/extension/ (or /Users/{user}/.agents/extension/)
     - Wires (symlinks) them from ~/.agents/extension/ into ~/.pi/agent/extensions/
"""

import argparse
import getpass
import os
import shutil
import sys
from typing import Optional
from pathlib import Path

EXTENSIONS_MAPPING = {
    "extension/custom-tui/custom-tui.ts": "custom-tui.ts",
    "extension/agent-switcher/agent-switcher.ts": "agent-switcher.ts",
    "extension/subagent-spawner/subagent-spawner.ts": "subagent-spawner.ts",
}

DEFAULT_PI_DIR = Path.home() / ".pi" / "agent" / "extensions"
DEFAULT_AGENTS_DIR = Path.home() / ".agents"


def resolve_user_home(username: Optional[str]) -> Path:
    if username:
        # Resolve /Users/<username> on macOS or /home/<username> on Linux
        user_home_macos = Path("/Users") / username
        user_home_linux = Path("/home") / username
        if user_home_macos.exists():
            return user_home_macos
        elif user_home_linux.exists():
            return user_home_linux
        else:
            # Fallback to path under /Users if macos style
            return user_home_macos
    return Path.home()


def link_or_copy(src_path: Path, dest_path: Path, use_symlinks: bool = False, force: bool = True) -> bool:
    if dest_path.exists() or dest_path.is_symlink():
        if force:
            if dest_path.is_dir() and not dest_path.is_symlink():
                shutil.rmtree(dest_path)
            else:
                dest_path.unlink()
        else:
            print(f"⚠️  Skipping {dest_path.name}: already exists (use --force to overwrite)")
            return True

    try:
        if use_symlinks:
            dest_path.symlink_to(src_path.resolve())
            print(f"🔗 Linked: {src_path} -> {dest_path}")
        else:
            shutil.copy2(src_path, dest_path)
            print(f"📋 Copied: {src_path} -> {dest_path}")
        return True
    except Exception as e:
        print(f"❌ Failed placing {src_path} -> {dest_path}: {e}", file=sys.stderr)
        return False


def setup_extensions(
    source_root: Path,
    target_dir: Path,
    agents_store_dir: Optional[Path] = None,
    use_symlinks: bool = False,
    force: bool = True,
) -> bool:
    success = True
    target_dir.mkdir(parents=True, exist_ok=True)

    if agents_store_dir:
        # Mode: Store into ~/.agents/extension and wire to ~/.pi/agent/extensions
        print(f"📦 Storing canonical extensions in: {agents_store_dir}")
        print(f"🔌 Wiring pi agent extensions in: {target_dir}")
        agents_store_dir.mkdir(parents=True, exist_ok=True)

        for src_rel, filename in EXTENSIONS_MAPPING.items():
            src_path = source_root / src_rel
            agent_ext_dest = agents_store_dir / filename
            pi_ext_dest = target_dir / filename

            if not src_path.exists():
                print(f"❌ Error: Source file not found: {src_path}", file=sys.stderr)
                success = False
                continue

            # Step 1: Put file into ~/.agents/extension/
            ok_store = link_or_copy(src_path, agent_ext_dest, use_symlinks=use_symlinks, force=force)
            if not ok_store:
                success = False
                continue

            # Step 2: Wire from ~/.agents/extension/ into ~/.pi/agent/extensions/ via symlink
            ok_wire = link_or_copy(agent_ext_dest, pi_ext_dest, use_symlinks=True, force=force)
            if not ok_wire:
                success = False

    else:
        # Standard direct mode
        print(f"Target extensions directory: {target_dir}")
        for src_rel, target_filename in EXTENSIONS_MAPPING.items():
            src_path = source_root / src_rel
            dest_path = target_dir / target_filename

            if not src_path.exists():
                print(f"❌ Error: Source file not found: {src_path}", file=sys.stderr)
                success = False
                continue

            ok = link_or_copy(src_path, dest_path, use_symlinks=use_symlinks, force=force)
            if not ok:
                success = False

    return success


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Wire pi agent extensions into ~/.pi/agent/extensions and optionally store in ~/.agents/extension"
    )
    parser.add_argument(
        "--user",
        "-u",
        type=str,
        default=None,
        help="Specify target system username (e.g., thiagoevoa) to install under /Users/{user}/.agents and /Users/{user}/.pi",
    )
    parser.add_argument(
        "--store-in-agents",
        "-a",
        action="store_true",
        help="Store extension files inside ~/.agents/extension (or /Users/{user}/.agents/extension) and wire to ~/.pi/agent/extensions",
    )
    parser.add_argument(
        "--target-dir",
        type=Path,
        default=None,
        help="Custom target directory for pi extensions (default: ~/.pi/agent/extensions)",
    )
    parser.add_argument(
        "--agents-target",
        type=Path,
        default=None,
        help="Custom target directory for .agents (default: ~/.agents)",
    )
    parser.add_argument(
        "--symlink",
        "-s",
        action="store_true",
        help="Create symbolic links instead of copying files",
    )
    parser.add_argument(
        "--no-force",
        action="store_true",
        help="Do not overwrite existing files in the target directory",
    )

    args = parser.parse_args()
    source_root = Path(__file__).resolve().parent

    current_user = args.user or getpass.getuser()
    user_home = resolve_user_home(args.user)
    target_dir = args.target_dir or (user_home / ".pi" / "agent" / "extensions")
    agents_base = args.agents_target or (user_home / ".agents")

    # Default to placing canonical extensions in ~/.agents/extension and wiring to ~/.pi/agent/extensions
    agents_store_dir = args.agents_target / "extension" if args.agents_target else (agents_base / "extension")

    print(f"Wiring pi extensions from: {source_root}")
    print(f"Detected user: {current_user} -> Home: {user_home}")

    ok = setup_extensions(
        source_root=source_root,
        target_dir=target_dir,
        agents_store_dir=agents_store_dir,
        use_symlinks=args.symlink,
        force=not args.no_force,
    )

    if ok:
        print("\n✅ Extensions successfully wired.")
    else:
        print("\n⚠️  Completed with errors.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
