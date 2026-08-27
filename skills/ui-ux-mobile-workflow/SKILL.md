---
name: ui-ux-mobile-workflow
description: Workflow and procedural guidance for the UI/UX Designer agent to design mobile app experiences using Figma MCP, Google Stitch MCP, Material Design, accessibility standards, and usability best practices.
---

# UI/UX Mobile Workflow Skill

Use this skill to guide a UI/UX agent in producing high-quality mobile design resources that are implementation-ready and aligned with modern best practices.

## Objectives
1. **Design with verifiable standards:** Base decisions on Material Design, accessibility standards, and established usability heuristics.
2. **Use Figma MCP and Google Stitch MCP:** Gather and transform design context and generate UI/UX alternatives with MCP tooling.
3. **Produce implementation-ready artifacts:** Generate clear outputs for developers (flows, component behavior, states, and interaction notes).
4. **Avoid assumption drift:** If product constraints are missing or ambiguous, stop and request clarification.

## Core Rules
- **Never guess:** Missing constraints (target users, business goals, platform scope, branding, localization, auth complexity, offline needs) must be clarified.
- **Mobile-first:** Prioritize one-handed reach, clear hierarchy, concise content, and low-friction task completion.
- **Systematic consistency:** Reuse design patterns and keep behavior consistent across screens and states.
- **Accessibility baseline:** Treat accessibility as a first-class requirement in all outputs.
- **Evidence-based rationale:** Every major decision must include a short rationale tied to standards or known principles.

## Trusted Reference Baseline
Use these references as the default quality baseline when designing:
- Material Design 3: https://m3.material.io/
- Android design guidance: https://developer.android.com/design
- Figma MCP overview and usage context: https://www.figma.com/blog/introducing-figma-mcp-server/
- Google Stitch: https://stitch.withgoogle.com/
- WCAG overview (W3C): https://www.w3.org/WAI/standards-guidelines/wcag/
- Nielsen Norman Group heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- ISO 9241-11 usability framework: https://www.iso.org/standard/63500.html

When facts are uncertain or likely to have changed, re-check official sources before finalizing outputs.

## Figma MCP Usage Guidance
When the task includes existing or new Figma resources, use Figma MCP to gather design context and convert it into actionable UI/UX resources.

Preferred Figma MCP context types:
1. **Code/context extraction:** Pull structured data for selected nodes and flows to understand hierarchy, components, and variables.
2. **Variable and token context:** Capture color, spacing, typography, and semantic token mappings to enforce consistency.
3. **Image/screenshot context:** Use visual context to validate intent, flow coherence, and edge-state behavior.

Use Figma MCP outputs to build:
- Screen inventories
- User flows and task paths
- Component/state matrices
- Interaction and feedback behavior specs
- Accessibility and usability checklists

## Google Stitch MCP Usage Guidance
Use Google Stitch MCP as an alternative path to generate UI concepts, screen variants, and exploration options when:
- the user asks for rapid concept generation,
- multiple visual directions are needed before system-level refinement,
- or initial structure is missing and fast ideation is required.

Guidance for Stitch MCP use:
1. Generate candidate mobile screens/flows from product intent and constraints.
2. Compare alternatives against Material Design, accessibility, and usability heuristics.
3. Select or merge the strongest direction and then normalize it into implementation-ready specs.
4. If both Figma MCP and Stitch MCP are available, prefer:
   - **Figma MCP** for deep inspection, design-system alignment, and component/token fidelity.
   - **Stitch MCP** for accelerated ideation and alternative generation.

## Workflow

### 1. Discovery & Clarification
1. Identify objective, scope, and platform targets (Android, iOS, or both).
2. Confirm key constraints:
   - primary user personas and jobs-to-be-done
   - app goals and success metrics
   - brand constraints and tone
   - localization and accessibility requirements
   - technical constraints and existing design system usage
3. If any critical constraint is missing, request clarification before designing.

### 2. Context Collection
1. Collect current project context from repository docs/specs.
2. Collect UI context from Figma MCP and/or Google Stitch MCP (selected nodes, flows, components, tokens, generated alternatives).
3. Validate that context is complete enough to support design decisions; if not, ask for missing inputs.

### 3. UX Structure
1. Define core user journeys and primary task paths.
2. Map navigation model and information architecture for mobile.
3. Specify happy path, empty states, loading states, and error recovery paths.
4. Ensure flows follow usability heuristics (clarity, feedback, control, consistency, error prevention).

### 4. UI Systemization
1. Build or refine component usage patterns with Material Design alignment.
2. Define typographic scale, spacing rhythm, and color semantics.
3. Standardize interaction states:
   - default
   - focused
   - pressed
   - disabled
   - loading
   - success/warning/error feedback
4. Document behavior rules and edge cases for each key component.

### 5. Accessibility & Quality Gate
Run a design QA pass before final handoff:
1. Contrast and readability checks aligned with WCAG guidance.
2. Touch target and spacing checks for mobile ergonomics.
3. Focus/selection and state visibility checks.
4. Clear, actionable error and validation messaging checks.
5. Consistency checks across screens and navigation patterns.

### 6. Delivery Artifacts
Provide concise, implementation-ready outputs:
1. **UX Brief:** problem framing, users, goals, constraints.
2. **Flow Spec:** key journeys with state transitions.
3. **UI Spec:** components, variants, states, spacing/typography/color token usage.
4. **Accessibility Notes:** key requirements and risk points.
5. **Handoff Notes:** implementation priorities, open questions, and validation checklist.

## Decision Checklist (use before finalizing)
- Does each screen have one clear primary action?
- Are navigation and labels consistent and predictable?
- Are system statuses visible at every meaningful step?
- Are errors preventable and recoverable with clear guidance?
- Are accessibility requirements explicit and testable?
- Can developers implement without guessing behavior?

If any answer is "no", revise before handoff.
