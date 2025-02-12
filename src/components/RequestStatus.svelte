<script lang="ts">
  export let loading = false;
  export let error: string | null = null;
  export let lastRequestTime: string | null = null;
</script>

<div class="status-container">
  {#if loading}
    <div class="status loading">
      <div class="spinner"></div>
      Sending request...
    </div>
  {:else if error}
    <div class="status error">
      <span>⚠️ {error}</span>
      <button on:click={() => error = null}>Dismiss</button>
    </div>
  {:else if lastRequestTime}
    <div class="status success">
      ✓ Last request completed at {lastRequestTime}
    </div>
  {/if}
</div>

<style>
  .status-container {
    width: 100%;
    min-height: 2rem;
    margin: 1rem 0;
  }

  .status {
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .loading {
    background: var(--background);
    box-shadow: inset 3px 3px 6px var(--shadow-dark),
                inset -3px -3px 6px var(--shadow-light);
  }

  .error {
    color: #e74c3c;
    background: var(--background);
    box-shadow: inset 3px 3px 6px var(--shadow-dark),
                inset -3px -3px 6px var(--shadow-light);
  }

  .success {
    color: #27ae60;
    background: var(--background);
    box-shadow: inset 3px 3px 6px var(--shadow-dark),
                inset -3px -3px 6px var(--shadow-light);
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid var(--text);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
