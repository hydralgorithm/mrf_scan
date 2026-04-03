---
name: "Add GradCAM Heatmap Panel"
description: "Create a main-dashboard panel styled like existing Magic Bento panels that displays the latest GradCAM heatmap for each uploaded X-ray"
argument-hint: "Optional: panel title, backend endpoint, target page"
agent: "agent"
---
Build one feature: a new main-dashboard component that follows this workspace's existing panel style and shows a GradCAM heatmap for uploaded X-rays.

Use these workspace references as context:
- Dashboard entry and layout: [MainDashboardPage](../../app/dashboard/src/pages/MainDashboardPage.tsx)
- Existing panel language: [MagicBentoPanel](../../app/dashboard/src/components/MagicBentoPanel.tsx)
- Upload flow: [ImageUpload](../../app/dashboard/src/components/ImageUpload.tsx)
- Frontend API layer: [api service](../../app/dashboard/src/services/api.ts)
- Backend API: [FastAPI app](../../src/api/main.py)
- Explainability utilities: [gradcam module](../../src/explainability/gradcam.py)

Requirements:
1. UI and styling
- Match the current dashboard visual system used by existing main dashboard components and Magic Bento panels.
- Add a dedicated panel for heatmap preview with loading, empty, and error states.
- Display only the blended GradCAM overlay image (do not render separate original image or raw heatmap-only panel).

2. Behavior
- Whenever a user uploads an X-ray, trigger GradCAM generation for that image.
- Generate a unique GradCAM result for the currently uploaded image, regardless of predicted class (NORMAL, VIRAL, or BACTERIAL).
- Display only the newest GradCAM output.
- Replace the previous heatmap in component state on each new upload.
- Do not persist or cache heatmaps across uploads or sessions.

3. GradCAM generation
- Implement or wire backend logic to generate GradCAM from the current model using the same upload/prediction flow.
- Prefer reusing existing explainability code where possible.
- Return data in a frontend-friendly format (for example image bytes endpoint or base64 payload).

4. Integration
- Connect the new panel to the current upload and prediction flow.
- Update frontend types and service contracts as needed.
- Keep changes minimal and consistent with current architecture.
- Scope this feature to the main dashboard only (no triage-mode integration required).
- If panel placement degrades layout quality, use a clear "Generate Heatmap" button in the main dashboard that triggers and reveals the blended overlay in a visually clean way.

5. Quality bar
- Preserve existing patterns and naming conventions.
- Add concise comments only where logic is non-obvious.
- Run relevant validation steps and report outcomes.

Output format:
1. Implementation plan
2. Files changed and why
3. Key code diffs
4. Validation run and results
5. Remaining risks or follow-ups
