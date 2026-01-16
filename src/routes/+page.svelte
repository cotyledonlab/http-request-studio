<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import FileExplorer from '../components/FileExplorer.svelte';
  import JsonEditor from '../components/JsonEditor.svelte';
  import UrlConfig from '../components/UrlConfig.svelte';
  import RequestStatus from '../components/RequestStatus.svelte';
  import HeadersEditor from '../components/HeadersEditor.svelte';
  import JsonTreeViewer from '../components/JsonTreeViewer.svelte';
  import ThemeToggle from '../components/ThemeToggle.svelte';

  type Header = { key: string; value: string; enabled: boolean };

  let jsonData: Record<string, unknown> = {};
  let response: unknown = '';
  let isJsonResponse = false;
  let responseHeaders: Record<string, string> = {};
  let statusCode: number | null = null;
  let requestUrl = 'https://api.example.com/endpoint';
  let requestMethod = 'GET';
  let loading = false;
  let error: string | null = null;
  let lastRequestTime: string | null = null;
  let requestDuration: number | null = null;
  let headers: Header[] = [
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: '', value: '', enabled: true }
  ];

  function getEnabledHeaders(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const h of headers) {
      const trimmedKey = h.key.trim();
      if (h.enabled && trimmedKey) {
        result[trimmedKey] = h.value;
      }
    }
    return result;
  }

  async function sendRequest() {
    loading = true;
    error = null;
    response = '';
    isJsonResponse = false;
    responseHeaders = {};
    statusCode = null;
    requestDuration = null;
    
    const startTime = performance.now();
    
    try {
      const result = await invoke<{
        status: number;
        headers: Record<string, string>;
        body: string;
      }>('proxy_request', {
        url: requestUrl,
        method: requestMethod,
        headers: getEnabledHeaders(),
        body: requestMethod !== 'GET' && requestMethod !== 'HEAD' ? JSON.stringify(jsonData) : null
      });
      
      requestDuration = Math.round(performance.now() - startTime);
      statusCode = result.status;
      responseHeaders = result.headers;
      
      // Try to parse as JSON for tree viewer
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
      error = err instanceof Error 
        ? err.message
        : String(err);
      response = '';
    } finally {
      loading = false;
    }
  }

  function handleFileSelect(event: CustomEvent) {
    console.log('Selected file:', event.detail);
    // Handle file selection here
  }
</script>

<main class="container">
  <header class="app-header">
    <h1>HTTP Request Studio</h1>
    <ThemeToggle />
  </header>
  <div class="workspace">
    <FileExplorer on:fileSelect={handleFileSelect}/>
    <div class="editor-section">
      <UrlConfig bind:url={requestUrl} bind:method={requestMethod} />
      <HeadersEditor bind:headers={headers} />
      {#if requestMethod !== 'GET'}
        <JsonEditor bind:value={jsonData} />
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
      <RequestStatus 
        {loading}
        {error}
        {lastRequestTime}
      />
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
:global(button) {
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

:global(input:focus) {
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
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
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

.response-headers summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
  user-select: none;
}

.response-headers summary:hover {
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
</style>
