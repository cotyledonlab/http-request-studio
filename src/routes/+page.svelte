<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import FileExplorer from '../components/FileExplorer.svelte';
  import JsonEditor from '../components/JsonEditor.svelte';
  import UrlConfig from '../components/UrlConfig.svelte';
  import RequestStatus from '../components/RequestStatus.svelte';
  import HeadersEditor from '../components/HeadersEditor.svelte';
  import JsonTreeViewer from '../components/JsonTreeViewer.svelte';
  import ThemeToggle from '../components/ThemeToggle.svelte';
  import HistoryPanel from '../components/history/HistoryPanel.svelte';
  import SaveRequestModal from '../components/collections/SaveRequestModal.svelte';
  import EnvironmentSelector from '../components/environments/EnvironmentSelector.svelte';
  import EnvironmentManager from '../components/environments/EnvironmentManager.svelte';
  import ConfirmDialog from '../components/shared/ConfirmDialog.svelte';
  import Modal from '../components/shared/Modal.svelte';

  import type { Header, HttpMethod, HistoryEntry, RequestPayload, SavedRequest } from '../lib/types';
  import { addHistoryEntry } from '../lib/stores/historyStore';
  import { createId } from '../lib/utils/uuid';
  import { substituteVariables } from '../lib/utils/variableSubstitution';
  import {
    loadEnvironments,
    environmentsStore,
    activeEnvironmentId,
    setActiveEnvironment
  } from '../lib/stores/environmentStore';
  import {
    activeCollection,
    activeCollectionId,
    createCollection,
    updateActiveCollection,
    persistActiveCollection
  } from '../lib/stores/collectionsStore';
  import {
    addItemToFolder,
    flattenFolders,
    updateItemById,
    removeItemById
  } from '../lib/utils/collectionUtils';

  let jsonData: Record<string, unknown> = {};
  let response: unknown = '';
  let isJsonResponse = false;
  let responseHeaders: Record<string, string> = {};
  let statusCode: number | null = null;
  let requestUrl = 'https://api.example.com/endpoint';
  let requestMethod: HttpMethod = 'GET';
  let loading = false;
  let error: string | null = null;
  let lastRequestTime: string | null = null;
  let requestDuration: number | null = null;
  let headers: Header[] = [
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: '', value: '', enabled: true }
  ];
  let lastRequestBody: string | null = null;
  let lastRequestBodyJson: unknown = null;
  let isJsonRequestBody = false;

  let showHistory = true;
  let showCollections = true;
  let showSaveModal = false;
  let showEnvManager = false;
  let showUnresolvedModal = false;
  let unresolvedVariables: string[] = [];
  let pendingSendPayload: { original: RequestPayload; resolved: RequestPayload } | null = null;

  let currentRequest: SavedRequest | null = null;
  let currentCollectionId: string | null = null;
  let baselineHash = '';
  let isDirty = false;
  let showDiscardConfirm = false;
  let pendingLoadAction: (() => void) | null = null;

  let urlInputRef: HTMLInputElement | null = null;
  let saveFolderId: string | null = null;
  let saveDefaultName = '';

  const methodsWithBody: HttpMethod[] = ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

  $: activeEnv = $environmentsStore.find((env) => env.id === $activeEnvironmentId) ?? null;
  $: activeVariables = activeEnv
    ? Object.fromEntries(
        activeEnv.variables
          .filter((variable) => variable.enabled && variable.key.trim())
          .map((variable) => [variable.key, variable.value])
      )
    : {};
  $: folderOptions = $activeCollection ? flattenFolders($activeCollection.items) : [];
  $: displayRequestName = currentRequest?.name ?? 'Untitled Request';
  $: currentPayloadHash = JSON.stringify(buildRequestPayload());
  $: isDirty = currentPayloadHash !== baselineHash;

  onMount(() => {
    void loadEnvironments();
    markClean();

    const handler = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'enter') {
        event.preventDefault();
        void sendRequest();
      }

      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (event.shiftKey) {
          void handleSaveRequest(true);
        } else {
          void handleSaveRequest(false);
        }
      }

      if (modifier && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleNewRequest();
      }

      if (modifier && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        showHistory = !showHistory;
      }

      if (modifier && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        showCollections = !showCollections;
      }

      if (modifier && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        urlInputRef?.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  onDestroy(() => {
    pendingLoadAction = null;
  });

  function buildRequestPayload(): RequestPayload {
    return {
      url: requestUrl,
      method: requestMethod,
      headers,
      body: methodsWithBody.includes(requestMethod) ? JSON.stringify(jsonData) : null
    };
  }

  function markClean(payload: RequestPayload = buildRequestPayload()) {
    baselineHash = JSON.stringify(payload);
  }

  function getEnabledHeaders(list: Header[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const header of list) {
      const trimmedKey = header.key.trim();
      if (header.enabled && trimmedKey) {
        result[trimmedKey] = header.value;
      }
    }
    return result;
  }

  function parseBody(body: string | null) {
    if (!body) {
      lastRequestBody = null;
      lastRequestBodyJson = null;
      isJsonRequestBody = false;
      return;
    }
    lastRequestBody = body;
    try {
      lastRequestBodyJson = JSON.parse(body);
      isJsonRequestBody = true;
    } catch {
      lastRequestBodyJson = null;
      isJsonRequestBody = false;
    }
  }

  function resolveRequest(payload: RequestPayload) {
    const unresolved = new Set<string>();
    const resolvedUrl = substituteVariables(payload.url, activeVariables);
    resolvedUrl.unresolved.forEach((name) => unresolved.add(name));

    const resolvedHeaders = payload.headers.map((header) => {
      const resolvedKey = substituteVariables(header.key, activeVariables);
      const resolvedValue = substituteVariables(header.value, activeVariables);
      resolvedKey.unresolved.forEach((name) => unresolved.add(name));
      resolvedValue.unresolved.forEach((name) => unresolved.add(name));
      return {
        ...header,
        key: resolvedKey.result,
        value: resolvedValue.result
      };
    });

    const resolvedBody = payload.body
      ? substituteVariables(payload.body, activeVariables)
      : { result: null, unresolved: [] };
    resolvedBody.unresolved.forEach((name) => unresolved.add(name));

    const resolvedPayload: RequestPayload = {
      ...payload,
      url: resolvedUrl.result,
      headers: resolvedHeaders,
      body: resolvedBody.result
    };

    return { payload: resolvedPayload, unresolved: Array.from(unresolved) };
  }

  async function sendRequest() {
    const originalPayload = buildRequestPayload();
    const resolved = resolveRequest(originalPayload);

    if (resolved.unresolved.length > 0) {
      unresolvedVariables = resolved.unresolved;
      pendingSendPayload = { original: originalPayload, resolved: resolved.payload };
      showUnresolvedModal = true;
      return;
    }

    await executeSend(originalPayload, resolved.payload);
  }

  async function executeSend(originalPayload: RequestPayload, resolvedPayload: RequestPayload) {
    loading = true;
    error = null;
    response = '';
    isJsonResponse = false;
    responseHeaders = {};
    statusCode = null;
    requestDuration = null;
    parseBody(resolvedPayload.body);

    const startTime = performance.now();

    let responseBody = '';
    let responseHeadersRecord: Record<string, string> = {};
    let responseStatus = 0;

    try {
      const result = await invoke<{
        status: number;
        headers: Record<string, string>;
        body: string;
      }>('proxy_request', {
        url: resolvedPayload.url,
        method: resolvedPayload.method,
        headers: getEnabledHeaders(resolvedPayload.headers),
        body: resolvedPayload.body
      });

      requestDuration = Math.round(performance.now() - startTime);
      statusCode = result.status;
      responseHeadersRecord = result.headers;
      responseStatus = result.status;
      responseHeaders = result.headers;
      responseBody = result.body;

      try {
        response = JSON.parse(result.body);
        isJsonResponse = true;
      } catch {
        response = result.body;
        isJsonResponse = false;
      }

      lastRequestTime = new Date().toLocaleTimeString();
    } catch (err) {
      requestDuration = Math.round(performance.now() - startTime);
      error = err instanceof Error ? err.message : String(err);
      response = '';
    } finally {
      loading = false;

      const entry: HistoryEntry = {
        id: createId(),
        timestamp: Date.now(),
        request: originalPayload,
        resolvedRequest: resolvedPayload,
        response: error
          ? null
          : {
              status: responseStatus,
              statusText: '',
              headers: responseHeadersRecord,
              body: responseBody,
              duration: requestDuration ?? 0
            },
        error
      };
      addHistoryEntry(entry);
    }
  }

  function handleHistorySelect(event: CustomEvent<HistoryEntry>) {
    const entry = event.detail;
    withDirtyCheck(() => loadRequest(entry.request, null, null));
  }

  function handleRequestSelect(event: CustomEvent<SavedRequest>) {
    const selected = event.detail;
    withDirtyCheck(() => loadRequest(selected.request, selected, $activeCollectionId));
  }

  function loadRequest(payload: RequestPayload, saved: SavedRequest | null, collectionId: string | null) {
    requestUrl = payload.url;
    requestMethod = payload.method;
    headers = payload.headers.length ? payload.headers : [{ key: '', value: '', enabled: true }];

    if (payload.body) {
      try {
        jsonData = JSON.parse(payload.body);
      } catch {
        jsonData = {};
      }
    } else {
      jsonData = {};
    }

    currentRequest = saved;
    currentCollectionId = collectionId;
    markClean(payload);
  }

  async function handleSaveRequest(forceSaveAs: boolean) {
    if (currentRequest && !forceSaveAs) {
      await saveExistingRequest();
      return;
    }

    if (!$activeCollection) {
      const name = window.prompt('Create a collection to save this request');
      if (!name) return;
      await createCollection(name.trim());
    }

    saveFolderId = null;
    saveDefaultName = currentRequest?.name ?? requestUrl;
    showSaveModal = true;
  }

  async function saveExistingRequest() {
    if (!currentRequest || !$activeCollection || !$activeCollectionId) return;
    const targetRequest = currentRequest;

    const payload = buildRequestPayload();
    const now = Date.now();
    const updatedRequest: SavedRequest = {
      ...targetRequest,
      request: payload,
      updatedAt: now
    };

    updateActiveCollection((collection) => ({
      ...collection,
      items: updateItemById(collection.items, targetRequest.id, (item) =>
        item.type === 'request' ? updatedRequest : item
      ),
      updatedAt: now
    }));

    await persistActiveCollection();
    currentRequest = updatedRequest;
    currentCollectionId = $activeCollectionId;
    markClean(payload);
  }

  async function handleSaveModal(event: CustomEvent<{ name: string; folderId: string | null }>) {
    if (!$activeCollection || !$activeCollectionId) return;

    const payload = buildRequestPayload();
    const now = Date.now();
    const saved: SavedRequest = {
      type: 'request',
      id: createId(),
      name: event.detail.name,
      request: payload,
      createdAt: now,
      updatedAt: now
    };

    updateActiveCollection((collection) => ({
      ...collection,
      items: addItemToFolder(collection.items, event.detail.folderId, saved),
      updatedAt: now
    }));

    await persistActiveCollection();
    currentRequest = saved;
    currentCollectionId = $activeCollectionId;
    markClean(payload);
    showSaveModal = false;
  }

  function handleSaveFolderCreate(event: CustomEvent<{ name: string; parentId: string | null }>) {
    if (!$activeCollection) return;
    const folder = {
      type: 'folder' as const,
      id: createId(),
      name: event.detail.name,
      items: [],
      expanded: true
    };

    updateActiveCollection((collection) => ({
      ...collection,
      items: addItemToFolder(collection.items, event.detail.parentId, folder),
      updatedAt: Date.now()
    }));
  }

  async function handleDeleteRequest() {
    if (!currentRequest || !$activeCollection) return;
    const targetRequest = currentRequest;
    updateActiveCollection((collection) => {
      const result = removeItemById(collection.items, targetRequest.id);
      return { ...collection, items: result.items, updatedAt: Date.now() };
    });
    await persistActiveCollection();
    handleNewRequest();
  }

  function handleNewRequest() {
    requestUrl = 'https://api.example.com/endpoint';
    requestMethod = 'GET';
    headers = [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: '', value: '', enabled: true }
    ];
    jsonData = {};
    currentRequest = null;
    currentCollectionId = null;
    markClean();
  }

  function withDirtyCheck(action: () => void) {
    if (isDirty) {
      pendingLoadAction = action;
      showDiscardConfirm = true;
      return;
    }
    action();
  }
