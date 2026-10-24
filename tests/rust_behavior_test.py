import importlib.util
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('rust_behavior_eval', Path(__file__).with_name('rust_behavior_eval.py'))
evaluation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluation)


@unittest.skipUnless(shutil.which('cargo') and shutil.which('git'), 'Rust fixtures require cargo and git')
class RustBehaviorFixtures(unittest.TestCase):
    def test_fixtures_exhibit_the_intended_baseline_and_keep_rubrics_private(self):
        for case in evaluation.load_cases():
            with self.subTest(case=case['id']), tempfile.TemporaryDirectory() as tmp:
                destination = Path(tmp)
                repo, base, head = evaluation.prepare(case, destination)
                task = (destination / 'TASK.md').read_text()
                self.assertIn(head, task)
                self.assertNotIn('{head}', task)
                self.assertNotIn('{base}', task)
                self.assertEqual(evaluation.git(repo, 'status', '--porcelain'), '')
                self.assertEqual(set(evaluation.git(repo, 'ls-files').splitlines()),
                                 {'.gitignore', *case['files'], *case.get('changes', {})})
                for check in case['baselineChecks']:
                    result = subprocess.run(check['args'], cwd=repo, capture_output=True, text=True, timeout=60)
                    self.assertEqual(result.returncode, check['exit'], result.stdout + result.stderr)
                    for expected in check.get('contains', []):
                        self.assertIn(expected, result.stdout + result.stderr)
                if case.get('changes'):
                    self.assertNotEqual(base, head)
                    evaluation.git(repo, 'checkout', '--detach', base)
                    result = subprocess.run(['cargo', 'test', '--offline'], cwd=repo,
                                            capture_output=True, text=True, timeout=60)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_prepare_preserves_an_existing_evaluation(self):
        with tempfile.TemporaryDirectory() as tmp:
            destination = Path(tmp)
            marker = destination / 'work.txt'
            marker.write_text('user work')
            with self.assertRaises(ValueError):
                evaluation.prepare(evaluation.load_cases()[0], destination)
            self.assertEqual(marker.read_text(), 'user work')
            self.assertEqual(list(destination.iterdir()), [marker])


if __name__ == '__main__':
    unittest.main()
