# Rust review contracts

Use with the [review procedure](review.md) when reviewing Rust changes.

Use the shared [review procedure](review.md) for separate Standards and Spec passes. Inspect ownership/borrowing, errors/panics, unsafe/FFI soundness, Send/Sync assumptions, cancellation/blocking, races, cleanup, feature gates, MSRV/public API compatibility, security, and test seams. Trace actual failure paths; unsafe code alone is not a defect, and compiler claims require diagnostics. A clear code path may establish a defect even without a runnable test; label the evidence.
