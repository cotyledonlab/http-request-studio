<script lang="ts">
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  export let data: unknown;
  export let depth: number = 0;
  export let keyName: string | null = null;
  export let isLast: boolean = true;
  
  let isExpanded = depth < 2; // Auto-expand first 2 levels
  let copied = false;
  
  $: isObject = data !== null && typeof data === 'object' && !Array.isArray(data);
  $: isArray = Array.isArray(data);
  $: isExpandable = isObject || isArray;
  $: itemCount = isArray ? (data as unknown[]).length : (isObject ? Object.keys(data as object).length : 0);
  $: entries = isObject ? Object.entries(data as object) : (isArray ? (data as unknown[]).map((v, i) => [i.toString(), v]) : []);
  
  function toggle() {
    if (isExpandable) {
      isExpanded = !isExpanded;
    }
  }
  
  function getValueType(val: unknown): string {
    if (val === null) return 'null';
    if (typeof val === 'boolean') return 'boolean';
    if (typeof val === 'number') return 'number';
    if (typeof val === 'string') return 'string';
    return 'unknown';
  }
  
  function formatValue(val: unknown): string {
    if (val === null) return 'null';
    if (typeof val === 'string') return JSON.stringify(val);
    return String(val);
  }
  
  async function copyValue() {
    const textToCopy = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(textToCopy);
    copied = true;
    setTimeout(() => copied = false, 1500);
  }
</script>

<div class="tree-node" class:root={depth === 0}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="node-row" class:expandable={isExpandable} on:click={toggle} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())} role={isExpandable ? 'button' : undefined} tabindex={isExpandable ? 0 : undefined} aria-expanded={isExpandable ? isExpanded : undefined}>
    {#if isExpandable}
      <span class="toggle" class:expanded={isExpanded}>▶</span>
    {:else}
      <span class="toggle-spacer"></span>
    {/if}
    
    {#if keyName !== null}
      <span class="key">"{keyName}"</span><span class="colon">: </span>
    {/if}
    
    {#if isExpandable}
      <span class="bracket">{isArray ? '[' : '{'}</span>
      {#if !isExpanded}
        <span class="preview">
          {#if isArray}
            <span class="item-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          {:else}
            <span class="item-count">{itemCount} key{itemCount !== 1 ? 's' : ''}</span>
          {/if}
        </span>
        <span class="bracket">{isArray ? ']' : '}'}</span>
      {/if}
    {:else}
      <button type="button" class="value {getValueType(data)}" on:click|stopPropagation={copyValue} title="Click to copy" aria-label="Copy value">
        {formatValue(data)}
        {#if copied}
          <span class="copied-badge" transition:slide={{ duration: 200 }}>✓ Copied!</span>
        {/if}
      </button>
    {/if}

    {#if !isLast && !isExpanded}<span class="comma">,</span>{/if}

    <button class="copy-btn" on:click|stopPropagation={copyValue} title="Copy to clipboard" aria-label="Copy to clipboard">
      {copied ? '✓' : '📋'}
    </button>
  </div>
  
  {#if isExpandable && isExpanded}
    <div class="children" transition:slide={{ duration: 250, easing: quintOut }}>
      {#each entries as [key, value], i}
        <svelte:self 
          data={value} 
          depth={depth + 1} 
          keyName={isObject ? key : null}
          isLast={i === entries.length - 1}
        />
      {/each}
      <div class="closing-bracket">
        <span class="bracket">{isArray ? ']' : '}'}</span>{#if !isLast}<span class="comma">,</span>{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .tree-node {
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
  }
  
  .tree-node.root {
    padding: 1rem;
    border-radius: 8px;
    background: var(--background-tertiary);
    border: 1px solid var(--border-color);
    overflow-x: auto;
  }
  
  .node-row {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 2px 4px;
    border-radius: 4px;
    cursor: default;
    position: relative;
    transition: background-color 0.15s ease;
  }
  
  .node-row.expandable {
    cursor: pointer;
  }
  
  .node-row:hover {
    background: var(--hover-bg, rgba(100, 100, 100, 0.1));
  }
  
  .node-row:hover .copy-btn {
    opacity: 1;
  }
  
  .toggle {
    display: inline-block;
    width: 1rem;
    font-size: 0.7rem;
    color: var(--text);
    opacity: 0.5;
    transition: transform 0.2s ease;
    user-select: none;
  }
  
  .toggle.expanded {
    transform: rotate(90deg);
  }
  
  .toggle-spacer {
    display: inline-block;
    width: 1rem;
  }
  
  .key {
    color: var(--key-color, #e06c75);
    font-weight: 500;
  }
  
  .colon {
    color: var(--text);
    opacity: 0.7;
  }
  
  .bracket {
    color: var(--bracket-color, #abb2bf);
    font-weight: 600;
  }
  
  .comma {
    color: var(--text);
    opacity: 0.5;
  }
  
  .preview {
    margin: 0 0.5rem;
  }
  
  .item-count {
    color: var(--text);
    opacity: 0.5;
    font-size: 0.8rem;
    font-style: italic;
  }
  
  .value {
    cursor: pointer;
    padding: 0 2px;
    border-radius: 3px;
    transition: all 0.15s ease;
    position: relative;
    /* Reset button styles */
    background: none;
    border: none;
    font-family: inherit;
    font-size: inherit;
    text-align: left;
  }
  
  .value:hover {
    background: var(--value-hover-bg, rgba(100, 100, 100, 0.15));
    transform: scale(1.02);
  }
  
  .value.string {
    color: var(--string-color, #98c379);
  }
  
  .value.number {
    color: var(--number-color, #d19a66);
  }
  
  .value.boolean {
    color: var(--boolean-color, #56b6c2);
    font-weight: 600;
  }
  
  .value.null {
    color: var(--null-color, #c678dd);
    font-style: italic;
  }
  
  .copied-badge {
    position: absolute;
    top: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--success-color, #27ae60);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  
  .copy-btn {
    opacity: 0;
    background: none;
    border: none;
    padding: 2px 6px;
    margin-left: 0.5rem;
    cursor: pointer;
    font-size: 0.85rem;
    border-radius: 4px;
    transition: all 0.15s ease;
  }
  
  .copy-btn:hover {
    background: var(--hover-bg, rgba(100, 100, 100, 0.15));
    transform: scale(1.1);
  }
  
  .children {
    margin-left: 1.5rem;
    border-left: 1px dashed var(--border-color, rgba(150, 150, 150, 0.3));
    padding-left: 0.5rem;
  }
  
  .closing-bracket {
    margin-left: 0;
  }
</style>
