<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let title = '';
  export let closeOnBackdrop = true;

  const dispatch = createEventDispatcher();

  function handleBackdrop(event: Event) {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) {
      dispatch('close');
    }
  }
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="0"
    on:click={handleBackdrop}
    on:keydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') handleBackdrop(event);
      if (event.key === 'Escape') dispatch('close');
    }}
  >
    <div class="modal-card" role="dialog" aria-modal="true" aria-label={title}>
      <header class="modal-header">
        <h2>{title}</h2>
        <button class="icon-btn" on:click={() => dispatch('close')} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>
      <div class="modal-body">
        <slot />
      </div>
      <footer class="modal-footer">
        <slot name="actions" />
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1.5rem;
  }

  .modal-card {
    width: min(540px, 100%);
    background: var(--background);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem 1.5rem 1.5rem;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
  }

  .icon-btn {
    border: none;
    background: transparent;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .icon-btn:hover {
    background: var(--background-tertiary);
    color: var(--text);
  }

  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: var(--text-secondary);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
</style>
