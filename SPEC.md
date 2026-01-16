# HTTP Request Studio - Development Specification v0.2.0

## Overview

This specification outlines the next major development phase for HTTP Request Studio, focusing on **persistence and organization features**. This phase transforms the application from a stateless request tool into a full-featured API development environment with saved collections, request history, and environment variables.

---

## Scope

### Features Included in This Phase

1. **Request History** - Automatic tracking of sent requests
2. **Request Collections** - Organize requests into folders and files
3. **Save/Load Requests** - Persist individual requests
4. **Environment Variables** - Variable substitution across requests

### Features Deferred to Future Phases

- Import from cURL/Postman (Phase 3)
- GraphQL support (Phase 3)
- WebSocket testing (Phase 4)
- Authentication helpers (Phase 3)

---

## Current State Analysis

### Existing Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| FileExplorer.svelte | UI Stub | Renders mock folder tree, emits selection events |
| Tauri IPC | Working | `proxy_request` command functional |
| Theme System | Complete | CSS variables, localStorage persistence |
| JSON Viewer | Complete | Recursive tree with copy functionality |

### Technical Debt to Address

1. **Unused Dependency** - Remove `svelte-jsoneditor` from package.json (never imported)
2. **Missing HTTP Methods** - HEAD/OPTIONS buttons not in UI (backend supports them)
3. **No Request Echo** - Sent request body not visible in response view

---

## Feature Specifications

### 1. Request History

#### Purpose
Automatically track all sent HTTP requests for quick re-execution and debugging.

#### Data Model

```typescript
interface HistoryEntry {
  id: string;                    // UUID
  timestamp: number;             // Unix timestamp (ms)
  request: {
    url: string;
    method: HttpMethod;
    headers: Header[];
    body: string | null;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    duration: number;            // ms
  } | null;                      // null if request failed
  error: string | null;          // Error message if failed
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
```

#### Storage Strategy

- **Location**: localStorage (frontend-only persistence)
- **Key**: `hrs:history`
- **Limit**: 100 most recent entries (configurable)
- **Eviction**: FIFO when limit reached

#### UI Components

**HistoryPanel.svelte**
- Collapsible sidebar panel (left side, below FileExplorer)
- Grouped by date (Today, Yesterday, This Week, Older)
- Each entry shows: method badge, URL (truncated), timestamp, status code
- Click to load request into editor
- Right-click context menu: Copy as cURL, Delete, Clear All
- Search/filter by URL or method

**Layout Changes**
```
+------------------+------------------------+
| File Explorer    |                        |
|------------------|    Request Editor      |
| History Panel    |                        |
|   [Today]        |------------------------|
|     GET /api/... |    Response Viewer     |
|     POST /users  |                        |
+------------------+------------------------+
```

#### Implementation Tasks

1. Create `HistoryEntry` type definitions in `src/lib/types.ts`
2. Create `historyStore.ts` with Svelte store for reactive history
3. Implement `HistoryPanel.svelte` component
4. Modify `+page.svelte` to record history on each request
5. Add history panel to layout (collapsible)
6. Implement date grouping logic
7. Add search/filter functionality
8. Implement context menu actions
9. Add clear history confirmation modal

---

### 2. Request Collections

#### Purpose
Organize saved requests into a hierarchical folder structure for project-based API development.

#### Data Model

```typescript
interface Collection {
  id: string;                    // UUID
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  items: CollectionItem[];
}

type CollectionItem = CollectionFolder | SavedRequest;

interface CollectionFolder {
  type: 'folder';
  id: string;
  name: string;
  items: CollectionItem[];
  expanded: boolean;             // UI state
}

interface SavedRequest {
  type: 'request';
  id: string;
  name: string;
  request: {
    url: string;
    method: HttpMethod;
    headers: Header[];
    body: string | null;
  };
  createdAt: number;
  updatedAt: number;
}

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}
```

#### Storage Strategy

- **Location**: Tauri filesystem API (app data directory)
- **Format**: JSON files
- **Structure**:
  ```
  $APPDATA/http-request-studio/
  ├── collections/
  │   ├── {collection-id}.json
  │   └── {collection-id}.json
  └── settings.json
  ```

#### Rust Backend Commands

