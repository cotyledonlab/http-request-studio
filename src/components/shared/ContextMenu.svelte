<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  type MenuItem = {
    id: string;
    label: string;
    disabled?: boolean;
    danger?: boolean;
  };

  export let open = false;
  export let x = 0;
  export let y = 0;
  export let items: MenuItem[] = [];

  const dispatch = createEventDispatcher();

  function handleSelect(item: MenuItem) {
    if (item.disabled) return;
    dispatch('select', item.id);
  }

  function handleClose() {
    dispatch('close');
  }

  onMount(() => {
    const handler = () => {
      if (open) dispatch('close');
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  });
</script>

{#if open}
  <div
    class="menu"
    role="menu"
    tabindex="-1"
    style={`top:${y}px; left:${x}px;`}
    on:contextmenu|preventDefault={handleClose}
  >
    {#each items as item}
      <button
        role="menuitem"
        class:danger={item.danger}
        class:disabled={item.disabled}
        on:click={() => handleSelect(item)}
        disabled={item.disabled}
      >
        {item.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .menu {
    position: fixed;
    min-width: 160px;
    background: var(--background);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    padding: 0.35rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  button {
    border: none;
    background: transparent;
    text-align: left;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
    color: var(--text);
  }

  button:hover:not(.disabled) {
    background: var(--background-tertiary);
  }

  button.danger {
    color: var(--error);
  }

  button.disabled {
    color: var(--text-muted);
    cursor: not-allowed;
  }
</style>
