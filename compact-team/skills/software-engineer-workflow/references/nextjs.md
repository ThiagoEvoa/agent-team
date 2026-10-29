# Next.js application contracts

Use for Next.js routing, server/client boundaries, cache behavior, and mutations. Apply [shared web contracts](web.md) when relevant.

- For new work, prefer App Router and Server Components; preserve an existing Pages Router unless migration is requested. Place `use client` at the smallest boundary needing browser state/APIs.
- Make data fetching, mutations, caching/revalidation, authentication, and authorization boundaries explicit. Verify version-specific behavior rather than assuming defaults. Avoid duplicate fetches, unnecessary client JavaScript, and server secrets crossing into browser code.
- Cover affected loading/error/not-found states, metadata, redirects, route handlers, and auth boundaries. Test stale-data and post-mutation behavior where cache contracts change.

Discover supported `next-devtools` capabilities and inspect schemas for uncertain version-specific behavior. Use repository-local and [official Next.js documentation](https://nextjs.org/docs) when unavailable; never invent tool output or silently configure a server. Use [web validation](web-validation.md) when checking the result.
