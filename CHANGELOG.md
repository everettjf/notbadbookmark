# Changelog

## 1.1.4 — 2026-09-24

- Restore the original green background and white NB lettering, adding rounded corners only.

## 1.1.3 — 2026-09-24

- Replace the letter-based icon with a teal bookmark and checkmark across extension sizes and the product website.
- Generate all artwork from one SVG source; keep extension permissions and data identifiers unchanged.

## 1.1.2 — 2026-09-24

- Standardize the display name as NotbadBookmark across the extension and website.
- Increment the package version for updating the existing Chrome Web Store listing; storage identifiers and permissions remain unchanged.

## 1.1.1 — 2026-09-24

- Refine light/dark surfaces with neutral backgrounds and a muted teal default accent.
- Add distinct sidebar selection, bookmark selection and theme-aware search highlights.
- Calibrate all six accent variants in both modes; add text contrast regression coverage.

## 1.1.0 — 2026-09-24

- Make bookmark edits, moves and failures explicit; preserve failed form input and prevent repeated submissions.
- Add local deletion snapshots and recoverable folder-tree deletion, with safe restore checkpoints and snapshot export.
- Add complete JSON backups, hierarchical HTML exchange, scoped exports, validated import previews, duplicate policies, cancellation and persistent import reports.
- Unify search, directory scope, domain filters and tag AND/OR matching; show folder results and reset hidden selections.
- Add tag rename/merge/removal, keyboard editing, complete folder paths and clearer empty states.
- Replace third-party favicon requests with local icons and document native Chrome sync separately from local metadata.
- Add automated regression coverage and a synthetic browser QA preview.