```rust
// New Tauri commands to add to lib.rs

#[tauri::command]
async fn list_collections(app: tauri::AppHandle) -> Result<Vec<CollectionMeta>, String>

#[tauri::command]
async fn get_collection(app: tauri::AppHandle, id: String) -> Result<Collection, String>

#[tauri::command]
async fn save_collection(app: tauri::AppHandle, collection: Collection) -> Result<(), String>

#[tauri::command]
async fn delete_collection(app: tauri::AppHandle, id: String) -> Result<(), String>

#[tauri::command]
async fn export_collection(app: tauri::AppHandle, id: String, path: String) -> Result<(), String>

#[tauri::command]
async fn import_collection(app: tauri::AppHandle, path: String) -> Result<Collection, String>
```

#### UI Enhancements to FileExplorer.svelte

Current state: Static mock data, no backend integration.

Required changes:
1. Replace mock data with reactive store from Tauri
2. Add create/rename/delete context menus for folders
3. Add create/rename/delete/duplicate for requests
4. Implement drag-and-drop reordering
5. Add collection-level actions (export, rename, delete)
6. Visual indicators for unsaved changes
7. Double-click to rename inline

#### Implementation Tasks

1. Define Rust structs for Collection data model
2. Implement Tauri commands for CRUD operations
3. Create `collectionsStore.ts` Svelte store
4. Refactor `FileExplorer.svelte` to use real data
5. Implement folder context menu (create, rename, delete)
6. Implement request context menu (save, duplicate, delete)
7. Add "New Collection" button and modal
8. Implement drag-and-drop with `@dnd-kit` or native HTML5
9. Add collection export/import functionality
10. Handle unsaved changes warning

---

### 3. Save/Load Requests

#### Purpose
Allow users to save the current request to a collection and load saved requests.

#### User Flows

**Save Current Request**
1. User composes request in editor
2. Clicks "Save" button (or Cmd+S)
3. If new request: Modal prompts for name and collection location
4. If existing request: Saves in place (or prompts for "Save As")
5. Request appears in FileExplorer under selected location

**Load Saved Request**
1. User clicks request in FileExplorer
2. Request loads into editor (URL, method, headers, body)
3. Title bar shows request name
4. Subsequent saves update this request

#### UI Components

**SaveRequestModal.svelte**
- Request name input
- Collection/folder tree selector
- Create new folder inline
- Save / Cancel buttons

**Request Editor Title Bar**
- Shows current request name (or "Untitled Request")
- Unsaved indicator (dot or asterisk)
- Save button (icon)
- More menu: Save As, Duplicate, Delete

#### State Management

```typescript
// In main page state
interface EditorState {
  currentRequest: SavedRequest | null;  // null = new unsaved request
  isDirty: boolean;                      // Has unsaved changes
  // ... existing state (url, method, headers, body)
}
```

#### Implementation Tasks

1. Add `currentRequest` and `isDirty` to page state
2. Create `SaveRequestModal.svelte`
3. Add title bar component with request name
4. Implement save flow (new vs existing)
5. Implement "Save As" functionality
6. Add unsaved changes detection
7. Prompt before loading new request if dirty
8. Add keyboard shortcuts (Cmd+S, Cmd+Shift+S)

---

### 4. Environment Variables

#### Purpose
Define variables that can be substituted into URLs, headers, and request bodies, enabling environment-specific configurations (dev, staging, prod).

#### Data Model

```typescript
interface Environment {
  id: string;
  name: string;                  // e.g., "Development", "Production"
  variables: EnvironmentVariable[];
  createdAt: number;
  updatedAt: number;
}

interface EnvironmentVariable {
  key: string;                   // e.g., "BASE_URL", "API_KEY"
  value: string;                 // e.g., "https://api.dev.example.com"
  enabled: boolean;
}
```

#### Variable Syntax

- **Syntax**: `{{VARIABLE_NAME}}`
- **Examples**:
  - URL: `{{BASE_URL}}/users/{{USER_ID}}`
  - Header: `Authorization: Bearer {{API_TOKEN}}`
  - Body: `{"apiKey": "{{API_KEY}}"}`

#### Storage Strategy

- **Location**: Tauri filesystem (alongside collections)
- **File**: `$APPDATA/http-request-studio/environments.json`

#### UI Components

**EnvironmentSelector.svelte**
- Dropdown in top toolbar showing active environment
- "No Environment" option
- Quick-add variable from dropdown
- "Manage Environments" link

**EnvironmentManager.svelte** (Modal)
- List of environments (create, rename, delete)
- Variable editor table for selected environment
- Import/export environment files
- Duplicate environment

