# Evidence-based code review

Pin the scope: exact base/head for a PR or commit range; `HEAD` and staged/unstaged scope for local changes; revision and included local changes for a full audit. Preserve a diff snapshot when the working tree may change. Read the originating requirements and ADRs. If the target changes, revalidate affected findings. Do not reset user work to make review easier.

Perform separate passes using the selected stack's standards:

- **Standards:** Correctness, security, language/runtime contracts, compatibility, architectural costs, and behavioral test coverage. Use actual diagnostics for compiler findings. Distinguish mandatory repository rules from optional preferences.
- **Spec:** Trace each acceptance criterion through implementation and tests. Identify missing, incorrect, or concretely unrequested behavior. If requirements are unavailable, state the limit; do not invent criteria.

State each finding's trigger, caller impact, exact file/line, evidence, and proportionate correction. Report a defect once, cross-referencing it if both axes apply. Keep unproven hypotheses under open questions, with evidence needed to resolve them. Empty axes may have no findings. A smell is a prompt to investigate, not a quota: report demonstrated maintenance cost rather than a pattern name alone.

For Dart, check the Fowler baseline: mysterious names, duplication, feature envy, data clumps, primitive obsession, repeated switches, shotgun surgery, divergent change, speculative generality, message chains, middle men, and refused bequest. For repeated structural problems across more than two modules, flag systemic architecture risk and propose the scoped [architecture audit](architecture-audit.md); do not expand an ordinary review into a redesign automatically.

Use the repository's severity scheme; otherwise P0 critical unconditional failure, P1 serious/common-path defect, P2 material narrower-trigger defect, P3 concrete low-impact issue. Rank within each axis. Verify baseline failures before calling them pre-existing; separate environment limitations from code defects. Read-only checks may run during review; changes and remote comments require task authorization.

For a formal review, use this compact structure; a focused implementation self-review can be summarized in the handoff:

```markdown
## Target
Revisions/diff scope and originating requirements.
## Standards Axis
Severity, file:line, trigger, evidence, impact, correction; or no findings.
## Spec Axis
Criterion and file:line, missing/incorrect/unrequested behavior; or no findings.
## Validation
Commands, runtime/toolchain/configuration, outcomes, baseline failures, skipped checks.
## Open questions
Only unresolved matters and how to resolve them; omit when empty.
## Status
Readiness, material gaps, and next action.
```
