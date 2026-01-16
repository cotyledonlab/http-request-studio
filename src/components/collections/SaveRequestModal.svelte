<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '../shared/Modal.svelte';
  import type { Collection } from '../../lib/types';

  export let open = false;
  export let collection: Collection | null = null;
  export let defaultName = '';
  export let selectedFolderId: string | null = null;
  export let folderOptions: Array<{ id: string; name: string }> = [];

  const dispatch = createEventDispatcher();

  let name = '';
  let folderName = '';

  $: if (open) {
    name = defaultName;
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || !collection) return;
    dispatch('save', { name: trimmed, folderId: selectedFolderId, collectionId: collection.id });
  }

  function handleCreateFolder() {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    dispatch('createFolder', { name: trimmed, parentId: selectedFolderId });
    folderName = '';
  }
</script>

<Modal {open} title="Save Request" on:close={() => dispatch('close')}>
  {#if !collection}
    <p class="empty-state">Create a collection first to save requests.</p>
  {:else}
    <div class="form-group">
      <label for="request-name">Request name</label>
      <input id="request-name" type="text" bind:value={name} placeholder="Untitled request" />
    </div>

    <div class="form-group">
      <label for="request-folder">Save to folder</label>
      <select id="request-folder" bind:value={selectedFolderId}>
        <option value={null}>Root of {collection.name}</option>
        {#each folderOptions as folder}
          <option value={folder.id}>{folder.name}</option>
        {/each}
      </select>
    </div>

    <div class="folder-create">
      <input type="text" placeholder="New folder name" bind:value={folderName} />
      <button class="secondary" on:click={handleCreateFolder}>Add Folder</button>
    </div>
  {/if}

  <div slot="actions" class="actions">
    <button class="secondary" on:click={() => dispatch('close')}>Cancel</button>
    <button on:click={handleSave} disabled={!collection || !name.trim()}>Save</button>
  </div>
</Modal>

<style>
  .empty-state {
    margin: 0;
    color: var(--text-secondary);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
  }

  input,
  select {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem 0.7rem;
    font-size: 0.85rem;
    background: var(--background);
    color: var(--text);
  }

  .folder-create {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
  }

  .actions button {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--background);
    font-weight: 600;
  }

  .actions button:not(.secondary) {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .secondary {
    background: transparent;
  }
</style>
