<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CollectionItem } from '../../lib/types';

  export let item: CollectionItem;
  export let depth = 0;
  export let selectedRequestId: string | null = null;
  export let editingId: string | null = null;
  export let editingValue = '';

  const dispatch = createEventDispatcher();

  function toggleFolder() {
    if (item.type !== 'folder') return;
    dispatch('toggle', { id: item.id });
  }

  function handleSelect() {
    if (item.type === 'request') {
      dispatch('select', { id: item.id });
    }
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    dispatch('context', { id: item.id, type: item.type, x: event.clientX, y: event.clientY });
  }

  function handleDragStart(event: DragEvent) {
    event.dataTransfer?.setData('text/plain', item.id);
    event.dataTransfer?.setData('application/x-hrs-type', item.type);
    dispatch('dragstart', { id: item.id, type: item.type });
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dispatch('drop', { targetId: item.id, targetType: item.type });
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (item.type === 'folder') {
      toggleFolder();
    } else {
      handleSelect();
    }
  }

  function handleEditInput(event: Event) {
    dispatch('edit', { id: item.id, value: (event.target as HTMLInputElement).value });
  }

  function commitRename() {
    dispatch('commit', { id: item.id });
  }
</script>

<div
  class="tree-item"
  class:folder={item.type === 'folder'}
  class:request={item.type === 'request'}
  style={`padding-left:${depth * 14 + 8}px;`}
  role="treeitem"
  tabindex="0"
  aria-selected={item.type === 'request' && item.id === selectedRequestId}
  on:contextmenu={handleContextMenu}
  on:dblclick={() => dispatch('rename', { id: item.id })}
  draggable={item.type === 'request' || item.type === 'folder'}
  on:dragstart={handleDragStart}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:keydown={handleKeydown}
>
  {#if item.type === 'folder'}
    <button class="folder-toggle" on:click={toggleFolder} aria-label="Toggle folder">
      <svg class:open={item.expanded} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
    <svg class="folder-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {#if item.expanded}
        <path d="M2 7.5A2.5 2.5 0 0 1 4.5 5h4.58a2.5 2.5 0 0 1 2.24 1.38l.67 1.34a.5.5 0 0 0 .45.28H19.5A2.5 2.5 0 0 1 22 10.5v8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5z"/>
      {:else}
        <path d="M4.5 5A2.5 2.5 0 0 0 2 7.5v11A2.5 2.5 0 0 0 4.5 21h15a2.5 2.5 0 0 0 2.5-2.5v-8a2.5 2.5 0 0 0-2.5-2.5h-7.06a.5.5 0 0 1-.45-.28l-.67-1.34A2.5 2.5 0 0 0 9.08 5z"/>
      {/if}
    </svg>
  {:else}
    <svg class="request-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
  {/if}

  {#if editingId === item.id}
    <input
      class="rename-input"
      type="text"
      value={editingValue}
      on:input={handleEditInput}
      on:keydown={(event) => event.key === 'Enter' && commitRename()}
      on:blur={commitRename}
    />
  {:else}
    <button
      class="item-label"
      class:selected={item.type === 'request' && item.id === selectedRequestId}
      on:click={handleSelect}
    >
      {item.name}
    </button>
  {/if}
</div>

{#if item.type === 'folder' && item.expanded}
  <div class="children">
    {#each item.items as child}
      <svelte:self
        item={child}
        depth={depth + 1}
        {selectedRequestId}
        {editingId}
        {editingValue}
        on:toggle
        on:select
        on:context
        on:dragstart
        on:drop
        on:rename
        on:edit
        on:commit
      />
    {/each}
  </div>
{/if}

<style>
  .tree-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .tree-item:hover {
    background: var(--hover-bg);
  }

  .folder-toggle {
    border: none;
    background: transparent;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .folder-toggle svg {
    transition: transform 0.15s ease;
  }

  .folder-toggle svg.open {
    transform: rotate(90deg);
  }

  .folder-icon {
    color: var(--warning);
  }

  .request-icon {
    color: var(--text-muted);
  }

  .item-label {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.8rem;
    text-align: left;
    flex: 1;
  }

  .item-label.selected {
    color: var(--text);
    font-weight: 600;
  }

  .rename-input {
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.25rem 0.4rem;
    font-size: 0.8rem;
  }

  .children {
    display: flex;
    flex-direction: column;
  }
</style>
