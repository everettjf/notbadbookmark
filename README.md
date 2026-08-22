<div align="center">

<img src="icons/icon128.png" width="96" height="96" alt="NotBadBookmark logo" />

# NotBadBookmark

Repository: <https://github.com/everettjf/notbadbookmark>

### A genuinely *not bad* bookmark manager for Chrome.

Replace Chrome's default bookmark page with a fast, modern, keyboard-friendly manager —
folders, tags, drag-and-drop, instant search, import/export, and dark mode.

<p>
  <a href="https://chromewebstore.google.com/detail/notbadbookmark/mablekconlhfomebomdjbohbjmgceana">
    <img alt="Available in the Chrome Web Store" src="https://img.shields.io/badge/Chrome%20Web%20Store-Add%20to%20Chrome-34A853?logo=googlechrome&logoColor=white&style=for-the-badge" />
  </a>
</p>

<p>
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white" />
  <img alt="React 18" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

<a href="https://chromewebstore.google.com/detail/notbadbookmark/mablekconlhfomebomdjbohbjmgceana"><b>🧩 Install</b></a> ·
<a href="https://everettjf.github.io/NotBadBookmark/"><b>🌐 Website</b></a> ·
<a href="#-features"><b>✨ Features</b></a> ·
<a href="#-development"><b>🛠 Development</b></a>

</div>

---

## ✨ Features

| | |
|---|---|
| 🗂 **Folder management** | Browse, create, rename, and delete folders with a clean sidebar tree. |
| 🏷 **Tags** | Add your own tags on top of Chrome's native folders, then filter by them. |
| 🔍 **Instant search** | Real-time, fuzzy-friendly filtering across titles and URLs as you type. |
| 🖱 **Drag & drop** | Reorder bookmarks and drag them **across folders** — powered by dnd-kit. |
| ⚡ **Virtualized grid** | Smooth scrolling even with thousands of bookmarks (TanStack Virtual). |
| ↕️ **Sorting** | Sort by title, URL, or date added — ascending or descending. |
| 📥 **Import / Export** | Import from JSON/HTML with **automatic de-duplication**; export to JSON, HTML, or Markdown. |
| 🌗 **Dark mode** | Light / dark theme toggle that remembers your choice. |
| 🔔 **Toasts** | Non-blocking notifications instead of jarring `alert()` popups. |
| 🎛 **Context menu** | Right-click any bookmark for quick actions. |
| 🔒 **Local & private** | No servers, no tracking — everything stays in your browser. See [Privacy Policy](PRIVACY_POLICY.md). |

---

## 🚀 Quick Start

### For users — install in one click

**👉 [Add to Chrome from the Chrome Web Store](https://chromewebstore.google.com/detail/notbadbookmark/mablekconlhfomebomdjbohbjmgceana)**

That's it. Open a new bookmarks page (`chrome://bookmarks`) and it's now NotBadBookmark ✨

### For developers — build from source

> **Heads up:** `dist/` is a build artifact and isn't committed. You must build once before loading.

```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run build
```

Then load it in Chrome:

1. Open `chrome://extensions/`
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked** and select this project directory
4. Open a new bookmarks page (`chrome://bookmarks`) — it's now NotBadBookmark ✨

NotBadBookmark overrides Chrome's built-in bookmarks page via `chrome_url_overrides`,
so it appears wherever you'd normally open the bookmark manager.

---

## 🛠 Development

```bash
npm run dev        # Build in watch mode (auto-rebuild on save)
npm run build      # Production build
npm run typecheck  # TypeScript type checking (tsc --noEmit)
npm run lint       # ESLint
npm run release    # Build + create a distributable .zip
```

**Workflow:** edit files in `src/` → `npm run dev` rebuilds → hit the **↻ reload** button
on the extension card in `chrome://extensions/` → refresh the bookmarks page.

### Tech stack

- **React 18** + **TypeScript** — modern, type-safe UI
- **Tailwind CSS** — utility-first styling with theme variables
- **shadcn/ui** + **Magic UI** — accessible, animated components
- **Framer Motion** — micro-interactions and transitions
- **@dnd-kit** — drag-and-drop
- **@tanstack/react-virtual** — list virtualization
- **Webpack** — bundling
- **Chrome Bookmarks API** (Manifest V3) — native integration

### Project structure

```
NotBadBookmark/
├── manifest.json              # MV3 manifest (overrides the bookmarks page)
├── bookmarks.html             # Entry HTML for the manager UI
├── src/
│   ├── bookmarks.tsx          # App entry point
│   ├── background.ts          # Service worker
│   ├── components/            # UI components (manager, dialogs, tree, grid…)
│   │   └── ui/                # shadcn/ui + Magic UI primitives
│   ├── hooks/                 # useBookmarks, useTags, useTheme, use-toast…
│   ├── lib/                   # Chrome API wrapper, import/export, tags, utils
│   └── globals.css            # Theme variables & global styles
├── icons/                     # Extension icons
├── docs/                      # GitHub Pages landing site
└── webpack.config.js
```

---

## 🔐 Permissions

| Permission | Why it's needed |
|---|---|
| `bookmarks` | Read and modify your bookmarks — the core of the app. |
| `storage` | Persist your preferences (theme, sort order, tags) locally. |

No host permissions, no network requests, no analytics. Your data never leaves the browser.

---

## 🗺 Roadmap

- [ ] On-device AI auto-tagging & categorization
- [ ] Command palette + keyboard shortcuts
- [ ] Dead-link detection
- [ ] Full-text content search
- [ ] Internationalization (i18n)

---

## 🤝 Contributing

1. Fork and create a feature branch
2. Make your changes
3. `npm run typecheck && npm run lint`
4. `npm run build`
5. Open a pull request

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and share.

<div align="center">
<sub>Built with ❤️ for people who have too many bookmarks.</sub>
</div>
