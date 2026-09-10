---
name: web-senior-workflow
description: Workflow and procedural guidance for Astro and Next.js web implementation, validation, and GitHub delivery.
---

# Senior Web Developer Workflow

Use this skill for web projects. Select one stack from product shape; do not default to one framework for every request.

## 1. Classify and ingest
- Read active issue/spec and acceptance criteria through GitHub MCP or `gh issue view`.
- Inspect repository tree, `package.json`, lockfile, framework config, TypeScript config, Tailwind config, scripts, CI, and existing tests.
- Determine package manager from lockfile; use it consistently.
- Choose:
  - **Astro + TypeScript + Tailwind** for normal public-facing sites, marketing pages, documentation, blogs, and content-heavy experiences.
  - **Next.js + TypeScript** for interactive products, SaaS, authenticated workflows, dashboards, and substantial client/server state.
- If requirements span both, define boundary first. Do not introduce two frameworks without explicit approval.

## 2. MCP-first framework research
Use MCP tools, not memory, for version-sensitive framework questions.

### Astro
- Discover/connect `astro-docs` MCP if needed.
- Use it for Astro routing, islands, content collections/layers, integrations, images, rendering modes, configuration, and deployment behavior.
- Confirm API/version before implementation; capture relevant guidance in implementation notes.

### Next.js
- Discover/connect `next-devtools` MCP if needed.
- Use it for App Router behavior, Server/Client Components, route handlers, caching/revalidation, metadata, diagnostics, and build/runtime issues.
- Confirm API/version before implementation; inspect project diagnostics before speculative fixes.

If requested MCP server is unavailable: state that constraint, use repository-local docs and official documentation, and mark verification risk. Never invent tool output.

## 3. Design and implementation
1. Define acceptance checks and affected routes/components.
2. Identify highest-level seam:
   - Astro: page/layout/content collection/island boundary.
   - Next.js: route segment/server function/client component/data boundary.
3. Define states: loading, empty, error, success, unavailable, responsive, and permission/auth states when relevant.
4. Write behavior tests or acceptance checks before implementation where practical.
5. Implement smallest complete change using existing conventions.
6. Keep TypeScript types close to domain boundaries; validate external input at runtime.
7. Keep secrets server-side and environment variables explicit.

## 4. Stack standards

### Astro + TypeScript + Tailwind
- Server-render by default; add islands only for required interactivity.
- Use semantic HTML and accessible native controls.
- Use content collections/layers for structured content instead of ad hoc parsing.
- Use stable metadata, canonical URLs, sitemap/robots behavior, optimized images, and valid internal links.
- Test hydrated islands independently where behavior warrants it.

### Next.js + TypeScript
- App Router and Server Components by default unless browser state/API requires client code.
- Place `use client` at smallest possible boundary.
- Make cache and revalidation intent explicit; test mutation and stale-data behavior.
- Cover `loading`, `error`, `not-found`, metadata, redirects, route handlers, and auth boundaries where applicable.
- Avoid duplicate data fetches, accidental client secrets, and unnecessary JavaScript.

## 5. Verification loop
Run focused checks after each seam change, then full checks:

```sh
# Use project package manager; examples only
npm run typecheck
npm run lint
npm test
npm run build
```

Also run:
- formatter check;
- relevant component/browser tests;
- production preview/smoke checks when available;
- responsive keyboard/accessibility checks;
- link, metadata, asset, and console-error checks for public sites;
- route, server/client, cache, and error-boundary checks for products.

Commands are project-specific. Inspect scripts first; do not claim a command passed if it was not run.

## 6. Review and delivery
- Inspect `git diff` and `git status`.
- Check scope against acceptance criteria; remove unrelated refactors.
- Check accessibility, performance, hydration/client bundle cost, SEO where relevant, security, and responsive behavior.
- Commit with conventional imperative subject; follow repository policy.
- Push branch and create PR using repository template when requested.
- Request `web-senior-reviewer` handoff when available.

## Handoff report template
```text
Framework: Astro + TypeScript + Tailwind | Next.js + TypeScript
Reason: <classification>
Changed: <files and key symbols>
Decisions: <important boundaries/tradeoffs>
Validation: <commands + pass/fail; skipped checks + reason>
Delivery: <branch/PR or not created>
Risks: <remaining risks>
Next: <reviewer or follow-up>
```
