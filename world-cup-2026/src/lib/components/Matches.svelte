<script>
  import { allMatches, stageNames, getTeam } from '$lib/data.js';
  import { scores, favoriteMatches } from '$lib/stores.js';
  import { getMatchResult } from '$lib/logic.js';
  import TeamBadge from './TeamBadge.svelte';
  import ScoreDialog from './ScoreDialog.svelte';

  let filter = $state('all');
  let groupFilter = $state('all');

  let filteredMatches = $derived(allMatches.filter(m => {
    if (filter === 'group' && m.type !== 'group') return false;
    if (filter === 'knockout' && m.type === 'group') return false;
    if (groupFilter !== 'all' && m.group !== groupFilter) return false;
    return true;
  }));

  let currentScores = $derived($scores);
  let favMatchIds = $derived($favoriteMatches);

  function handleScore(matchId, home, away, homePenalty, awayPenalty) {
    scores.setScore(matchId, home, away, homePenalty, awayPenalty);
  }

  function toggleFav(matchId) {
    favoriteMatches.toggle(matchId);
  }
</script>

<div class="matches-container">
  <div class="filters">
    <button class:active={filter === 'all'} onclick={() => filter = 'all'}>الكل</button>
    <button class:active={filter === 'group'} onclick={() => filter = 'group'}>المجموعات</button>
    <button class:active={filter === 'knockout'} onclick={() => filter = 'knockout'}>الإقصاءات</button>
  </div>

  {#if filter === 'group' || filter === 'all'}
    <div class="group-filters">
      <button class:active={groupFilter === 'all'} onclick={() => groupFilter = 'all'}>الكل</button>
      {#each 'ABCDEFGHIJKL'.split('') as g}
        <button class:active={groupFilter === g} onclick={() => groupFilter = g}>{g}</button>
      {/each}
    </div>
  {/if}

  <div class="matches-list">
    {#each filteredMatches as match (match.id)}
      {@const score = currentScores[match.id]}
      {@const homeResult = getMatchResult(score, true)}
      {@const awayResult = getMatchResult(score, false)}
      {@const isFav = favMatchIds.includes(match.id)}
      <div class="match-card" class:group-match={match.type === 'group'}>
        <div class="match-header">
          <span class="match-id">#{match.id}</span>
          <span class="match-stage">{stageNames[match.type]}</span>
          {#if match.group}
            <span class="match-group">المجموعة {match.group}</span>
          {/if}
          <button class="fav-btn" class:active={isFav} onclick={() => toggleFav(match.id)}>
            {isFav ? '★' : '☆'}
          </button>
        </div>
        <div class="match-body">
          <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
            <TeamBadge teamId={match.home} />
          </div>
          <div class="score-area">
            <ScoreDialog 
              homeScore={score?.home}
              awayScore={score?.away}
              homePenalty={score?.homePenalty}
              awayPenalty={score?.awayPenalty}
              onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
            />
          </div>
          <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
            <TeamBadge teamId={match.away} />
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .matches-container {
    padding: 8px;
  }
  .filters, .group-filters {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .filters button, .group-filters button {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    color: #ccc;
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }
  .filters button.active, .group-filters button.active {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #001B44;
    border-color: #FFD700;
    font-weight: bold;
  }
  .matches-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .match-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 10px 12px;
    transition: all 0.2s;
  }
  .match-card:hover {
    border-color: rgba(255,215,0,0.2);
  }
  .match-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 0.75rem;
  }
  .match-id {
    color: rgba(255,255,255,0.4);
  }
  .match-stage {
    color: #FFD700;
    font-weight: bold;
  }
  .match-group {
    color: rgba(255,255,255,0.5);
  }
  .fav-btn {
    margin-right: auto;
    background: none;
    border: none;
    color: rgba(255,215,0,0.3);
    cursor: pointer;
    font-size: 1rem;
    padding: 0 4px;
  }
  .fav-btn.active {
    color: #FFD700;
  }
  .match-body {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .team-row {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
  }
  .team-row.result-win {
    background: rgba(76, 175, 80, 0.15);
    border-left: 3px solid #4CAF50;
  }
  .team-row.result-loss {
    background: rgba(244, 67, 54, 0.12);
    border-left: 3px solid #F44336;
  }
  .team-row.result-draw {
    background: rgba(255, 193, 7, 0.12);
    border-left: 3px solid #FFC107;
  }
  .score-area {
    flex-shrink: 0;
  }
</style>
