<script lang="ts">
  export let url: string = 'https://api.example.com';
  export let method: string = 'GET';

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
</script>

<div class="url-config">
  <div class="method-select">
    {#each methods as httpMethod}
      <button 
        class:active={method === httpMethod}
        on:click={() => method = httpMethod}
      >
        {httpMethod}
      </button>
    {/each}
  </div>
  <input 
    type="text" 
    bind:value={url} 
    placeholder="Enter URL..."
  />
</div>

<style>
  .url-config {
    width: 100%;
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .method-select {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    background: var(--background);
    color: var(--text);
    font-size: 0.9rem;
    box-shadow: 3px 3px 6px var(--shadow-dark),
                -3px -3px 6px var(--shadow-light);
    transition: all 0.2s ease;
  }

  button.active {
    box-shadow: inset 3px 3px 6px var(--shadow-dark),
                inset -3px -3px 6px var(--shadow-light);
    color: #396cd8;
  }

  input {
    flex: 1;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    background: var(--background);
    color: var(--text);
    box-shadow: inset 3px 3px 6px var(--shadow-dark),
                inset -3px -3px 6px var(--shadow-light);
  }

  input:focus {
    outline: none;
  }
</style>
