# PR Description Standards

All PRs MUST use this standard format.

## 🏷️ Title Format
Conventional Commits: `type(scope): description` (e.g., `feat(ui): add loading state`). Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

## 📝 PR Description Template
```markdown
# [PR Title]

## 🎯 Purpose / Linked Issue
- **Closes:** #issue_number

## 🛠️ Summary of Changes
- **Screens / Widgets:**
- **State Management:**
- **Models / Services:**
- **Dependencies:**

## 🧪 Verification & Testing
### Automated Tests
- Command: `flutter test`
- Result:
### Manual Verification
- Steps/logs:

## 🏁 Developer Handoff Checklist
- [ ] Formatted (`dart format`) and fixes applied (`dart fix`).
- [ ] Passes analyzer (`dart analyze`).
- [ ] Tests cover 100% of newly added behaviors.
- [ ] No secrets or hardcoded credentials.
- [ ] Handoff documentation/reports generated.
```
