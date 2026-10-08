---
name: lottie-workflow
description: Workflow and procedural guidance for the Lottie Agent to plan, create, edit, optimize, and validate Lottie JSON and dotLottie animations using available LottieFiles Creator MCP tools, motion design principles, accessibility checks, and implementation-ready handoffs.
---

# Lottie Workflow Skill

Use this skill for Lottie asset creation, edits, motion review, optimization, and playback specifications. Application implementation remains with the platform developer.

## Objectives
1. **Purposeful motion:** Translate functional intent and brand emotion into deliberate timing, easing, and choreography.
2. **Verified tooling:** Use available LottieFiles Creator MCP capabilities without inventing tool names or export support.
3. **Portable assets:** Deliver self-contained assets compatible with the actual target player and version.
4. **Accessible playback:** Define reduced-motion, static fallback, pause, and state behavior.
5. **Evidence-backed delivery:** Separate structural, visual, runtime, and performance validation.

## 🛑 Core Rules
- Read repository instructions and acceptance criteria before editing.
- Clarify blocking inputs: intended state/action, destination platform/player, required format, and brand constraints. Label proposed defaults for non-blocking details.
- Design intent first; implementation properties second.
- Use the fewest animated properties and layers needed. Secondary/ambient motion is optional, not mandatory for every interaction.
- Treat timing tables, overshoot, and 1/3 rules as design heuristics, not hard renderer limits or accessibility standards.
- Verify player/version support for any advanced feature. Valid JSON does not prove a Lottie asset is playable.
- Preserve source assets. Write revisions to agreed paths; avoid unrelated changes.
- Confirm authorization before external upload/publication of private artwork or assets. Do not expose credentials in prompts, files, or reports.
- Never claim preview, export, compatibility, performance, or accessibility checks passed unless actually performed.
- Do not install tooling, modify MCP configuration, commit, push, or create branches unless requested or approved.

## Trusted Reference Baseline
- Motion design skill: https://github.com/LottieFiles/motion-design-skill
- LottieFiles documentation: https://developers.lottiefiles.com/
- dotLottie specification: https://dotlottie.io/spec/
- lottie-web renderer: https://github.com/airbnb/lottie-web
- Flutter Lottie player: https://pub.dev/packages/lottie
- WCAG guidance: https://www.w3.org/WAI/standards-guidelines/wcag/

Motion baseline below synthesizes principles from LottieFiles' MIT-licensed motion-design skill; it does not vendor that skill. Consult official documentation for the selected player/version and uncertain or changing capabilities.

## Workflow

### 0. Tool Availability Gate
1. Discover LottieFiles Creator MCP tools. Server names may vary; `lottiefiles-creator` / `mcp__lottiefiles_creator` are discovery hints, not tool APIs.
2. Read exposed tool descriptions and argument schemas. Record actual support for creation, inspection, editing, preview, and export; do not assume all are supported.
3. Check authentication, project access, upload implications, and export destinations before remote actions.
4. Choose execution path:
   - **MCP available:** Use verified capabilities; keep returned asset/project IDs for subsequent edits.
   - **MCP partially available:** Use supported operations and local files for remaining steps. Report gaps.
   - **MCP unavailable:** Inspect supplied assets with existing local tooling. Small, well-understood JSON edits or motion specifications can proceed; do not promise complex generation or previews without tooling.
5. If blocked, request source files, access, or permission for an alternative. Never simulate successful tool output.

### 1. Discovery & Asset Inspection
1. Read brief, existing assets, design tokens, and consuming component when available.
2. Confirm:
   - purpose/state: loading, success, error, onboarding, illustration, or decorative loop;
   - emotional target and brand personality;
   - viewport, background, theme variants, and scaling behavior;
   - target platform, player/package version, and renderer;
   - output: Lottie `.json`, dotLottie `.lottie`, source/project link, preview, or specification;
   - duration, loop/autoplay policy, triggers, transitions, and interruption behavior;
   - file-size/performance budget and accessibility requirements;
   - artwork ownership and permission for external processing.
3. For JSON, inspect version (`v`), frame rate (`fr`), in/out points (`ip`, `op`), dimensions (`w`, `h`), layers, assets, fonts, and markers when present.
4. For dotLottie, inspect archive entries and manifest using tools compatible with its specification version. Do not treat the archive as plain JSON or assume a fixed manifest layout across versions.
5. Record missing dependencies, external image/font references, expression usage, clipping risks, and unsupported features.

### 2. Motion Brief & Storyboard
Create a brief before generation:

| Decision | Required outcome |
|---|---|
| Purpose | What motion communicates and why it is needed |
| Emotion/personality | Playful, Premium, Corporate, or Energetic; match existing brand |
| Narrative | Initial state → action → settled/final state |
| Primary element | Hero and attention hierarchy |
| Properties | Minimum position/scale/rotation/opacity/color changes |
| Timing | Duration, easing, key beats, stagger budget |
| Playback | Start, stop, loop, completion, interruption, and state triggers |
| Accessibility | Reduced-motion/static alternative and non-motion status |
| Compatibility | Target format, player/version, and feature constraints |

**Timing starting points:**
- Micro-feedback: 80–120ms; button/toggle: 120–180ms.
- Icons: 150–250ms; cards: 200–350ms; dialogs: 300–400ms.
- Page transitions: 400–600ms; decorative reveals can be longer when justified.
- Entrances generally ease-out; exits ease-in; on-screen transitions ease-in-out.
- Continuous rotation can be linear; ambient oscillation benefits from smooth, seamless easing.
- Exits generally shorter than entrances. Keep repeated feedback responsive.
- Stagger should reinforce hierarchy, not delay access to content; use <500ms as an initial budget, then validate context.

