# UX/UI design and information architecture

## Establish context and tooling

Identify users and jobs, desired outcomes, target platforms, brand/design system, accessibility/localization requirements, and constraints such as authentication, offline operation, or device size. Read existing product/spec context before asking questions. Clarify blocking choices; label reversible proposed defaults and continue independent work.

Discover actual Figma, Google Stitch, or Penpot tools and inspect schemas before connected actions. Use Figma for source design context, components, variables/tokens, hierarchy, and visual inspection; Stitch for rapid concepts/variants when supported; Penpot when it is the relevant accessible source. Respect the user's requested tool. Missing tools do not justify fabricated files, node IDs, exports, or previews. Continue with available local assets, diagrams, screen/state specifications, and tokens; report what cannot be edited or visually checked. External creation/upload/publication must fall within the authorized scope.

## Structure and design

Map the core journey, information architecture, navigation, and recovery paths before polishing screens. Keep labels/domain concepts consistent with the spec. Identify primary actions and success feedback; design relevant empty/loading/error/success, permission/denied, offline, and interrupted states. Consider back navigation, destructive actions, validation, and resumability where they affect the journey.

For mobile, account for touch targets and spacing, one-handed reach, keyboard occlusion, safe areas, screen-reader order, intermittent connectivity, and interrupted sessions. Use Material guidance for compatible Android/cross-platform systems and respect established iOS/platform and brand conventions. For a web target, add responsive layout, pointer/keyboard interaction, focus/navigation, and browser behavior rather than mechanically copying mobile patterns.

Reuse the existing token system for typography, spacing, color semantics, shape, and motion. Define component variants and default, focused, pressed, disabled, loading, and feedback states as applicable. Keep content concise and actionable; support longer localized strings and directional layouts where required. Prefer established accessible platform controls over custom interaction machinery.

Compare alternatives for consequential navigation or interaction decisions using task completion, consistency, accessibility, error prevention/recovery, and implementation constraints. Record the chosen behavior and rationale; avoid producing multiple polished directions when a narrow fix is requested.

## Review and handoff

Review requirement coverage separately from design quality. Walk the primary and failure journeys: can users understand status, predict navigation, complete tasks, recover, and retain control? Check hierarchy, consistency, readability, contrast, focus visibility/order, target ergonomics, non-color feedback, labels, input errors, text scaling, and reduced motion. Verify applicable numeric accessibility/platform requirements against current authoritative guidance before claiming compliance. An annotated design is not a tested accessible implementation.

Deliver the artifacts the task needs, rather than a mandatory full package:
- UX brief: problem, users/outcomes, scope, constraints, decisions.
- Flow/state map: entry/exit conditions, navigation, permissions, recovery.
- UI specification: screens/components, variants, token mapping, responsive rules, content.
- Accessibility and acceptance checks with remaining validation gaps.
- Source/artifact links or local paths, revisions, and engineering integration notes.

For motion, use [Lottie guidance](lottie.md) when an animation asset or playback contract is part of the deliverable. Keep UI state behavior and animation triggers/fallbacks consistent. Production application implementation remains an engineering concern; deliver decisions/contracts that can be implemented without guessing.

Consult relevant current sources when necessary: [Material](https://m3.material.io/), [Android design](https://developer.android.com/design), [Apple design](https://developer.apple.com/design/human-interface-guidelines/), [W3C accessibility](https://www.w3.org/WAI/standards-guidelines/wcag/), and [usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). Treat tool/provider features as runtime discoveries rather than fixed guarantees.
