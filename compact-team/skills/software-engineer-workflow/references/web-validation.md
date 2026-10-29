# Web build and browser validation

Use when reproducing or verifying a web change, including production-preview and accessibility checks.

Use the shared [diagnosis loop](diagnosis.md) with a focused component/browser/route test, asserted request, or production build/preview reproduction. Inspect framework diagnostics and browser/server logs before speculative fixes. Retain a behavioral regression check; do not treat disappearance during hot reload as proof that production behavior is fixed.

Inspect scripts before running package-manager-native formatter, typecheck, lint, relevant tests, and production build checks. Do not assume every project has scripts named `typecheck`, `lint`, or `test`. Run focused checks while editing, then required broader checks once the change is ready. Verify production preview/smoke behavior where available, affected routes and assets, console errors, narrow/wide viewports, keyboard access, and relevant loading/failure states. Public sites need link/metadata checks; products need server/client, auth, cache, and error-boundary checks. Report unavailable browser/build checks explicitly.

Use the shared [review procedure](review.md) for separate Standards and Spec passes. Include accessibility, security, responsive behavior, hydration/bundle cost, performance, and SEO where relevant; ground findings in the changed behavior and requirements. Perform the review within this agent, without depending on a separate reviewer persona.
