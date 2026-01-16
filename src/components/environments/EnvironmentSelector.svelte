<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Environment } from '../../lib/types';

  export let environments: Environment[] = [];
  export let activeId: string | null = null;

  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    dispatch('select', value ? value : null);
  }
</script>

<div class="env-selector">
  <select on:change={handleChange} bind:value={activeId}>
    <option value="">No Environment</option>
    {#each environments as env}
      <option value={env.id}>{env.name}</option>
    {/each}
  </select>
  <button class="manage-btn" on:click={() => dispatch('manage')}>Manage</button>
</div>

<style>
  .env-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  select {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
    background: var(--background);
    color: var(--text);
  }

  .manage-btn {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.35rem 0.7rem;
    font-size: 0.8rem;
    background: var(--background-tertiary);
  }
</style>
