<script lang="ts">
  import { onMount } from 'svelte';

  export let value: Record<string, unknown> = {};
  export let variables: Record<string, string> = {};
  export let isValid = true;

  let editor: HTMLTextAreaElement;
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
      isValid = true;
    } catch (e) {
      isValid = false;
    }
  }

  function escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightVariables(value: string, vars: Record<string, string>): string {
    if (!value) return '';
    const escaped = escapeHtml(value);
    return escaped.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const resolved = Object.prototype.hasOwnProperty.call(vars, key);
      const className = resolved ? 'variable' : 'variable unresolved';
      return `<span class=\"${className}\">${match}</span>`;
    });
  }

  $: if (editor) {
    const nextInternalValue = JSON.stringify(value, null, 2);
    if (nextInternalValue !== internalValue) {
      internalValue = nextInternalValue;
      editor.value = internalValue;
    }
  }

  $: highlightedBody = highlightVariables(internalValue, variables);
</script>

<div class="editor-container">
  <h3>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
    Body
    {#if !isValid}
      <span class="error-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        Invalid JSON
      </span>
    {:else}
      <span class="valid-badge">JSON</span>
    {/if}
  </h3>
  <div class="textarea-wrapper" class:invalid={!isValid}>
    <div class="textarea-highlight" aria-hidden="true">
      {@html highlightedBody}
    </div>
    <textarea
      bind:this={editor}
      on:input={handleInput}
      rows="8"
      placeholder={'{"key": "value"}'}
      spellcheck="false"
    ></textarea>
  </div>
</div>

<style>
  .editor-container {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  h3 {
    margin: 0 0 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  h3 svg {
    color: var(--text-muted);
  }

  .valid-badge {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    background: var(--success-light);
    color: var(--success);
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .error-badge {
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    background: var(--error-light);
    color: var(--error);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .textarea-wrapper {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.15s ease;
    position: relative;
    background: var(--background-tertiary);
  }

  .textarea-wrapper:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .textarea-wrapper.invalid {
    border-color: var(--error);
  }

  .textarea-wrapper.invalid:focus-within {
    box-shadow: 0 0 0 3px var(--error-light);
  }

  textarea {
    width: 100%;
    padding: 0.875rem;
    border: none;
    background: transparent;
    color: var(--text);
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    resize: vertical;
    min-height: 120px;
  }

  .textarea-highlight {
    position: absolute;
    inset: 0;
    padding: 0.875rem;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    white-space: pre-wrap;
    pointer-events: none;
    color: transparent;
  }

  .textarea-highlight :global(.variable) {
    background: var(--color-variable);
    border-radius: 4px;
  }

  .textarea-highlight :global(.variable.unresolved) {
    background: var(--color-variable-unresolved);
  }

  textarea::placeholder {
    color: var(--text-muted);
  }

  textarea:focus {
    outline: none;
  }
</style>
