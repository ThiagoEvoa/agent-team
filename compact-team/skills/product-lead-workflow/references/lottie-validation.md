# Lottie validation and integration handoff

Use for an asset review, target-player acceptance, performance/accessibility checks, and evidence-backed handoff. Authoring instructions remain in [Lottie editing](lottie.md).

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
