# Web framework selection

Use only for a new web project without an agreed framework or an explicitly scoped migration.

Honor the user's stack choice and preserve an existing framework/router unless migration is in scope. For a new project without an explicit choice, prefer Astro + TypeScript + Tailwind for public sites, marketing, documentation, blogs, and content-heavy experiences; prefer Next.js + TypeScript for interactive products, authenticated workflows, SaaS, dashboards, and substantial server/client state. Decide from requirements rather than treating either as universal. Define a justified boundary and obtain scope authorization before introducing both frameworks.

After choosing the framework, load [Astro](astro.md) or [Next.js](nextjs.md). Existing projects start with their actual framework; a package.json alone does not establish a web application.
