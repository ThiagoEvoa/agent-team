# Web engineering: Astro and Next.js

## Choose and inspect the stack

Honor the user's stack choice and preserve an existing framework/router unless migration is in scope. For a new project without an explicit choice, prefer Astro + TypeScript + Tailwind for public sites, marketing, documentation, blogs, and content-heavy experiences; prefer Next.js + TypeScript for interactive products, authenticated workflows, SaaS, dashboards, and substantial server/client state. Decide from requirements rather than treating either as universal. Define a justified boundary and obtain scope authorization before introducing both frameworks.

Read acceptance criteria, `package.json`, the lockfile/package-manager declaration, framework and TypeScript configuration, styling tokens, scripts, CI, routes, and tests. Use the repository's package manager consistently. Inspect dependencies and entrypoints: a `package.json` may belong to tooling or Firebase Functions rather than a web application.

Discover available `astro-docs` or `next-devtools` MCP capabilities and inspect their schemas before using them for framework questions and diagnostics. Check version-sensitive APIs against the installed version, not memory. If unavailable, use repository-local and official documentation and report diagnostics/verification gaps. Missing MCP does not justify inventing results or silently installing/configuring a server. Official starting points: [Astro documentation](https://docs.astro.build/) and [Next.js documentation](https://nextjs.org/docs).

## Design and implementation

Use the shared [design/domain guidance](design.md) for consequential boundaries. Identify the caller-visible seam: Astro page/layout/content collection/island, or Next.js route segment/server function/client component/data boundary. Define relevant loading, empty, error, success, unavailable, permission/auth, network-failure, and responsive states. Write behavioral tests where useful; for visual changes establish browser acceptance checks before implementation.

Keep TypeScript types near domain boundaries, preserve project strictness, and avoid unjustified `any` or unsafe casts. Validate external input at runtime; compile-time types are insufficient. Keep secrets and privileged operations server-side, and inspect public environment-variable exposure. Use semantic HTML, accessible native controls, labels, keyboard navigation, visible focus, responsive layouts, and reduced-motion support. Follow existing styling tokens and state/navigation conventions.

For Astro:
- Prefer static/server-rendered HTML and add hydrated islands only where interaction requires them. Choose hydration directives deliberately and keep browser-only code out of build/server paths.
- Use content collections/layers for structured content when appropriate; verify APIs and rendering mode for the project's version and adapter.
- Preserve metadata, canonical URLs, sitemap/robots behavior, optimized images, links, and assets. Test island behavior and hydration when affected.

For Next.js:
- For new work, prefer App Router and Server Components; preserve an existing Pages Router unless migration is requested. Place `use client` at the smallest boundary needing browser state/APIs.
- Make data fetching, mutations, caching/revalidation, authentication, and authorization boundaries explicit. Verify version-specific behavior rather than assuming defaults. Avoid duplicate fetches, unnecessary client JavaScript, and server secrets crossing into browser code.
- Cover affected loading/error/not-found states, metadata, redirects, route handlers, and auth boundaries. Test stale-data and post-mutation behavior where cache contracts change.

## Diagnosis, validation, and review

Use the shared [diagnosis loop](diagnosis.md) with a focused component/browser/route test, asserted request, or production build/preview reproduction. Inspect framework diagnostics and browser/server logs before speculative fixes. Retain a behavioral regression check; do not treat disappearance during hot reload as proof that production behavior is fixed.

Inspect scripts before running package-manager-native formatter, typecheck, lint, relevant tests, and production build checks. Do not assume every project has scripts named `typecheck`, `lint`, or `test`. Run focused checks while editing, then required broader checks once the change is ready. Verify production preview/smoke behavior where available, affected routes and assets, console errors, narrow/wide viewports, keyboard access, and relevant loading/failure states. Public sites need link/metadata checks; products need server/client, auth, cache, and error-boundary checks. Report unavailable browser/build checks explicitly.

Use the shared [review procedure](review.md) for separate Standards and Spec passes. Include accessibility, security, responsive behavior, hydration/bundle cost, performance, and SEO where relevant; ground findings in the changed behavior and requirements. Perform the review within this agent, without depending on a separate reviewer persona.

Add [Firebase](firebase.md) for backend services/rules or authorization-contract changes; SDK-only UI integration stays in this profile. Add [DevOps](devops.md) for pipelines, hosting infrastructure, or artifact/runtime changes. Report framework/rationale, changed routes/files, boundary decisions, checks and outcomes, delivery status, and risks. Use the repository PR template when publication is authorized; do not publish or deploy automatically.
