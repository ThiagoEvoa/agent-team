# Motion and Lottie assets

## Establish intent, sources, and capabilities

Own motion planning, Lottie/dotLottie assets, playback specifications, optimization, and review. Coordinate broader journey/state design through the bundled [UX reference](ux-design.md); provide app integration contracts rather than implementing production UI by default. This reference contains the required motion baseline; no separately installed motion skill or specialist agent is needed.

Read the brief, existing assets, brand tokens, target component/player, and repository rules. Establish purpose/state, emotional tone, dimensions/background/theme, platform/player version/renderer, requested format, duration/loop policy, triggers/interruption, size/performance budget, accessibility, and artwork rights. Clarify only blocking gaps; label proposed defaults for reversible details. Preserve original sources and write scoped revisions.

Discover LottieFiles Creator MCP capabilities and schemas for inspection, creation, edits, preview, and export. Do not assume a server offers every capability. Verify project access, authentication, external upload implications, and export destination before remote work. Use supported operations and retain returned project/asset IDs. For asynchronous jobs inspect actual status before reporting completion. If unavailable, local inspection, simple known-supported JSON edits, or a storyboard/spec can proceed; complex generation or runtime preview may remain blocked. Never fabricate IDs, exports, or playable assets.

Inspect JSON version, frame rate, in/out frames, dimensions, layers, precompositions/assets, fonts, images, markers, expressions, and dependencies. Inspect dotLottie as an archive with its version's manifest/specification, not as plain JSON or a universally fixed archive layout. Identify missing assets, clipping risks, unsupported effects, and external dependencies before editing.

## Brief and motion craft

Define initial state → action/key beats → settled state, primary attention target, minimal animated properties, timing/easing, loop/segment policy, interruption/completion, reduced-motion/static behavior, and player constraints. Make functional status understandable without motion or color alone.

Use these as starting heuristics, not fixed requirements: brief micro-feedback around 80–120 ms, buttons/toggles 120–180 ms, icons 150–250 ms, cards 200–350 ms, dialogs 300–400 ms, page transitions 400–600 ms. Tune to context and repeated use. Entrances often ease out, exits ease in, and on-screen transitions ease in/out. Continuous rotation may be linear; loops need intentional endpoint pose and velocity. Keep stagger from delaying access to content.

Use restrained anticipation, arcs, follow-through, or overshoot only when they reinforce meaning and brand. Corporate/premium motion usually benefits from restraint; pronounced bounce needs a fitting context. Secondary/ambient layers are optional. Reduced motion should remove unnecessary spatial movement and looping; use an informative static state or restrained opacity transition when suitable.

## Create, edit, and optimize

Choose the smallest viable path: revise an existing asset, use verified generation tools, or author simple JSON with known-supported properties. Give tools a concrete brief with tokens, dimensions, elements, timing/key beats, loop/background, and player constraints. Remote processing of private assets must be within user authorization; never expose credentials.

For ordinary timelines duration is `(op - ip) / fr`; verify segment/player boundary behavior rather than treating `op` as a guaranteed displayed final frame. Retiming requires updating the affected timeline, not changing `fr` alone. Preserve parenting, layer references, precomposition links, shape structure, and animated/static property representations.

Use expressions, masks, fonts, markers, interactive features, and state machines only after checking format/player/version support. Define app-controlled playback when advanced features are unavailable. Export through actual supported tooling; renaming `.json` to `.lottie` does not create an archive. Preserve editable source references and dependency/license information.

Optimize observed costs: remove unused assets/layers, redundant keyframes, or unnecessary geometry only while preserving appearance and behavior. Recheck loop seams and timing after simplification. Compare JSON/dotLottie by supported playback and measured transfer/rendering behavior; compression alone does not establish faster rendering. Do not invent universal layer budgets, frame rates, or GPU guarantees.

## Validate, review, and deliver

Report each validation dimension independently as passed, failed, or not run with evidence:

| Dimension | Checks |
|---|---|
| Structural | Parse JSON/archive, sensible dimensions/range/rate, resolved assets/fonts/precompositions, version-appropriate manifest/schema validation when available |
| Visual | Intended size/background, first/key/final frames, clipping/readability, hierarchy/easing, loop pose/velocity and repeated-viewing comfort |
| Target runtime | Actual player/version, load/failure, autoplay/loop, segments, pause/replay/speed/completion, interruption/disposal/background behavior as applicable |
| Accessibility | Reduced-motion/static fallback, non-motion status, decorative/informative semantics, controls for moving content when required, no hazardous flashing or unnecessary vestibular motion |
| Performance | Asset bytes/dependencies, layer/path/image costs, measured frame behavior on relevant devices where available |

Parsing is not visual validation; a creator preview is not target-player validation. Structural field checks are not specification certification. Where UI/runtime tools are missing, deliver a draft with explicit gaps and integration checks rather than claiming production readiness. Revise observed failures and rerun affected checks.

Deliver paths/formats, editable source, fallback asset or specified fallback behavior, ownership/license, dimensions/rate/range/duration, segments/markers, player/version/dependencies, trigger/loop/pause/completion/interruption behavior, accessibility semantics, measured budgets, and validation evidence/gaps. Include exact state transitions and lifecycle cleanup expectations for the engineer. Do not upload/publish assets, modify unrelated artwork, or mutate Git as an implicit final step.

Verify uncertain format/player behavior against [LottieFiles documentation](https://developers.lottiefiles.com/), [dotLottie specification](https://dotlottie.io/spec/), [lottie-web](https://github.com/airbnb/lottie-web), [Flutter Lottie](https://pub.dev/packages/lottie), and [W3C accessibility guidance](https://www.w3.org/WAI/standards-guidelines/wcag/) as relevant to the selected runtime/version.
