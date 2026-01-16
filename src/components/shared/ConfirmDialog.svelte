<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';

  export let open = false;
  export let title = 'Confirm';
  export let message = '';
  export let confirmText = 'Confirm';
  export let cancelText = 'Cancel';
  export let danger = false;

  const dispatch = createEventDispatcher();
</script>

<Modal {open} {title} on:close={() => dispatch('cancel')}>
  <p class="message">{message}</p>
  <div slot="actions" class="actions">
    <button class="secondary" on:click={() => dispatch('cancel')}>{cancelText}</button>
    <button class:danger on:click={() => dispatch('confirm')}>{confirmText}</button>
  </div>
</Modal>

<style>
  .message {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
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
    color: var(--text);
    font-weight: 600;
  }

  .actions button:hover {
    background: var(--background-tertiary);
    border-color: var(--border-color-strong);
  }

  .actions button.danger {
    background: var(--error);
    border-color: var(--error);
    color: white;
  }

  .actions button.danger:hover {
    filter: brightness(0.95);
  }

  .actions button.secondary {
    background: transparent;
  }
</style>
