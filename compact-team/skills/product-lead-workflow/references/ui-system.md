# Visual and component systems

Use for screen/component specifications, design tokens, variants, responsive rules, and design-tool context.

Discover actual Figma, Google Stitch, or Penpot tools and inspect schemas before connected actions. Use Figma for source design context, components, variables/tokens, hierarchy, and visual inspection; Stitch for rapid concepts/variants when supported; Penpot when it is the relevant accessible source. Respect the user's requested tool. Missing tools do not justify fabricated files, node IDs, exports, or previews. Continue with available local assets, diagrams, screen/state specifications, and tokens; report what cannot be edited or visually checked. External creation/upload/publication must fall within the authorized scope.

For mobile, account for touch targets and spacing, one-handed reach, keyboard occlusion, safe areas, screen-reader order, intermittent connectivity, and interrupted sessions. Use Material guidance for compatible Android/cross-platform systems and respect established iOS/platform and brand conventions. For a web target, add responsive layout, pointer/keyboard interaction, focus/navigation, and browser behavior rather than mechanically copying mobile patterns.

Reuse the existing token system for typography, spacing, color semantics, shape, and motion. Define component variants and default, focused, pressed, disabled, loading, and feedback states as applicable. Keep content concise and actionable; support longer localized strings and directional layouts where required. Prefer established accessible platform controls over custom interaction machinery.

Review hierarchy, consistency, state visibility, content, and token fidelity against the agreed flow. Deliver screens/components, variants, token mappings, source/artifact revisions, responsive rules, and engineering notes. Load [accessibility](accessibility.md) when specifying or assessing its requirements; changes to navigation belong to [journey design](ux-flows.md).

Consult relevant current sources when necessary: [Material](https://m3.material.io/), [Android design](https://developer.android.com/design), [Apple design](https://developer.apple.com/design/human-interface-guidelines/), [W3C accessibility](https://www.w3.org/WAI/standards-guidelines/wcag/), and [usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). Treat tool/provider features as runtime discoveries rather than fixed guarantees.

When motion is part of the UI contract, keep screen states, animation triggers, and fallback behavior consistent using [motion design](motion-design.md). Production application implementation remains an engineering concern.
