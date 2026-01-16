<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { Collection, CollectionItem, SavedRequest } from '../lib/types';
  import {
    collectionsStore,
    activeCollection,
    activeCollectionId,
    collectionDirty,
    collectionsLoading,
    collectionsError,
    clearCollectionsError,
    refreshCollections,
    openCollection,
    createCollection,
    deleteCollection,
    exportCollection,
    importCollection,
    updateActiveCollection,
    persistActiveCollection,
    saveCollection,
    fetchCollection
  } from '../lib/stores/collectionsStore';
  import { createId } from '../lib/utils/uuid';
  import {
    addItemToFolder,
    updateItemById,
    removeItemById,
    insertItemBefore,
    findItemById,
    findRequestById
  } from '../lib/utils/collectionUtils';
  import CollectionTreeItem from './collections/CollectionTreeItem.svelte';
  import ContextMenu from './shared/ContextMenu.svelte';
  import ConfirmDialog from './shared/ConfirmDialog.svelte';
  import Modal from './shared/Modal.svelte';

  export let selectedRequestId: string | null = null;

  const dispatch = createEventDispatcher();

  let showNewCollectionModal = false;
  let newCollectionName = '';
  let newCollectionDescription = '';
  let contextMenuOpen = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextTarget: { id: string; type: 'collection' | 'folder' | 'request' } | null = null;
  let editingId: string | null = null;
  let editingValue = '';
  let pendingCollectionId: string | null = null;
  let showUnsavedPrompt = false;
  let showDeleteConfirm = false;
  let deleteTarget: { id: string; type: 'collection' | 'folder' | 'request' } | null = null;
  let draggingId: string | null = null;

  onMount(async () => {
    await refreshCollections();
  });

  $: active = $activeCollection;
  $: activeId = $activeCollectionId;

  async function handleSelectCollection(id: string) {
    if ($collectionDirty && activeId && id !== activeId) {
      pendingCollectionId = id;
      showUnsavedPrompt = true;
      return;
    }
    await openCollection(id);
  }

  async function confirmSwitch(saveChanges: boolean) {
    if (!pendingCollectionId) return;
    if (saveChanges && active) {
      await persistActiveCollection();
      if ($collectionDirty) {
        return;
      }
    }
    const opened = await openCollection(pendingCollectionId);
    if (!opened) return;
    pendingCollectionId = null;
    showUnsavedPrompt = false;
  }

  async function handleCreateCollection() {
    const name = newCollectionName.trim();
    if (!name) return;
    const created = await createCollection(name, newCollectionDescription.trim() || undefined);
    if (!created) return;
    newCollectionName = '';
    newCollectionDescription = '';
    showNewCollectionModal = false;
  }

  function startRename(itemId: string, name: string) {
    editingId = itemId;
    editingValue = name;
  }

  function commitRename() {
    if (!editingId || !editingValue.trim()) {
      editingId = null;
      return;
    }

    updateActiveCollection((collection) => ({
      ...collection,
      items: updateItemById(collection.items, editingId as string, (item) => ({
        ...item,
        name: editingValue.trim()
      })),
      updatedAt: Date.now()
    }));

    editingId = null;
  }

  async function renameCollection(id: string, name: string) {
    if (!name.trim()) return;
    if (activeId === id && active) {
      updateActiveCollection((collection) => ({
        ...collection,
        name: name.trim(),
        updatedAt: Date.now()
      }));
      await persistActiveCollection();
    } else {
      const collection = await fetchCollection(id);
      if (collection) {
        const updated: Collection = { ...collection, name: name.trim(), updatedAt: Date.now() };
        await saveCollection(updated);
      }
    }
  }

  function addFolder(parentId: string | null) {
    if (!active) return;
    const name = window.prompt('Folder name');
    if (!name) return;
    const folder: CollectionItem = {
      type: 'folder',
      id: createId(),
      name,
      items: [],
      expanded: true
    };
    updateActiveCollection((collection) => ({
      ...collection,
      items: addItemToFolder(collection.items, parentId, folder),
      updatedAt: Date.now()
    }));
  }

  function removeItem(id: string) {
    if (!active) return;
    updateActiveCollection((collection) => {
      const result = removeItemById(collection.items, id);
      return { ...collection, items: result.items, updatedAt: Date.now() };
    });
  }

  function duplicateRequest(id: string) {
    if (!active) return;
    const request = findItemById(active.items, id);
    if (!request || request.type !== 'request') return;
    const now = Date.now();
    const copy: SavedRequest = {
      ...request,
      id: createId(),
      name: `${request.name} Copy`,
      createdAt: now,
      updatedAt: now
    };
    updateActiveCollection((collection) => ({
      ...collection,
      items: insertItemBefore(collection.items, id, copy),
      updatedAt: Date.now()
    }));
  }

  function handleSelectRequest(id: string) {
    if (!active) return;
    const request = findRequestById(active, id);
    if (request) {
      dispatch('requestSelect', request);
    }
  }

  function openContextMenu(event: CustomEvent<{ id: string; type: string; x: number; y: number }>) {
    const { id, type, x, y } = event.detail;
    contextMenuX = x;
    contextMenuY = y;
    contextTarget = { id, type: type as 'collection' | 'folder' | 'request' };
    contextMenuOpen = true;
  }

  function handleTreeContextMenu(id: string, type: 'folder' | 'request', x: number, y: number) {
    contextMenuX = x;
    contextMenuY = y;
    contextTarget = { id, type };
    contextMenuOpen = true;
  }

  async function handleContextAction(action: string) {
    if (!contextTarget) return;
    const { id, type } = contextTarget;
    contextMenuOpen = false;

    if (type === 'collection') {
      if (action === 'rename') {
        const name = window.prompt('Rename collection');
        if (name) await renameCollection(id, name);
      }
      if (action === 'export') {
        const path = window.prompt('Export collection path', `${id}.json`);
        if (path) await exportCollection(id, path);
      }
      if (action === 'delete') {
        deleteTarget = { id, type };
        showDeleteConfirm = true;
      }
      if (action === 'import') {
        const path = window.prompt('Import collection path');
        if (path) {
          const collection = await importCollection(path);
          if (collection) {
            await openCollection(collection.id);
          }
        }
      }
    }

    if (type === 'folder') {
      if (action === 'new-folder') addFolder(id);
      if (action === 'rename') startRename(id, (findItemById(active?.items ?? [], id) as CollectionItem)?.name ?? '');
      if (action === 'delete') {
        deleteTarget = { id, type };
        showDeleteConfirm = true;
      }
    }

    if (type === 'request') {
      if (action === 'duplicate') duplicateRequest(id);
      if (action === 'rename') startRename(id, (findItemById(active?.items ?? [], id) as CollectionItem)?.name ?? '');
      if (action === 'delete') {
        deleteTarget = { id, type };
        showDeleteConfirm = true;
      }
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'collection') {
      void deleteCollection(deleteTarget.id);
    } else {
      removeItem(deleteTarget.id);
    }
    deleteTarget = null;
    showDeleteConfirm = false;
  }

  function handleDragStart(event: CustomEvent<{ id: string }>) {
    draggingId = event.detail.id;
  }

  function handleDrop(event: CustomEvent<{ targetId: string; targetType: string }>) {
    if (!active || !draggingId || draggingId === event.detail.targetId) return;
    const result = removeItemById(active.items, draggingId);
    if (!result.removed) return;
    let nextItems = result.items;
    if (event.detail.targetType === 'folder') {
      nextItems = addItemToFolder(nextItems, event.detail.targetId, result.removed);
    } else {
      nextItems = insertItemBefore(nextItems, event.detail.targetId, result.removed);
    }
    updateActiveCollection((collection) => ({
      ...collection,
      items: nextItems,
      updatedAt: Date.now()
    }));
    draggingId = null;
  }

  function handleEdit(event: CustomEvent<{ id: string; value: string }>) {
    editingId = event.detail.id;
    editingValue = event.detail.value;
  }

  async function handleCollectionContextMenu(event: MouseEvent, id: string) {
    event.preventDefault();
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    contextTarget = { id, type: 'collection' };
    contextMenuOpen = true;
  }
