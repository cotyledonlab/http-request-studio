<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Modal from '../shared/Modal.svelte';
  import type { EnvironmentVariable } from '../../lib/types';
  import {
    environmentsStore,
    activeEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    duplicateEnvironment,
    exportEnvironments,
    importEnvironments
  } from '../../lib/stores/environmentStore';

  export let open: boolean = false;

  let selectedId: string | null = null;
  let editingEnvId: string | null = null;
  let editingEnvName = '';
  let newEnvName = '';

  $: environments = $environmentsStore;
  $: selectedEnvironment = environments.find((env) => env.id === selectedId) ?? null;

  $: if (open && !selectedId) {
    selectedId = $activeEnvironmentId ?? environments[0]?.id ?? null;
  }

  onMount(() => {
    selectedId = get(activeEnvironmentId) ?? get(environmentsStore)[0]?.id ?? null;
  });

  function handleCreateEnvironment() {
    const trimmed = newEnvName.trim();
    if (!trimmed) return;
    const env = createEnvironment(trimmed);
    selectedId = env.id;
    newEnvName = '';
  }

  function startRename(envId: string, currentName: string) {
    editingEnvId = envId;
    editingEnvName = currentName;
  }

  function commitRename() {
    if (!editingEnvId) return;
    const trimmed = editingEnvName.trim();
    if (!trimmed) return;
    updateEnvironment(editingEnvId, (env) => ({
      ...env,
      name: trimmed,
      updatedAt: Date.now()
    }));
    editingEnvId = null;
  }

  function handleDeleteEnvironment(id: string) {
    if (!window.confirm('Delete this environment?')) return;
    deleteEnvironment(id);
    if (selectedId === id) {
      selectedId = environments[0]?.id ?? null;
    }
  }

  function handleDuplicate(id: string) {
    const copy = duplicateEnvironment(id);
    if (copy) selectedId = copy.id;
  }

  function updateVariable(index: number, patch: Partial<EnvironmentVariable>) {
    if (!selectedEnvironment) return;
    updateEnvironment(selectedEnvironment.id, (env) => {
      const variables = env.variables.map((variable, i) =>
        i === index ? { ...variable, ...patch } : variable
      );
      return { ...env, variables, updatedAt: Date.now() };
    });
  }

  function addVariable() {
    if (!selectedEnvironment) return;
    updateEnvironment(selectedEnvironment.id, (env) => ({
      ...env,
      variables: [...env.variables, { key: '', value: '', enabled: true }],
      updatedAt: Date.now()
    }));
  }

  function removeVariable(index: number) {
    if (!selectedEnvironment) return;
    updateEnvironment(selectedEnvironment.id, (env) => ({
      ...env,
      variables: env.variables.filter((_, i) => i !== index),
      updatedAt: Date.now()
    }));
  }

  async function handleExport() {
    const path = window.prompt('Export environments path', 'environments.json');
    if (path) {
      await exportEnvironments(path);
    }
  }

  async function handleImport() {
    const path = window.prompt('Import environments path');
    if (path) {
      await importEnvironments(path);
    }
  }
</script>

<Modal {open} title="Manage Environments" on:close={() => (open = false)}>
  <div class="layout">
    <div class="sidebar">
      <div class="sidebar-header">
        <input
          type="text"
          placeholder="New environment"
          bind:value={newEnvName}
          on:keydown={(event) => event.key === 'Enter' && handleCreateEnvironment()}
        />
        <button on:click={handleCreateEnvironment}>Add</button>
      </div>
      <div class="env-list">
        {#if environments.length === 0}
          <p class="empty">No environments yet.</p>
        {:else}
          {#each environments as env}
            <div class="env-item" class:active={env.id === selectedId}>
              {#if editingEnvId === env.id}
                <input
                  type="text"
                  bind:value={editingEnvName}
                  on:keydown={(event) => event.key === 'Enter' && commitRename()}
                  on:blur={commitRename}
                />
              {:else}
                <button class="env-name" on:click={() => (selectedId = env.id)}>{env.name}</button>
              {/if}
              <div class="env-actions">
                <button on:click={() => startRename(env.id, env.name)} title="Rename">✎</button>
                <button on:click={() => handleDuplicate(env.id)} title="Duplicate">⧉</button>
                <button class="danger" on:click={() => handleDeleteEnvironment(env.id)} title="Delete">✕</button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div class="content">
      {#if !selectedEnvironment}
        <p class="empty">Select an environment to edit variables.</p>
      {:else}
        <div class="variables-header">
          <h4>{selectedEnvironment.name} Variables</h4>
          <button on:click={addVariable}>Add Variable</button>
        </div>
        <div class="variables-table">
          <div class="variables-row header">
            <span>Enabled</span>
            <span>Key</span>
            <span>Value</span>
            <span></span>
          </div>
          {#each selectedEnvironment.variables as variable, index}
            <div class="variables-row">
              <input
                type="checkbox"
                checked={variable.enabled}
                on:change={(event) => updateVariable(index, { enabled: (event.target as HTMLInputElement).checked })}
              />
              <input
                type="text"
                value={variable.key}
                placeholder="BASE_URL"
                on:input={(event) => updateVariable(index, { key: (event.target as HTMLInputElement).value })}
              />
              <input
                type="text"
                value={variable.value}
                placeholder="https://api.example.com"
                on:input={(event) => updateVariable(index, { value: (event.target as HTMLInputElement).value })}
              />
              <button class="danger" on:click={() => removeVariable(index)}>Delete</button>
            </div>
          {/each}
        </div>
      {/if}
      <div class="import-export">
        <button on:click={handleImport}>Import</button>
        <button on:click={handleExport}>Export</button>
      </div>
    </div>
  </div>

  <div slot="actions" class="actions">
    <button class="secondary" on:click={() => (open = false)}>Close</button>
  </div>
</Modal>

<style>
  .layout {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1.5rem;
  }

  .sidebar {
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: var(--background-tertiary);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sidebar-header {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
  }

  .sidebar-header input {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
  }

  .sidebar-header button {
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--background);
  }

  .env-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .env-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border-radius: 8px;
    background: var(--background);
    border: 1px solid transparent;
  }

  .env-item.active {
    border-color: var(--primary);
  }

  .env-name {
    background: transparent;
    border: none;
    text-align: left;
    font-size: 0.8rem;
    color: var(--text);
  }

  .env-actions {
    display: flex;
    gap: 0.25rem;
  }

  .env-actions button {
    border: none;
    background: transparent;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .env-actions .danger {
    color: var(--error);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .variables-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .variables-header h4 {
    margin: 0;
    font-size: 0.9rem;
  }

  .variables-header button {
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--background);
  }

  .variables-table {
    border: 1px solid var(--border-color);
    border-radius: 10px;
    overflow: hidden;
  }

  .variables-row {
    display: grid;
    grid-template-columns: auto 1fr 1fr auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid var(--border-color);
  }

  .variables-row:last-child {
    border-bottom: none;
  }

  .variables-row.header {
    background: var(--background-tertiary);
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .variables-row input[type='text'] {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }

  .variables-row button {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }

  .variables-row button.danger {
    color: var(--error);
    border-color: var(--error);
    background: var(--error-light);
  }

  .import-export {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .import-export button {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.35rem 0.7rem;
  }

  .empty {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .actions .secondary {
    padding: 0.4rem 0.9rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--background);
  }
</style>
