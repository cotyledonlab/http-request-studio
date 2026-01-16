<script lang="ts">
  import { onMount } from 'svelte';

  let isDark = false;

  onMount(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      isDark = saved === 'dark';
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
  });

  function toggle() {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme();
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
</script>

<button
  class="theme-toggle"
  on:click={toggle}
  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  aria-label="Toggle theme"
>
  <div class="toggle-track" class:dark={isDark}>
    <div class="icon-container">
      <svg class="sun-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="moon-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </div>
    <div class="toggle-thumb" class:dark={isDark}></div>
  </div>
</button>

<style>
  .theme-toggle {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    outline: none;
    border-radius: 14px;
  }

  .theme-toggle:focus-visible {
    box-shadow: 0 0 0 2px var(--primary-light), 0 0 0 4px var(--primary);
  }

  .toggle-track {
    position: relative;
    width: 52px;
    height: 28px;
    background: var(--background-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    display: flex;
    align-items: center;
    padding: 0 4px;
    transition: all 0.3s ease;
  }

  .toggle-track.dark {
    background: var(--background-tertiary);
    border-color: var(--border-color);
  }

  .icon-container {
    display: flex;
    width: 100%;
    justify-content: space-between;
    padding: 0 2px;
    z-index: 1;
  }

  .sun-icon {
    color: var(--warning);
    opacity: 1;
    transition: all 0.3s ease;
  }

  .toggle-track.dark .sun-icon {
    opacity: 0.3;
  }

  .moon-icon {
    color: var(--primary);
    opacity: 0.3;
    transition: all 0.3s ease;
  }

  .toggle-track.dark .moon-icon {
    opacity: 1;
  }

  .toggle-thumb {
    position: absolute;
    width: 20px;
    height: 20px;
    background: var(--background);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    left: 3px;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .toggle-thumb.dark {
    left: 27px;
  }

  .theme-toggle:hover .toggle-track {
    border-color: var(--border-color-strong);
  }

  .theme-toggle:hover .toggle-thumb {
    box-shadow: var(--shadow-md);
  }

  .theme-toggle:active .toggle-thumb {
    transform: scale(0.95);
  }
</style>