</script>

<div class="file-explorer">
  <div class="explorer-header">
    <h3>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
      Collections
      {#if $collectionDirty}
        <span class="dirty-dot" title="Unsaved changes"></span>
      {/if}
    </h3>
    <button class="new-btn" title="New collection" aria-label="New collection" on:click={() => (showNewCollectionModal = true)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>

  <div class="collections-list">
    {#if $collectionsError}
      <div class="explorer-error">
        <span>{$collectionsError}</span>
        <button class="dismiss" on:click={clearCollectionsError} aria-label="Dismiss error">x</button>
      </div>
    {/if}
    {#if $collectionsLoading}
      <p class="empty">Loading collections...</p>
    {:else if $collectionsStore.length === 0}
      <p class="empty">No collections yet.</p>
    {:else}
      {#each $collectionsStore as collection}
        <button
          class="collection-item"
          class:active={collection.id === activeId}
          on:click={() => handleSelectCollection(collection.id)}
          on:contextmenu={(event) => handleCollectionContextMenu(event, collection.id)}
        >
          <span>{collection.name}</span>
        </button>
      {/each}
    {/if}
  </div>

  {#if active}
    <div class="tree-header">
      <span>{active.name}</span>
      <button class="secondary" on:click={() => addFolder(null)}>New Folder</button>
    </div>
    <div class="tree">
      {#if active.items.length === 0}
        <p class="empty">No requests saved.</p>
      {:else}
        {#each active.items as item}
          <CollectionTreeItem
            {item}
            depth={0}
            {selectedRequestId}
            {editingId}
            {editingValue}
            on:toggle={(event) => updateActiveCollection((collection) => ({
              ...collection,
              items: updateItemById(collection.items, event.detail.id, (current) =>
                current.type === 'folder' ? { ...current, expanded: !current.expanded } : current
              ),
              updatedAt: Date.now()
            }))}
            on:select={(event) => handleSelectRequest(event.detail.id)}
            on:context={(event) => handleTreeContextMenu(event.detail.id, event.detail.type, event.detail.x, event.detail.y)}
            on:dragstart={handleDragStart}
            on:drop={handleDrop}
            on:rename={(event) => startRename(event.detail.id, (findItemById(active.items, event.detail.id) as CollectionItem)?.name ?? '')}
            on:edit={handleEdit}
            on:commit={commitRename}
          />
        {/each}
      {/if}
    </div>
  {/if}

  <ContextMenu
    open={contextMenuOpen}
    x={contextMenuX}
    y={contextMenuY}
    items={
      contextTarget?.type === 'collection'
        ? [
            { id: 'rename', label: 'Rename' },
            { id: 'export', label: 'Export' },
            { id: 'import', label: 'Import' },
            { id: 'delete', label: 'Delete', danger: true }
          ]
        : contextTarget?.type === 'folder'
        ? [
            { id: 'new-folder', label: 'New Folder' },
            { id: 'rename', label: 'Rename' },
            { id: 'delete', label: 'Delete', danger: true }
          ]
        : [
            { id: 'duplicate', label: 'Duplicate' },
            { id: 'rename', label: 'Rename' },
            { id: 'delete', label: 'Delete', danger: true }
          ]
    }
    on:select={(event) => handleContextAction(event.detail)}
    on:close={() => (contextMenuOpen = false)}
  />

  <ConfirmDialog
    open={showDeleteConfirm}
    title="Delete item"
    message="This action cannot be undone."
    confirmText="Delete"
    danger
    on:confirm={handleDeleteConfirm}
    on:cancel={() => (showDeleteConfirm = false)}
  />

  <Modal open={showNewCollectionModal} title="New collection" on:close={() => (showNewCollectionModal = false)}>
    <div class="form-group">
      <label for="collection-name">Name</label>
      <input id="collection-name" type="text" bind:value={newCollectionName} placeholder="Collection name" />
    </div>
    <div class="form-group">
      <label for="collection-description">Description</label>
      <input id="collection-description" type="text" bind:value={newCollectionDescription} placeholder="Optional description" />
    </div>
    <div slot="actions" class="actions">
      <button class="secondary" on:click={() => (showNewCollectionModal = false)}>Cancel</button>
      <button on:click={handleCreateCollection} disabled={!newCollectionName.trim()}>Create</button>
    </div>
  </Modal>

  <Modal open={showUnsavedPrompt} title="Unsaved changes" on:close={() => (showUnsavedPrompt = false)}>
    <p>You have unsaved changes in this collection. Save before switching?</p>
    <div slot="actions" class="actions">
      <button class="secondary" on:click={() => (showUnsavedPrompt = false)}>Cancel</button>
      <button class="secondary" on:click={() => confirmSwitch(false)}>Discard</button>
      <button on:click={() => confirmSwitch(true)}>Save & Switch</button>
    </div>
  </Modal>
</div>

<style>
  .file-explorer {
    background: var(--background);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    width: 240px;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .explorer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--background-tertiary);
  }

  .explorer-header h3 {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .dirty-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--warning);
  }

  .explorer-header h3 svg {
    color: var(--text-muted);
  }

  .new-btn {
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
  }

  .new-btn:hover {
    background: var(--primary-light);
    color: var(--primary);
  }

  .collections-list {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    border-bottom: 1px solid var(--border-color);
    max-height: 200px;
    overflow-y: auto;
  }

  .explorer-error {
    padding: 0.5rem 0.6rem;
    border-radius: 6px;
    background: var(--error-light);
    color: var(--error);
    border: 1px solid var(--error);
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .explorer-error .dismiss {
    border: none;
    background: transparent;
    color: inherit;
    padding: 0;
    cursor: pointer;
  }

  .collection-item {
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    padding: 0.4rem 0.6rem;
    text-align: left;
    font-size: 0.8rem;
  }

  .collection-item.active {
    border-color: var(--primary);
    color: var(--primary);
  }

  .tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.8rem;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .tree-header button {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }

  .tree {
    padding: 0.4rem 0.2rem 0.75rem;
    flex: 1;
    overflow-y: auto;
  }

  .empty {
    margin: 0.8rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-group label {
    font-size: 0.8rem;
    color: var(--text);
  }

  .form-group input {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem 0.7rem;
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
  }

  .actions button:not(.secondary) {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .secondary {
    background: transparent;
  }
</style>
