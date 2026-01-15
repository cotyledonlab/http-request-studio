<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import FileExplorer from '../components/FileExplorer.svelte';
  import JsonEditor from '../components/JsonEditor.svelte';
  import UrlConfig from '../components/UrlConfig.svelte';
  import RequestStatus from '../components/RequestStatus.svelte';
  import HeadersEditor from '../components/HeadersEditor.svelte';

  type Header = { key: string; value: string; enabled: boolean };

  let jsonData: Record<string, unknown> = {};
  let response = '';
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
      if (h.enabled && h.key.trim()) {
        result[h.key.trim()] = h.value;
      }
    }
    return result;
  }

  async function sendRequest() {
    loading = true;
    error = null;
    response = '';
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
        body: requestMethod !== 'GET' ? JSON.stringify(jsonData) : null
      });
      
      requestDuration = Math.round(performance.now() - startTime);
      statusCode = result.status;
      responseHeaders = result.headers;
      
      // Try to parse as JSON for pretty printing
      try {
        response = JSON.parse(result.body);
      } catch {
        response = result.body;
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
  <h1>HTTP Request Studio</h1>
  <div class="workspace">
    <FileExplorer on:fileSelect={handleFileSelect}/>
    <div class="editor-section">
      <UrlConfig bind:url={requestUrl} bind:method={requestMethod} />
      <HeadersEditor bind:headers={headers} />
      {#if requestMethod !== 'GET'}
        <JsonEditor bind:value={jsonData} />
      {/if}
      <button on:click={sendRequest} disabled={loading}>
        {loading ? 'Sending...' : 'Send Request'}
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
            <div>
              <h3>Response Body</h3>
              <pre>{typeof response === 'string' ? response : JSON.stringify(response, null, 2)}</pre>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
:root {
  --background: #e0e5ec;
  --text: #2d3436;
  --shadow-light: #ffffff;
  --shadow-dark: #a3b1c6;
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color: #0f0f0f;
  background-color: #f6f6f6;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.container {
  margin: 0;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--background);
  color: var(--text);
}

h1, h2 {
  color: var(--text);
  margin-bottom: 2rem;
}

button {
  background: var(--background);
  padding: 1rem 2rem;
  border: none;
  border-radius: 15px;
  color: var(--text);
  font-weight: bold;
  box-shadow: 5px 5px 10px var(--shadow-dark),
              -5px -5px 10px var(--shadow-light);
  transition: all 0.2s ease;
  margin: 2rem 0;
}

button:hover {
  box-shadow: 2px 2px 5px var (--shadow-dark),
              -2px -2px 5px var(--shadow-light);
}

button:active {
  box-shadow: inset 5px 5px 10px var(--shadow-dark),
              inset -5px -5px 10px var(--shadow-light);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

pre {
  background: var(--background);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: inset 5px 5px 10px var(--shadow-dark),
              inset -5px -5px 10px var(--shadow-light);
  text-align: left;
  margin-top: 1rem;
}

.logo.vite:hover {
  filter: drop-shadow(0 0 2em #747bff);
}

.logo.svelte-kit:hover {
  filter: drop-shadow(0 0 2em #ff3e00);
}

.row {
  display: flex;
  justify-content: center;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}

input,
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  transition: border-color 0.25s;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #396cd8;
}
button:active {
  border-color: #396cd8;
  background-color: #e8e8e8;
}

input,
button {
  outline: none;
}

#greet-input {
  margin-right: 5px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #2f2f2f;
    --text: #e0e5ec;
    --shadow-light: #3d3d3d;
    --shadow-dark: #222222;
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  a:hover {
    color: #24c8db;
  }

  input,
  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }
  button:active {
    background-color: #0f0f0f69;
  }
}

.workspace {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  padding: 2rem;
}

.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.response-section {
  width: 100%;
  margin-top: 1rem;
}

.response-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-weight: bold;
  font-family: monospace;
  background: var(--background);
  box-shadow: 3px 3px 6px var(--shadow-dark),
              -3px -3px 6px var(--shadow-light);
}

.status-badge.success {
  color: #27ae60;
}

.status-badge.error {
  color: #e74c3c;
}

.duration {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-family: monospace;
  color: var(--text);
  opacity: 0.7;
  background: var(--background);
  box-shadow: inset 2px 2px 4px var(--shadow-dark),
              inset -2px -2px 4px var(--shadow-light);
}

.response-headers {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: var(--background);
  box-shadow: 3px 3px 6px var(--shadow-dark),
              -3px -3px 6px var(--shadow-light);
}

.response-headers summary {
  cursor: pointer;
  font-weight: 500;
  color: var(--text);
}

.headers-content {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--shadow-dark);
}

.header-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-family: monospace;
  font-size: 0.85rem;
}

.header-key {
  color: #396cd8;
  font-weight: 500;
}

.header-value {
  color: var(--text);
  word-break: break-all;
}

.response-section h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1rem;
}
</style>