**Variable Highlighting**
- In URL input: Highlight `{{...}}` syntax with distinct color
- In headers: Same highlighting
- In JSON editor: Same highlighting
- Unresolved variables shown in red/warning color

#### Substitution Logic

```typescript
// src/lib/variableSubstitution.ts

function substituteVariables(
  text: string,
  variables: Record<string, string>
): SubstitutionResult {
  const pattern = /\{\{(\w+)\}\}/g;
  const unresolved: string[] = [];

  const result = text.replace(pattern, (match, varName) => {
    if (varName in variables) {
      return variables[varName];
    }
    unresolved.push(varName);
    return match; // Keep original if not found
  });

  return { result, unresolved };
}
```

#### Request Flow Integration

1. User clicks "Send"
2. System collects active environment variables
3. Substitute variables in URL, headers, body
4. If unresolved variables exist: Show warning modal
5. Send substituted request via Tauri
6. History stores both original (with `{{}}`) and resolved values

#### Implementation Tasks

1. Define Environment types in `src/lib/types.ts`
2. Add Rust commands for environment CRUD
3. Create `environmentStore.ts` Svelte store
4. Implement `EnvironmentSelector.svelte` dropdown
5. Implement `EnvironmentManager.svelte` modal
6. Create `variableSubstitution.ts` utility
7. Add variable highlighting to UrlConfig, HeadersEditor, JsonEditor
8. Integrate substitution into request send flow
9. Add unresolved variable warning modal
10. Store original + resolved in history

---

## Technical Architecture

### New File Structure

```
src/
├── lib/
│   ├── types.ts                 # Shared TypeScript types
│   ├── stores/
│   │   ├── historyStore.ts      # Request history state
│   │   ├── collectionsStore.ts  # Collections state
│   │   └── environmentStore.ts  # Environments state
│   └── utils/
│       ├── variableSubstitution.ts
│       ├── uuid.ts              # UUID generation
│       └── dateUtils.ts         # Date formatting/grouping
├── components/
│   ├── history/
│   │   └── HistoryPanel.svelte
│   ├── collections/
│   │   ├── FileExplorer.svelte  # (refactored)
│   │   └── SaveRequestModal.svelte
│   ├── environments/
│   │   ├── EnvironmentSelector.svelte
│   │   └── EnvironmentManager.svelte
│   └── shared/
│       ├── Modal.svelte         # Reusable modal component
│       ├── ContextMenu.svelte   # Right-click menu
│       └── ConfirmDialog.svelte # Confirmation prompts
│   └── ... (existing components)
└── routes/
    └── +page.svelte             # (enhanced with new state)

src-tauri/
└── src/
    └── lib.rs                   # + collection/environment commands
```

