import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('agents_setup', ROOT / 'agents-setup.py')
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)

ext_spec = importlib.util.spec_from_file_location('extensions_setup', ROOT / 'pi-extensions-setup.py')
extensions = importlib.util.module_from_spec(ext_spec)
ext_spec.loader.exec_module(extensions)


class SetupTests(unittest.TestCase):
    def test_source_link_to_destination_preserves_original(self):
        for links in (False, True):
            with self.subTest(links=links), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                src, dst = root / 'src', root / 'dst'
                src.mkdir(); dst.mkdir()
                target = dst / 'helper.py'
                target.write_text('original')
                (src / target.name).symlink_to(target)
                self.assertTrue(setup.sync_directory(src, dst, use_symlinks=links))
                self.assertEqual(target.read_text(), 'original')
                self.assertFalse(target.is_symlink())

    def test_invalid_source_preserves_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); src, dst = root / 'src', root / 'dst'
            src.mkdir(); dst.mkdir()
            (src / 'helper.py').symlink_to(root / 'missing')
            (dst / 'helper.py').write_text('original')
            self.assertFalse(setup.sync_directory(src, dst))
            self.assertEqual((dst / 'helper.py').read_text(), 'original')

    def test_copy_failure_preserves_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); src, dst = root / 'src', root / 'dst'
            src.mkdir(); dst.mkdir()
            (src / 'helper.py').write_text('new')
            (dst / 'helper.py').write_text('original')
            with patch.object(setup.shutil, 'copy2', side_effect=OSError('copy failed')):
                self.assertFalse(setup.sync_directory(src, dst))
            self.assertEqual((dst / 'helper.py').read_text(), 'original')

    def test_failed_replacement_restores_previous_copy(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); src, dst = root / 'src', root / 'dst'
            src.mkdir(); dst.mkdir()
            (src / 'helper.py').write_text('new')
            (dst / 'helper.py').write_text('original')
            rename = Path.rename
            def fail_staged(path, target):
                if path.name == 'new': raise OSError('replacement failed')
                return rename(path, target)
            with patch.object(Path, 'rename', fail_staged):
                self.assertFalse(setup.sync_directory(src, dst))
            self.assertEqual((dst / 'helper.py').read_text(), 'original')

    def test_no_force_preserves_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); src, dst = root / 'src', root / 'dst'
            src.mkdir(); dst.mkdir()
            (src / 'helper.py').write_text('new')
            (dst / 'helper.py').write_text('original')
            self.assertTrue(setup.sync_directory(src, dst, force=False))
            self.assertEqual((dst / 'helper.py').read_text(), 'original')

    def test_extension_source_identity_and_failed_copy_preserve_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source, target = root / 'source.ts', root / 'installed.ts'
            target.write_text('original')
            source.symlink_to(target)
            self.assertTrue(extensions.link_or_copy(source, target))
            self.assertEqual(target.read_text(), 'original')
            source.unlink(); source.write_text('new')
            with patch.object(extensions.shutil, 'copy2', side_effect=OSError('copy failed')):
                self.assertFalse(extensions.link_or_copy(source, target))
            self.assertEqual(target.read_text(), 'original')

    def test_extensions_full_install_repeated(self):
        for links in (False, True):
            with self.subTest(links=links), tempfile.TemporaryDirectory() as tmp:
                command = [sys.executable, str(ROOT / 'pi-extensions-setup.py'), '--target-dir', str(Path(tmp) / 'pi'), '--agents-target', str(Path(tmp) / 'agents'), '--store-in-agents']
                if links: command.append('--symlink')
                for _ in range(2):
                    result = subprocess.run(command, capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0, result.stderr)
                self.assertTrue((Path(tmp) / 'pi/agent-switcher.ts').is_file())
                for filename in ('tts.ts', 'tts/core.ts', 'tts/README.md'):
                    self.assertTrue((Path(tmp) / 'pi' / filename).is_file(), filename)

    def test_tts_selected_install_preserves_settings_in_all_modes(self):
        for links in (False, True):
            for store in (False, True):
                with self.subTest(links=links, store=store), tempfile.TemporaryDirectory() as tmp:
                    root = Path(tmp)
                    target = root / 'pi/extensions'
                    target.mkdir(parents=True)
                    config = target.parent / 'tts.json'
                    saved = '{"enabled":true,"model":"personal-model","voice":"personal-voice"}\n'
                    config.write_text(saved)
                    (target / 'tts.ts').write_text('old extension')
                    command = [sys.executable, str(ROOT / 'pi-extensions-setup.py'),
                               '--target-dir', str(target), '--agents-target', str(root / 'agents'),
                               '--extensions', 'tts']
                    if links:
                        command.append('--symlink')
                    if store:
                        command.append('--store-in-agents')
                    for _ in range(2):
                        result = subprocess.run(command, capture_output=True, text=True)
                        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                        self.assertEqual(config.read_text(), saved)
                        for src, filename in extensions.EXTENSION_FILES['tts']:
                            installed = target / filename
                            self.assertEqual(installed.read_bytes(), (ROOT / src).read_bytes())
                            self.assertEqual(installed.is_symlink(), links or store)
                            if store:
                                self.assertTrue((root / 'agents/extension' / filename).is_file())
                        self.assertEqual(sorted(p.name for p in target.iterdir()), ['tts', 'tts.ts'])

    def test_recovered_scripts_compile(self):
        for path in (ROOT / 'scripts').glob('*.py'):
            self.assertFalse(path.is_symlink())
            compile(path.read_text(), str(path), 'exec')

    def test_full_install_copy_and_symlink_repeated(self):
        for links in (False, True):
            with self.subTest(links=links), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                command = [sys.executable, str(ROOT / 'agents-setup.py'), '--agents-target', str(root / 'agents'), '--pi-agent-target', str(root / 'pi')]
                if links: command.append('--symlink')
                for _ in range(2):
                    result = subprocess.run(command, capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0, result.stderr)
                self.assertTrue((root / 'agents/agents/firebase-agent.md').is_file())
                self.assertTrue((root / 'pi/scripts/orchestrate.py').is_file())
                self.assertTrue((root / 'pi/scripts/orchestrate.py').is_symlink())
                checked = subprocess.run(command + ['--check'], capture_output=True, text=True)
                self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)

    def test_scoped_install_and_read_only_drift_check(self):
        for links in (False, True):
            with self.subTest(links=links), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                command = [sys.executable, str(ROOT / 'agents-setup.py'),
                           '--agents-target', str(root / 'agents'), '--pi-agent-target', str(root / 'pi'),
                           '--only', 'agents/rust-senior-engineer.md', 'skills/rust-senior-workflow']
                missing = subprocess.run(command + ['--check'], capture_output=True, text=True)
                self.assertEqual(missing.returncode, 1)
                self.assertEqual(list(root.iterdir()), [])
                installed = subprocess.run(command + (['--symlink'] if links else []), capture_output=True, text=True)
                self.assertEqual(installed.returncode, 0, installed.stderr)
                self.assertFalse((root / 'pi').exists())
                self.assertEqual([p.name for p in (root / 'agents/agents').iterdir()], ['rust-senior-engineer.md'])
                current = subprocess.run(command + ['--check'], capture_output=True, text=True)
                self.assertEqual(current.returncode, 0, current.stderr)
                if not links:
                    resource = root / 'agents/skills/rust-senior-workflow/references/validation.md'
                    resource.write_text('stale')
                    drift = subprocess.run(command + ['--check'], capture_output=True, text=True)
                    self.assertEqual(drift.returncode, 1)
                    self.assertEqual(resource.read_text(), 'stale')
                    self.assertIn('Drift:', drift.stdout)

    def test_drift_check_detects_extra_nested_and_missing_resources(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); src, dst = root / 'src', root / 'dst'
            (src / 'skill').mkdir(parents=True); (dst / 'skill').mkdir(parents=True)
            (src / 'skill/SKILL.md').write_text('same')
            (dst / 'skill/SKILL.md').write_text('same')
            # Unrelated installed top-level entries are outside the source's ownership.
            (dst / 'personal-skill').mkdir()
            self.assertTrue(setup.check_directory(src, dst))
            extra = dst / 'skill/old-reference.md'
            extra.write_text('removed from source')
            self.assertFalse(setup.check_directory(src, dst))
            extra.unlink()
            (dst / 'skill/SKILL.md').unlink()
            self.assertFalse(setup.check_directory(src, dst))

    def test_unknown_install_selector_fails_before_writes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for selector in ('skills/../agents', 'agents/..', 'skills/missing', '../agents-setup.py'):
                result = subprocess.run([sys.executable, str(ROOT / 'agents-setup.py'),
                                         '--agents-target', str(root / 'agents'),
                                         '--pi-agent-target', str(root / 'pi'), '--only', selector],
                                        capture_output=True, text=True)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertEqual(list(root.iterdir()), [])


if __name__ == '__main__':
    unittest.main()
