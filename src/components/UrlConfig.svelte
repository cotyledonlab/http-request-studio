<script lang="ts">
  export let url: string = 'https://api.example.com';
  export let method: string = 'GET';

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  function getMethodColor(m: string): string {
    const colors: Record<string, string> = {
      GET: 'var(--method-get)',
      POST: 'var(--method-post)',
      PUT: 'var(--method-put)',
      DELETE: 'var(--method-delete)',
      PATCH: 'var(--method-patch)',
      HEAD: 'var(--method-head)',
      OPTIONS: 'var(--method-options)'
    };
    return colors[m] || 'var(--text-secondary)';
  }
</script>

<div class="url-config">
  <div class="method-select-wrapper">
    <select
      bind:value={method}
      class="method-select"
      style="--method-color: {getMethodColor(method)}"
    >
      {#each methods as httpMethod}
        <option value={httpMethod}>{httpMethod}</option>
      {/each}
    </select>
    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </div>
  <input
    type="text"
    bind:value={url}
    placeholder="Enter request URL..."
    class="url-input"
  />
</div>

<style>
  .url-config {
    width: 100%;
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .method-select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .method-select {
    appearance: none;
    padding: 0.625rem 2rem 0.625rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--background);
    color: var(--method-color);
    font-size: 0.8rem;
    font-weight: 700;
    font-family: 'SF Mono', 'Fira Code', monospace;
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 100px;
  }

  .method-select:hover {
    border-color: var(--border-color-strong);
    background: var(--background-tertiary);
  }

  .method-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .select-arrow {
    position: absolute;
    right: 0.625rem;
    pointer-events: none;
    color: var(--text-muted);
  }

  .url-input {
    flex: 1;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--background);
    color: var(--text);
    font-size: 0.875rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    transition: all 0.15s ease;
  }

  .url-input::placeholder {
    color: var(--text-muted);
  }

  .url-input:hover {
    border-color: var(--border-color-strong);
  }

  .url-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }
</style>
