<script lang="ts">
  import { invoke } from '@tauri-apps/api/tauri';
  import FileExplorer from '../components/FileExplorer.svelte';
  import JsonEditor from '../components/JsonEditor.svelte';
  import UrlConfig from '../components/UrlConfig.svelte';
  import RequestStatus from '../components/RequestStatus.svelte';

  let jsonData = {};
  let response = '';
  let requestUrl = 'https://api.example.com/endpoint';
  let requestMethod = 'GET';
  let loading = false;
  let error: string | null = null;
  let lastRequestTime: string | null = null;

  async function sendRequest() {
    loading = true;
    error = null;
    response = '';
    
    try {
      const result = await invoke('proxy_request', {
        url: requestUrl,
        method: requestMethod,
        body: requestMethod !== 'GET' ? jsonData : null
      });
      
      response = result;
      lastRequestTime = new Date().toLocaleTimeString();
    } catch (err) {
      error = err instanceof Error 
        ? err.message
        : 'An unknown error occurred';
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
      <JsonEditor bind:value={jsonData} />
      <button on:click={sendRequest} disabled={loading}>
        {loading ? 'Sending...' : 'Send Request'}
      </button>
      <RequestStatus 
        {loading}
        {error}
        {lastRequestTime}
      />
      {#if response}
        <div>
          <h2>Response</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
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
</style>
