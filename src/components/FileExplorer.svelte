<script lang="ts">
  type FileItem = {
    name: string;
    type: 'file' | 'folder';
    children?: FileItem[];
    isOpen?: boolean;
  };

  export let files: FileItem[] = [
    {
      name: 'requests',
      type: 'folder',
      isOpen: true,
      children: [
        { name: 'login.json', type: 'file' },
        { name: 'users.json', type: 'file' },
      ]
    },
    {
      name: 'responses',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'response1.json', type: 'file' },
      ]
    }
  ];

  function toggleFolder(folder: FileItem) {
    folder.isOpen = !folder.isOpen;
    files = files; // trigger reactivity
  }

  function handleFileClick(file: FileItem) {
    // Emit event for file selection
    dispatch('fileSelect', file);
  }

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="file-explorer">
  <h3>Files</h3>
  <div class="files-container">
    {#each files as file}
      {#if file.type === 'folder'}
        <div class="folder">
          <button class="folder-button" on:click={() => toggleFolder(file)}>
            {file.isOpen ? '📂' : '📁'} {file.name}
          </button>
          {#if file.isOpen}
            <div class="folder-contents">
              {#each file.children || [] as child}
                <button 
                  class="file-button"
                  on:click={() => handleFileClick(child)}
                >
                  📄 {child.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <button 
          class="file-button"
          on:click={() => handleFileClick(file)}
        >
          📄 {file.name}
        </button>
      {/if}
    {/each}
  </div>
</div>

<style>
  .file-explorer {
    background: var(--background);
    padding: 1rem;
    border-radius: 15px;
    box-shadow: 5px 5px 10px var(--shadow-dark),
                -5px -5px 10px var(--shadow-light);
    max-width: 250px;
    margin-right: 2rem;
  }

  .files-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .folder-contents {
    margin-left: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .folder-button, .file-button {
    width: 100%;
    text-align: left;
    padding: 0.5rem;
    border: none;
    background: var(--background);
    color: var(--text);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .folder-button:hover, .file-button:hover {
    box-shadow: 2px 2px 5px var(--shadow-dark),
                -2px -2px 5px var(--shadow-light);
  }

  .folder-button:active, .file-button:active {
    box-shadow: inset 2px 2px 5px var(--shadow-dark),
                inset -2px -2px 5px var(--shadow-light);
  }
</style>
