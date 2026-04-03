---
name: "Polish GradCAM Panel Placement"
description: "Refine placement and visual polish of the main-dashboard GradCAM blended-overlay panel or Generate Heatmap button to match existing dashboard style"
argument-hint: "Optional: preferred section, compact vs prominent, panel or button-first"
agent: "agent"
---
Polish one focused area: the placement, composition, and visual finish of the GradCAM experience on the main dashboard after the heatmap feature exists.

Use these workspace references as context:
- Dashboard layout: [MainDashboardPage](../../app/dashboard/src/pages/MainDashboardPage.tsx)
- Existing panel style: [MagicBentoPanel](../../app/dashboard/src/components/MagicBentoPanel.tsx)
- Existing dashboard components: [ClinicalDashboard](../../app/dashboard/src/components/ClinicalDashboard.tsx)
- Upload interaction: [ImageUpload](../../app/dashboard/src/components/ImageUpload.tsx)
- App-level styling: [App.css](../../app/dashboard/src/App.css)
- Global styling: [index.css](../../app/dashboard/src/index.css)

Constraints:
1. Scope
- Main dashboard only.
- Do not add triage-mode UI changes.

2. Visual direction
- Keep consistency with established dashboard and Magic Bento styling.
- Avoid introducing a conflicting design language.
- Make spacing, hierarchy, and alignment feel intentional on desktop and mobile.

3. Interaction model
- Prefer auto-update on upload if the UI remains clear.
- If auto-update causes clutter, present a clean primary "Generate Heatmap" button and reveal the latest blended overlay elegantly.
- Show only the blended overlay view (no separate original/heatmap panes).

4. UX states
- Keep or improve loading, empty, and error states.
- Ensure state transitions feel smooth and understandable.

5. Quality and architecture
- Keep edits minimal and localized.
- Preserve existing naming and component patterns.
- Add concise comments only where logic is non-obvious.

Output format:
1. Placement decision and rationale
2. Files changed and why
3. UX improvements applied
4. Responsive behavior notes
5. Validation run and results
