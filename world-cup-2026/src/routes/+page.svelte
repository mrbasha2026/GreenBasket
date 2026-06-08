<script>
  import { scores } from '$lib/stores.js';
  import Matches from '$lib/components/Matches.svelte';
  import Groups from '$lib/components/Groups.svelte';
  import Knockout from '$lib/components/Knockout.svelte';
  import Favorites from '$lib/components/Favorites.svelte';

  let activeTab = $state('matches');

  const tabs = [
    { id: 'matches', label: 'المباريات', icon: '⚽' },
    { id: 'groups', label: 'المجموعات', icon: '🏆' },
    { id: 'knockout', label: 'الإقصاءات', icon: '🏟️' },
    { id: 'favorites', label: 'المفضلة', icon: '⭐' },
  ];

  function resetAll() {
    if (confirm('هل أنت متأكد من مسح جميع النتائج؟')) {
      scores.reset();
    }
  }
</script>

<div class="app">
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <div class="logo-section">
        <img src="/wc2026-logo.png" alt="كأس العالم 2026" class="header-logo" />
      </div>
      <button class="reset-btn" onclick={resetAll}>مسح الكل</button>
    </div>
  </header>

  <!-- Tab Navigation -->
  <nav class="tabs">
    {#each tabs as tab}
      <button 
        class="tab" 
        class:active={activeTab === tab.id}
        onclick={() => activeTab = tab.id}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>

  <!-- Content -->
  <main class="content">
    {#if activeTab === 'matches'}
      <Matches />
    {:else if activeTab === 'groups'}
      <Groups />
    {:else if activeTab === 'knockout'}
      <Knockout />
    {:else if activeTab === 'favorites'}
      <Favorites />
    {/if}
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    background: linear-gradient(135deg, #001B44 0%, #002855 50%, #001B44 100%);
    border-bottom: 2px solid rgba(255, 215, 0, 0.3);
    padding: 8px 16px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1400px;
    margin: 0 auto;
  }

  .logo-section {
    display: flex;
    align-items: center;
  }

  .header-logo {
    height: 50px;
    width: auto;
    object-fit: contain;
    border-radius: 6px;
  }

  .reset-btn {
    background: rgba(244, 67, 54, 0.15);
    color: #ff6b6b;
    border: 1px solid rgba(244, 67, 54, 0.3);
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    background: rgba(244, 67, 54, 0.25);
  }

  .tabs {
    display: flex;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 215, 0, 0.1);
    position: sticky;
    top: 68px;
    z-index: 99;
  }

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 8px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.85rem;
  }

  .tab:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.03);
  }

  .tab.active {
    color: #FFD700;
    border-bottom-color: #FFD700;
    background: rgba(255, 215, 0, 0.05);
  }

  .tab-icon {
    font-size: 1rem;
  }

  .tab-label {
    font-size: 0.8rem;
  }

  .content {
    flex: 1;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }
</style>
