#!/usr/bin/env python3
"""Prepare isolated Rust agent tasks without exposing evaluator rubrics."""

import argparse
import json
import subprocess
from pathlib import Path, PurePosixPath

DATASET = Path(__file__).with_name('rust-behavior-evaluation.json')


def load_cases():
    return json.loads(DATASET.read_text())


def write_files(repo, files):
    for name, content in files.items():
        relative = PurePosixPath(name)
        if relative.is_absolute() or '..' in relative.parts or '.git' in relative.parts:
            raise ValueError(f'Invalid fixture path: {name}')
        target = repo.joinpath(*relative.parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)


def git(repo, *args):
    return subprocess.run(['git', '-C', str(repo), *args], check=True,
                          capture_output=True, text=True).stdout.strip()


def commit(repo, message):
    git(repo, 'add', '.')
    git(repo, '-c', 'user.name=Rust evaluation', '-c', 'user.email=rust-eval@example.invalid',
        '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '-m', message)
    return git(repo, 'rev-parse', 'HEAD')


def prepare(case, destination):
    destination = Path(destination)
    if destination.exists() and (not destination.is_dir() or any(destination.iterdir())):
        raise ValueError('Evaluation destination must be absent or an empty directory')
    repo = destination / 'repo'
    repo.mkdir(parents=True)
    write_files(repo, {'.gitignore': '/target/\n/Cargo.lock\n', **case['files']})
    git(repo, '-c', 'init.templateDir=', 'init', '--initial-branch=main')
    base = commit(repo, 'Evaluation base')
    head = base
    if case.get('changes'):
        write_files(repo, case['changes'])
        head = commit(repo, 'Change under review')
    task = case['prompt'].replace('{base}', base).replace('{head}', head)
    (destination / 'TASK.md').write_text(f'{task}\n\nRepository: {repo.resolve()}\n')
    return repo, base, head


def main():
    cases = {case['id']: case for case in load_cases()}
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('case', choices=sorted(cases))
    parser.add_argument('destination', type=Path, help='New or empty evaluation directory')
    args = parser.parse_args()
    try:
        repo, base, head = prepare(cases[args.case], args.destination)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Cannot prepare evaluation: {error}\n')
    print(f'Task: {(args.destination / "TASK.md").resolve()}\nRepository: {repo.resolve()}\nBase: {base}\nHead: {head}')


if __name__ == '__main__':
    main()
