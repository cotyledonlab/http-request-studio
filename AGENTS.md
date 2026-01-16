# Agent Context: HTTP Request Studio

This document provides context for AI coding agents working on this project.

## Project Overview

**HTTP Request Studio** is a lightweight, native desktop application for testing HTTP APIs. Think of it as a simpler, faster alternative to Postman built with modern web technologies.

- **Version**: 0.1.0 (early MVP)
- **License**: MIT
- **Repository**: https://github.com/cotyledonlab/http-request-studio

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | Svelte | 5.0.0 |
| Meta-framework | SvelteKit | 2.9.0 |
| Desktop Runtime | Tauri | 2.0 |
| Build Tool | Vite | 6.0.3 |
| Language | TypeScript | 5.6 |
| Backend | Rust | stable |
| HTTP Client | reqwest | 0.12 |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (SvelteKit)             │
│  src/routes/+page.svelte (main app)                 │
│  src/components/*.svelte (UI components)            │
└──────────────────────┬──────────────────────────────┘
                       │ Tauri IPC (invoke)
┌──────────────────────▼──────────────────────────────┐
│                    Backend (Rust/Tauri)             │
│  src-tauri/src/lib.rs (commands)                    │
│  - proxy_request: HTTP client via reqwest          │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

```
http-request-studio/
├── src/                          # Frontend source
│   ├── routes/
│   │   ├── +layout.ts            # SSG config for Tauri
│   │   └── +page.svelte          # Main application page
│   ├── components/
│   │   ├── UrlConfig.svelte      # URL input + method selector
│   │   ├── HeadersEditor.svelte  # Request headers management
│   │   ├── JsonEditor.svelte     # JSON body editor with validation
│   │   ├── JsonTreeViewer.svelte # Interactive JSON response tree
│   │   ├── RequestStatus.svelte  # Loading/error/success states
│   │   ├── FileExplorer.svelte   # Collections sidebar
│   │   ├── history/              # History panel
│   │   ├── collections/          # Save modal + collection tree
│   │   ├── environments/         # Environment selector + manager
│   │   ├── shared/               # Modal/context menu/confirm dialog
│   │   └── ThemeToggle.svelte    # Dark/light mode toggle
│   └── app.html                  # HTML template
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Tauri command handlers
│   │   └── main.rs               # Entry point
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── static/                       # Static assets
├── SPEC.md                       # Development specification (Phase 2)
├── package.json                  # Node dependencies
└── vite.config.js                # Vite configuration
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development build (frontend + Tauri)
npm run tauri dev

# Build for production
npm run tauri build

# Type checking
npm run check

# Frontend only (no Tauri)
npm run dev
```

## Current Implementation Status

### Working Features
- HTTP request composition (URL, method, headers, body)
- All HTTP methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- JSON body editor with validation
- Interactive JSON response tree viewer
- Response headers display
- Request timing metrics
- Request history with search and copy-as-cURL
- Collections with folders, drag-and-drop ordering, and import/export
- Save/load requests with dirty-state indicators
- Environment variables with substitution and highlighting
- Request body echo in response view
- Dark/light theme with localStorage persistence
- Click-to-copy for JSON values
- JSON validation blocks invalid request bodies
- Storage error alerts for collections, environments, and history
- Import from cURL via modal paste

### Not Yet Implemented (see SPEC.md)
- Import from Postman
- GraphQL support
- WebSocket testing
- Authentication helpers

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/routes/+page.svelte` | Main app logic, state management, request handling |
| `src-tauri/src/lib.rs` | Rust HTTP proxy command |
| `src/components/JsonTreeViewer.svelte` | Recursive JSON rendering (most complex component) |
| `src/components/HeadersEditor.svelte` | Dynamic header rows with autocomplete |
| `SPEC.md` | Detailed spec for next development phase |

## Code Patterns

### Svelte 5 Runes
This project uses Svelte 5 with runes syntax:
```svelte
<script lang="ts">
  let count = $state(0);           // Reactive state
  let doubled = $derived(count * 2); // Derived value
</script>
```

### Tauri IPC
Frontend calls Rust via Tauri's invoke:
```typescript
import { invoke } from '@tauri-apps/api/core';

const response = await invoke('proxy_request', {
  url: 'https://api.example.com',
  method: 'GET',
  headers: { 'Authorization': 'Bearer token' },
  body: null
});
```

### Neumorphic Design
UI uses soft shadows for a "soft UI" aesthetic:
```css
.neumorphic {
  background: var(--bg-color);
  box-shadow:
    8px 8px 16px var(--shadow-dark),
    -8px -8px 16px var(--shadow-light);
  border-radius: 12px;
}
```

### Theme System
CSS variables enable theming:
```css
:root {
  --bg-color: #e0e5ec;
  --text-color: #2d3436;
  /* ... */
}
:root.dark {
  --bg-color: #1a1a2e;
  --text-color: #f1f5f9;
}
```

## Known Issues / Technical Debt

1. **No native file picker**: Import/export uses manual path prompts (dialog plugin pending)

## Testing

No automated tests currently exist. Testing is manual:
1. Run `npm run tauri dev`
2. Test HTTP requests against httpbin.org or similar
3. Verify response rendering and theme switching

## Roadmap Reference

See `SPEC.md` for the detailed Phase 2 development plan covering:
- Request history (localStorage)
- Collections (Tauri filesystem)
- Environment variables (variable substitution)

## Contributing Guidelines

- Keep components small and focused
- Use TypeScript for all new code
- Follow existing neumorphic design patterns
- Test on both dark and light themes
- Prefer editing existing files over creating new ones
- When work is completed, complete the steps described here every time: update `README.md` and `AGENTS.md`, check off completed work in `SPEC.md`, then commit and push as the final step

## Quick Context for Common Tasks

### Adding a new component
1. Create `src/components/MyComponent.svelte`
2. Import in `+page.svelte` or parent component
3. Use existing CSS variable system for theming

### Adding a new Tauri command
1. Add function in `src-tauri/src/lib.rs` with `#[tauri::command]`
2. Register in `tauri::Builder` in `lib.rs`
3. Call from frontend with `invoke('command_name', { args })`

### Modifying the request flow
1. Main logic is in `src/routes/+page.svelte`
2. `sendRequest()` function handles the request lifecycle
3. Response stored in reactive state variables

---

*Last updated: January 2026*
