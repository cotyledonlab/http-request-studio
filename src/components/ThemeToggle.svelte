<script lang="ts">
  import { onMount } from 'svelte';
  
  let isDark = false;
  
  onMount(() => {
    // Check system preference or saved preference
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
    <span class="icon sun">☀️</span>
    <span class="icon moon">🌙</span>
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
  }
  
  .toggle-track {
    position: relative;
    width: 60px;
    height: 30px;
    background: linear-gradient(135deg, #74b9ff, #81ecec);
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 6px;
    box-shadow: inset 2px 2px 4px rgba(0,0,0,0.1),
                inset -2px -2px 4px rgba(255,255,255,0.3),
                2px 2px 6px rgba(0,0,0,0.15);
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    overflow: hidden;
  }
  
  .toggle-track.dark {
    background: linear-gradient(135deg, #2c3e50, #34495e);
  }
  
  .icon {
    font-size: 14px;
    z-index: 1;
    transition: all 0.3s ease;
  }
  
  .sun {
    opacity: 1;
    transform: scale(1);
  }
  
  .toggle-track.dark .sun {
    opacity: 0.3;
    transform: scale(0.8);
  }
  
  .moon {
    opacity: 0.3;
    transform: scale(0.8);
  }
  
  .toggle-track.dark .moon {
    opacity: 1;
    transform: scale(1);
  }
  
  .toggle-thumb {
    position: absolute;
    width: 24px;
    height: 24px;
    background: linear-gradient(145deg, #ffffff, #f0f0f0);
    border-radius: 50%;
    left: 3px;
    box-shadow: 2px 2px 4px rgba(0,0,0,0.2),
                -1px -1px 2px rgba(255,255,255,0.5);
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .toggle-thumb.dark {
    left: 33px;
    background: linear-gradient(145deg, #ecf0f1, #bdc3c7);
  }
  
  .theme-toggle:hover .toggle-thumb {
    transform: scale(1.1);
  }
  
  .theme-toggle:active .toggle-thumb {
    transform: scale(0.95);
  }
</style>
