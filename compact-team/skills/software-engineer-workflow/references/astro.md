# Astro application contracts

Use for Astro pages, islands, content, and rendering behavior. Apply [shared web contracts](web.md) when relevant.

- Prefer static/server-rendered HTML and add hydrated islands only where interaction requires them. Choose hydration directives deliberately and keep browser-only code out of build/server paths.
- Use content collections/layers for structured content when appropriate; verify APIs and rendering mode for the project's version and adapter.
- Preserve metadata, canonical URLs, sitemap/robots behavior, optimized images, links, and assets. Test island behavior and hydration when affected.

Discover supported `astro-docs` capabilities and inspect schemas for uncertain version-specific behavior. Use repository-local and [official Astro documentation](https://docs.astro.build/) when unavailable; never invent tool output or silently configure a server. Use [web validation](web-validation.md) when checking the result.
