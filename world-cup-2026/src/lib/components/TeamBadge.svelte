<script>
  import { getTeam } from '$lib/data.js';
  
  let { teamId = '', small = false } = $props();
  
  let team = $derived(getTeam(teamId));
</script>

{#if team}
  <span class="team-badge" class:small>
    <img 
      src="https://flagcdn.com/w40/{team.flag}.png" 
      alt="{team.nameEn}" 
      class="flag"
      onerror={(e) => e.target.src = 'https://flagcdn.com/w40/xx.png'}
    />
    {#if !small}
      <span class="name">{team.name}</span>
    {/if}
  </span>
{/if}

<style>
  .team-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .flag {
    width: 24px;
    height: 16px;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  .small .flag {
    width: 20px;
    height: 14px;
  }
  .name {
    font-size: 0.85rem;
    color: #e0e0e0;
  }
</style>
