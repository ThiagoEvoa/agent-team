# Evidence-based code review

Review intent, executable behavior, test strength, and structure. Use tool results and observed outcomes to support conclusions, alongside focused code inspection. Passing tests, a clean audit, or favorable metrics do not establish that the requirements themselves are correct. Keep verification proportional to the affected behavior and risk; this procedure requires neither a multi-agent pipeline nor a particular harness.

## Pin the target and criteria

Pin the scope: exact base/head for a PR or commit range; `HEAD` and staged/unstaged scope for local changes; revision and included local changes for a full audit. Preserve a diff snapshot when the working tree may change. Read the originating requirements and ADRs. If the target changes, revalidate affected findings. Do not reset user work to make review easier.

## Review on two axes

Perform separate passes using the selected stack's standards:

- **Standards:** Correctness, security, language/runtime contracts, compatibility, architectural costs, and behavioral test coverage. Use actual diagnostics for compiler findings. Distinguish mandatory repository rules from optional preferences.
- **Spec:** Trace each acceptance criterion through implementation and tests. Identify missing, incorrect, or concretely unrequested behavior. If requirements are unavailable, state the limit; do not invent criteria.

When assessing tests, use the [behavioral testing guidelines](testing.md): real owned collaborators, doubles only at uncontrolled external boundaries, and outcome assertions without mock/spy interaction verification. Report concrete behavior left untested or falsely established; do not turn unrelated legacy test style into a finding by itself.

For affected boundaries, select [authorization](security-auth.md), [input validation](security-input.md), [data integrity](data-integrity.md), [sensitive data](security-data.md), or [cryptography](cryptography.md). For authorized corrections, follow the [delivery loop](delivery.md); recurring failures can require rechecking the seam or architecture rather than another local patch.

## Gather verification evidence

1. **Intent:** Map each acceptance criterion or domain invariant to a concrete scenario, its expected outcome, and the evidence available. Include relevant rejection, boundary, authorization, and recovery cases. Derive expectations from the request, supplied examples, and human-authored or human-reviewed specifications rather than reverse-engineering them from the implementation. State assumptions and missing criteria; an agent-written test agreeing with agent-written code is not independent confirmation of intent. Gherkin is useful when behavioral specification warrants it, but is not mandatory for every change.
2. **Behavior:** Inspect and run the relevant existing scenarios through real owned components using the selected stack's commands. Confirm that assertions reach the changed behavior and check meaningful outcomes. For UI or operational changes, include available browser/runtime checks or product walkthrough evidence. Distinguish observed results from steps merely proposed for a human to perform. Record unavailable environments and missing integration evidence.
3. **Test strength:** Inspect assertions for incorrect outcomes they would miss. Use focused production-code mutation testing when warranted by important business rules, complex decisions, a regression, or uncertain assertions and supported by available tooling. For an existing Gherkin execution pipeline, consider acceptance mutation to check that scenario values reach the application and assertions. Load [mutation testing](mutation-testing.md) only when executing or interpreting those checks; coverage alone does not establish assertion quality.
4. **Structure:** Inspect module boundaries, dependency direction/cycles, duplication, and concentrated complexity in the changed code and affected consumers. Use existing architecture checks and available complexity, coverage, CRAP, or duplication reports to investigate concrete risks. CRAP combines complexity with coverage; neither it nor any score alone proves a defect or correctness. Use repository-defined thresholds, or report measurements and limitations without inventing universal numeric gates. Keep focused code inspection for security boundaries, compatibility, concurrency, and other contracts the executed checks do not establish.
5. **Gaps:** Separate confirmed defects, unmet requirements, unverified behavior, and environment/tool limitations. Record which scenarios and checks ran against which target and configuration. A missing optional tool is a limitation, not automatically a code defect; a missing required check remains a readiness gap. Revalidate affected evidence after fixes or target changes, without repeating unrelated checks unnecessarily.

## Findings and readiness

State each finding's trigger, caller impact, exact file/line, evidence, and proportionate correction. Report a defect once, cross-referencing it if both axes apply. Keep unproven hypotheses under open questions, with evidence needed to resolve them. Empty axes may have no findings. A smell is a prompt to investigate, not a quota: report demonstrated maintenance cost rather than a pattern name alone.

For systemic structural problems, propose the scoped [architecture audit](architecture-audit.md); do not expand an ordinary review into a redesign automatically.

Use the repository's severity scheme; otherwise P0 critical unconditional failure, P1 serious/common-path defect, P2 material narrower-trigger defect, P3 concrete low-impact issue. Rank within each axis. Verify baseline failures before calling them pre-existing; separate environment limitations from code defects. Keep unrelated baseline defects outside a diff review's findings; a full-project audit may include them within scope. Read-only checks may run during review; changes and remote comments require task authorization.

Keep self-review distinct from independent review and human sign-off. Present acceptance behavior, architectural consequences, and unresolved gaps clearly enough for the responsible human to assess. An agent's readiness assessment is not human approval or authorization to merge or deploy.

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
Acceptance criteria/scenarios and evidence for each; unverified criteria.
Mutation and structural checks when warranted: scope, results, survivors/exclusions,
project thresholds, and unavailable tooling. Omit irrelevant optional checks.
## Open questions
Only unresolved matters and how to resolve them; omit when empty.
## Status
Readiness, material gaps, and next action.
```

## Background

This procedure adapts verification ideas from Robert C. Martin's [September 2026 interview](https://www.aviator.co/podcast/uncle-bob-martin-ai-clean-code) and his [Acceptance Pipeline Specification](https://github.com/unclebob/Acceptance-Pipeline-Specification). Use the project's own tools and thresholds; these references do not require adopting his orchestration, installations, or personal thresholds.
