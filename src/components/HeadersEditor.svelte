<script lang="ts">
  type Header = { key: string; value: string; enabled: boolean };
  
  export let headers: Header[] = [
    { key: '', value: '', enabled: true }
  ];

  function addHeader() {
    headers = [...headers, { key: '', value: '', enabled: true }];
  }

  function removeHeader(index: number) {
    headers = headers.filter((_, i) => i !== index);
    if (headers.length === 0) {
      headers = [{ key: '', value: '', enabled: true }];
    }
  }

  function toggleHeader(index: number) {
    headers[index].enabled = !headers[index].enabled;
    headers = headers;
  }

  // Common headers for autocomplete
  const commonHeaders = [
    'Authorization',
    'Content-Type',
    'Accept',
    'X-API-Key',
    'X-Request-ID',
    'Cache-Control',
    'User-Agent'
  ];
</script>

<div class="headers-editor">
  <div class="headers-title">
    <h3>Headers</h3>
    <button class="add-btn" on:click={addHeader} title="Add header">+</button>
  </div>
  
  <div class="headers-list">
    {#each headers as header, index}
      <div class="header-row" class:disabled={!header.enabled}>
        <button 
          class="toggle-btn"
          class:active={header.enabled}
          on:click={() => toggleHeader(index)}
          title={header.enabled ? 'Disable' : 'Enable'}
        >
          ✓
        </button>
        <input
          type="text"
          class="key-input"
          placeholder="Header name"
          bind:value={header.key}
          list="common-headers"
        />
        <span class="separator">:</span>
        <input
          type="text"
          class="value-input"
          placeholder="Value"
          bind:value={header.value}
        />
        <button 
          class="remove-btn" 
          on:click={() => removeHeader(index)}
          title="Remove header"
        >
          ×
        </button>
      </div>
    {/each}
  </div>

  <datalist id="common-headers">
    {#each commonHeaders as name}
      <option value={name}></option>
    {/each}
  </datalist>
</div>

<style>
  .headers-editor {
    width: 100%;
    margin-bottom: 1rem;
  }

  .headers-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .headers-title h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--text);
  }

  .add-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: var(--background);
    color: var(--text);
    font-size: 1.2rem;
    font-weight: bold;
    box-shadow: 3px 3px 6px var(--shadow-dark),
                -3px -3px 6px var(--shadow-light);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-btn:hover {
    color: #396cd8;
  }

  .add-btn:active {
    box-shadow: inset 2px 2px 4px var(--shadow-dark),
                inset -2px -2px 4px var(--shadow-light);
  }

  .headers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .header-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 8px;
    background: var(--background);
    box-shadow: 2px 2px 4px var(--shadow-dark),
                -2px -2px 4px var(--shadow-light);
    transition: opacity 0.2s ease;
  }

  .header-row.disabled {
    opacity: 0.5;
  }

  .toggle-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: var(--background);
    color: transparent;
    font-size: 0.8rem;
    box-shadow: inset 2px 2px 4px var(--shadow-dark),
                inset -2px -2px 4px var(--shadow-light);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn.active {
    color: #27ae60;
    box-shadow: 2px 2px 4px var(--shadow-dark),
                -2px -2px 4px var(--shadow-light);
  }

  .key-input {
    flex: 1;
    min-width: 120px;
    padding: 0.4rem 0.6rem;
    border: none;
    border-radius: 6px;
    background: var(--background);
    color: var(--text);
    font-family: monospace;
    font-size: 0.9rem;
    box-shadow: inset 2px 2px 4px var(--shadow-dark),
                inset -2px -2px 4px var(--shadow-light);
  }

  .separator {
    color: var(--text);
    opacity: 0.5;
  }

  .value-input {
    flex: 2;
    padding: 0.4rem 0.6rem;
    border: none;
    border-radius: 6px;
    background: var(--background);
    color: var(--text);
    font-family: monospace;
    font-size: 0.9rem;
    box-shadow: inset 2px 2px 4px var(--shadow-dark),
                inset -2px -2px 4px var(--shadow-light);
  }

  .key-input:focus,
  .value-input:focus {
    outline: none;
  }

  .remove-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: var(--background);
    color: var(--text);
    font-size: 1.2rem;
    box-shadow: 2px 2px 4px var(--shadow-dark),
                -2px -2px 4px var(--shadow-light);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .remove-btn:hover {
    color: #e74c3c;
  }

  .remove-btn:active {
    box-shadow: inset 2px 2px 4px var(--shadow-dark),
                inset -2px -2px 4px var(--shadow-light);
  }
</style>