**Motion craft:**
- Use anticipation, follow-through, arcs, or restrained overshoot where they support meaning.
- Keep Corporate/Premium restrained; reserve pronounced bounce for appropriate Playful/Energetic work.
- Use secondary/ambient layers only when useful; avoid distracting always-on motion in task-focused UI.
- For reduced motion, remove spatial movement and loops; static state or simple opacity change is acceptable.

If installed, consult `motion-design` references selectively: personality/timing for simple interactions; choreography/narrative for scenes; context adaptation for accessibility/performance. Accessibility and target-player constraints override decorative prescriptions.

### 3. Creation or Editing
1. Choose smallest viable path: edit existing asset, generate with verified MCP tools, or author simple JSON with known-supported features.
2. Supply creation tools with concrete brief: dimensions, colors/tokens, named elements, key beats, timings, looping, background, and target constraints.
3. Preserve returned editable source/project references when available; check task status using exposed capabilities if generation is asynchronous.
4. Map seconds to timeline frames using the asset's `fr`. For a typical timeline, duration = `(op - ip) / fr`; confirm player behavior and segment boundaries rather than assuming `op` is a displayed final frame.
5. When editing JSON, preserve layer references, parenting, assets, shape structure, and animated/static property representations. Do not change `fr` alone to retime motion.
6. Make loop seams intentional: compare endpoint poses, opacity, and velocity; verify segment boundaries in playback.
7. Use markers/segments/state machines only if supported by the selected format, player, and version. Otherwise define application-controlled playback explicitly.
8. Avoid unverified expressions, effects, or font behavior. Replace unsupported features with simpler geometry/precomposition only after confirming visual fidelity and authoring support.
9. Export only through supported tooling. Renaming `.json` to `.lottie` does not create a dotLottie archive.

### 4. Validation & Revision Loop
Run separate checks; report each as passed, failed, or not run with reason.

**Structural**
- JSON parses; expected animation fields exist with sensible dimensions, frame rate, and frame range.
- Referenced assets/precompositions resolve; required images/fonts are available.
- dotLottie archive and manifest conform to the selected specification version; animation references resolve.
- Use a schema/spec validator when available. Basic field checks alone are not specification certification.

**Visual**
- Preview at intended size/background and representative mobile/desktop sizes.
- Check first frame, key beats, final state, clipping, readability, easing, and loop seam.
- Verify motion hierarchy, brand consistency, and repeated-viewing comfort.

**Target runtime**
- Play in the actual target player/version, not only the creation-tool preview.
- Check loading, autoplay/loop, pause/resume, replay, speed, completion, segments, and state switching as applicable.
- Exercise interruption, unmount/disposal, background/offscreen behavior, and failed asset loading with the platform developer.
- Capture unsupported-feature warnings and visual differences across required renderers/platforms.

**Accessibility & performance**
- Verify reduced-motion/static fallback, non-motion status text, and decorative vs informative semantics in the consuming UI.
- No essential meaning conveyed only through motion or color; avoid hazardous flashing and large vestibular-triggering movement.
- Provide pause/stop/hide controls for automatically moving content when required by WCAG; avoid unnecessary autoplay loops.
- Record asset bytes, dependency count, layer/path complexity, and measured runtime frame behavior on representative devices when tooling permits.
- File compression reduces transfer size, not necessarily rendering cost. Minimize unnecessary paths, layers, masks, and images; measure rather than claiming universal element budgets or GPU acceleration.

Fix observed failures, re-export, then rerun affected checks. If preview/runtime tools are unavailable, deliver a draft with explicit validation gaps—not a production-ready claim.

### 5. Optimization & Delivery
1. Remove unused assets/layers and redundant keyframes only when semantics and appearance remain intact.
2. Simplify expensive geometry and repeated decoration; compare before/after in the target player.
3. Compare Lottie JSON and dotLottie only where target support is confirmed. Choose from measured size and playback behavior, not extension preference.
4. Deliver stable asset paths plus editable source references and a static fallback when required.
5. Record source/license attribution, dependencies, required format/player versions, duration, dimensions, markers/segments, and playback settings.
6. Handoff app integration to `flutter-senior-developer` or `web-senior-developer`. Include trigger logic, fallback behavior, lifecycle cleanup, and accessibility checks. Route broader UI decisions to `ui-ux-designer`; Flutter runtime testing to `flutter-qa-specialist`.
7. Inspect diff/status and report only completed work. Do not publish assets or mutate git state as an implicit final step.

## Delivery Quality Gate
- [ ] Purpose, personality, and state behavior match requirements.
- [ ] Requested format exported and dependencies resolved.
- [ ] Structural validation completed; visual and runtime checks evidenced or explicitly not run.
- [ ] Target player/version and feature constraints documented.
- [ ] Loop seams, final states, and interruption behavior checked where relevant.
- [ ] Reduced-motion/static alternative and integration semantics specified.
- [ ] Performance budget met by measurement, or remaining risk stated.
- [ ] Source ownership, license, and external publication status recorded.
- [ ] Developer can integrate without guessing playback behavior.

## Handoff Report Template
```text
Purpose: <interaction/state, emotional target, personality>
Assets: <paths, formats, source/project references, fallback>
Timeline: <dimensions, fr, ip/op, duration, markers/segments>
Playback: <trigger, autoplay, loop, speed, completion, interruption>
Compatibility: <platform, player/version, dependencies, constraints>
Accessibility: <reduced-motion alternative, static/status behavior, controls>
Validation: <structural/visual/runtime/performance results + evidence>
Not run: <checks and reasons>
Decisions: <timing/easing/choreography rationale and tradeoffs>
Rights: <source/license, upload/publication authorization/status>
Next: <integration owner and remaining risks>
```
