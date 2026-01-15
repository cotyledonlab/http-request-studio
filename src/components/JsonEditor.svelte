<script lang="ts">
  import { onMount } from 'svelte';

  export let value: Record<string, unknown> = {};
  
  let editor: HTMLTextAreaElement;
  let isValidJson = true;
  let internalValue = '';

  onMount(() => {
    internalValue = JSON.stringify(value, null, 2);
    if (editor) {
      editor.value = internalValue;
    }
  });

  function handleInput(event: Event) {
    const newValue = (event.target as HTMLTextAreaElement).value;
    try {
      value = JSON.parse(newValue);
      isValidJson = true;
    } catch (e) {
      isValidJson = false;
    }
  }

  // Update textarea when value changes from outside
  // Uses internalValue to avoid expensive JSON operations on every reactive update
  $: if (editor) {
    const nextInternalValue = JSON.stringify(value, null, 2);
    if (nextInternalValue !== internalValue) {
      internalValue = nextInternalValue;
      editor.value = internalValue;
    }
  }
</script>

<div class="editor-container">
  <h3>Request Body</h3>
  <textarea 
    bind:this={editor} 
    on:input={handleInput} 
    rows="10" 
    placeholder="Enter JSON body..."
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

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: var(--text);
    text-align: left;
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
