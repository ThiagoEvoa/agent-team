# Pull Request Description Standards

All developers (and developer agents) MUST use this standard template when creating Pull Requests on GitHub. This ensures the reviewer has all necessary context, execution logs, and references to complete their audit efficiently.

## 🏷️ PR Title Format
Follow Conventional Commits:
- `feat(scope): brief description` - For new features/routes/modules.
- `fix(scope): brief description` - For bug fixes.
- `refactor(scope): brief description` - For code changes that neither fix a bug nor add a feature.
- `test(scope): brief description` - For adding missing tests or correcting tests.
- `docs(scope): brief description` - For documentation-only changes.
- `chore(scope): brief description` - For dependency bumps, build system tweaks, etc.

*Example: `feat(routes): add user creation route and validation middleware`*

---

## 📝 PR Description Template

Use the following Markdown structure for the Pull Request description body.

```markdown
# [PR Title Here]

## 🎯 Purpose / Linked Issue
Explain what this PR accomplishes and link the corresponding GitHub issue.
- **Closes:** #issue_number (e.g. Closes #42)

## 🛠️ Summary of Changes
Detail exactly what was added, modified, or removed:
- **Routes / Endpoints:** [e.g., POST `/users`]
- **Middleware:** [e.g., `user_validation_middleware`]
- **Models / Repositories:** [e.g., `UserRepository`, `UserModel`]
- **Dependencies:** [e.g., added `crypto` pkg]

## 🧪 Verification & Testing
Describe how changes were tested and show evidence of successful execution.
### Automated Tests
- Run command: `dart test` or `mcp_dart_run_tests`
- Result summary: [e.g., All 15 tests passed (100% behavior coverage)]

### Manual Verification
Describe manual testing steps and paste console outputs, API responses, or logs here:
```json
{
  "status": "success",
  "data": { "id": "123", "name": "Thiago" }
}
```

## 🏁 Developer Handoff Checklist
- [ ] Code is formatted (`dart format`) and fixes applied (`dart fix`).
- [ ] Code passes all analyzer checks (`dart analyze`).
- [ ] Tests cover 100% of newly added behaviors.
- [ ] No secrets or hardcoded credentials are included.
- [ ] Handoff documentation/reports are generated.
```
