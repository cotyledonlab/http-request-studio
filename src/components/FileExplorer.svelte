<script lang="ts">
  type FileItem = {
    name: string;
    type: 'file' | 'folder';
    children?: FileItem[];
    isOpen?: boolean;
  };

  export let files: FileItem[] = [
    {
      name: 'My Collection',
      type: 'folder',
      isOpen: true,
      children: [
        { name: 'Get Users', type: 'file' },
        { name: 'Create User', type: 'file' },
      ]
    },
    {
      name: 'Archive',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'Old Request', type: 'file' },
      ]
    }
  ];

  function toggleFolder(folder: FileItem) {
    folder.isOpen = !folder.isOpen;
    files = files;
  }

  function handleFileClick(file: FileItem) {
    dispatch('fileSelect', file);
  }

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="file-explorer">
  <div class="explorer-header">
    <h3>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
      Collections
    </h3>
    <button class="new-btn" title="New collection" aria-label="New collection">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>
  <div class="files-container">
    {#each files as file}
      {#if file.type === 'folder'}
        <div class="folder">
          <button class="folder-button" on:click={() => toggleFolder(file)}>
            <svg class="folder-icon" class:open={file.isOpen} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="folder-type-icon">
              {#if file.isOpen}
                <path d="M2 7.5A2.5 2.5 0 0 1 4.5 5h4.58a2.5 2.5 0 0 1 2.24 1.38l.67 1.34a.5.5 0 0 0 .45.28H19.5A2.5 2.5 0 0 1 22 10.5v8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5z"/>
              {:else}
                <path d="M4.5 5A2.5 2.5 0 0 0 2 7.5v11A2.5 2.5 0 0 0 4.5 21h15a2.5 2.5 0 0 0 2.5-2.5v-8a2.5 2.5 0 0 0-2.5-2.5h-7.06a.5.5 0 0 1-.45-.28l-.67-1.34A2.5 2.5 0 0 0 9.08 5z"/>
              {/if}
            </svg>
            <span class="folder-name">{file.name}</span>
            <span class="item-count">{file.children?.length || 0}</span>
          </button>
          {#if file.isOpen}
            <div class="folder-contents">
              {#each file.children || [] as child}
                <button
                  class="file-button"
                  on:click={() => handleFileClick(child)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  {child.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <button
          class="file-button root-file"
          on:click={() => handleFileClick(file)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          {file.name}
        </button>
      {/if}
    {/each}
  </div>
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

  .files-container {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .folder-contents {
    margin-left: 1rem;
    padding-left: 0.75rem;
    border-left: 1px solid var(--border-color);
  }

  .folder-button {
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.625rem;
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .folder-button:hover {
    background: var(--hover-bg);
  }

  .folder-icon {
    color: var(--text-muted);
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }

  .folder-icon.open {
    transform: rotate(90deg);
  }

  .folder-type-icon {
    color: var(--warning);
    flex-shrink: 0;
  }

  .folder-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-count {
    font-size: 0.7rem;
    color: var(--text-muted);
    background: var(--background-tertiary);
    padding: 0.1rem 0.4rem;
    border-radius: 8px;
  }

  .file-button {
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.625rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
  }

  .file-button:hover {
    background: var(--hover-bg);
    color: var(--text);
  }

  .file-button svg {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .root-file {
    margin-left: 0;
  }
</style>
