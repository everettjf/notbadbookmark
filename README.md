# NotBadBookmark

A modern, elegant Chrome extension that replaces the default bookmark manager with a superior user experience. Built with React, TypeScript, shadcn/ui, and Magic UI components for a clean, compact, and highly functional bookmark management interface.

## Features

- **Modern UI**: Clean, responsive interface built with shadcn/ui and Magic UI components
- **Fast Search**: Instant bookmark search with real-time filtering
- **Smooth Animations**: Beautiful transitions and hover effects powered by Framer Motion
- **Full CRUD Operations**: Add, edit, delete, and organize bookmarks seamlessly
- **Folder Management**: Organize bookmarks into folders with visual hierarchy
- **Favicon Support**: Automatic favicon fetching for visual bookmark identification
- **Compact Design**: Optimized for the Chrome extension popup format
- **TypeScript**: Full type safety and modern development experience

## Tech Stack

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Full type safety and excellent developer experience
- **shadcn/ui** - High-quality, accessible UI components
- **Magic UI** - Beautiful animated components and effects
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Framer Motion** - Smooth animations and transitions
- **Chrome Extension APIs** - Native bookmark management integration
- **Webpack** - Modern bundling and build system

## Project Structure

```
NotBadBookmark/
├── manifest.json           # Chrome extension manifest
├── popup.html             # Extension popup HTML
├── src/
│   ├── components/
│   │   ├── ui/            # shadcn/ui and Magic UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── blur-fade.tsx
│   │   │   └── border-beam.tsx
│   │   ├── App.tsx        # Main application component
│   │   ├── BookmarkItem.tsx # Individual bookmark display
│   │   ├── BookmarkDialog.tsx # Add/edit bookmark modal
│   │   └── SearchBar.tsx  # Search input component
│   ├── hooks/
│   │   └── useBookmarks.ts # Bookmark state management hook
│   ├── lib/
│   │   ├── bookmarks.ts   # Chrome bookmarks API wrapper
│   │   └── utils.ts       # Utility functions (cn helper)
│   ├── globals.css        # Global styles and theme variables
│   ├── popup.tsx          # Popup entry point
│   └── background.ts      # Background script
├── dist/                  # Built extension files
├── package.json
├── tsconfig.json          # TypeScript configuration
├── tsconfig.build.json    # Build-specific TypeScript config
├── webpack.config.js      # Webpack build configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── postcss.config.js      # PostCSS configuration
```

## Development

### Prerequisites

- Node.js 16+ and npm
- Chrome browser for testing

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select this project directory
   - The extension will appear in your Chrome toolbar

### Development Scripts

- `npm run dev` - Build in development mode with file watching
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint code linting

### Development Workflow

1. Make changes to source files in `src/`
2. Run `npm run dev` for automatic rebuilds
3. Refresh the extension in Chrome's extension management page
4. Test changes in the extension popup

## Chrome Extension Features

### Permissions

The extension requires these Chrome permissions:
- `bookmarks` - Read and modify user bookmarks
- `activeTab` - Open bookmarks in new tabs

### API Integration

The extension uses Chrome's Bookmarks API through a clean service layer:

```typescript
// Read all bookmarks
const bookmarks = await BookmarkService.getAllBookmarks();

// Search bookmarks
const results = await BookmarkService.searchBookmarks("query");

// Create bookmark
await BookmarkService.createBookmark({
  title: "Example",
  url: "https://example.com",
  parentId: folderId
});
```

## UI Components

### Key Components

- **BookmarkItem**: Individual bookmark display with favicon, title, URL, and action buttons
- **SearchBar**: Real-time search with clear functionality
- **BookmarkDialog**: Modal for adding and editing bookmarks
- **BlurFade**: Animated component wrapper for smooth reveal effects
- **BorderBeam**: Animated border effect for visual enhancement

### Design System

The extension follows shadcn/ui design principles:
- Consistent spacing and typography
- Accessible color schemes with dark mode support
- Responsive design patterns
- Smooth animations and micro-interactions

## Installation for End Users

1. Download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory
5. Pin the extension to your toolbar for easy access

## Future Enhancements

- Drag and drop bookmark organization
- Import/export functionality
- Advanced filtering and sorting options
- Keyboard shortcuts
- Custom themes and layouts
- Backup and sync features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run typecheck && npm run lint`
5. Build: `npm run build`
6. Submit a pull request

## License

MIT License - feel free to use and modify as needed.
