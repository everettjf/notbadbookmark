# Reliability release validation — 1.1.0

Date: 2026-09-24. Scope: all three reliability/backup/search phases.

## Implemented

- Callback errors propagate through the bookmark service. Forms retain their input after errors, report partial success, wait for existing tags, and guard repeated saves.
- Bookmark editing performs the selected move. Folder targets exclude the root, managed folders, self and descendants. Native browser folders cannot be renamed or deleted.
- Deletion previews recursive counts, verifies the confirmed subtree has not changed, persists a local snapshot before mutation, uses removeTree for folders and retains recovery information across reloads.
- Restore maps old IDs to new IDs, restores tags, resumes checkpointed work, accepts a fallback destination and blocks ambiguous creation retries. Independent snapshot export includes saved tags, not the current live tag store.
- Versioned JSON preserves hierarchy, empty folders, sibling order and tags. HTML preserves structure and escapes titles/attributes; Markdown is a reading copy. Import validates before mutation, estimates duplicates, supports cancellation and reports partial results. Recent import reports survive reloads and indicate interrupted work.
- Query state keeps explicit folder scope and descendant inclusion; text/domain/tag matching and sorting are applied to the same complete tree. Out-of-order refreshes cannot replace newer data. Selection resets when scope/filters change.
- Tag rename/merge uses one IndexedDB transaction. Tags refresh across extension tabs; visible counts exclude bookmarks removed outside the manager.
- Accessible edit controls, F2 entry, full paths, visible active filters, no-match guidance, consistent 180px grid columns, local icons and reduced-motion CSS.

## Automated checks

Run `npm run check` and `npm run release`.

34 tests cover service failures, invalid schema and unknown versions, JSON round trips, standard HTML with omitted closing tags, special characters, duplicate-policy preview versus execution, cancellation, durable recovery, snapshot-write failure, failed deletion, missing parents, interrupted restore checkpoints, partial restore continuation, scope/tag/domain queries, tag merge/removal, IME composition, form error retention, actual manager edit/move behavior, tag-save retry without duplicate creation, hidden bulk selection, empty states and stale refresh rejection.

Synthetic CPU-only query measurements (Node 24.21.0 on this Mac; 2026-09-24 test run): approximately 23ms / 85ms / 318ms for 1,000 / 10,000 / 50,000 bookmarks with Unicode text, a domain filter and title sorting. These measurements include query/filter/sort calculation, not Chrome API reads, React rendering, scrolling or input-to-paint latency. They are not a claim that the 300ms end-to-end UI target has been met.

TypeScript and ESLint pass. Webpack produces a production bundle; its default 244 KiB asset/entrypoint advisory is exceeded (about 460 KiB JS before compression). No test adapter or preview page is included in the extension zip.

## Browser inspection

Ran the application through a localhost preview using only synthetic Chrome API data (182 bookmarks with nested and empty folders, Unicode, tags and enough rows to activate virtualization). Checked list layout, search/path highlighting, folder scope, F2 editing and successful title save, plus an 800×700 viewport. UI form and destructive-operation scenarios also run through the automated synthetic adapter.

No personal Chrome library was touched. This preview is not a loaded-extension test of actual Chrome Bookmarks/Storage API behavior or browser account synchronization. Before store submission, load `release/` unpacked in a dedicated Chrome test profile and smoke-test import → export → delete → restart → restore with disposable fixtures. Native Chrome HTML import/export compatibility remains a release smoke check beyond parser fixtures.

## Recovery limits

Chrome bookmarks and IndexedDB/storage are not one atomic transaction. Restores create new IDs and native timestamps. Deleted snapshots and tags remain local to the profile and are removed by clearing extension data/uninstalling. A storage error can stop a deletion before it starts, or require inspection after a mutation. If a restore was interrupted between creation and its checkpoint, automatic retry is blocked to prevent duplicates; export the snapshot and inspect the destination. Import cancellation stops subsequent items and retains completed changes; it is not an atomic rollback.

## Deferred scope

Saved searches, advanced query syntax, webpage full-text search, AI classification and dead-link scanning are future work. No Chrome Web Store upload or external publication was performed for this implementation.

## Color refinement — 1.1.1

Default light and dark themes visually checked in the synthetic browser preview. Added 12 token contrast tests (six accents × two modes), covering primary/body/secondary text, action labels, destructive labels and selected-folder text at 4.5:1 or higher for the tested combinations. This is targeted contrast validation, not a full accessibility audit.
