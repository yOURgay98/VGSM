# Next Upgrade Notes

This release candidate is stable for friend beta usage. The items below are intentional v1 limits for the next pass:

1. Map labels dataset

- Current `/data/map/labels.json` is a starter dataset.
- Next: expand coverage and add a community editor for labels.

2. Zone editing depth

- Current zone UX supports reliable draw/create, rename/recolor, and hide/delete.
- Next: add vertex-level edit/reshape mode.

3. Desktop distribution

- Tauri scaffold and docs are included.
- Next: automate signed binary CI artifacts for Windows/macOS/Linux.

4. Command form controls

- Command palette is stable and audited.
- Next: replace remaining native select fields with a unified Radix select wrapper.

5. Diagnostics

- Dev-only diagnostics page captures runtime errors/warnings.
- Next: optional server-side error aggregation endpoint for staging/prod observability.
