# Privacy Policy for NotbadBookmark

Effective date: September 24, 2026 (version 1.1.0).

NotbadBookmark has no account, analytics, advertising, or developer-operated backend. The extension does not send bookmark titles, URLs, tags, or recovery snapshots to our servers. Website icons use local placeholders; this version does not request Google's favicon service.

## Storage and browser synchronization

Bookmarks are read and written through Chrome's native bookmark store. Chrome may synchronize those bookmarks according to your browser and account settings. This is separate from NotbadBookmark's local metadata.

Tags are stored in the extension's IndexedDB database. UI preferences, deletion recovery snapshots (including titles, URLs, folder structure and tags), and recent import reports are stored in `chrome.storage.local`. They are not synchronized by this extension. Import reports retain the latest 20 operations. Recovery snapshots remain local until extension data is removed; export an independent JSON backup before clearing extension data or uninstalling.

## Actions you control

Import reads a file you choose and adds its bookmarks to Chrome. Export writes a file to your device; JSON backups include tags and folder structure. You decide whether and where to share that file. Opening a bookmark navigates to that website, whose own privacy policy applies. Copying a link writes it to your system clipboard.

## Permissions

- `bookmarks`: read, create, edit, move and remove bookmarks and folders.
- `storage`: save preferences, local recovery snapshots and import reports.

The extension does not request host permissions or scan website contents. Recovery depends on local storage being available and cannot restore original Chrome IDs or native creation dates. It is not a substitute for an independent exported backup.

## Contact

For product or privacy questions, contact the maintainer through [GitHub issues](https://github.com/everettjf/notbadbookmark/issues). Do not attach a personal bookmark backup to a public issue.
