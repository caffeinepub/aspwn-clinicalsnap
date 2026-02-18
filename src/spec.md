# Specification

## Summary
**Goal:** Improve in-app photo capture consistency and documentation by adding capture alignment aids, clinical view templates, faster annotation stamps, and an on-device branded PDF export.

**Planned changes:**
- Add a camera capture UI toggle to show/hide alignment guides (e.g., rule-of-thirds grid and center crosshair) as visual-only overlays.
- Add an optional “ghost overlay” mode in camera capture to select a reference photo from the current session and overlay it with an opacity slider (visual-only; not saved into photos).
- Add standard clinical view templates (Frontal, Left 45°, Right 45°, Occlusal) selectable during capture, persisted per captured/imported photo, and displayed in the session grid/viewer.
- Extend the full-screen photo annotation experience with a “Stamps” tool including preset stamps (Arrow, Margin line, Prep line) that can be placed and persisted, with undo/removal via existing quick-correction workflows.
- Add an “Export to PDF” action for a session that generates a downloadable PDF on-device including clinic branding (name and optional logo from Branding Settings) plus session title/date and session photos in a readable layout.

**User-visible outcome:** Clinicians can toggle capture guides, align shots using a semi-transparent reference photo, tag photos with standard view labels, add quick stamp annotations, and export a branded session PDF without uploading photos to the backend.
