<script lang="ts">
  import { onMount } from 'svelte';
  import type { JSONContent } from 'svelte-jsoneditor';

  let json: JSONContent = {
    json: {
      message: "Hello, world!"
    }
  };

  let editor: HTMLTextAreaElement;
  let isValidJson = true;

  onMount(() => {
    editor.value = JSON.stringify(json.json, null, 2);
  });

  function handleInput(event: Event) {
    try {
      json.json = JSON.parse((event.target as HTMLTextAreaElement).value);
        isValidJson = true;
    } catch (e) {
      isValidJson = false;
    }
  }
</script>

<div class="editor-container">
  <textarea 
    bind:this={editor} 
    on:input={handleInput} 
    rows="10" 
    cols="50"
  ></textarea>
  {#if !isValidJson}
    <div class="error">Invalid JSON</div>
  {/if}
</div>

<style>
  .editor-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  textarea {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 15px;
    background: var(--background);
    color: var(--text);
    font-family: monospace;
    resize: vertical;
    box-shadow: inset 5px 5px 10px var(--shadow-dark),
                inset -5px -5px 10px var(--shadow-light);
  }

  textarea:focus {
    outline: none;
  }

  .error {
    color: #e74c3c;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    text-align: left;
    padding: 0.5rem;
  }
</style>
