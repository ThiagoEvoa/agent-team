# Shared web application contracts

Use for browser, TypeScript, accessibility, and server/client contracts common to the selected web framework.

Read acceptance criteria, `package.json`, the lockfile/package-manager declaration, framework and TypeScript configuration, styling tokens, scripts, CI, routes, and tests. Use the repository's package manager consistently. Inspect dependencies and entrypoints: a `package.json` may belong to tooling or Firebase Functions rather than a web application.

Use the shared [module design](design.md) for consequential boundaries. Identify the caller-visible seam: Astro page/layout/content collection/island, or Next.js route segment/server function/client component/data boundary. Define relevant loading, empty, error, success, unavailable, permission/auth, network-failure, and responsive states. Write behavioral tests where useful; for visual changes establish browser acceptance checks before implementation.

Keep TypeScript types near domain boundaries, preserve project strictness, and avoid unjustified `any` or unsafe casts. Validate external input at runtime; compile-time types are insufficient. Keep secrets and privileged operations server-side, and inspect public environment-variable exposure. Use semantic HTML, accessible native controls, labels, keyboard navigation, visible focus, responsive layouts, and reduced-motion support. Follow existing styling tokens and state/navigation conventions.

Add [Firebase](firebase.md) only for backend resources/contracts. Validation commands and browser evidence are in [web validation](web-validation.md).
