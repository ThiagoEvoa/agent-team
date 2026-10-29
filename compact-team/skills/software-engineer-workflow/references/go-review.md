# Go review contracts

Use with the [review procedure](review.md) for a Go review; these are contract prompts, not a quota for findings.

Use the shared [review procedure](review.md) for separate Standards and Spec passes against a pinned target. Check package/error contracts, cancellation, goroutine leaks, synchronization, HTTP limits/auth, database semantics, module/toolchain compatibility, and behavioral tests. Verify acceptance criteria for statuses/payloads, authorization, persistence effects, and compatibility; mark absent criteria unknown. Ground findings in exact locations and failure paths, verify compiler claims, and distinguish self-review from independent review.