</script>

<main class="container">
  <header class="app-header">
    <div class="brand">
      <h1>HTTP Request Studio</h1>
      <button class="ghost" on:click={handleNewRequest}>New</button>
    </div>
    <div class="header-actions">
      <EnvironmentSelector
        environments={$environmentsStore}
        activeId={$activeEnvironmentId}
        on:select={(event) => setActiveEnvironment(event.detail)}
        on:manage={() => (showEnvManager = true)}
      />
      <button class="ghost" on:click={() => (showCollections = !showCollections)}>
        {showCollections ? 'Hide Collections' : 'Show Collections'}
      </button>
      <button class="ghost" on:click={() => (showHistory = !showHistory)}>
        {showHistory ? 'Hide History' : 'Show History'}
      </button>
      <ThemeToggle />
    </div>
  </header>

  <div class="workspace">
    <div class="sidebar">
      {#if showCollections}
        <FileExplorer selectedRequestId={currentRequest?.id ?? null} on:requestSelect={handleRequestSelect} />
      {/if}
      {#if showHistory}
        <HistoryPanel on:select={handleHistorySelect} />
      {/if}
    </div>

    <div class="editor-section">
      <div class="request-title">
        <div class="name">
          {displayRequestName}
          {#if isDirty}
            <span class="dirty">*</span>
          {/if}
        </div>
        <div class="title-actions">
          <button on:click={() => handleSaveRequest(false)} disabled={!isDirty}>
            Save
          </button>
          <button on:click={() => handleSaveRequest(true)}>Save As</button>
          {#if currentRequest}
            <button class="danger" on:click={handleDeleteRequest}>Delete</button>
          {/if}
        </div>
      </div>

      <UrlConfig bind:url={requestUrl} bind:method={requestMethod} bind:inputRef={urlInputRef} variables={activeVariables} />
      <HeadersEditor bind:headers={headers} variables={activeVariables} />
      {#if methodsWithBody.includes(requestMethod)}
        <JsonEditor bind:value={jsonData} variables={activeVariables} />
      {/if}
      <button class="send-btn" on:click={sendRequest} disabled={loading}>
        {#if loading}
          <span class="spinner"></span>
          Sending...
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          Send
        {/if}
      </button>
      <RequestStatus {loading} {error} {lastRequestTime} />
      {#if statusCode !== null || error}
        <div class="response-section">
          <div class="response-meta">
            {#if statusCode !== null}
              <span class="status-badge" class:success={statusCode >= 200 && statusCode < 300} class:error={statusCode >= 400}>
                {statusCode}
              </span>
            {/if}
            {#if requestDuration !== null}
              <span class="duration">{requestDuration}ms</span>
            {/if}
          </div>

          {#if lastRequestBody}
            <details class="request-body" open>
              <summary>Request Body</summary>
              {#if isJsonRequestBody && lastRequestBodyJson}
                <JsonTreeViewer data={lastRequestBodyJson} />
              {:else}
                <pre class="raw-response">{lastRequestBody}</pre>
              {/if}
            </details>
          {/if}

          {#if Object.keys(responseHeaders).length > 0}
            <details class="response-headers">
              <summary>Response Headers ({Object.keys(responseHeaders).length})</summary>
              <div class="headers-content">
                {#each Object.entries(responseHeaders) as [key, value]}
                  <div class="header-item">
                    <span class="header-key">{key}:</span>
                    <span class="header-value">{value}</span>
                  </div>
                {/each}
              </div>
            </details>
          {/if}

          {#if response}
            <div class="response-body">
              <h3>Response Body</h3>
              {#if isJsonResponse}
                <JsonTreeViewer data={response} />
              {:else}
                <pre class="raw-response">{response}</pre>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</main>

<SaveRequestModal
  open={showSaveModal}
  collection={$activeCollection}
  defaultName={saveDefaultName}
  selectedFolderId={saveFolderId}
  {folderOptions}
  on:save={handleSaveModal}
  on:createFolder={handleSaveFolderCreate}
  on:close={() => (showSaveModal = false)}
/>

<EnvironmentManager bind:open={showEnvManager} />

<ConfirmDialog
  open={showDiscardConfirm}
  title="Discard changes?"
  message="You have unsaved changes. Loading a different request will discard them."
  confirmText="Discard"
  danger
  on:confirm={() => {
    pendingLoadAction?.();
    pendingLoadAction = null;
    showDiscardConfirm = false;
  }}
  on:cancel={() => (showDiscardConfirm = false)}
/>

<Modal
  open={showUnresolvedModal}
  title="Unresolved variables"
  on:close={() => {
    showUnresolvedModal = false;
    unresolvedVariables = [];
    pendingSendPayload = null;
  }}
>
  <p>The request contains variables without values:</p>
  <ul class="unresolved-list">
    {#each unresolvedVariables as variable}
      <li>{`{{${variable}}}`}</li>
    {/each}
  </ul>
  <div slot="actions" class="actions">
    <button class="secondary" on:click={() => (showUnresolvedModal = false)}>Cancel</button>
    <button
      on:click={() => {
        if (pendingSendPayload) {
          void executeSend(pendingSendPayload.original, pendingSendPayload.resolved);
        }
        pendingSendPayload = null;
        unresolvedVariables = [];
        showUnresolvedModal = false;
      }}
    >
      Send Anyway
    </button>
  </div>
</Modal>

<style>
:root, :global([data-theme="light"]) {
  /* Modern Light Theme - Clean & Crisp */
  --background: #ffffff;
  --background-secondary: #f8fafc;
  --background-tertiary: #f1f5f9;
  --text: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-color-strong: #cbd5e1;

  /* Accent Colors */
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --primary-light: #eff6ff;
  --success: #10b981;
  --success-light: #ecfdf5;
  --warning: #f59e0b;
  --warning-light: #fffbeb;
  --error: #ef4444;
  --error-light: #fef2f2;

  /* Method Badge Colors */
  --method-get: #10b981;
  --method-post: #3b82f6;
  --method-put: #f59e0b;
  --method-delete: #ef4444;
  --method-patch: #8b5cf6;
  --method-head: #6b7280;
  --method-options: #6b7280;

  /* JSON Tree Colors */
  --key-color: #be185d;
  --string-color: #059669;
  --number-color: #d97706;
  --boolean-color: #2563eb;
  --null-color: #7c3aed;
  --bracket-color: #64748b;
  --hover-bg: rgba(59, 130, 246, 0.08);
  --success-color: #10b981;

  /* Variable Highlight */
  --color-variable: rgba(229, 192, 123, 0.4);
  --color-variable-unresolved: rgba(224, 108, 117, 0.4);

  /* Shadows - Subtle & Modern */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);

  /* Legacy neumorphic vars (for gradual migration) */
  --shadow-light: transparent;
  --shadow-dark: rgba(0, 0, 0, 0.08);

  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;

  color: var(--text);
  background-color: var(--background-secondary);

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

:global([data-theme="dark"]) {
  /* Modern Dark Theme - Deep & Rich */
  --background: #0f172a;
  --background-secondary: #1e293b;
  --background-tertiary: #334155;
  --text: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: #334155;
  --border-color-strong: #475569;

  /* Accent Colors (slightly brighter for dark mode) */
  --primary: #60a5fa;
  --primary-hover: #3b82f6;
  --primary-light: rgba(59, 130, 246, 0.15);
  --success: #34d399;
  --success-light: rgba(16, 185, 129, 0.15);
  --warning: #fbbf24;
  --warning-light: rgba(245, 158, 11, 0.15);
  --error: #f87171;
  --error-light: rgba(239, 68, 68, 0.15);

  /* Method Badge Colors */
  --method-get: #34d399;
  --method-post: #60a5fa;
  --method-put: #fbbf24;
  --method-delete: #f87171;
  --method-patch: #a78bfa;
  --method-head: #9ca3af;
  --method-options: #9ca3af;

  /* JSON Tree Colors - One Dark inspired */
  --key-color: #f472b6;
  --string-color: #34d399;
  --number-color: #fbbf24;
  --boolean-color: #60a5fa;
  --null-color: #a78bfa;
  --bracket-color: #94a3b8;
  --hover-bg: rgba(96, 165, 250, 0.1);
  --success-color: #34d399;

  /* Variable Highlight */
  --color-variable: rgba(229, 192, 123, 0.35);
  --color-variable-unresolved: rgba(248, 113, 113, 0.35);

  /* Shadows - Subtle for dark mode */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3);

  /* Legacy neumorphic vars */
  --shadow-light: transparent;
  --shadow-dark: rgba(0, 0, 0, 0.3);

  color: var(--text);
  background-color: var(--background);
}

.container {
  margin: 0;
  min-height: 100vh;
  padding: 1.5rem;
  background-color: var(--background-secondary);
  color: var(--text);
}

h1 {
  color: var(--text);
  margin-bottom: 1rem;
  font-weight: 600;
}

/* Primary Send Button */
button.send-btn {
  background: var(--primary);
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: var(--shadow-md);
  transition: all 0.15s ease;
  margin: 1.5rem 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

button.send-btn:hover {
  background: var(--primary-hover);
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

button.send-btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

button.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

pre {
  background: var(--background);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  text-align: left;
  margin-top: 0.75rem;
  font-size: 0.85rem;
}

:global(a) {
  font-weight: 500;
  color: var(--primary);
  text-decoration: none;
}

:global(a:hover) {
  text-decoration: underline;
}

:global(input),
:global(button),
:global(select),
:global(textarea) {
  border-radius: 6px;
  border: 1px solid var(--border-color);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  color: var(--text);
  background-color: var(--background);
  transition: all 0.15s ease;
}

:global(input:focus),
:global(textarea:focus),
:global(select:focus) {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

:global(button) {
  cursor: pointer;
}

:global(button:hover) {
  background-color: var(--background-tertiary);
  border-color: var(--border-color-strong);
}

:global(button:active) {
  background-color: var(--background-tertiary);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ghost {
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
}

.request-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.request-title .name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.request-title .dirty {
  margin-left: 0.25rem;
  color: var(--warning);
}

.title-actions {
  display: flex;
  gap: 0.5rem;
}

.title-actions button {
  padding: 0.4rem 0.7rem;
  font-size: 0.8rem;
}

.title-actions .danger {
  border-color: var(--error);
  color: var(--error);
}

.response-body {
  width: 100%;
}

.raw-response {
  background: var(--background);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow-x: auto;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-secondary);
}

/* Smooth theme transitions */
:global(*) {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.workspace {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: flex-start;
  gap: 1.5rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--background);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.response-section {
  width: 100%;
  margin-top: 0.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.response-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
  font-family: 'SF Mono', monospace;
  background: var(--background-tertiary);
  border: 1px solid var(--border-color);
}

.status-badge.success {
  color: var(--success);
  background: var(--success-light);
  border-color: var(--success);
}

.status-badge.error {
  color: var(--error);
  background: var(--error-light);
  border-color: var(--error);
}

.duration {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-family: 'SF Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: var(--background-tertiary);
  border: 1px solid var(--border-color);
}

.response-headers {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--background-tertiary);
  border: 1px solid var(--border-color);
}

.response-headers summary,
.request-body summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
  user-select: none;
}

.response-headers summary:hover,
.request-body summary:hover {
  color: var(--primary);
}

.headers-content {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.header-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-family: 'SF Mono', monospace;
  font-size: 0.8rem;
}

.header-key {
  color: var(--primary);
  font-weight: 500;
}

.header-value {
  color: var(--text-secondary);
  word-break: break-all;
}

.response-section h3 {
  margin: 1rem 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.request-body {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--background-tertiary);
  border: 1px solid var(--border-color);
}

.unresolved-list {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--text-secondary);
}

.unresolved-list li {
  font-family: 'SF Mono', monospace;
  font-size: 0.8rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.actions button {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--background);
}

.actions button:not(.secondary) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.actions .secondary {
  background: transparent;
}

/* Loading spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 960px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .sidebar {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
