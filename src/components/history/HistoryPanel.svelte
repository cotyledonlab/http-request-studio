<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { historyStore, clearHistory, removeHistoryEntry } from '../../lib/stores/historyStore';
  import { formatDate, formatTime, getHistoryGroup } from '../../lib/utils/dateUtils';
  import type { HistoryEntry, HttpMethod } from '../../lib/types';
  import ContextMenu from '../shared/ContextMenu.svelte';
  import ConfirmDialog from '../shared/ConfirmDialog.svelte';

  const dispatch = createEventDispatcher();

  export let collapsed = false;

  const methods: Array<HttpMethod | 'ALL'> = [
    'ALL',
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'HEAD',
    'OPTIONS'
  ];

  let searchTerm = '';
  let methodFilter: HttpMethod | 'ALL' = 'ALL';
  let contextMenuOpen = false;
  let menuX = 0;
  let menuY = 0;
  let menuEntry: HistoryEntry | null = null;
  let showClearConfirm = false;

  function toggleCollapse() {
    collapsed = !collapsed;
  }

  function openMenu(event: MouseEvent, entry: HistoryEntry) {
    event.preventDefault();
    menuEntry = entry;
    menuX = event.clientX;
    menuY = event.clientY;
    contextMenuOpen = true;
  }

  function handleMenuSelect(event: CustomEvent<string>) {
    const action = event.detail;
    contextMenuOpen = false;
    if (!menuEntry && action !== 'clear') return;
    if (action === 'copy' && menuEntry) {
      void copyAsCurl(menuEntry);
    } else if (action === 'delete' && menuEntry) {
      removeHistoryEntry(menuEntry.id);
    } else if (action === 'clear') {
      showClearConfirm = true;
    }
  }

  async function copyAsCurl(entry: HistoryEntry) {
    const req = entry.resolvedRequest ?? entry.request;
    const parts: string[] = [`curl -X ${req.method} '${req.url}'`];
    const escapeSingleQuotes = (value: string) => value.replace(/'/g, "'\"'\"'");
    for (const header of req.headers) {
      if (!header.enabled || !header.key.trim()) continue;
      const headerValue = escapeSingleQuotes(`${header.key}: ${header.value}`);
      parts.push(`-H '${headerValue}'`);
    }
    if (req.body && !['GET', 'HEAD'].includes(req.method)) {
      const bodyValue = escapeSingleQuotes(req.body);
      parts.push(`--data '${bodyValue}'`);
    }
    await navigator.clipboard.writeText(parts.join(' '));
  }

  function selectEntry(entry: HistoryEntry) {
    dispatch('select', entry);
  }

  function getStatusClass(entry: HistoryEntry) {
    const status = entry.response?.status ?? 0;
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400) return 'error';
    return 'neutral';
  }

  $: filtered = $historyStore.filter((entry) => {
    const matchesSearch = searchTerm
      ? entry.request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.request.method.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesMethod = methodFilter === 'ALL' ? true : entry.request.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  $: grouped = filtered.reduce((acc, entry) => {
    const group = getHistoryGroup(entry.timestamp);
    if (!acc[group]) acc[group] = [];
    acc[group].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  const groupOrder: Array<'Today' | 'Yesterday' | 'This Week' | 'Older'> = [
    'Today',
    'Yesterday',
    'This Week',
    'Older'
  ];

  $: groupedList = groupOrder
    .map((group) => [group, grouped[group] ?? []] as const)
    .filter(([, entries]) => entries.length > 0);

  const menuItems = [
    { id: 'copy', label: 'Copy as cURL' },
    { id: 'delete', label: 'Delete', danger: true },
    { id: 'clear', label: 'Clear All', danger: true }
  ];
</script>

<div class="history-panel" class:collapsed>
  <div class="panel-header">
    <div class="title-group">
      <h3>History</h3>
      <span class="count">{$historyStore.length}</span>
    </div>
    <button class="collapse-btn" on:click={toggleCollapse} aria-label="Toggle history">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  </div>

  {#if !collapsed}
    <div class="controls">
      <input
        type="text"
        placeholder="Search history..."
        bind:value={searchTerm}
      />
      <select bind:value={methodFilter}>
        {#each methods as method}
          <option value={method}>{method}</option>
        {/each}
      </select>
      <button class="clear-btn" on:click={() => (showClearConfirm = true)} disabled={$historyStore.length === 0}>
        Clear
      </button>
    </div>

    <div class="history-list">
      {#if filtered.length === 0}
        <p class="empty">No history yet.</p>
      {:else}
        {#each groupedList as [groupName, entries]}
          <div class="group">
            <div class="group-header">
              <span>{groupName}</span>
              <span class="group-date">{formatDate(entries[0].timestamp)}</span>
            </div>
            {#each entries as entry}
              <button
                class="history-item"
                on:click={() => selectEntry(entry)}
                on:contextmenu={(event) => openMenu(event, entry)}
              >
                <span class="method" data-method={entry.request.method}>{entry.request.method}</span>
                <span class="url" title={entry.request.url}>{entry.request.url}</span>
                <span class="time">{formatTime(entry.timestamp)}</span>
                {#if entry.response}
                  <span class={`status ${getStatusClass(entry)}`}>{entry.response.status}</span>
                {:else if entry.error}
                  <span class="status error">ERR</span>
                {/if}
              </button>
            {/each}
          </div>
        {/each}
      {/if}
    </div>
  {/if}

  <ContextMenu
    open={contextMenuOpen}
    x={menuX}
    y={menuY}
    items={menuItems}
    on:select={handleMenuSelect}
    on:close={() => (contextMenuOpen = false)}
  />

  <ConfirmDialog
    open={showClearConfirm}
    title="Clear history"
    message="This will remove all history entries. This action cannot be undone."
    confirmText="Clear history"
    danger
    on:confirm={() => {
      clearHistory();
      showClearConfirm = false;
    }}
    on:cancel={() => (showClearConfirm = false)}
  />
</div>

<style>
  .history-panel {
    background: var(--background);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--background-tertiary);
    border-bottom: 1px solid var(--border-color);
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  h3 {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .count {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    background: var(--background);
    color: var(--text-secondary);
  }

  .collapse-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .collapsed .collapse-btn {
    transform: rotate(180deg);
  }

  .controls {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .controls input,
  .controls select {
    width: 100%;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--background);
    color: var(--text);
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .clear-btn {
    padding: 0.4rem 0.7rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--background);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .history-list {
    max-height: 320px;
    overflow-y: auto;
    padding: 0.5rem 0.5rem 0.75rem;
  }

  .empty {
    margin: 0;
    padding: 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    padding: 0 0.5rem;
  }

  .history-item {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.5rem;
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .history-item:hover {
    border-color: var(--border-color);
    background: var(--hover-bg);
  }

  .method {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.4rem;
    border-radius: 6px;
    background: var(--background-tertiary);
    color: var(--text-secondary);
  }

  .method[data-method='GET'] { color: var(--method-get); }
  .method[data-method='POST'] { color: var(--method-post); }
  .method[data-method='PUT'] { color: var(--method-put); }
  .method[data-method='DELETE'] { color: var(--method-delete); }
  .method[data-method='PATCH'] { color: var(--method-patch); }
  .method[data-method='HEAD'] { color: var(--method-head); }
  .method[data-method='OPTIONS'] { color: var(--method-options); }

  .url {
    font-size: 0.8rem;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .time {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .status {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.4rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
  }

  .status.success {
    color: var(--success);
    border-color: var(--success);
    background: var(--success-light);
  }

  .status.error {
    color: var(--error);
    border-color: var(--error);
    background: var(--error-light);
  }
</style>
