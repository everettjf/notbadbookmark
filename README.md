# NotbadBookmark

A local bookmark manager for Chrome, focused on reliable organization, search and portable backups. Replaces `chrome://bookmarks`.

[Chrome Web Store](https://chromewebstore.google.com/detail/notbadbookmark/mablekconlhfomebomdjbohbjmgceana) · [Website](https://everettjf.github.io/NotBadBookmark/) · [Privacy](PRIVACY_POLICY.md)

## Manage and find

- Create, edit, rename and move bookmarks and folders. F2 opens editing for a focused bookmark or folder card; Enter saves and Escape cancels. Failed saves keep the form open and explain any partial success.
- Search titles, URLs and folder paths without leaving the selected folder. Choose whether to include its subfolders. Cmd/Ctrl+F focuses search; Escape clears it. Matching is case-insensitive text matching, not fuzzy or webpage full-text search.
- Combine domain and tag filters; choose all-tag or any-tag matching. Clear active filters explicitly. Folder results are shown separately.
- Rename or merge tags globally, or remove a tag without deleting its bookmarks.
- List and grid views, native-folder navigation, complete path tooltips, keyboard controls and a virtualized large-library view.
- Drag bookmarks to folders. Reordering is supported only within one folder in Manual order, with filters cleared and subfolder inclusion off.
- Select all matching editable bookmarks, including items outside the virtualized viewport. Changing search, folder or filters clears selection to avoid hidden bulk deletions.

## Delete and recover

Deletion asks once and displays recursive item counts. A local snapshot must be saved successfully before an item is removed. Recovery restores folders, bookmarks and tags; Chrome allocates new IDs and creation dates. If the original parent is unavailable, choose a new destination.

Recovery records persist across manager reloads but remain in this browser profile. A crash during a creation checkpoint can leave an ambiguous result; recovery stops and asks you to inspect/export the snapshot rather than silently duplicating data. Storage exhaustion prevents deletion before it starts. Browser changes and extension metadata are not one atomic transaction.

## Import and export

| Format | Purpose |
|---|---|
| JSON v2 | Full backup with nested folders, empty folders, ordering and tags. Legacy flat/tree JSON remains readable. |
| Browser HTML | Folder/link exchange using Netscape bookmark format. Custom tags are not portable through HTML. |
| Markdown | Human-readable sharing copy, not a restore format. |

Export all, the current folder with descendants, or selected bookmarks. Import validates the whole file before writing, previews counts and expected duplicates, and lets you choose a destination and duplicate policy. Default imports use a separate folder. Skip policies merge uniquely named destination folders; ambiguous same-name folders are not guessed. URLs are compared exactly after trimming surrounding whitespace, without stripping query parameters or fragments.

Imports support cancellation between items and report successful, skipped and failed work. Existing data is never deleted by import. Completed changes remain after cancellation or failure; inspect the report before retrying. **Recovery → Recent import reports** retains the latest 20 runs and flags interrupted runs. Import currently accepts JSON and HTML up to 25 MB, 100,000 nodes and 64 folder levels.

## Local data

The extension has no analytics or server. It uses local placeholder icons and does not fetch third-party favicons. Chrome can synchronize native bookmarks according to your browser settings; extension tags, recovery records and preferences remain local. Export JSON before clearing extension data or uninstalling.

## Develop and validate

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run release
```

Load the project directory as an unpacked extension in a **dedicated test profile**, after building. Do not run destructive tests against a personal library.

For a browser preview backed only by synthetic data:

```sh
npm run preview:qa
# http://127.0.0.1:4178/tests/preview.html
```

The preview replaces Chrome APIs with a test adapter. It verifies browser rendering and interaction, not native Chrome synchronization. Tests cover API failures, import/export round trips, recovery, filtering, input composition and form/selection behavior. See [validation notes](docs/reliability-validation.md) for coverage and limits.

## Future work

Saved queries, richer keyboard navigation, and optional AI classification can follow the reliable core. This release does not fetch webpage contents, scan dead links, or provide AI search.
