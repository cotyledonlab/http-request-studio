<script lang="ts">
  type Header = { key: string; value: string; enabled: boolean };

  export let headers: Header[] = [
    { key: '', value: '', enabled: true }
  ];
  export let variables: Record<string, string> = {};

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
    headers = [...headers];
  }

  const commonHeaders = [
    'Authorization',
    'Content-Type',
    'Accept',
    'X-API-Key',
    'X-Request-ID',
    'Cache-Control',
    'User-Agent'
  ];

  function escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightVariables(value: string, vars: Record<string, string>): string {
    if (!value) return '';
    const escaped = escapeHtml(value);
    return escaped.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const resolved = Object.prototype.hasOwnProperty.call(vars, key);
      const className = resolved ? 'variable' : 'variable unresolved';
      return `<span class=\"${className}\">${match}</span>`;
    });
  }
</script>

<div class="headers-editor">
  <div class="headers-title">
    <h3>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6h16"></path>
        <path d="M4 12h16"></path>
        <path d="M4 18h12"></path>
      </svg>
      Headers
      <span class="header-count">{headers.filter(h => h.enabled && h.key.trim()).length}</span>
    </h3>
    <button class="add-btn" on:click={addHeader} title="Add header" aria-label="Add header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>

  <div class="headers-list">
    {#each headers as header, index}
      <div class="header-row" class:disabled={!header.enabled}>
        <button
          class="toggle-btn"
          class:active={header.enabled}
          on:click={() => toggleHeader(index)}
          title={header.enabled ? 'Disable header' : 'Enable header'}
          aria-label={header.enabled ? 'Disable header' : 'Enable header'}
          aria-pressed={header.enabled}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <div class="input-wrapper key">
          <div class="input-highlight" aria-hidden="true">
            {@html highlightVariables(header.key, variables)}
          </div>
          <input
            type="text"
            class="key-input"
            placeholder="Header name"
            bind:value={header.key}
            list="common-headers"
          />
        </div>
        <span class="separator">:</span>
        <div class="input-wrapper value">
          <div class="input-highlight" aria-hidden="true">
            {@html highlightVariables(header.value, variables)}
          </div>
          <input
            type="text"
            class="value-input"
            placeholder="Value"
            bind:value={header.value}
          />
        </div>
        <button
          class="remove-btn"
          on:click={() => removeHeader(index)}
          title="Remove header"
          aria-label="Remove header"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
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
    margin-bottom: 1.25rem;
  }

  .headers-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .headers-title h3 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .headers-title h3 svg {
    color: var(--text-muted);
  }

  .header-count {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 10px;
    background: var(--background-tertiary);
    color: var(--text-secondary);
  }

  .add-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--background);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .add-btn:hover {
    color: var(--primary);
    border-color: var(--primary);
    background: var(--primary-light);
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
    border-radius: 6px;
    background: var(--background-tertiary);
    border: 1px solid var(--border-color);
    transition: all 0.15s ease;
  }

  .header-row:hover {
    border-color: var(--border-color-strong);
  }

  .header-row.disabled {
    opacity: 0.5;
  }

  .toggle-btn {
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--background);
    color: transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toggle-btn.active {
    background: var(--success);
    border-color: var(--success);
    color: white;
  }

  .toggle-btn:hover:not(.active) {
    border-color: var(--success);
  }

  .input-wrapper {
    position: relative;
    flex: 1;
    min-width: 80px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: var(--background);
  }

  .input-wrapper.value {
    flex: 2;
  }

  .input-wrapper:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light);
  }

  .input-highlight {
    position: absolute;
    inset: 0;
    padding: 0.375rem 0.5rem;
    font-family: 'SF Mono', monospace;
    font-size: 0.8rem;
    white-space: pre;
    pointer-events: none;
    color: transparent;
  }

  .input-highlight :global(.variable) {
    background: var(--color-variable);
    border-radius: 3px;
  }

  .input-highlight :global(.variable.unresolved) {
    background: var(--color-variable-unresolved);
  }

  .key-input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: none;
    background: transparent;
    color: var(--text);
    font-family: 'SF Mono', monospace;
    font-size: 0.8rem;
    transition: all 0.15s ease;
  }

  .key-input:focus {
    outline: none;
  }

  .separator {
    color: var(--text-muted);
    font-weight: 500;
  }

  .value-input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: none;
    background: transparent;
    color: var(--text);
    font-family: 'SF Mono', monospace;
    font-size: 0.8rem;
    transition: all 0.15s ease;
  }

  .value-input:focus {
    outline: none;
  }

  .key-input::placeholder,
  .value-input::placeholder {
    color: var(--text-muted);
  }

  .remove-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    color: var(--error);
    background: var(--error-light);
  }
</style>
