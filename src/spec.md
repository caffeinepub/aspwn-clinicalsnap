# Specification

## Summary
**Goal:** Enable users to edit and delete patient profiles from the patient list.

**Planned changes:**
- Add Edit action to PatientListPanel that opens PatientEditorDialog with pre-populated patient data
- Add Delete action to PatientListPanel that shows confirmation dialog and removes patient with all associated data
- Ensure Edit and Delete actions have touch-friendly sizing (44x44 points minimum) suitable for iPad
- Cascade patient deletion to all related sessions, photos, annotations, pairings, and voice memos in IndexedDB

**User-visible outcome:** Users can tap Edit to modify a patient's name, ID, date of birth, or treatment history, or tap Delete to permanently remove a patient and all their data after confirming the action.
