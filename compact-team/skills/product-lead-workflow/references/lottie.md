# Lottie asset authoring and optimization

Use for inspection, creation, editing, retiming, export, and optimization of Lottie JSON/dotLottie. Use an existing approved brief; missing motion decisions use [motion design](motion-design.md).

Discover LottieFiles Creator MCP capabilities and schemas for inspection, creation, edits, preview, and export. Do not assume a server offers every capability. Verify project access, authentication, external upload implications, and export destination before remote work. Use supported operations and retain returned project/asset IDs. For asynchronous jobs inspect actual status before reporting completion. If unavailable, local inspection, simple known-supported JSON edits, or a storyboard/spec can proceed; complex generation or runtime preview may remain blocked. Never fabricate IDs, exports, or playable assets.

Inspect JSON version, frame rate, in/out frames, dimensions, layers, precompositions/assets, fonts, images, markers, expressions, and dependencies. Inspect dotLottie as an archive with its version's manifest/specification, not as plain JSON or a universally fixed archive layout. Identify missing assets, clipping risks, unsupported effects, and external dependencies before editing.

Choose the smallest viable path: revise an existing asset, use verified generation tools, or author simple JSON with known-supported properties. Give tools a concrete brief with tokens, dimensions, elements, timing/key beats, loop/background, and player constraints. Remote processing of private assets must be within user authorization; never expose credentials.

For ordinary timelines duration is `(op - ip) / fr`; verify segment/player boundary behavior rather than treating `op` as a guaranteed displayed final frame. Retiming requires updating the affected timeline, not changing `fr` alone. Preserve parenting, layer references, precomposition links, shape structure, and animated/static property representations.

Use expressions, masks, fonts, markers, interactive features, and state machines only after checking format/player/version support. Define app-controlled playback when advanced features are unavailable. Export through actual supported tooling; renaming `.json` to `.lottie` does not create an archive. Preserve editable source references and dependency/license information.

Optimize observed costs: remove unused assets/layers, redundant keyframes, or unnecessary geometry only while preserving appearance and behavior. Recheck loop seams and timing after simplification. Compare JSON/dotLottie by supported playback and measured transfer/rendering behavior; compression alone does not establish faster rendering. Do not invent universal layer budgets, frame rates, or GPU guarantees.

Validate an edited/exported asset using [Lottie validation](lottie-validation.md). Asset ownership, rights, and app integration contracts must be retained; do not implement production UI or publish private artwork implicitly.
