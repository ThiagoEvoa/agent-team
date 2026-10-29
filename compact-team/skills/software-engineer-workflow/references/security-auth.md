# Authentication and authorization contracts

Use for caller identity, session trust, resource ownership, tenant isolation, and privileged operations.

Identify callers, untrusted inputs, privileged components, sensitive outputs, and side effects. Establish where identity is actually verified and where resource ownership, tenant, and role authorization are enforced. Credential extraction, client-side checks, SDK configuration, CORS, and possession of an object ID do not establish authorization.

Enforce least privilege and deny unauthorized operations at the service/data boundary used by the caller. Check both reads and writes, including list/query access, bulk actions, indirect references, and background operations when affected. Preserve token/session expiry, revocation, cookie/CSRF protections, redirect rules, and rate/abuse controls according to the application's actual authentication mechanism. Do not invent a new authentication scheme to repair a narrow defect.

Exercise allowed and denied behavior through real owned components using [behavioral testing](testing.md). For Firebase client authorization, add [Firebase validation](firebase-validation.md).

Trace the caller → identity verification → resource authorization → protected effect path when reviewing access control. Exercise unauthenticated, wrong-owner/tenant, and wrong-role outcomes; a clean scanner does not establish these permissions. Use the [review procedure](review.md) for finding quality and readiness.