### State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Svelte Stores                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ historyStore │ │ collections  │ │ environmentStore │ │
│  │ (localStorage│ │    Store     │ │    (Tauri FS)    │ │
│  │     sync)    │ │  (Tauri FS)  │ │                  │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Tauri Commands                         │
│  proxy_request | list_collections | save_collection     │
│  get_collection | delete_collection | save_environments │
│  load_environments | export_collection | import_...     │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Rust Backend                           │
│  reqwest (HTTP) | std::fs (File I/O) | serde (JSON)     │
└─────────────────────────────────────────────────────────┘
```

---

## UI/UX Design Guidelines

### Layout Updates

The main layout shifts from single-panel to resizable three-panel:

```
┌────────────────────────────────────────────────────────────┐
│ [Logo] HTTP Request Studio    [Env: Development ▼] [Theme] │
├──────────────┬─────────────────────────────────────────────┤
│ Collections  │  [GET ▼] [{{BASE_URL}}/api/users_________]  │
│  📁 My API   │  ┌─────────────────────────────────────────┐│
│    📄 Get    │  │ Headers  │ Body  │ Auth                 ││
│    📄 Create │  ├─────────────────────────────────────────┤│
│  📁 Other    │  │ Content-Type: application/json          ││
│──────────────│  │ Authorization: Bearer {{TOKEN}}         ││
│ History      │  └─────────────────────────────────────────┘│
│  Today       │─────────────────────────────────────────────│
│   GET /api.. │  Response (200 OK) - 145ms                  │
│   POST /user │  ┌─────────────────────────────────────────┐│
│  Yesterday   │  │ { "id": 1, "name": "John" }             ││
│   ...        │  └─────────────────────────────────────────┘│
└──────────────┴─────────────────────────────────────────────┘
```

### Neumorphic Component Patterns

Extend existing design system for new components:

- **Sidebar panels**: Inset shadow for "pressed" sections
- **Tree items**: Subtle hover state, selected state with accent color
- **Modals**: Raised card with soft outer shadow
- **Dropdowns**: Match existing button style with chevron
- **Context menus**: Floating card with shadow, rounded corners

### Color Palette Extension

```css
:root {
  /* Existing colors... */

  /* New semantic colors */
  --color-method-get: #61affe;
  --color-method-post: #49cc90;
  --color-method-put: #fca130;
  --color-method-delete: #f93e3e;
  --color-method-patch: #50e3c2;

  --color-variable: #e5c07b;      /* {{variable}} highlighting */
  --color-variable-unresolved: #e06c75;

  --color-status-success: #49cc90;
  --color-status-error: #f93e3e;
  --color-status-warning: #fca130;
}
```

---

## Implementation Plan

### Phase 2.1: Foundation (Week 1)

1. Set up `src/lib/` directory structure
2. Create shared types in `types.ts`
3. Implement reusable Modal and ConfirmDialog components
4. Add Rust filesystem utilities for app data directory
5. Remove unused `svelte-jsoneditor` dependency
6. Add HEAD/OPTIONS method buttons to UI

### Phase 2.2: Request History (Week 2)

1. Implement `historyStore.ts` with localStorage
2. Create `HistoryPanel.svelte` component
3. Integrate history recording into request flow
4. Add date grouping and search/filter
5. Implement context menu actions

### Phase 2.3: Collections Backend (Week 3)

1. Define Rust structs for collections
2. Implement Tauri CRUD commands
3. Create `collectionsStore.ts`
4. Set up filesystem persistence

### Phase 2.4: Collections UI (Week 4)

1. Refactor `FileExplorer.svelte` to use store
2. Implement folder/request CRUD operations
3. Add drag-and-drop reordering
4. Create `SaveRequestModal.svelte`
5. Implement save/load request flows

### Phase 2.5: Environment Variables (Week 5)

1. Implement environment Tauri commands
2. Create `environmentStore.ts`
3. Build `EnvironmentSelector.svelte`
4. Build `EnvironmentManager.svelte`
5. Implement variable substitution logic
6. Add syntax highlighting for variables
7. Integrate into request flow

### Phase 2.6: Polish & Testing (Week 6)

1. Keyboard shortcuts implementation
2. Unsaved changes warnings
3. Error handling improvements
4. Manual testing across platforms
5. Performance optimization
6. Documentation updates

---

## Testing Strategy

### Manual Test Cases

#### History
- [ ] Request automatically added to history after send
- [ ] History persists after app restart
- [ ] Click history item loads request into editor
- [ ] Search filters history correctly
- [ ] Clear history removes all entries
- [ ] History respects 100-item limit

#### Collections
- [ ] Create new collection
- [ ] Create folder within collection
- [ ] Save request to collection
- [ ] Load request from collection
- [ ] Rename folder/request inline
- [ ] Delete folder (with children warning)
- [ ] Drag-and-drop reorder works
- [ ] Collections persist after restart

#### Environment Variables
- [ ] Create new environment
- [ ] Add/edit/delete variables
- [ ] Switch active environment
- [ ] Variables substitute in URL
- [ ] Variables substitute in headers
- [ ] Variables substitute in body
- [ ] Unresolved variable warning appears
- [ ] Environments persist after restart

---

## Success Criteria

Phase 2 is complete when:

1. Users can send a request and see it automatically appear in history
2. Users can save requests to organized collections
3. Users can define environment variables and use them in requests
4. All data persists across application restarts
5. UI remains responsive with 100+ history items and multiple collections
6. Feature parity maintained across macOS, Windows, Linux

---

## Open Questions

1. **History limit**: Is 100 entries sufficient, or should it be user-configurable?
2. **Sync**: Should collections support cloud sync in a future phase?
3. **Import priority**: Should cURL import be moved earlier in roadmap?
4. **Variable scoping**: Should variables support collection-level scoping in addition to environment-level?

---

## Appendix: Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Send Request | Cmd+Enter | Ctrl+Enter |
| Save Request | Cmd+S | Ctrl+S |
| Save As | Cmd+Shift+S | Ctrl+Shift+S |
| New Request | Cmd+N | Ctrl+N |
| Toggle History | Cmd+H | Ctrl+H |
| Toggle Collections | Cmd+E | Ctrl+E |
| Focus URL | Cmd+L | Ctrl+L |
