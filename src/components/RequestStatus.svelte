<script lang="ts">
  export let loading = false;
  export let error: string | null = null;
  export let lastRequestTime: string | null = null;
</script>

<div class="status-container">
  {#if loading}
    <div class="status loading">
      <div class="spinner"></div>
      <span>Sending request...</span>
    </div>
  {:else if error}
    <div class="status error">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span class="error-text">{error}</span>
      <button class="dismiss-btn" on:click={() => error = null} aria-label="Dismiss error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  {:else if lastRequestTime}
    <div class="status success">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Completed at {lastRequestTime}</span>
    </div>
  {/if}
</div>

<style>
  .status-container {
    width: 100%;
    min-height: 1rem;
  }

  .status {
    padding: 0.625rem 0.875rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .loading {
    background: var(--primary-light);
    color: var(--primary);
    border: 1px solid var(--primary);
  }

  .error {
    background: var(--error-light);
    color: var(--error);
    border: 1px solid var(--error);
  }

  .error-text {
    flex: 1;
  }

  .success {
    background: var(--success-light);
    color: var(--success);
    border: 1px solid var(--success);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .dismiss-btn {
    padding: 0.25rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--error);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }

  .dismiss-btn:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
