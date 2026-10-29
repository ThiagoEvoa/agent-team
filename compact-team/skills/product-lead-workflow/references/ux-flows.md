# User journeys and interaction flows

Use for navigation, information architecture, task paths, state transitions, and recovery behavior.

Identify users and jobs, desired outcomes, target platforms, brand/design system, accessibility/localization requirements, and constraints such as authentication, offline operation, or device size. Read existing product/spec context before asking questions. Clarify blocking choices; label reversible proposed defaults and continue independent work.

Map the core journey, information architecture, navigation, and recovery paths before polishing screens. Keep labels/domain concepts consistent with the spec. Identify primary actions and success feedback; design relevant empty/loading/error/success, permission/denied, offline, and interrupted states. Consider back navigation, destructive actions, validation, and resumability where they affect the journey.

Compare alternatives for consequential navigation or interaction decisions using task completion, consistency, accessibility, error prevention/recovery, and implementation constraints. Record the chosen behavior and rationale; avoid producing multiple polished directions when a narrow fix is requested.

Review requirement coverage separately from journey quality. Walk primary and failure paths for status, predictable navigation, completion, recovery, and user control. Deliver a concise UX brief and flow/state map with entry/exit conditions, permissions, source revisions, decisions, and open questions.

For visual components use [UI systems](ui-system.md); for accessibility evaluation use [accessibility](accessibility.md). For motion intent use [motion design](motion-design.md). App implementation remains an engineering concern.

Consult relevant current sources when necessary: [Material](https://m3.material.io/), [Android design](https://developer.android.com/design), [Apple design](https://developer.apple.com/design/human-interface-guidelines/), [W3C accessibility](https://www.w3.org/WAI/standards-guidelines/wcag/), and [usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). Treat tool/provider features as runtime discoveries rather than fixed guarantees.
