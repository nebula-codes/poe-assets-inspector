# PoE DAT Studio

A modern, redesigned Path of Exile .dat file viewer and analyzer.

**Live Demo:** https://nebula-codes.github.io/poe-assets-inspector

---

## Credits

This project is a fork of [**poe-dat-viewer**](https://github.com/SnosMe/poe-dat-viewer) by [SnosMe](https://github.com/SnosMe).

**Original Project:** https://snosme.github.io/poe-dat-viewer

All core functionality for parsing and analyzing .dat files comes from the original project. This fork modernizes the UI/UX with an admin dashboard design and updated tooling.

---

## Features

### Core Features (from original)
- Supports `.datc64` files from Path of Exile 1 & Path of Exile 2
- Upload files from your PC or import directly from PoE patch servers
- Automatic file analysis to detect possible column structures
- Schema management and data export

### New in This Fork
- **Modern Admin Dashboard UI** - Dark slate theme with collapsible sidebar
- **Vue 3.5 + Composition API** - Upgraded from Vue 3.2
- **Pinia State Management** - Centralized app state
- **Vue Router** - Multi-page navigation (Dashboard, Viewer, Settings)
- **Settings Panel** - Customize theme, font size, and display preferences
- **Improved Developer Experience:**
  - Vitest for testing
  - Prettier + ESLint for code formatting
  - Husky + lint-staged for git hooks
  - TypeScript 5.8

---

## Screenshots

### Dashboard
Modern welcome screen with stats and quick actions.

### Data Viewer
Tabbed interface with drag-and-drop file support.

### Settings
Customizable preferences for theme and display options.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/nebula-codes/poe-assets-inspector.git
cd poe-assets-inspector/viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview  # Preview the build locally
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests with Vitest |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue | 3.5 | UI Framework |
| TypeScript | 5.8 | Type Safety |
| Vite | 6.0 | Build Tool |
| Tailwind CSS | 3.4 | Styling |
| Pinia | 2.3 | State Management |
| Vue Router | 4.5 | Navigation |
| Vitest | 2.1 | Testing |

---

## Exporting Game Data

For programmatic data export and CLI tools, visit the [lib directory README](./lib/README.md).

---

## Related Projects

| Name | Language | Description |
|------|----------|-------------|
| [poe-dat-viewer](https://github.com/SnosMe/poe-dat-viewer) | TypeScript/Vue | Original project this fork is based on |
| [PyPoE](https://github.com/Project-Path-of-Exile-Wiki/PyPoE) | Python | Python library for PoE data |
| [pogo](https://github.com/oriath-net/pogo) | Go | Go library for PoE data |
| [LibGGPK3](https://github.com/aianlinb/LibGGPK3) | C# | C# library for GGPK files |

---

## License

This project maintains the same license as the original [poe-dat-viewer](https://github.com/SnosMe/poe-dat-viewer).

---

## Acknowledgments

Special thanks to [SnosMe](https://github.com/SnosMe) for creating the original poe-dat-viewer, which made this project possible. The core .dat parsing logic, WebAssembly analysis, and bundle loading functionality are entirely their work.
